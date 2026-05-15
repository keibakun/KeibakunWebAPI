import { PuppeteerManager } from "../utils/PuppeteerManager";
import { HorsePedigreeScraper } from "./horseDetail/horsePedigree";
import { JsonFileWriterUtil } from "../utils/JsonFileWriterUtil";
import { Logger } from "../utils/Logger";
import { HorseDetailRunLogger } from "../utils/HorseDetailRunLogger";
import path from "path";
import {
    WORK_POOL_DIR,
    HORSE_OUT_DIR,
    HORSE_LOG_OUT_DIR,
    getOldestWorkPoolFile,
    getHorseDetailOutPath,
    readWorkPoolEntries,
    readHorseDetail,
} from "./main_horseDetail_db";

const logger = new Logger();
const jsonWriter = new JsonFileWriterUtil(logger);

/** workPool の1エントリ */
interface HorseEntry {
    raceId: string;
    horseId: string;
    umaban: string;
}

// =============================================================================
// Step④: 5代血統表取得・補完メイン
// =============================================================================

/**
 * workPool の先頭ファイルを参照し、HorseDetail JSON に5代血統表を補完して上書き保存する。
 * その後 workPool ファイルを削除する（Step⑤を兼ねる）。
 *
 * 前提: Step②③が完了済みであること。
 *
 * **スキップ条件**: HorseDetail JSON 内の `profile.pedigree` が既に存在する場合はスキップ。
 * これにより再実行しても無駄なアクセスが発生しない。
 */
class Main_HorseDetail_Pedigree {
    async run(): Promise<void> {
        const fileName = await getOldestWorkPoolFile(WORK_POOL_DIR);
        if (!fileName) {
            logger.info("workPool に処理対象ファイルがありません。正常終了します。");
            return;
        }

        const filePath = path.join(WORK_POOL_DIR, fileName);
        logger.info(`処理対象 workPool ファイル: ${filePath}`);

        const entries = await readWorkPoolEntries(filePath);
        if (entries.length === 0) {
            logger.warn(`horseId 配列が空のためスキップ: ${filePath}`);

            return;
        }

        const pm = new PuppeteerManager();
        await pm.init();

        const isCI = !!process.env.CI || process.env.GITHUB_ACTIONS === "true";
        const concurrency = isCI ? 1 : 3;
        logger.info(`並列数: ${concurrency}${isCI ? " (CI環境)" : ""}`);

        const runLogger = new HorseDetailRunLogger("main_horseDetail_pedigree", HORSE_LOG_OUT_DIR);
        try {
            await this.processEntries(entries, pm, concurrency, runLogger);
        } finally {
            await pm.close();
            const saved = await runLogger.save();
            if (saved) logger.info(`実行ログを保存しました: ${saved}`);
        }

    }

    private async processEntries(
        entries: HorseEntry[],
        pm: PuppeteerManager,
        concurrency: number,
        runLogger: HorseDetailRunLogger
    ): Promise<void> {
        const workerCount = Math.min(concurrency, entries.length);
        let cursor = 0;

        const worker = async (workerId: number) => {
            while (true) {
                const idx = cursor++;
                if (idx >= entries.length) break;

                const { horseId } = entries[idx];

                const horseDetail = await readHorseDetail(HORSE_OUT_DIR, horseId);
                if (!horseDetail) {
                    logger.warn(`[Worker${workerId}] HorseDetail が存在しないためスキップ: horseId=${horseId}`);
                    runLogger.recordSkip(horseId, "HorseDetailが存在しない、1層前のDB取得で失敗した可能性あり");
                    continue;
                }

                // pedigree が既に存在する場合はスキップ
                if (
                    horseDetail.profile.pedigree &&
                    Object.keys(horseDetail.profile.pedigree).length > 0
                ) {
                    logger.info(`[Worker${workerId}] pedigree 取得済みのためスキップ: horseId=${horseId}`);
                    continue;
                }

                const page = await pm.newPage();
                try {
                    logger.info(`[Worker${workerId}] (${idx + 1}/${entries.length}) 血統取得: horseId=${horseId}`);

                    const scraper = new HorsePedigreeScraper(page);
                    const pedigree = await scraper.scrapePedigree(horseId, horseDetail.profile);

                    if (Object.keys(pedigree).length === 0) {
                        logger.warn(`[Worker${workerId}] 血統データが空 horseId=${horseId}`);
                    }

                    horseDetail.profile.pedigree = pedigree;

                    const target = getHorseDetailOutPath(HORSE_OUT_DIR, horseId);
                    await jsonWriter.writeJson(target.dir, "index.html", horseDetail);
                    logger.info(`[Worker${workerId}] 血統補完・保存完了: ${target.file}`);
                } catch (e: unknown) {
                    logger.error(`[Worker${workerId}] 血統取得エラー horseId=${horseId}: ${String(e)}`);
                    runLogger.recordFail(horseId, String(e).split("\n")[0]);
                    if (e instanceof Error && e.name === "TargetCloseError") break;
                } finally {
                    await page.close().catch(() => {});
                }

                const waitMs = 3000 + Math.floor(Math.random() * 4000);
                await new Promise((r) => setTimeout(r, waitMs));
            }
        };

        await Promise.all(Array.from({ length: workerCount }, (_, i) => worker(i)));
    }
}

// CLI
if (require.main === module) {
    new Main_HorseDetail_Pedigree().run().catch((err) => {
        logger.error(`main_horseDetail_pedigree の実行で異常終了: ${String(err)}`);
        process.exit(1);
    });
}
