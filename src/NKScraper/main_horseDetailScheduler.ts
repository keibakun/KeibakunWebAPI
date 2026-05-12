import { PuppeteerManager } from "../utils/PuppeteerManager";
import { HorseDetailScraper } from "./horseDetail/horseDetail";
import fs from "fs/promises";
import path from "path";
import { Logger } from "../utils/Logger";
import { FileUtil } from "../utils/FileUtil";
import { JsonFileWriterUtil } from "../utils/JsonFileWriterUtil";

const logger      = new Logger();
const jsonWriter  = new JsonFileWriterUtil(logger);

const WORK_POOL_DIR  = path.join(__dirname, "../../temp/work/workPool/horseDetail");
const HORSE_OUT_DIR  = path.join(process.cwd(), "HorseDetail");
const PROGRESS_FILE  = path.join(WORK_POOL_DIR, ".progress.json");
const CONCURRENCY    = 3;
const INTERVAL_MS    = 60 * 60 * 1000; // 1時間

/** 1件の馬エントリ */
interface HorseEntry {
    raceId: string;
    horseId: string;
    umaban: string;
}

/** 進捗ファイルの構造 */
interface Progress {
    /** 次に処理するファイルのインデックス（0始まり） */
    nextIndex: number;
}

// =============================================================================
// ヘルパー
// =============================================================================

/** workPool ディレクトリ内の workPool*.json を昇順で返す */
async function listWorkPoolFiles(): Promise<string[]> {
    if (!await FileUtil.exists(WORK_POOL_DIR)) return [];
    const entries = await fs.readdir(WORK_POOL_DIR);
    return entries
        .filter((n) => /^workPool\d+\.json$/i.test(n))
        .sort((a, b) => {
            const na = parseInt(a.match(/\d+/)?.[0] ?? "0", 10);
            const nb = parseInt(b.match(/\d+/)?.[0] ?? "0", 10);
            return na - nb;
        });
}

