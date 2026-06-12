import { PuppeteerManager } from "../utils/PuppeteerManager";
import { HorseDbScraper } from "./horseDetail/horseDbScraper";
import fs from "fs/promises";
import path from "path";
import { Logger } from "../utils/Logger";
import { FileUtil } from "../utils/FileUtil";
import { JsonFileWriterUtil } from "../utils/JsonFileWriterUtil";
import { HorseDetail } from "./horseDetail/horseDetailIF";
import { HorseDetailRunLogger } from "../utils/HorseDetailRunLogger";

const logger = new Logger();
const jsonWriter = new JsonFileWriterUtil(logger);

/** workPool の1エントリ */
interface HorseEntry {
    raceId: string;
    horseId: string;
    umaban: string;
}

// =============================================================================
// workPool / HorseDetail パスユーティリティ（全 main_horseDetail_*.ts で共通）
// =============================================================================

export const WORK_POOL_DIR = path.join(__dirname, "../../temp/work/workPool/horseDetail");
export const HORSE_OUT_DIR = path.join(process.cwd(), "HorseDetail");
export const HORSE_LOG_OUT_DIR = path.join(process.cwd(), "Log/HorseDetail");

export function getHorseDetailOutPath(base: string, id: string): { dir: string; file: string } {
    if (id.length >= 10) {
        const dir = path.join(base, id.slice(0, 4), id.slice(4, 6), id.slice(6, 8), id.slice(8, 10));
        return { dir, file: path.join(dir, "index.html") };
    }
    if (id.length >= 8) {
        const dir = path.join(base, id.slice(0, 4), id.slice(4, 6), id.slice(6, 8));
        return { dir, file: path.join(dir, "index.html") };
    }
    return { dir: base, file: path.join(base, `${id}.html`) };
}

export async function readWorkPoolEntries(filePath: string): Promise<HorseEntry[]> {
    const raw = await fs.readFile(filePath, "utf-8");
    const json: unknown = JSON.parse(raw);

    if (json && typeof json === "object" && Array.isArray((json as { horses?: unknown }).horses)) {
        return ((json as { horses: unknown[] }).horses as Record<string, unknown>[])
            .filter((item) => !!item && typeof item === "object")
            .map((item) => ({
                raceId:  String(item["raceId"]  ?? "").trim(),
                horseId: String(item["horseId"] ?? "").trim(),
                umaban:  String(item["umaban"]  ?? "").trim(),
            }))
            .filter((e) => e.horseId.length > 0);
    }
    throw new Error(`workPool ファイルの形式が不正です: ${filePath}`);
}

export async function getOldestWorkPoolFile(dir: string): Promise<string | null> {
    if (!await FileUtil.exists(dir)) return null;
    const entries = await fs.readdir(dir);
    const files: string[] = [];
    for (const name of entries) {
        const full = path.join(dir, name);
        const stat = await fs.stat(full).catch(() => null);
        if (stat?.isFile()) files.push(name);
    }
    if (files.length === 0) return null;
    files.sort((a, b) => a.localeCompare(b));
    return files[0];
}

export async function readHorseDetail(base: string, horseId: string): Promise<HorseDetail | null> {
    const { file } = getHorseDetailOutPath(base, horseId);
    if (!await FileUtil.exists(file)) return null;
    try {
        const raw = await fs.readFile(file, "utf-8");
        return JSON.parse(raw) as HorseDetail;
    } catch {
        return null;
    }
}

// =============================================================================
// Step②: DB 取得メイン
// =============================================================================

/**
 * workPool の先頭ファイルを消化して db.netkeiba からプロフィール＋成績を取得・保存する。
 *
 * - comment は空文字のまま保存（Step③で補完する）
 * - pedigree は保存しない（Step④で補完する）
 * - workPool ファイルは削除しない（Step③④が同じファイルを参照するため Step⑤で削除）
 */
export class Main_HorseDetail_Db {
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

        const runLogger = new HorseDetailRunLogger("main_horseDetail_db", HORSE_LOG_OUT_DIR);
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

                const { horseId, raceId } = entries[idx];
                const page = await pm.newPage();
                try {
                    logger.info(`[Worker${workerId}] (${idx + 1}/${entries.length}) DB取得: horseId=${horseId}`);

                    const scraper = new HorseDbScraper(page);
                    const { profile, raceResults } = await scraper.scrape(horseId);

                    if (!profile.name)      logger.warn(`[Worker${workerId}] 警告: profile.name が空 horseId=${horseId}`);
                    if (!profile.sex)       logger.warn(`[Worker${workerId}] 警告: profile.sex が0 horseId=${horseId}`);
                    if (!profile.birthDate) logger.warn(`[Worker${workerId}] 警告: profile.birthDate が空 horseId=${horseId}`);
                    if (!profile.trainer)   logger.warn(`[Worker${workerId}] 警告: profile.trainer が空 horseId=${horseId}`);
                    if (raceResults.length === 0) logger.warn(`[Worker${workerId}] 警告: raceResults が0件 horseId=${horseId}`);

                    const horseDetail: HorseDetail = { profile, raceResults };
                    const target = getHorseDetailOutPath(HORSE_OUT_DIR, horseId);
                    await jsonWriter.writeJson(target.dir, "index.html", horseDetail);
                    logger.info(`[Worker${workerId}] 保存完了: ${target.file}`);
                } catch (e: unknown) {
                    logger.error(`[Worker${workerId}] DB取得エラー horseId=${horseId} raceId=${raceId}: ${String(e)}`);
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
    new Main_HorseDetail_Db().run().catch((err) => {
        logger.error(`main_horseDetail_db の実行で異常終了: ${String(err)}`);
        process.exit(1);
    });
}
