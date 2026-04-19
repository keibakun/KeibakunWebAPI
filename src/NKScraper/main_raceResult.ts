import path from "path";
import fs from "fs/promises";
import { Page } from "puppeteer";
import { PuppeteerManager } from "../utils/PuppeteerManager";
import { RaceResult } from "./raceResult/raceResult";
import { JsonFileWriterUtil } from "../utils/JsonFileWriterUtil";
import { FileUtil } from "../utils/FileUtil";
import { Logger } from "../utils/Logger";

const logger = new Logger();
const jsonWriter = new JsonFileWriterUtil(logger);

/** 並列処理のデフォルト同時実行数 */
const DEFAULT_CONCURRENCY = 5;

/**
 * Main_RaceResult
 *
 * 年月から `RaceList` を走査し、各 `raceId` に対して `RaceResult` を取得して
 * `RaceResult/<year><month><rest>/index.html` に JSON を保存するクラスです。
 * 複数タブを使った並列スクレイピングに対応しています。
 */
export class Main_RaceResult {
    private year: number;
    private monthArg?: number;
    private concurrency: number;
    private singleRaceId?: string;

    /**
     * コンストラクタ
     * @param year 対象の年（例: 2025）
     * @param monthArg 対象の月（省略時は全月）
     * @param concurrency 並列実行数（デフォルト: 5）
     * @param singleRaceId 1件だけ取得する raceId（指定時は year/monthArg を無視）
     */
    constructor(year: number, monthArg?: number, concurrency?: number, singleRaceId?: string) {
        this.year = year;
        this.monthArg = monthArg;
        this.concurrency = concurrency ?? DEFAULT_CONCURRENCY;
        this.singleRaceId = singleRaceId;
    }

    /**
     * エントリポイント: Puppeteer を初期化して対象月すべての処理を実行します。
     * `singleRaceId` が指定された場合は year/monthArg を無視し、その1件のみ処理します。
     */
    async run(): Promise<void> {
        let allRaceIds: string[];

        if (this.singleRaceId) {
            logger.info(`単一 raceId モード: ${this.singleRaceId}, 並列数: ${this.concurrency}`);
            allRaceIds = [this.singleRaceId];
        } else {
            logger.info(`指定された年: ${this.year}${this.monthArg ? `, 月: ${this.monthArg}` : ""}, 並列数: ${this.concurrency}`);

            const months = this.getTargetMonths();

            // 全対象月の raceId を先に収集する
            allRaceIds = [];
            for (const month of months) {
                const ids = await this.collectRaceIds(month);
                allRaceIds.push(...ids);
            }
        }

        if (allRaceIds.length === 0) {
            logger.warn("処理対象の raceId がありません");
            return;
        }
        logger.info(`合計 ${allRaceIds.length} 件の raceId を処理します（並列数: ${this.concurrency}）`);

        // Puppeteer を起動してワーカープールで並列処理
        const pm = new PuppeteerManager();
        const pages: Page[] = [];
        try {
            await pm.init();

            // 並列数ぶんのページ（タブ）を生成
            for (let i = 0; i < this.concurrency; i++) {
                const page = await pm.newPage();
                pages.push(page);
            }

            // ワーカープール方式で並列実行
            await this.runWorkerPool(pages, allRaceIds);
        } catch (e) {
            logger.error(`致命的なエラー: ${String(e)}`);
        } finally {
            // 追加したページをクローズ
            for (const page of pages) {
                try { await page.close(); } catch {}
            }
            await pm.close();
        }
    }

    /**
     * ワーカープール: 各ページが共有キューから raceId を取り出して処理する
     * @param pages Puppeteer Page の配列
     * @param raceIds 処理対象の raceId 配列
     */
    private async runWorkerPool(pages: Page[], raceIds: string[]): Promise<void> {
        let cursor = 0;
        const total = raceIds.length;

        const worker = async (page: Page, workerId: number) => {
            const scraper = new RaceResult(page);
            while (true) {
                const idx = cursor++;
                if (idx >= total) break;
                const raceId = raceIds[idx];
                try {
                    logger.info(`[Worker${workerId}] (${idx + 1}/${total}) raceId: ${raceId} のレース結果を取得します`);
                    const result = await scraper.getRaceResult(raceId);

                    const ry = raceId.substring(0, 4);
                    const rm = raceId.substring(4, 6);
                    const rest = raceId.substring(6);
                    const outDir = path.join(__dirname, `../../RaceResult/`, ry, rm, rest);
                    await jsonWriter.writeJson(outDir, "index.html", result);
                } catch (err: any) {
                    logger.error(`[Worker${workerId}] raceId: ${raceId} の取得・保存でエラー: ${String(err)}`);
                }
            }
        };

        // 全ワーカーを同時に起動し、すべてが完了するまで待機
        await Promise.all(pages.map((page, i) => worker(page, i)));
    }

