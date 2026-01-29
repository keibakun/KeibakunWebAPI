import path from "path";
import fs from "fs/promises";
import getShutuba from "./shutuba/shutuba";
import { RaceIF } from "./shutuba/syutubaIF";
import { Logger } from "../utils/Logger";
import { FileUtil } from "../utils/FileUtil";
import { JsonFileWriterUtil } from "../utils/JsonFileWriterUtil";

const logger = new Logger();
const jsonWriter = new JsonFileWriterUtil(logger);

/**
 * Main_Shutuba
 *
 * `RaceSchedule/<YYYYMM>/index.html` から開催日を抽出し、
 * `RaceList/<kaisaiDate>/index.html` を参照して `raceId` を取り出し、
 * 各 `raceId` に対して `getShutuba` を呼び出して出馬表を保存するクラスです。
 */
export class Main_Shutuba {
    private year: number;
    private monthArg?: number;

    /**
     * コンストラクタ
     * @param year 対象年（例: 2025）
     * @param monthArg 対象月（1-12）
     */
    constructor(year: number, monthArg?: number) {
        this.year = year;
        this.monthArg = monthArg;
    }

    /**
     * エントリポイント: スケジュールから開催日を抽出して処理を開始します。
     */
    async run(): Promise<void> {
        // monthArg が整数か検証（以前は必須だったため同様の振る舞いにしている）
        if (!this.monthArg || isNaN(this.monthArg) || this.monthArg < 1 || this.monthArg > 12) {
            logger.error("月の指定が無効です。1～12の範囲で指定してください。");
            return;
        }

        logger.info(`指定された年: ${this.year}, 月: ${this.monthArg}`);

        const formattedMonth = this.monthArg.toString().padStart(2, "0");
        const schedulePath = path.join(__dirname, `../../RaceSchedule/${this.year}${formattedMonth}/index.html`);

        // schedule ファイルの存在チェック
        if (! await FileUtil.exists(schedulePath)) {
            logger.warn(`index.html が存在しません: ${schedulePath}`);
            return;
        }

        // index.html を読み込み、kaisaiDate を抽出
        let scheduleContent = "";
        try {
            scheduleContent = await fs.readFile(schedulePath, "utf-8");
        } catch (e) {
            logger.error(`スケジュールの読み込みに失敗しました: ${schedulePath}`);
            return;
        }

        const kaisaiDates = this.extractKaisaiDates(scheduleContent, schedulePath);
        if (kaisaiDates.length === 0) {
            logger.warn(`指定された年 (${this.year}) の月 (${this.monthArg}) の開催日が見つかりませんでした。`);
            return;
        }

        // 各開催日について処理
        for (const kaisaiDate of kaisaiDates) {
            await this.processKaisaiDate(kaisaiDate);
        }
    }

    /**
     * index.html の内容から kaisaiDate を抽出します。
     * @param htmlContent index.html の文字列
     * @param indexPath ログ用のパス
     */
    private extractKaisaiDates(htmlContent: string, indexPath: string): string[] {
        const kaisaiDateMatches = htmlContent.match(/"kaisaiDate":\s*"(\d{8})"/g);
        if (!kaisaiDateMatches) {
            logger.warn(`kaisaiDate が見つかりません: ${indexPath}`);
            return [];
        }
        return kaisaiDateMatches
            .map((match) => match.match(/"kaisaiDate":\s*"(\d{8})"/)?.[1] || "")
            .filter((d) => d !== "");
    }

    /**
     * 開催日の RaceList/index.html を読み、raceId を抽出して出馬表を取得・保存します。
     * @param kaisaiDate 開催日文字列（YYYYMMDD）
     */
    private async processKaisaiDate(kaisaiDate: string): Promise<void> {
        const raceListPath = path.join(__dirname, `../../RaceList/${kaisaiDate}/index.html`);
        if (! await FileUtil.exists(raceListPath)) {
            logger.warn(`RaceList の index.html が存在しません: ${raceListPath}`);
            return;
        }

        let raceListContent = "";
        try {
            raceListContent = await fs.readFile(raceListPath, "utf-8");
        } catch (e) {
            logger.error(`RaceList の読み込みに失敗しました: ${raceListPath}`);
            return;
        }

        // raceId を抽出
        const raceIdMatches = raceListContent.match(/"raceId":\s*"(\d{12})"/g);
        if (!raceIdMatches) {
            logger.warn(`raceId が見つかりません: ${raceListPath}`);
            return;
        }

        const raceIds = raceIdMatches
            .map((match) => match.match(/"raceId":\s*"(\d{12})"/)?.[1] || "")
            .filter((id) => id !== "");

        // 各 raceId に対して出馬表を取得して保存
        for (const raceId of raceIds) {
            logger.info(`レースID: ${raceId} の出馬表を取得します`);
            try {
                const raceData: RaceIF = await getShutuba(raceId); // 実際のスクレイピング関数を呼び出し

                // raceId を分解して出力先ディレクトリを構築
                const ry = raceId.substring(0, 4);
                const rm = raceId.substring(4, 6);
                const rest = raceId.substring(6);

                const outDir = path.join(__dirname, `../../Shutuba/`, ry, rm, rest);
                // JsonFileWriterUtil を利用して JSON として保存
                await jsonWriter.writeJson(outDir, "index.html", raceData);
            } catch (error: any) {
                logger.error(`レースID: ${raceId} の出馬表取得中にエラーが発生しました: ${String(error)}`);
            }
        }
    }
}

// CLI 実行
const args = process.argv.slice(2);
const year = parseInt(args[0], 10) || 2025;
const monthArg = args[1] ? parseInt(args[1], 10) : undefined;

const main = new Main_Shutuba(year, monthArg);
main.run();