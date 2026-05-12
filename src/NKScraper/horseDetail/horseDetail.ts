import { Page } from "puppeteer";
import { Logger } from "../../utils/Logger";
import { HorseProfile, HorseRaceResultRow, HorseDetail } from "./horseDetailIF";

// =============================================================================
// 定数
// =============================================================================

/** db.netkeiba.com（PC版）User-Agent */
const DESKTOP_UA =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

/** race.sp.netkeiba.com（SP版）User-Agent */
const MOBILE_UA =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 " +
    "(KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

// =============================================================================
// evaluate 内で使用するルックアップテーブル（ブラウザ文脈に注入するため plain object）
// =============================================================================

/** 性別文字列 → HorseSex コード */
const SEX_MAP: Record<string, number> = { 牡: 1, 牝: 2, せん: 3 };

/** 毛色文字列 → HorseCoatColor コード（JRA公認8毛色） */
const COAT_MAP: Record<string, number> = {
    鹿毛: 1, 黒鹿毛: 2, 青鹿毛: 3, 青毛: 4,
    栗毛: 5, 栃栗毛: 6, 芦毛: 7, 白毛: 8,
};

/** 競馬場名 → VenueCode（JRA 10場） */
const VENUE_MAP: Record<string, number> = {
    札幌: 1, 函館: 2, 福島: 3, 新潟: 4, 東京: 5,
    中山: 6, 中京: 7, 京都: 8, 阪神: 9, 小倉: 10,
};

/** コース種別文字列 → CourseType コード */
const COURSE_MAP: Record<string, number> = { 芝: 1, ダート: 2, 障: 3 };

/** 天気文字列 → WeatherCode */
const WEATHER_MAP: Record<string, number> = {
    晴: 1, 曇: 2, 雨: 3, 小雨: 4, 雪: 5,
};

/** 馬場状態文字列 → BabaCode（芝・ダート共通） */
const BABA_MAP: Record<string, number> = {
    良: 1, 稍重: 2, 重: 3, 不良: 4,
};

/**
 * グレード括弧内文字列 → grade コード。
 * 括弧なし・未登録はフォールバックロジックで補完する。
 */
const GRADE_MAP: Record<string, number> = {
    GI: 1, G1: 1, "Ｇ１": 1,
    GII: 2, G2: 2, "Ｇ２": 2,
    GIII: 3, G3: 3, "Ｇ３": 3,
    重賞: 4,
    オープン: 5, OP: 5,
    JG1: 10, "ＪＧ１": 10,
    JG2: 11, "ＪＧ２": 11,
    JG3: 12, "ＪＧ３": 12,
    L: 15, "Ｌ": 15,
    "3勝クラス": 16, "３勝クラス": 16,
    "2勝クラス": 17, "２勝クラス": 17,
    "1勝クラス": 18, "１勝クラス": 18,
};

// =============================================================================
// ブラウザ文脈外で使える純粋ヘルパー
// =============================================================================

/**
 * 非同期処理を最大 `maxAttempts` 回リトライする。
 * `TargetCloseError` は即再スローする。
 */
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

/**
 * db.netkeiba の馬詳細ページ DOM からプロフィールを解析して返す。
 * `page.evaluate` に直接渡すために関数リテラルとして定義する。
 */
