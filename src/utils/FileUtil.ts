import fs from "fs/promises";

/**
 * ファイル操作に関するユーティリティクラス
 */
export class FileUtil {
    /**
     * ファイル存在チェック（非同期I/O対応）
     */
    static async exists(path: string): Promise<boolean> {
        try {
            await fs.access(path);
            return true;
        } catch {
            return false;
        }
    }
}