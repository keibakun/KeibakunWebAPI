import { Page } from "puppeteer";

import { RaceIF, RawRaceIF, RawSyutubaIF, SyutubaIF } from "./syutubaIF";
import { VENUE_MAP } from "../../../config/LookupTables/venue";
import {
    GRADE_MAP,
    WEATHER_MAP,
    BABA_MAP,
    COURSE_CHAR_MAP,
    MAWARI_MAP,
    SHIBA_COURSE_MAP,
    HORSE_CATEGORY_MAP,
    JOKEN_TOKEN_MAP,
    JYURYO_KUBUN_MAP,
} from "../../../config/LookupTables/race";
import { SEX_MAP, JOCKEY_MARK_MAP } from "../../../config/LookupTables/horse";

// =============================================================================
// 変換ヘルパー（Node.js 側）
// =============================================================================

/**
 * コース文字列をパースして各コード値に変換する
 * @example "芝1600m(左 外\xa0B)" → { courseType:1, distance:1600, mawari:5, shibaKubun:2 }
 * @example "ダ1800m(右)"         → { courseType:2, distance:1800, mawari:1, shibaKubun:0 }
 * @example "障2750m(芝)"         → { courseType:3, distance:2750, mawari:0, shibaKubun:0 }
 */
function parseCourse(courseStr: string): { courseType: number; distance: number; mawari: number; shibaKubun: number } {
    const m = courseStr.match(/^(ダ|芝|障)(\d+)m\(([^)]+)\)/);
    if (!m) return { courseType: 0, distance: 0, mawari: 0, shibaKubun: 0 };

    const [, typeChar, distStr, innerStr] = m;
    const courseType = COURSE_CHAR_MAP[typeChar] ?? 0;
    const distance = parseInt(distStr, 10);

    let mawari = 0;
    let shibaKubun = 0;

    if (courseType !== 3) {
        // NBSP（\xa0）の後ろが芝コース種別（A/B/C/D）
        const shibaMatch = innerStr.match(/\u00a0([A-D])$/);
        if (shibaMatch) {
            shibaKubun = SHIBA_COURSE_MAP[shibaMatch[1]] ?? 0;
        }
        // 回り部分：NBSP以前のテキストから "右 外" → "右外" のように正規化
        const mawariRaw = innerStr.split("\u00a0")[0].trim();
        const mawariKey = mawariRaw.replace(" 外", "外");
        mawari = MAWARI_MAP[mawariKey] ?? 0;
    }

    return { courseType, distance, mawari, shibaKubun };
}

/**
 * 性齢文字列をパースして性別コードと年齢に変換する
 * @example "牝3"  → { sex:2, age:3 }
 * @example "セ10" → { sex:3, age:10 }
 */
function parseSexAge(sexageStr: string): { sex: number; age: number } {
    const m = sexageStr.match(/^(牡|牝|セ|せん|セン)(\d+)$/);
    if (!m) return { sex: 0, age: 0 };
    const sexRaw = m[1] === "セン" || m[1] === "セ" ? "せん" : m[1];
    return { sex: SEX_MAP[sexRaw] ?? 0, age: parseInt(m[2], 10) };
}

/**
 * 馬体重文字列をパースして体重と増減に変換する
 * @example "480(+2)"  → { weightNum:480, weightDiff:2 }
 * @example "488(-4)"  → { weightNum:488, weightDiff:-4 }
 * @example ""         → { weightNum:0, weightDiff:0 }
 */
function parseWeight(weightStr: string): { weightNum: number; weightDiff: number } {
    const m = weightStr.match(/^(\d+)\(([+-]\d+)\)$/);
    if (!m) return { weightNum: 0, weightDiff: 0 };
    return { weightNum: parseInt(m[1], 10), weightDiff: parseInt(m[2], 10) };
}

/**
 * 騎手名文字列からマークと名前を分離する
 * @example "☆舟山"  → { jockeyMark:1, jockey:"舟山" }
 * @example "▲小林美" → { jockeyMark:2, jockey:"小林美" }
 * @example "戸崎圭"  → { jockeyMark:0, jockey:"戸崎圭" }
 */