    /**
     * 対象とする月の配列を返します。
     */
    private getTargetMonths(): number[] {
        if (this.monthArg && this.monthArg >= 1 && this.monthArg <= 12) {
            return [this.monthArg];
        }
        return Array.from({ length: 12 }, (_, i) => i + 1);
    }

    /**
     * 指定月の RaceList ディレクトリを走査し、raceId の配列を返します。
     * @param month 対象月（1-12）
     */
    private async collectRaceIds(month: number): Promise<string[]> {
        const formattedMonth = month.toString().padStart(2, "0");
        const raceListRoot = path.join(__dirname, `../../RaceList/`);

        let entries: string[] = [];
        try {
            entries = await fs.readdir(raceListRoot);
        } catch (err) {
            logger.warn(`RaceListディレクトリが見つかりません: ${raceListRoot}`);
            return [];
        }

        const kaisaiDates: string[] = [];
        for (const name of entries) {
            const idxPath = path.join(raceListRoot, name, "index.html");
            if (name.startsWith(`${this.year}${formattedMonth}`) && await FileUtil.exists(idxPath)) {
                kaisaiDates.push(name);
            }
        }

        if (kaisaiDates.length === 0) {
            logger.warn(`RaceList/${this.year}${formattedMonth}**/index.html が見つかりません`);
            return [];
        }

        const raceIds: string[] = [];
        for (const kaisaiDate of kaisaiDates) {
            const ids = await this.extractRaceIds(raceListRoot, kaisaiDate);
            raceIds.push(...ids);
        }
        return raceIds;
    }

    /**
     * 開催日（kaisaiDate）の RaceList/index.html から raceId を抽出します。
     * @param raceListRoot RaceList ルートパス
     * @param kaisaiDate 開催日文字列（YYYYMMDD）
     */
    private async extractRaceIds(raceListRoot: string, kaisaiDate: string): Promise<string[]> {
        const raceListPath = path.join(raceListRoot, kaisaiDate, "index.html");
        if (! await FileUtil.exists(raceListPath)) {
            logger.warn(`RaceListファイルが存在しません: ${raceListPath}`);
            return [];
        }

        let raceListJson = "";
        try {
            raceListJson = await fs.readFile(raceListPath, "utf-8");
        } catch (e) {
            logger.error(`RaceListの読み込みに失敗しました: ${raceListPath}`);
            return [];
        }

        let raceList: any[] = [];
        try {
            raceList = JSON.parse(raceListJson);
        } catch (e) {
            logger.error("RaceListのJSONパースに失敗しました");
            return [];
        }

        const raceIds: string[] = [];
        for (const venue of raceList) {
            if (venue.items && Array.isArray(venue.items)) {
                for (const item of venue.items) {
                    if (item.raceId) {
                        raceIds.push(item.raceId);
                    }
                }
            }
        }

        if (raceIds.length === 0) {
            logger.error(`raceIdが見つかりませんでした: ${kaisaiDate}`);
        }
        return raceIds;
    }
}

// CLI 実行
// args[0] が 4 文字より長い場合は raceId として扱い、年月は無視する
const args = process.argv.slice(2);

if (args[0] && args[0].length > 4) {
    const singleRaceId = args[0];
    const concurrency = args[1] ? parseInt(args[1], 10) : undefined;
    const main = new Main_RaceResult(0, undefined, concurrency, singleRaceId);
    main.run();
} else {
    const year = parseInt(args[0], 10) || 2025;
    const monthArg = args[1] ? parseInt(args[1], 10) : undefined;
    const concurrency = args[2] ? parseInt(args[2], 10) : undefined;
    const main = new Main_RaceResult(year, monthArg, concurrency);
    main.run();
}