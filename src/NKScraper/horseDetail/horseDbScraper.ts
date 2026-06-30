import { Page } from "puppeteer";
import { Logger } from "../../utils/Logger";
import { HorseProfile, HorseRaceResultRow } from "./horseDetailIF";
import {
    SEX_MAP,
    COAT_MAP,
} from "../../../config/LookupTables/horse";
import { 
    VENUE_MAP,
    COURSE_MAP,
    WEATHER_MAP,
    BABA_MAP,
    GRADE_MAP,
} from "../../../config/LookupTables/venue";

// =============================================================================
// 定数
// =============================================================================

/** db.netkeiba.com（PC版）User-Agent */
const DESKTOP_UA =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// =============================================================================
// ブラウザ文脈外で使える純粋ヘルパー
// =============================================================================

async function retry<T>(
    fn: (attempt: number) => Promise<T>,
    maxAttempts: number,
    delayMs: number
): Promise<T> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn(attempt);
        } catch (error) {
            lastError = error;
            if (error instanceof Error && error.name === "TargetCloseError") throw error;
            if (attempt < maxAttempts) await new Promise((r) => setTimeout(r, delayMs));
        }
    }
    throw lastError;
}

// =============================================================================
// ブラウザ文脈（evaluate 内）で動作する純粋解析関数
// =============================================================================

/** 馬詳細ページの DOM から HorseProfile を解析する関数（evaluate 内で実行される） */
function parseProfile(
    hid: string,
    SEX: Record<string, number>,
    COAT: Record<string, number>
): HorseProfile {
    const name =
        document.querySelector(".horse_title h1")?.textContent?.trim() ??
        document.querySelector("h1")?.textContent?.trim() ??
        "";

    // プロフィールテーブルを th → td のマップに変換
    const profMap: Record<string, string> = {};
    for (const tr of document.querySelectorAll(".db_prof_table tr")) {
        const th = tr.querySelector("th")?.textContent?.trim() ?? "";
        const td = tr.querySelector("td")?.textContent?.trim() ?? "";
        if (th) profMap[th] = td;
    }

    // タイトルやプロフィールテーブルから性別・年齢・毛色を抽出
    const titleParts = (document.querySelector(".horse_title .txt_01")?.textContent?.trim() ?? "")
        .split(/[\s\u3000]+/)
        .map((s: string) => s.trim())
        .filter(Boolean);

    // 性別・年齢はタイトルの2番目優先、なければプロフィールテーブルから。どちらもなければ0（不明）になる。
    const sexageStr = titleParts[1] ?? profMap["性齢"] ?? "";
    const sexRaw = sexageStr.match(/^(牡|牝|セン|セ|せん)/)?.[1] ?? "";
    const sexStr = sexRaw === "セン" || sexRaw === "セ" ? "せん" : sexRaw;
    const sex = SEX[sexStr] ?? 0;
    const age = parseInt(sexageStr.match(/(\d+)歳/)?.[1] ?? "0", 10);

    // 毛色はタイトルの3番目優先、なければプロフィールテーブルから。どちらもなければ0（不明）になる。
    const coatKey = titleParts[2] ?? profMap["毛色"] ?? "";
    const type = COAT[coatKey] ?? 0;

    // プロフィールテーブルのリンクから調教師・馬主・生産者の名前とIDを抽出
    const extractLink = (selector: string) => {
        const a = document.querySelector(selector) as HTMLAnchorElement | null;
        const id = a?.getAttribute("href")?.match(/\/([^/]+)\/?$/)?.[1] ?? "";
        return { name: a?.textContent?.trim() ?? "", id };
    };
    // 調教師セルから旧名（旧姓）を抽出。例）「(旧)田中修次」→「田中修次」
    const trainer = extractLink(".db_prof_table a[href*='/trainer/']");
    // 馬主セルから旧名を抽出。例）「(旧)サンデーサラブレッドクラブ」→「サンデーサラブレッドクラブ」
    const owner   = extractLink(".db_prof_table a[href*='/owner/']");
    // 生産者セルから旧名を抽出。例）「(旧)ノーザンファーム」→「ノーザンファーム」
    const breeder = extractLink(".db_prof_table a[href*='/breeder/']");

    // 調教師セルのテキストから厩舎を抽出。例）「(旧)田中修次（美浦）」→「美浦」
    const trainerCell = document.querySelector(".db_prof_table a[href*='/trainer/']")?.closest("td");
    // 厩舎は「美浦」「栗東」「地方」「海外」のいずれかになる想定。例外的に「(旧)田中修次（地方）」→「地方」もある。
    const kyuusya = trainerCell?.textContent?.match(/[（(]([^）)]+)[）)]/)?.[1]?.trim() ?? "";

    // 生年月日は「1990年1月1日」の形式で表記されている想定。例外的に「平成2年1月1日」などもあるが、現状は未対応でそのまま文字列を返す。
    const birthDate = (() => {
        const raw = profMap["生年月日"] ?? "";
        const m = raw.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
        return m ? `${m[1]}${m[2].padStart(2, "0")}${m[3].padStart(2, "0")}` : raw;
    })();

    return {
        name,
        status: titleParts[0] ?? profMap["現役状況"] ?? profMap["状態"] ?? "",
        sex, age, type, birthDate,
        trainer:   trainer.name || (profMap["調教師"] ?? ""),
        trainerId: trainer.id,
        kyuusya,
        owner:     owner.name   || (profMap["馬主"]   ?? ""),
        ownerId:   owner.id,
        breeder:   breeder.name || (profMap["生産者"] ?? ""),
        breederId: breeder.id,
    };
}