function parseProfile(
    hid: string,
    SEX: Record<string, number>,
    COAT: Record<string, number>
): HorseProfile {
    const name =
        document.querySelector(".horse_title h1")?.textContent?.trim() ??
        document.querySelector("h1")?.textContent?.trim() ??
        "";

    // プロフィールテーブル → ラベル: 値 マップ
    const profMap: Record<string, string> = {};
    for (const tr of document.querySelectorAll(".db_prof_table tr")) {
        const th = tr.querySelector("th")?.textContent?.trim() ?? "";
        const td = tr.querySelector("td")?.textContent?.trim() ?? "";
        if (th) profMap[th] = td;
    }

    // ".horse_title .txt_01": "現役 牡4歳 黒鹿毛"
    const titleParts = (document.querySelector(".horse_title .txt_01")?.textContent?.trim() ?? "")
        .split(/[\s\u3000]+/)
        .map((s: string) => s.trim())
        .filter(Boolean);

    // 性別・年齢
    const sexageStr = titleParts[1] ?? profMap["性齢"] ?? "";
    const sexRaw = sexageStr.match(/^(牡|牝|セン|セ|せん)/)?.[1] ?? "";
    const sexStr = sexRaw === "セン" || sexRaw === "セ" ? "せん" : sexRaw;
    const sex = SEX[sexStr] ?? 0;
    const age = parseInt(sexageStr.match(/(\d+)歳/)?.[1] ?? "0", 10);

    // 毛色
    const coatKey = titleParts[2] ?? profMap["毛色"] ?? "";
    const type = COAT[coatKey] ?? 0;

    // リンク要素（調教師・馬主・生産者）
    const extractLink = (selector: string) => {
        const a = document.querySelector(selector) as HTMLAnchorElement | null;
        const id = a?.getAttribute("href")?.match(/\/([^/]+)\/?$/)?.[1] ?? "";
        return { name: a?.textContent?.trim() ?? "", id };
    };
    const trainer = extractLink(".db_prof_table a[href*='/trainer/']");
    const owner   = extractLink(".db_prof_table a[href*='/owner/']");
    const breeder = extractLink(".db_prof_table a[href*='/breeder/']");

    // 厩舎: 「斎藤誠 (美浦)」→ "美浦"
    const trainerCell = document.querySelector(".db_prof_table a[href*='/trainer/']")?.closest("td");
    const kyuusya = trainerCell?.textContent?.match(/[（(]([^）)]+)[）)]/)?.[1]?.trim() ?? "";

    // 生年月日
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

/**
 * db.netkeiba の成績テーブル DOM から HorseRaceResultRow[] を解析して返す。
 * `page.evaluate` に直接渡すために関数リテラルとして定義する。
 */
function parseRaceResults(
    VENUE: Record<string, number>,
    COURSE: Record<string, number>,
    GRADE: Record<string, number>,
    WEATHER: Record<string, number>,
    BABA: Record<string, number>
): HorseRaceResultRow[] {
    const table = document.querySelector("table.db_h_race_results");
    if (!table) return [];

    const headers = Array.from(table.querySelectorAll("thead th")).map(
        (th) => th.textContent?.trim() ?? ""
    );

    // 数値変換ヘルパー（空文字・NaN → null）
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

        // --- raceId ---
        const raceA = (Array.from(row.querySelectorAll("td a[href]")) as HTMLAnchorElement[])
            .find((a) => /\/race\/([0-9]{10,12})(?:\/|$)/.test(a.getAttribute("href") ?? "")) ?? null;
        const raceId = raceA?.getAttribute("href")?.match(/\/race\/([0-9]{10,12})/)?.[1] ?? "";

        // --- コース・距離 ---
        const courseText = col("距離", 14);
        const courseStr  = courseText.match(/^(芝|ダ|障|ダート)/)?.[1].replace("ダ", "ダート") ?? "";
        const course     = COURSE[courseStr] ?? null;
        const distance   = toInt(courseText.match(/(\d+)/)?.[1] ?? "");

        // --- 通過順（右詰め：最後の値が tuuka4c） ---
        const tuukaParts = col("通過", 25).split("-").filter(Boolean);
        const tuukaSlot  = (slot: number): string =>
            slot >= 4 - tuukaParts.length
                ? tuukaParts[slot - (4 - tuukaParts.length)] ?? ""
                : "";

        // --- 騎手ID ---
        const jockeyIdx = headers.indexOf("騎手") >= 0 ? headers.indexOf("騎手") : 12;
        const jockeyA   = cells[jockeyIdx]?.querySelector("a") as HTMLAnchorElement | null;
        const jockeyId  = jockeyA?.getAttribute("href")?.match(/jockey\/result\/recent\/(\d+)/)?.[1] ?? "";

        // --- レース名・グレード ---
        const raceNameRaw = col("レース名") || (raceA?.textContent?.trim() ?? "");
        const gradeMatch  = raceNameRaw.match(/[（(]([^）)]+)[）)]\s*$/);
        const gradeStr    = gradeMatch?.[1]?.trim() ?? "";
        const raceName    = gradeMatch ? raceNameRaw.slice(0, gradeMatch.index).trim() : raceNameRaw;

        let grade = GRADE[gradeStr] ?? 0;
        if (grade === 0) {
            if      (raceNameRaw.includes("新馬"))                                                      grade = 19;
            else if (raceNameRaw.includes("未勝利"))                                                    grade = 20;
            else if (raceNameRaw.includes("1勝クラス") || raceNameRaw.includes("１勝クラス"))          grade = 18;
            else if (raceNameRaw.includes("2勝クラス") || raceNameRaw.includes("２勝クラス"))          grade = 17;
            else if (raceNameRaw.includes("3勝クラス") || raceNameRaw.includes("３勝クラス"))          grade = 16;
            else if (raceNameRaw.includes("500万下")   || raceNameRaw.includes("５００万下"))           grade = 9;
            else if (raceNameRaw.includes("1000万下")  || raceNameRaw.includes("１０００万下"))         grade = 7;
            else if (raceNameRaw.includes("1600万下")  || raceNameRaw.includes("１６００万下"))         grade = 6;
        }

        // --- 開催（回次・場所・日目） ---
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
// メインクラス
// =============================================================================

