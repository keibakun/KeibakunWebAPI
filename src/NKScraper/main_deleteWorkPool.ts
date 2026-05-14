import fs from "fs/promises";
import path from "path";
import { Logger } from "../utils/Logger";
import { WORK_POOL_DIR, getOldestWorkPoolFile } from "./main_horseDetail_db";

const logger = new Logger();

// =============================================================================
// Step⑤: workPool ファイル削除（処理済みの先頭1ファイルのみ）
// =============================================================================

/**
 * fetch_db / fetch_modal / fetch_pedigree が処理した workPool ファイル（最古の1件）を削除する。
 *
 * 残りの workPool ファイルは次回実行に引き継がれる。
 */
async function run(): Promise<void> {
    const fileName = await getOldestWorkPoolFile(WORK_POOL_DIR);
    if (!fileName) {
        logger.info("削除対象の workPool ファイルが存在しません。スキップします。");
        return;
    }

    const filePath = path.join(WORK_POOL_DIR, fileName);
    await fs.rm(filePath, { force: true });
    logger.info(`削除完了: ${filePath}`);
}

run().catch((err) => {
    logger.error(`main_deleteWorkPool の実行で異常終了: ${String(err)}`);
    process.exit(1);
});
