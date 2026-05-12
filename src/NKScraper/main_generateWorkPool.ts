import fs from "fs/promises";
import path from "path";
import { Logger } from "../utils/Logger";

const logger = new Logger();

const ROOT           = path.join(__dirname, "../../");
const SHUTUBA_ROOT   = path.join(ROOT, "Shutuba");
const WORK_POOL_DIR  = path.join(ROOT, "temp/work/workPool/horseDetail");
const CHUNK_SIZE     = 100;

/** 1件の馬エントリ */
interface HorseEntry {
    raceId: string;
    horseId: string;
    umaban: string;
}

// =============================================================================
// ヘルパー
// =============================================================================

async function dirExists(p: string): Promise<boolean> {
    try {
        const s = await fs.stat(p);
        return s.isDirectory();
    } catch {
        return false;
    }
}

async function fileExists(p: string): Promise<boolean> {
    try {
        const s = await fs.stat(p);
        return s.isFile();
    } catch {
        return false;
    }
}

/**
 * Shutuba/index.html の内容から馬エントリを抽出する。
 * syutuba 配列優先、失敗時は正規表現フォールバック。
 */
function extractEntries(content: string, raceId: string): HorseEntry[] {
    const entries: HorseEntry[] = [];
    const seen = new Set<string>();

    try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed?.syutuba)) {
            for (const item of parsed.syutuba) {
                const horseId = String(item?.horseId ?? item?.horseid ?? "").trim();
                const umaban  = String(item?.umaban  ?? "").trim();
                if (horseId && !seen.has(horseId)) {
                    seen.add(horseId);
                    entries.push({ raceId, horseId, umaban });
                }
            }
            return entries;
        }
    } catch {
        // フォールバックへ
    }

    let m: RegExpExecArray | null;
    const re = /"horseId"\s*:\s*"(\d+)"/g;
    while ((m = re.exec(content)) !== null) {
        const horseId = m[1];
        if (!seen.has(horseId)) {
            seen.add(horseId);
            entries.push({ raceId, horseId, umaban: "" });
        }
    }

    return entries;
}

/**
 * 既存の workPool*.json を全削除する。
 */
async function clearWorkPool(): Promise<void> {
    if (!await dirExists(WORK_POOL_DIR)) return;
    const files = await fs.readdir(WORK_POOL_DIR);
    for (const name of files) {
        if (/^workPool\d+\.json$/i.test(name)) {
            await fs.rm(path.join(WORK_POOL_DIR, name), { force: true });
        }
    }
}

/**
 * 既存の workPool*.json に含まれる horseId を収集する。
 * 生成時に重複を除外するために使用する。
 */
async function getExistingWorkPoolIds(): Promise<Set<string>> {
    const ids = new Set<string>();
    if (!await dirExists(WORK_POOL_DIR)) return ids;
    const files = await fs.readdir(WORK_POOL_DIR);
    for (const name of files) {
        if (!/^workPool\d+\.json$/i.test(name)) continue;
        try {
            const raw  = await fs.readFile(path.join(WORK_POOL_DIR, name), "utf-8");
            const json = JSON.parse(raw) as { horses?: { horseId?: unknown }[] };
            for (const h of json?.horses ?? []) {
                const id = String(h?.horseId ?? "").trim();
                if (id) ids.add(id);
            }
        } catch { /* ignore */ }
    }
    return ids;
}

/**
 * エントリ配列を CHUNK_SIZE 件ごとに workPool ファイルへ保存する。
 */
async function saveWorkPool(entries: HorseEntry[]): Promise<void> {
    await fs.mkdir(WORK_POOL_DIR, { recursive: true });
    await clearWorkPool();

    const fileCount = Math.max(1, Math.ceil(entries.length / CHUNK_SIZE));
    for (let i = 0; i < fileCount; i++) {
        const chunk   = entries.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        const outPath = path.join(WORK_POOL_DIR, `workPool${i}.json`);
        await fs.writeFile(outPath, JSON.stringify({ horses: chunk }, null, 4), "utf-8");
        logger.info(`保存完了: ${outPath} (${chunk.length}件)`);
    }
    logger.info(`workPool 生成完了: 合計 ${entries.length}件 / ${fileCount}ファイル`);
}