/**
 * 馬詳細情報スクレイパー。
 *
 * 2つのページから馬詳細情報を取得します。
 *
 * **Step 1**: `https://db.netkeiba.com/horse/{horseId}`
 * - プロフィール（馬名・性齢・毛色・調教師・馬主・生産者）
 * - 全成績テーブル（着順・タイム・騎手・コース・距離など）
 *
 * **Step 2**: `https://race.sp.netkeiba.com/modal/horse.html?race_id={raceId}&horse_id={horseId}`
 * - 各成績のコメントを取得し Step 1 の成績テーブルに補完する。
 * - 「もっと見る」ボタンが存在する場合はクリックして全件展開する。
 *
 * 血統取得は {@link HorsePedigreeScraper}（`horsePedigree.ts`）で別途行う。
 *
 * @example
 * ```typescript
 * const scraper = new HorseDetailScraper(page);
 * const detail = await scraper.getHorseDetail("202506010311", "2020109107", "3");
 * ```
 */
export class HorseDetailScraper {
    private readonly page: Page;
    private readonly logger: Logger;

    /**
     * @param page - スクレイピングに使用する Puppeteer Page。
     *               1件ごとに新しいページを渡して状態汚染を防ぐこと。
     */
    constructor(page: Page) {
        this.page   = page;
        this.logger = new Logger();
    }

    /**
     * 馬の詳細情報を取得する。
     *
     * @param raceId  - 直近レースの raceId（SP モーダル URL に使用）
     * @param horseId - 馬ID（例: `"2020109107"`）
     * @param umaban  - 馬番（SP モーダルの `i` パラメータ）
     */
    async getHorseDetail(
        raceId: string,
        horseId: string,
        umaban: string | number
    ): Promise<HorseDetail> {
        const { profile, raceResults } = await this.scrapeFromDbNetkeiba(horseId);
        await this.supplementComments(raceId, horseId, umaban, raceResults);
        return { profile, raceResults };
    }

    // -------------------------------------------------------------------------
    // Step 1: db.netkeiba.com/horse/{horseId}
    // -------------------------------------------------------------------------

    /**
     * db.netkeiba.com の馬詳細ページからプロフィールと全成績テーブルを取得する。
     * 失敗時は最大 2 回リトライ。`TargetCloseError` は即再スロー。
     */
    private async scrapeFromDbNetkeiba(
        horseId: string
    ): Promise<{ profile: HorseProfile; raceResults: HorseRaceResultRow[] }> {
        const url = `https://db.netkeiba.com/horse/${horseId}/`;
        this.logger.info(`db.netkeiba.com 馬情報ページへアクセス: ${url}`);

        return retry(async (attempt) => {
            await this.page.setUserAgent(DESKTOP_UA);
            await this.page.setViewport({ width: 1280, height: 900, isMobile: false });
            await this.page.setExtraHTTPHeaders({ "accept-language": "ja,en-US;q=0.9,en;q=0.8" });
            await this.page.goto(url, { waitUntil: "domcontentloaded" });
            await this.page.evaluate("window.__name = function(fn) { return fn; };");

            // .horse_title は静的 HTML なので先に待機
            await this.page.waitForSelector(".horse_title", { timeout: 15000 }).catch(() => {
                this.logger.warn(`db.netkeiba .horse_title 待機タイムアウト（attempt=${attempt}）`);
            });

            // 成績テーブルは .horse_title より後にレンダリングされる場合がある
            await this.page.waitForSelector("table.db_h_race_results", { timeout: 15000 }).catch(() => {
                this.logger.info(`db.netkeiba 成績テーブルなし（未出走・引退の可能性）: horseId=${horseId}`);
            });

            const profile = await this.page.evaluate(parseProfile, horseId, SEX_MAP, COAT_MAP);
            const raceResults = await this.page.evaluate(parseRaceResults, VENUE_MAP, COURSE_MAP, GRADE_MAP, WEATHER_MAP, BABA_MAP);

            if (!profile.name && raceResults.length === 0) {
                const title   = await this.page.title().catch(() => "");
                const snippet = await this.page
                    .evaluate(() => document.body?.innerText?.slice(0, 300) ?? "")
                    .catch(() => "");
                throw new Error(`空データを検知しました title=${title} body=${snippet}`);
            }

            this.logger.info(
                `db.netkeiba からデータ取得成功（attempt=${attempt}）horseId=${horseId} races=${raceResults.length}`
            );
            return { profile, raceResults };
        }, 2, 3000);
    }

