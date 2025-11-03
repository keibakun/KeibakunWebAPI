/**
 * Loggerクラス
 * - info, warn, errorメソッドを提供します
 */
export class Logger {
    info(message: string) {
        console.info(`[INFO] ${message}`);
    }
    warn(message: string) {
        console.warn(`[WARN] ${message}`);
    }
    error(message: string) {
        console.error(`[ERROR] ${message}`);
    }
}