/** 進捗ファイルを読み込む。存在しない場合は { nextIndex: 0 } を返す */
async function loadProgress(): Promise<Progress> {
    try {
        const raw = await fs.readFile(PROGRESS_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        if (typeof parsed?.nextIndex === "number") return parsed as Progress;
    } catch {
        // 存在しない or パース失敗 → 初期値
    }
    return { nextIndex: 0 };
}

/** 進捗ファイルを保存する */
async function saveProgress(progress: Progress): Promise<void> {
    await fs.mkdir(WORK_POOL_DIR, { recursive: true });
    await fs.writeFile(PROGRESS_FILE, JSON.stringify(progress, null, 4), "utf-8");
}

/** workPool JSON ファイルから HorseEntry 配列を読み込む */
async function readWorkPoolFile(filePath: string): Promise<HorseEntry[]> {
    const raw  = await fs.readFile(filePath, "utf-8");
    const json = JSON.parse(raw);

    // 新形式: { horses: HorseEntry[] }
    if (json && typeof json === "object" && Array.isArray(json.horses)) {
        return (json.horses as unknown[])
            .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
            .map((item) => ({
                raceId:  String(item.raceId  ?? "").trim(),
                horseId: String(item.horseId ?? "").trim(),
                umaban:  String(item.umaban  ?? "").trim(),
            }))
            .filter((e) => e.horseId.length > 0);
    }

    // 旧形式互換: string[] / { horseId: string[] }
    let ids: unknown[];
    if (Array.isArray(json)) {
        ids = json;
    } else if (Array.isArray(json?.horseId)) {
        ids = json.horseId;
    } else {
        throw new Error(`workPool ファイルの形式が不正です: ${filePath}`);
    }

    logger.warn(`旧形式 workPool ファイル（raceId/umaban なし）: ${filePath}`);
    return ids
        .map((id) => String(id).trim())
        .filter((id) => id.length > 0)
        .map((horseId) => ({ raceId: "", horseId, umaban: "" }));
}

/** HorseDetail 保存先ディレクトリとファイルパスを返す（main_horseDetail と同一ロジック） */
function getOutPath(outDir: string, id: string): { dir: string; file: string } {
    if (id.length >= 10) {
        const year   = id.substring(0, 4);
        const month  = id.substring(4, 6);
        const part3  = id.substring(6, 8);
        const part4  = id.substring(8, 10);
        const dir    = path.join(outDir, year, month, part3, part4);
        return { dir, file: path.join(dir, "index.html") };
    }
    if (id.length >= 8) {
        const year  = id.substring(0, 4);
        const month = id.substring(4, 6);
        const part3 = id.substring(6, 8);
        const dir   = path.join(outDir, year, month, part3);
        return { dir, file: path.join(dir, "index.html") };
    }
    return { dir: outDir, file: path.join(outDir, `${id}.html`) };
}

// =============================================================================
// 並列処理
// =============================================================================

async function processEntries(
    entries: HorseEntry[],
    pm: PuppeteerManager
): Promise<void> {
    if (entries.length === 0) return;

    const workerCount = Math.min(CONCURRENCY, entries.length);
    logger.info(`並列処理開始（並列数: ${workerCount} / 件数: ${entries.length}）`);

    let cursor = 0;

    const worker = async (workerId: number) => {
        while (true) {
            const idx = cursor++;
            if (idx >= entries.length) break;

            const { raceId, horseId, umaban } = entries[idx];
            const page = await pm.newPage();
            try {
                logger.info(`[Worker${workerId}] (${idx + 1}/${entries.length}) horseId=${horseId} raceId=${raceId}`);
                const scraper     = new HorseDetailScraper(page);
                const horseDetail = await scraper.getHorseDetail(raceId, horseId, umaban);
                const target      = getOutPath(HORSE_OUT_DIR, horseId);
                await jsonWriter.writeJson(target.dir, "index.html", horseDetail);
                logger.info(`[Worker${workerId}] 保存完了: ${target.file}`);
            } catch (e: any) {
                logger.error(`[Worker${workerId}] horseId=${horseId} でエラー: ${String(e)}`);
                if (e instanceof Error && e.name === "TargetCloseError") break;
            } finally {
                try { await page.close(); } catch { /* 既に閉じている場合は無視 */ }
            }

            // レートリミット対策
            const waitMs = 3000 + Math.floor(Math.random() * 4000);
            await new Promise((r) => setTimeout(r, waitMs));
        }
    };

    await Promise.all(Array.from({ length: workerCount }, (_, i) => worker(i)));
}

// =============================================================================
// メインクラス
// =============================================================================

/**
 * workPool を参照して 1 時間おきに 1 ファイル分の HorseDetail 取得を行うスケジューラ。
 *
 * - `temp/work/workPool/horseDetail/workPool*.json` を昇順で処理する。
 * - 処理済みインデックスを `.progress.json` に保存し、再起動後も続きから再開できる。
 * - workPool ファイルは削除しない。
 * - 全ファイルを処理し終えたら正常終了する。
 *
 * @example
 * ```bash
 * npx tsx src/NKScraper/main_horseDetailScheduler.ts
 * ```
 */
export class Main_HorseDetailScheduler {

    async run(): Promise<void> {
        logger.info("HorseDetail スケジューラを開始します");
        logger.info(`workPool ディレクトリ: ${WORK_POOL_DIR}`);
        logger.info(`処理間隔: ${INTERVAL_MS / 60000} 分`);

        const files = await listWorkPoolFiles();
        if (files.length === 0) {
            logger.warn("workPool ファイルが見つかりません。終了します。");
            return;
        }
        logger.info(`workPool ファイル数: ${files.length}`);

        const progress = await loadProgress();
        logger.info(`前回の進捗を読み込みました: nextIndex=${progress.nextIndex}`);

        if (progress.nextIndex >= files.length) {
            logger.info("全ての workPool ファイルを処理済みです。終了します。");
            return;
        }

        let isFirst = true;

        while (progress.nextIndex < files.length) {
            const fileName = files[progress.nextIndex];
            const filePath = path.join(WORK_POOL_DIR, fileName);

            logger.info(`========================================`);
            logger.info(`処理開始: ${fileName} (${progress.nextIndex + 1}/${files.length})`);
            logger.info(`========================================`);

            let entries: HorseEntry[] = [];
            try {
                entries = await readWorkPoolFile(filePath);
                logger.info(`エントリ数: ${entries.length}件`);
            } catch (e: any) {
                logger.error(`workPool ファイル読み込みエラー（スキップ）: ${filePath}: ${String(e)}`);
                progress.nextIndex++;
                await saveProgress(progress);
                continue;
            }

            const pm = new PuppeteerManager();
            await pm.init();
            try {
                await processEntries(entries, pm);
            } finally {
                await pm.close();
            }

            progress.nextIndex++;
            await saveProgress(progress);
            logger.info(`進捗を保存しました: nextIndex=${progress.nextIndex}`);

            if (progress.nextIndex >= files.length) {
                logger.info("全ての workPool ファイルの処理が完了しました。");
                break;
            }

            // 1時間待機（初回は待機しない）
            if (!isFirst) {
                logger.info(`次の処理まで ${INTERVAL_MS / 60000} 分待機します...`);
            }
            logger.info(`次の処理: ${files[progress.nextIndex]} (${new Date(Date.now() + INTERVAL_MS).toLocaleString("ja-JP")} 予定)`);
            await new Promise((r) => setTimeout(r, INTERVAL_MS));

            isFirst = false;
        }

        logger.info("スケジューラを終了します。");
    }
}

// =============================================================================
// CLI エントリポイント
// =============================================================================

if (require.main === module) {
    new Main_HorseDetailScheduler().run().catch((e) => {
        logger.error(`予期しないエラー: ${String(e)}`);
        process.exit(1);
    });
}