    // -------------------------------------------------------------------------
    // Step 2: sp.netkeiba モーダルから comment を補完
    // -------------------------------------------------------------------------

    /**
     * sp.netkeiba モーダルページから各レースのコメントを取得し、
     * 成績テーブルの `comment` フィールドに補完する（破壊的更新）。
     *
     * - キーは日付文字列（`"YYYY/MM/DD"`）。馬は1日1レースのみ出走するため日付で一意に紐づく。
     * - エラー発生時はスキップし、コメントなしで続行する。
     * - 全体タイムアウト 35 秒を超えた場合もスキップし、ページを `about:blank` に戻す。
     */
    private async supplementComments(
        raceId: string,
        horseId: string,
        umaban: string | number,
        raceResults: HorseRaceResultRow[]
    ): Promise<void> {
        const OVERALL_MS = 150000; // goto最大3回(25s×3+待機6s) + waitForSelector最大2回(25s×2) = 131s + バッファ
        let timedOut = false;
        let timer: ReturnType<typeof setTimeout> | null = null;

        const killer = new Promise<void>((resolve) => {
            timer = setTimeout(() => {
                timedOut = true;
                this.logger.warn(`SP comment 補完 全体タイムアウト（${OVERALL_MS / 1000}秒）- スキップ`);
                resolve();
            }, OVERALL_MS);
        });

        // .catch(() => {}) によりkiller発火後に_doSupplementCommentsが
        // バックグラウンドで失敗してもUnhandled Rejectionにならない
        const work = this._doSupplementComments(raceId, horseId, umaban, raceResults)
            .finally(() => { if (timer !== null) clearTimeout(timer); })
            .catch(() => {});

        await Promise.race([work, killer]);
    }