function parseJockey(jockeyStr: string): { jockeyMark: number; jockey: string } {
    const markChar = jockeyStr[0] ?? "";
    const mark = JOCKEY_MARK_MAP[markChar];
    if (mark !== undefined && mark !== 0) {
        return { jockeyMark: mark, jockey: jockeyStr.slice(1) };
    }
    return { jockeyMark: 0, jockey: jockeyStr };
}

/**
 * 競走条件文字列をトークン分解してビットマスクに変換する
 * @example "(混)[指]"           → 0x09 (MIX | KORYU)
 * @example "(国際) 牡・牝(指)"  → 0x12 (INTL | TOKUSHI) ※牡・牝は性別制限なし
 * @example "(国際) 牝(特指)"    → 0x16 (INTL | MARE | TOKUSHI)
 */
function parseJoken(jokenStr: string): number {
    // "牡・牝" は性別制限なしの明示（牝フラグを立てない）
    const normalized = jokenStr.replace("牡・牝", "");
    return Object.entries(JOKEN_TOKEN_MAP).reduce(
        (flags, [token, flag]) => normalized.includes(token) ? flags | flag : flags,
        0
    );
}

/**
 * 本賞金文字列をパースして数値配列に変換する
 * @example "本賞金:580,230,150,87,58万円" → [580, 230, 150, 87, 58]
 */
function parseHonShokin(shokinStr: string): number[] {
    const m = shokinStr.match(/本賞金:([\d,]+)万円/);
    if (!m) return [];
    return m[1].split(",").map(Number);
}

/**
 * ブラウザ抽出済みの RawRaceIF をルックアップテーブルで変換して RaceIF を生成する
 */
function transformRaceData(raw: RawRaceIF): RaceIF {
    const { courseType, distance, mawari, shibaKubun } = parseCourse(raw.course);

    const rd = raw.raceData;
    const kaisaiKai = parseInt((rd[0] ?? "").replace("回", ""), 10) || 0;
    const venue = VENUE_MAP[rd[1] ?? ""] ?? 0;
    const kaisaiDay = parseInt((rd[2] ?? "").replace("日目", ""), 10) || 0;
    const horseCategory = HORSE_CATEGORY_MAP[rd[3] ?? ""] ?? 0;
    const raceClass = GRADE_MAP[rd[4] ?? ""] ?? 0;
    const joken = parseJoken(rd[5] ?? "");
    const jyuryoKubun = JYURYO_KUBUN_MAP[rd[6] ?? ""] ?? 0;
    const tousu = parseInt((rd[7] ?? "").replace("頭", ""), 10) || 0;
    const honShokin = parseHonShokin(rd[8] ?? "");

    const syutuba: SyutubaIF[] = raw.syutuba.map((s: RawSyutubaIF): SyutubaIF => {
        const { sex, age } = parseSexAge(s.sexage);
        const { jockeyMark, jockey } = parseJockey(s.jockey);
        const { weightNum, weightDiff } = parseWeight(s.weight);
        return {
            umaban: parseInt(s.umaban, 10) || 0,
            horseName: s.horseName,
            horseId: s.horseId,
            sex,
            age,
            kinryou: parseFloat(s.kinryou) || 0,
            jockeyMark,
            jockey,
            jockeyId: s.jockeyId,
            trainer: s.trainer,
            trainerId: s.trainerId,
            weightNum,
            weightDiff,
        };
    });

    return {
        raceNum: parseInt(raw.raceNum.replace("R", ""), 10) || 0,
        raceName: raw.raceName,
        grade: GRADE_MAP[raw.grade] ?? 0,
        raceTime: raw.raceTime,
        courseType,
        distance,
        mawari,
        shibaKubun,
        weather: WEATHER_MAP[raw.weather] ?? 0,
        baba: BABA_MAP[raw.baba] ?? 0,
        kaisaiKai,
        venue,
        kaisaiDay,
        horseCategory,
        raceClass,
        joken,
        jyuryoKubun,
        tousu,
        honShokin,
        syutuba,
    };
}

// =============================================================================
// メイン取得関数
// =============================================================================

/**
 * 出馬表を取得する関数
 * @param {Page} page - PuppeteerのPageインスタンス
 * @param {string} raceId - レースID
 * @returns {Promise<RaceIF>} - 出馬表の情報（コード化済み）
 */
