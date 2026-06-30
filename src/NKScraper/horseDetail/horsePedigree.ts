import { Page } from "puppeteer";
import { Logger } from "../../utils/Logger";
import { HorseProfile, Pedigree, PedigreeNode, HorseGender } from "./horseDetailIF";

/** db.netkeiba.com（PC版）User-Agent */
const DESKTOP_UA =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// =============================================================================
// ブラウザ文脈（evaluate 内）で動作する純粋解析関数
// =============================================================================

/**
 * db.netkeiba の5代血統ページ DOM から血統表をフラットなヒープ形式で返す。
 *
 * ヒープインデックス:
 * - `"2"` = 父 / `"3"` = 母
 * - 偶数インデックス = 父系（牡） / 奇数インデックス = 母系（牝）
 * - 親ノード `i` の父 = `2i`、母 = `2i+1`
 * - 最大 `"63"`（第5世代）
 */
function parsePedigreeTable(): Record<string, PedigreeNode> {
    const table = document.querySelector(".blood_table");
    if (!table) return {};

    // すべての td 要素を取得し、rowspan 属性を元に世代と位置を計算する
    const allCells = Array.from(table.querySelectorAll("td")) as HTMLTableCellElement[];
    if (allCells.length === 0) return {};

    // 最大 rowspan を元に総行数を決定（gen1 の rowspan × 2 = 総行数）
    const maxRowspan = Math.max(
        ...allCells.map((td) => parseInt(td.getAttribute("rowspan") ?? "1", 10))
    );
    const TOTAL_ROWS = maxRowspan * 2;

    const pedigree: Record<string, PedigreeNode> = {};
    const countByRowspan: Record<number, number> = {};

    for (const cell of allCells) {
        // rowspan 属性を取得（デフォルトは 1）
        const rowspan = parseInt(cell.getAttribute("rowspan") ?? "1", 10);

        // rowspan から世代を逆算（log2(TOTAL_ROWS / rowspan) が 1〜5 の整数）
        const genFloat = Math.log2(TOTAL_ROWS / rowspan);
        const gen = Math.round(genFloat);
        if (Math.abs(genFloat - gen) > 0.01 || gen < 1 || gen > 5) continue;

        // 同じ rowspan のセルが複数ある場合、順番に pos を割り当てる
        if (!countByRowspan[rowspan]) countByRowspan[rowspan] = 0;
        const pos = countByRowspan[rowspan]++;

        // ヒープインデックス: gen の先頭インデックス（2^gen）+ 同世代内の位置
        const heapIdx = Math.pow(2, gen) + pos;
        const gender: HorseGender = heapIdx % 2 === 0 ? "牡" : "牝";

        const a = cell.querySelector("a") as HTMLAnchorElement | null;
        const href = a?.getAttribute("href") ?? "";
        const id = href.match(/\/horse\/(?:ped\/)?([^/?]+)/)?.[1] ?? "";
        // textContent には "日本語名\n\t\t    \n\t\t    English Name(米)" のような形式が含まれる
        // 改行前の最初のテキスト部分（日本語名）のみを使用する
        const rawName = a?.textContent ?? "";
        const name = rawName.split(/[\r\n]/)[0].trim();

        if (name || id) {
            pedigree[String(heapIdx)] = { id, name, gender };
        }
    }

    return pedigree;
}

// =============================================================================
// クラス
// =============================================================================

/**
 * 馬の5代血統表スクレイパー。
 *
 * `https://db.netkeiba.com/horse/ped/{horseId}/` から血統を取得し、
 * ヒープインデックス形式の {@link Pedigree} として返す。
 *
 * `HorseDetailScraper` とは別ページを渡して単独で使用すること。
 *
 * @example
 * ```typescript
 * const page = await pm.newPage();
 * try {
 *     const scraper = new HorsePedigreeScraper(page);
 *     const pedigree = await scraper.scrapePedigree(horseId, profile);
 * } finally {
 *     await page.close();
 * }
 * ```
 */
export class HorsePedigreeScraper {
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
     * db.netkeiba の血統ページ（`/horse/ped/{horseId}/`）から5代血統表を取得する。
     *
     * - ヒープインデックス方式（`"2"`=父 / `"3"`=母 / ... / `"63"`=第5世代）
     * - インデックス `"1"` には本馬自身を追加する。
     * - エラー発生時は空オブジェクトを返し処理を継続する。
     *
     * @param horseId - 馬ID（例: `"2020109107"`）
     * @param profile - `HorseDetailScraper` で取得した馬プロフィール（馬名・性別に使用）
     */
    async scrapePedigree(horseId: string, profile: HorseProfile): Promise<Pedigree> {
        const url = `https://db.netkeiba.com/horse/ped/${horseId}/`;
        this.logger.info(`血統ページへアクセス: ${url}`);

        const pedigree: Pedigree = {};

        try {
            // ページのロードと DOM の安定化を待つ
            await this.page.setUserAgent(DESKTOP_UA);
            await this.page.setViewport({ width: 1280, height: 900, isMobile: false });
            await this.page.setExtraHTTPHeaders({ "accept-language": "ja,en-US;q=0.9,en;q=0.8" });
            await this.page.goto(url, { waitUntil: "load", timeout: 20000 });

            // 血統表のテーブルが表示されるまで待機（最大 15 秒）
            await this.page.waitForSelector(".blood_table", { timeout: 15000 }).catch(() => {
                this.logger.warn(`blood_table 待機タイムアウト: horseId=${horseId}`);
            });

            const raw = await this.page.evaluate(parsePedigreeTable);
            Object.assign(pedigree, raw);

            // インデックス "1" = 本馬自身
            const sexToGender: Record<number, HorseGender> = { 1: "牡", 2: "牝", 3: "せん" };
            pedigree["1"] = {
                id:     horseId,
                name:   profile.name,
                gender: sexToGender[profile.sex] ?? "牡",
            };

            this.logger.info(`血統取得成功: horseId=${horseId} nodes=${Object.keys(pedigree).length}`);
        } catch (error) {
            this.logger.warn(`血統取得中にエラー（空で続行）: ${String(error)}`);
        }

        return pedigree;
    }
}