    /** {@link supplementComments} の実処理。外側の Promise.race に包まれて使用する。 */
    private async _doSupplementComments(
        raceId: string,
        horseId: string,
        umaban: string | number,
        raceResults: HorseRaceResultRow[]
    ): Promise<void> {
        const url =
            `https://race.sp.netkeiba.com/modal/horse.html` +
            `?race_id=${raceId}&horse_id=${horseId}&i=${Number(umaban)}&rf=shutuba_modal`;
        this.logger.info(`sp.netkeiba モーダルへアクセス（comment 補完）: ${url}`);

        try {
            // db.netkeiba ページのスクリプトが非同期で残りタブをクラッシュさせるケースがある。
            // about:blank に遷移してリソースを解放してから UA/Viewport を設定することで安定化する。
            // （血統取得を同一ページで行わなくなったため about:blank 遷移が安全に使える）
            await this.page.goto("about:blank", { waitUntil: "domcontentloaded", timeout: 10000 })
                .catch((e) => { this.logger.warn(`about:blank 遷移失敗（続行）: ${String(e)}`); });
            await this.page.setUserAgent(MOBILE_UA);
            await this.page.setViewport({ width: 390, height: 844, isMobile: true });
            await this.page.setExtraHTTPHeaders({
                "accept-language": "ja,en-US;q=0.9,en;q=0.8",
                Referer: `https://race.sp.netkeiba.com/race/shutuba.html?race_id=${raceId}`,
            });

            // gotoを最大3回リトライ（ロードが遅いケースに対応）
            // waitUntil: "domcontentloaded" = DOM解析完了後。
            // "load" は全リソース待ちのため、SPモーダルの非同期リソースが残ると永遠にブロックされる。
            // コンテンツ出現は後続の waitForSelector で担保する。
            let gotoSuccess = false;
            for (let attempt = 1; attempt <= 3; attempt++) {
                try {
                    await this.page.goto(url, { waitUntil: "domcontentloaded", timeout: 25000 });
                    gotoSuccess = true;
                    this.logger.info(`SP page.goto 成功（試行${attempt}/3）URL: ${this.page.url()}`);
                    break;
                } catch (e) {
                    this.logger.warn(`SP page.goto 試行${attempt}/3 失敗: ${String(e)}`);
                    if (attempt < 3) {
                        await new Promise((r) => setTimeout(r, 3000));
                    }
                }
            }
            if (!gotoSuccess) {
                this.logger.warn(`SP page.goto 3回試行後も失敗（comment 補完スキップ）: horseId=${horseId}`);
                return;
            }

            const selector =
                `horse_data[horse_id="${horseId}"] .RacingResultsArea, ` +
                `horse_data[horse-id="${horseId}"] .RacingResultsArea`;

            // waitForSelectorも失敗したらリロードして再試行
            let selectorFound = await this.page.waitForSelector(selector, { timeout: 25000 })
                .then(() => true)
                .catch(() => false);

            if (!selectorFound) {
                this.logger.warn(`SP selector 1回目タイムアウト、リロードして再試行: horseId=${horseId}`);
                await this.page.reload({ waitUntil: "domcontentloaded", timeout: 25000 }).catch(() => {});
                selectorFound = await this.page.waitForSelector(selector, { timeout: 25000 })
                    .then(() => true)
                    .catch(() => false);
            }

            if (!selectorFound) {
                this.logger.warn(`sp.netkeiba horse_data 待機タイムアウト（2回試行後、comment 補完スキップ）: horseId=${horseId}`);
                return;
            }

            await this.expandAllResults(horseId);

            const commentMap: Record<string, string> = await this.page.evaluate((hid) => {
                const horseDataEl = document.querySelector(
                    `horse_data[horse-id="${hid}"], horse_data[horse_id="${hid}"]`
                );
                const listEl = horseDataEl?.querySelector(`.RacingResultList.result_${hid}`);
                if (!listEl) return {};

                const map: Record<string, string> = {};
                for (const li of listEl.querySelectorAll("li")) {
                    const dateText = li
                        .querySelector(".RaceDate")
                        ?.childNodes[0]?.textContent?.replace(/\s+/g, "")
                        .trim();
                    if (!dateText) continue;
                    const cwSpans = li.querySelectorAll(".CornerWrap span");
                    if (cwSpans.length < 2) continue;
                    const comment =
                        cwSpans[1].textContent?.trim().replace(/^\(\s*|\s*\)$/g, "").trim() ?? "";
                    if (comment) map[dateText] = comment;
                }
                return map;
            }, horseId);

            for (const row of raceResults) {
                if (commentMap[row.race.date]) row.result.comment = commentMap[row.race.date];
            }
            this.logger.info(`comment 補完完了: ${Object.keys(commentMap).length} 件`);

        } catch (error) {
            this.logger.warn(`comment 補完中にエラー（スキップ）: ${String(error)}`);
        }
    }

    /**
     * SP モーダルの「もっと見る」ボタンをクリックして全成績を展開する。
     * ボタンが存在しない場合は何もしない。
     */
    private async expandAllResults(horseId: string): Promise<void> {
        const moreButton = await this.page.$(`#RacingResultMore_${horseId}`);
        if (!moreButton) return;

        const initialCount = await this.page.evaluate(
            (hid) => document.querySelectorAll(`.result_${hid} li`).length,
            horseId
        );
        await moreButton.click();
        this.logger.info(`「もっと見る」ボタンをクリック（horseId=${horseId}）`);

        await this.page
            .waitForFunction(
                (hid, cnt) => document.querySelectorAll(`.result_${hid} li`).length > cnt,
                { timeout: 8000 },
                horseId,
                initialCount
            )
            .catch(async () => {
                this.logger.warn(`もっと見る後の追加データ待機タイムアウト`);
                await new Promise((r) => setTimeout(r, 1500));
            });
    }
}