/** 馬詳細ページの DOM から全成績テーブルを解析して HorseRaceResultRow[] を返す関数（evaluate 内で実行される） */
function parseRaceResults(
    VENUE: Record<string, number>,
    COURSE: Record<string, number>,
    GRADE: Record<string, number>,
    WEATHER: Record<string, number>,
    BABA: Record<string, number>
): HorseRaceResultRow[] {
    const table = document.querySelector("table.db_h_race_results");
    if (!table) return [];

    // テーブルのヘッダー行から列名を抽出。例）["日付", "天気", "開催", "R", ...]
    const headers = Array.from(table.querySelectorAll("thead th")).map(
        (th) => th.textContent?.trim() ?? ""
    );

    // 数値変換ヘルパー。空文字は null、カンマ区切りは除去してから変換。変換できない場合も null。
    const toFloat = (s: string): number | null => {
        if (!s.trim()) return null;
        const n = parseFloat(s.replace(/,/g, ""));
        return isNaN(n) ? null : n;
    };
    const toInt = (s: string): number | null => {
        if (!s.trim()) return null;
        const n = parseInt(s.replace(/,/g, ""), 10);
        return isNaN(n) ? null : n;
    };

    return Array.from(table.querySelectorAll("tbody tr")).map((row) => {
        const cells = Array.from(row.querySelectorAll("td"));
        const text  = (i: number) => cells[i]?.textContent?.replace(/\s+/g, " ").trim() ?? "";
        const col   = (name: string, fallback = -1) => {
            const idx = headers.indexOf(name);
            return idx >= 0 ? text(idx) : fallback >= 0 ? text(fallback) : "";
        };

        const raceA = (Array.from(row.querySelectorAll("td a[href]")) as HTMLAnchorElement[])
            .find((a) => /\/race\/([0-9]{10,12})(?:\/|$)/.test(a.getAttribute("href") ?? "")) ?? null;
        const raceId = raceA?.getAttribute("href")?.match(/\/race\/([0-9]{10,12})/)?.[1] ?? "";

        const courseText = col("距離", 14);
        const courseStr  = courseText.match(/^(芝|ダ|障|ダート)/)?.[1].replace("ダ", "ダート") ?? "";
        const course     = COURSE[courseStr] ?? null;
        const distance   = toInt(courseText.match(/(\d+)/)?.[1] ?? "");

        const tuukaParts = col("通過", 25).split("-").filter(Boolean);
        const tuukaSlot  = (slot: number): string =>
            slot >= 4 - tuukaParts.length
                ? tuukaParts[slot - (4 - tuukaParts.length)] ?? ""
                : "";

        const jockeyIdx = headers.indexOf("騎手") >= 0 ? headers.indexOf("騎手") : 12;
        const jockeyA   = cells[jockeyIdx]?.querySelector("a") as HTMLAnchorElement | null;
        const jockeyId  = jockeyA?.getAttribute("href")?.match(/jockey\/result\/recent\/(\d+)/)?.[1] ?? "";

        const raceNameRaw = col("レース名") || (raceA?.textContent?.trim() ?? "");
        const gradeMatch  = raceNameRaw.match(/[（(]([^）)]+)[）)]\s*$/);
        const gradeStr    = gradeMatch?.[1]?.trim() ?? "";
        const raceName    = gradeMatch ? raceNameRaw.slice(0, gradeMatch.index).trim() : raceNameRaw;

        // グレード文字列から GRADE コードを抽出。例）「GIII」→3、「OP」→5
        let grade = GRADE[gradeStr] ?? 0;
        if (grade === 0) {
            if      (raceNameRaw.includes("新馬"))                                           grade = 19;
            else if (raceNameRaw.includes("未勝利"))                                         grade = 20;
            else if (raceNameRaw.includes("1勝クラス") || raceNameRaw.includes("１勝クラス")) grade = 18;
            else if (raceNameRaw.includes("2勝クラス") || raceNameRaw.includes("２勝クラス")) grade = 17;
            else if (raceNameRaw.includes("3勝クラス") || raceNameRaw.includes("３勝クラス")) grade = 16;
            else if (raceNameRaw.includes("500万下")   || raceNameRaw.includes("５００万下")) grade = 9;
            else if (raceNameRaw.includes("1000万下")  || raceNameRaw.includes("１０００万下")) grade = 7;
            else if (raceNameRaw.includes("1600万下")  || raceNameRaw.includes("１６００万下")) grade = 6;
        }

        const placeRaw   = col("開催") || col("場所");
        const placeMatch = placeRaw.match(/^(\d+)?([^\d]+)(\d+)?$/);
        const kaiji      = placeMatch?.[1] ? parseInt(placeMatch[1], 10) : null;
        const venueStr   = placeMatch?.[2]?.trim() ?? placeRaw;
        const day        = placeMatch?.[3] ? parseInt(placeMatch[3], 10) : null;
        const venue      = VENUE[venueStr] ?? null;

        return {
            race: {
                date:     col("日付", 0) || col("年月日", 0),
                kaiji, venue, day,
                raceId, raceName, grade,
                R:        toInt(col("R", 3) || col("レース番号", 3)),
                course, distance,
                weather:  WEATHER[col("天気", 2).trim()] ?? 0,
                baba:     BABA[col("馬場", 16).trim()] ?? 0,
                tousuu:   toInt(col("頭数", 6)),
            },
            entry: {
                wakuban:    toInt(col("枠番", 7)),
                umaban:     toInt(col("馬番", 8)),
                kinryou:    toFloat(col("斤量", 13)),
                jockey:     col("騎手", 12),
                jockeyId,
                odds:       toFloat(col("オッズ", 9)),
                popularity: toInt(col("人気", 10)),
            },
            result: {
                rank:              col("着順", 11),
                time:              col("タイム", 18),
                prize:             toFloat(col("賞金", cells.length - 1)),
                tyakusa:           toFloat(col("着差", 19)),
                tuuka1c:           toInt(tuukaSlot(0)),
                tuuka2c:           toInt(tuukaSlot(1)),
                tuuka3c:           toInt(tuukaSlot(2)),
                tuuka4c:           toInt(tuukaSlot(3)),
                last3f:            toFloat(col("上り", 27)),
                weight:            toInt(col("馬体重", 28).replace(/\(.*?\)/, "").trim()),
                comment:           "",
                winnerOrSecondary: (col("勝ち馬(2着馬)", 31) || col("1着馬", 31) || col("勝馬", 31))
                    .replace(/^\(|\)$/g, ""),
            },
        };
    });
}

