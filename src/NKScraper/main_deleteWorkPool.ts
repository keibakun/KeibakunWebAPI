import fs from "fs/promises";
import path from "path";
import { Logger } from "../utils/Logger";
import { WORK_POOL_DIR } from "./main_horseDetail_db";

const logger = new Logger();

// =============================================================================
// Step⑤: workPool ファイル削除
// =============================================================================

/**
 * workPool ディレクトリ内の workPool*.json をすべて削除する。
 *
 * ④血統取得が正常完了した後に実行する（GitHub Actions の delete_workpool job）。
 */
async function run(): Promise<void> {
    let dirExists = false;
    try {
        const stat = await fs.stat(WORK_POOL_DIR);
        dirExists = stat.isDirectory();
    } catch { /* does not exist */ }

    if (!dirExists) {
        logger.info("workPool ディレクトリが存在しません。スキップします。");
        return;
    }

    const files = await fs.readdir(WORK_POOL_DIR);
    let deleted = 0;
    for (const name of files) {
        if (/^workPool\d+\.json$/i.test(name)) {
            await fs.rm(path.join(WORK_POOL_DIR, name), { force: true });
            logger.info(`削除: ${name}`);
            deleted++;
        }
    }
    logger.info(`workPool ファイルを ${deleted} 件削除しました`);
}

run().catch((err) => {
    logger.error(`main_deleteWorkPool の実行で異常終了: ${String(err)}`);
    process.exit(1);
});