// =============================================================================
// メインクラス
// =============================================================================

/**
 * Shutuba フォルダを最新年度から走査して workPool ファイルを生成するクラス。
 *
 * - Shutuba ディレクトリを **年→月→レース** の順で降順走査する（最新優先）。
 * - raceId / horseId / umaban を抽出し、{@link CHUNK_SIZE} 件ごとに
 *   `temp/work/workPool/horseDetail/workPool{n}.json` へ保存する。
 * - horseId の重複は最初に出現したエントリのみ採用する。
 *
 * @example
 * ```typescript
 * const gen = new Main_GenerateWorkPool();
 * await gen.run();
 * ```
 */
export class Main_GenerateWorkPool {

    /**
     * workPool 生成処理を実行する。
     */
    async run(): Promise<void> {
        logger.info("workPool 生成を開始します...");
        logger.info(`対象ディレクトリ: ${SHUTUBA_ROOT}`);

        if (!await dirExists(SHUTUBA_ROOT)) {
            logger.error(`Shutuba ディレクトリが存在しません: ${SHUTUBA_ROOT}`);
            return;
        }

        const allEntries: HorseEntry[] = [];
        const existingIds = await getExistingWorkPoolIds();
        logger.info(`既存 workPool から ${existingIds.size} 件のIDを除外対象に設定`);
        const seenHorseIds = new Set<string>(existingIds);

        // 年ディレクトリを降順（最新優先）で走査
        const years = (await fs.readdir(SHUTUBA_ROOT))
            .filter((n) => /^\d{4}$/.test(n))
            .sort((a, b) => b.localeCompare(a));

        outer: for (const year of years) {
            const yearDir = path.join(SHUTUBA_ROOT, year);
            if (!await dirExists(yearDir)) continue;

            // 月ディレクトリを降順で走査
            const months = (await fs.readdir(yearDir))
                .filter((n) => /^\d{2}$/.test(n))
                .sort((a, b) => b.localeCompare(a));

            for (const month of months) {
                const monthDir = path.join(yearDir, month);
                if (!await dirExists(monthDir)) continue;

                // レースディレクトリ（ddRRRR 形式 6桁）を降順で走査
                const raceDirs = (await fs.readdir(monthDir))
                    .filter((n) => /^\d{6}$/.test(n))
                    .sort((a, b) => b.localeCompare(a));

                for (const raceDir of raceDirs) {
                    const indexPath = path.join(monthDir, raceDir, "index.html");
                    if (!await fileExists(indexPath)) continue;

                    // raceId = year(4) + month(2) + raceDir(6)
                    const raceId = `${year}${month}${raceDir}`;

                    let content: string;
                    try {
                        content = await fs.readFile(indexPath, "utf-8");
                    } catch (e) {
                        logger.warn(`読み込み失敗（スキップ）: ${indexPath}: ${String(e)}`);
                        continue;
                    }

                    const entries = extractEntries(content, raceId);
                    for (const entry of entries) {
                        if (!seenHorseIds.has(entry.horseId)) {
                            seenHorseIds.add(entry.horseId);
                            allEntries.push(entry);
                        }
                    }
                    if (allEntries.length >= CHUNK_SIZE) break outer;
                }
            }

            logger.info(`${year}年 走査完了（累計 ${allEntries.length}件）`);
        }

        logger.info(`全走査完了: 合計 ${allEntries.length}件（重複除去済み）`);
        await saveWorkPool(allEntries);
    }
}

// =============================================================================
// CLI エントリポイント
// =============================================================================

if (require.main === module) {
    new Main_GenerateWorkPool().run().catch((e) => {
        logger.error(`予期しないエラー: ${String(e)}`);
        process.exit(1);
    });
}