// =============================================================================
// クラス
// =============================================================================

/**
 * db.netkeiba.com の馬詳細ページからプロフィールと全成績を取得するスクレイパー。
 *
 * Step② 専用。コメント補完・血統取得は行わない。
 * 取得した { profile, raceResults } をそのまま HorseDetail JSON として保存する。
 */
export class HorseDbScraper {
    private readonly page: Page;
    private readonly logger: Logger;

    constructor(page: Page) {
        this.page   = page;
        this.logger = new Logger();
    }

    /**
     * db.netkeiba の馬詳細ページからプロフィールと全成績テーブルを取得する。
     * 1件ごとに新規ページを作成して finally でクローズするため、
     * 呼び出し側は任意のアンカー Page を渡せばよい。
     */
    async scrape(horseId: string): Promise<{ profile: HorseProfile; raceResults: HorseRaceResultRow[] }> {
        const url = `https://db.netkeiba.com/horse/${horseId}/`;
        this.logger.info(`[db] goto 開始: ${url}`);

        const dbPage = await this.page.browserContext().newPage();
        try {
            return await retry(async (attempt) => {
                await dbPage.setUserAgent(DESKTOP_UA);
                await dbPage.setViewport({ width: 1280, height: 900, isMobile: false });
                await dbPage.setExtraHTTPHeaders({ "accept-language": "ja,en-US;q=0.9,en;q=0.8" });

                await dbPage.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
                this.logger.info(`[db] goto 完了: title="${await dbPage.title().catch(() => "")}"`);

                await dbPage.evaluate("window.__name = function(fn) { return fn; };");

                const horseTitleFound = await dbPage.waitForSelector(".horse_title", { timeout: 15000 })
                    .then(() => true).catch(() => false);
                if (!horseTitleFound) {
                    this.logger.warn(`[db] .horse_title が見つかりません（attempt=${attempt}）horseId=${horseId}`);
                } else {
                    this.logger.info(`[db] .horse_title 確認済み（attempt=${attempt}）`);
                }

                const tableFound = await dbPage.waitForSelector("table.db_h_race_results", { timeout: 15000 })
                    .then(() => true).catch(() => false);
                if (!tableFound) {
                    this.logger.info(`[db] 成績テーブルなし（未出走・引退の可能性）: horseId=${horseId}`);
                } else {
                    this.logger.info(`[db] 成績テーブル確認済み（attempt=${attempt}）`);
                }

                this.logger.info(`[db] プロフィール解析中...`);
                const profile = await dbPage.evaluate(parseProfile, horseId, SEX_MAP, COAT_MAP);
                this.logger.info(`[db] プロフィール解析完了: name="${profile.name}" sex=${profile.sex} age=${profile.age}`);

                this.logger.info(`[db] 成績解析中...`);
                const raceResults = await dbPage.evaluate(parseRaceResults, VENUE_MAP, COURSE_MAP, GRADE_MAP, WEATHER_MAP, BABA_MAP);
                this.logger.info(`[db] 成績解析完了: ${raceResults.length} 件`);

                if (!profile.name) this.logger.warn(`[db] 警告: profile.name が空 horseId=${horseId}`);
                if (!profile.sex)  this.logger.warn(`[db] 警告: profile.sex が0 horseId=${horseId}`);
                if (raceResults.length === 0) this.logger.warn(`[db] 警告: raceResults が0件 horseId=${horseId}`);

                if (!profile.name && raceResults.length === 0) {
                    const title   = await dbPage.title().catch(() => "");
                    const snippet = await dbPage.evaluate(() => document.body?.innerText?.slice(0, 300) ?? "").catch(() => "");
                    throw new Error(`空データを検知しました title=${title} body=${snippet}`);
                }

                this.logger.info(`db.netkeiba 取得成功（attempt=${attempt}）horseId=${horseId} races=${raceResults.length}`);
                return { profile, raceResults };
            }, 2, 3000);
        } finally {
            await dbPage.close().catch(() => {});
        }
    }
}
