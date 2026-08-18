import { Page } from "puppeteer";
import { PuppeteerManager } from "../../utils/PuppeteerManager";
import { RaceResult } from "../../scrapers/nk/raceResult/raceResult";
import { RaceResultDbService } from "../../service/db/RaceResultDbService";
import { RaceListDbService } from "../../service/db/RaceListDbService";
import { Logger } from "../../utils/Logger";

const logger = new Logger();
const dbService = new RaceResultDbService();
const raceListDbService = new RaceListDbService();

/** 並列処理のデフォルト同時実行数 */
const DEFAULT_CONCURRENCY = 5;

/**
 * Main_RaceResult
 *
 * 年月をKeibakunServerへ問い合わせ、各 `raceId` に対して `RaceResult` を取得して
 * DBへ保存するクラスです。
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
                    await dbService.store(raceId, result);
                    logger.info(`[Worker${workerId}] raceId: ${raceId} を DB に保存しました`);
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
     * 指定年月のレース一覧をKeibakunServerへ問い合わせ、raceIdの配列を返します。
     * @param month 対象月（1-12）
     */
    private async collectRaceIds(month: number): Promise<string[]> {
        try {
            const yyyymm = `${this.year}${month.toString().padStart(2, "0")}`;
            return await raceListDbService.findRaceIds(yyyymm);
        } catch (err) {
            logger.warn(`RaceList API の呼び出しに失敗しました: date=${this.year}${month.toString().padStart(2, "0")}`);
            return [];
        }
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