export default async function getShutuba(page: Page, raceId: string): Promise<RaceIF> {
    const url: string = `https://race.netkeiba.com/race/shutuba.html?race_id=${raceId}&rf=race_submenu`;

    console.info(`URL: ${url} から出馬表を取得します`);

    await page.goto(url, { waitUntil: "domcontentloaded" });

    let rawData: RawRaceIF;

    try {
        rawData = await page.$eval(
            'table[class*="Shutuba_Table"]',
            (table: Element): any => {
                const raceNum: string = document.querySelector("span.RaceNum")?.textContent?.trim() || "";
                const raceName: string = document.querySelector("h1.RaceName")?.textContent?.trim() || "";

                // レースグレードを取得
                const gradeSpan: Element | null = document.querySelector("span.Icon_GradeType");
                const gradeClassList: string[] = Array.from(gradeSpan?.classList || []);
                const grade: string =
                    gradeClassList
                        .find((className: string) => className.startsWith("Icon_GradeType") && className !== "Icon_GradeType")
                        ?.replace("Icon_GradeType", "GradeType") || "";

                // RaceData01 の情報を取得
                const raceData01: Element | null = document.querySelector("div.RaceData01");
                const raceTime: string = raceData01?.textContent?.match(/(\d{2}:\d{2})発走/)?.[1] || "";

                // コース情報を取得（付加情報も含む）
                const courseMain: string = raceData01?.querySelector("span")?.textContent?.trim() || "";
                const courseExtra: string = raceData01?.textContent?.match(/\(([^)]+)\)/)?.[0] || "";
                const course: string = `${courseMain}${courseExtra}`.trim();

                const weather: string = raceData01?.textContent?.match(/天候:(\S+)/)?.[1] || "";
                const baba: string = raceData01?.querySelector("span.Item04")?.textContent?.match(/馬場:(\S+)/)?.[1] || "";

                const raceData: string[] = Array.from(document.querySelectorAll("div.RaceData02 span")).map(
                    (span: Element) => span.textContent?.trim() || ""
                );

                // 出走馬情報を取得（文字列のまま）
                const rows: Element[] = Array.from(table.querySelectorAll("tbody tr"));
                const syutuba = rows.map((row: Element) => {
                    const umaban: string = row.querySelector("td:nth-child(2)")?.textContent?.trim() || "";
                    const horseAnchor = row.querySelector("td:nth-child(4) a") as HTMLAnchorElement | null;
                    const horseName: string = horseAnchor?.textContent?.trim() || "";
                    const horseId: string = horseAnchor?.getAttribute("href")?.match(/horse\/(\d+)/)?.[1] || "";
                    const sexage: string = row.querySelector("td:nth-child(5)")?.textContent?.trim() || "";
                    const kinryou: string = row.querySelector("td:nth-child(6)")?.textContent?.trim() || "";

                    const jockeyAnchor = row.querySelector("td.Jockey a") as HTMLAnchorElement | null;
                    const jockey: string = jockeyAnchor?.textContent?.trim() || "";
                    const jockeyId: string = jockeyAnchor?.getAttribute("href")?.match(/jockey\/result\/recent\/(\d{5})/)?.[1] || "";

                    const trainerAnchor = row.querySelector("td.Trainer a") as HTMLAnchorElement | null;
                    const trainer: string = trainerAnchor?.textContent?.trim() || "";
                    const trainerId: string = trainerAnchor?.getAttribute("href")?.match(/trainer\/result\/recent\/(\d{5})/)?.[1] || "";

                    const weight: string = row.querySelector("td:nth-child(9)")?.textContent?.trim() || "";

                    return { umaban, horseName, horseId, sexage, kinryou, jockey, jockeyId, trainer, trainerId, weight };
                });

                return { raceNum, raceName, grade, raceTime, course, weather, baba, raceData, syutuba };
            }
        );

        console.info("出馬表の取得に成功しました");
    } catch (error) {
        console.error("出馬表の取得中にエラーが発生しました:", error);
        throw error;
    }

    return transformRaceData(rawData!);
}
