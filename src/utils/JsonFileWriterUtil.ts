import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";
import { Logger } from "./Logger";

/**
 * JSONファイルの書き込みを行うユーティリティクラス
 */
export class JsonFileWriterUtil {
    private logger: Logger;

    /**
     * コンストラクタ
     * @param logger ログ出力用Loggerインスタンス（省略時は新規生成）
     */
    constructor(logger?: Logger) {
        this.logger = logger ?? new Logger();
    }

    /**
     * ディレクトリを作成し、JSONファイルを書き込む
     * @param outputDir 出力ディレクトリ
     * @param fileName ファイル名
     * @param data 保存するデータ（任意の型）
     * @returns {Promise<void>} 書き込み完了時に解決されるPromise
     */
    async writeJson(outputDir: string, fileName: string, data: any): Promise<void> {
        const resolvedDir = path.resolve(outputDir);
        if (!existsSync(resolvedDir)) {
            this.logger.info(`ディレクトリ作成: ${resolvedDir}`);
            await fs.mkdir(resolvedDir, { recursive: true });
        } else {
            this.logger.info(`ディレクトリが既に存在: ${resolvedDir}`);
        }
        const fp = path.join(resolvedDir, fileName);
        await fs.writeFile(fp, JSON.stringify(data, null, 2), "utf-8");
        this.logger.info(`${fp} にJSONファイルを保存しました`);
    }
}