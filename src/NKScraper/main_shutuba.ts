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
 * デバッグモードフラグはデフォルトで false です。
 */
export class Main_Shutuba {
    private year: number;
    private month?: number;
    private day?: number;
    private debug: boolean;
    /**
     * コンストラクタ
     * @param year 対象年（例: 2026）
     * @param month 対象月（1-12）
     * @param day 対象日（1-31）
     * @param debug デバッグモードフラグ
     */
    constructor(year: number, month?: number, day?: number, debug?: boolean) {
        this.year = year;
        this.month = month;
        this.day = day;
        this.debug = debug || false;
    }

    /**
     * エントリポイント: スケジュールから開催日を抽出して処理を開始します。
     */
    async run(): Promise<void> {
        let kaisaiDates: string[] = [];

        if (!this.debug) {
            // debug=false の場合は year/month/day 指定が期待される。翌日以降の RaceList を走査する。
            if (!this.month || isNaN(this.month) || this.month < 1 || this.month > 12 ||
                !this.day || isNaN(this.day) || this.day < 1 || this.day > 31) {
                logger.error("月/日の指定が無効です。月は1～12、日は1～31の範囲で指定してください。");
                return;
            }

            logger.info(`指定された年: ${this.year}, 月: ${this.month}, 日: ${this.day}（debug=false）`);

            const baseDate = new Date(this.year, this.month - 1, this.day);
            const targetDate = new Date(baseDate);
            targetDate.setDate(targetDate.getDate() + 1); // 明日以降

            kaisaiDates = await this.getKaisaiDatesFromRaceListAfter(targetDate);
            if (kaisaiDates.length === 0) {
                logger.warn(`指定日時の翌日以降の RaceList に開催日が見つかりませんでした。`);
                return;
            }
        } else {
            // 既存の動作（debug=true）: RaceSchedule から開催日を抽出
            // month が整数か検証
            if (!this.month || isNaN(this.month) || this.month < 1 || this.month > 12) {
                logger.error("月の指定が無効です。1～12の範囲で指定してください。");
                return;
            }

            logger.info(`指定された年: ${this.year}, 月: ${this.month}, デバッグモード: ${this.debug}`);

            const formattedMonth = this.month.toString().padStart(2, "0");
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

            kaisaiDates = this.extractKaisaiDates(scheduleContent, schedulePath);
            if (kaisaiDates.length === 0) {
                logger.warn(`指定された年 (${this.year}) の月 (${this.month}) の開催日が見つかりませんでした。`);
                return;
            }
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
     * RaceList ディレクトリを走査し、targetDate（YYYYMMDD）以上のディレクトリ名を返す
     * @param targetDate 判定開始日（この日を含む）
     */
    private async getKaisaiDatesFromRaceListAfter(targetDate: Date): Promise<string[]> {
        const raceListDir = path.join(__dirname, `../../RaceList`);
        if (! await FileUtil.exists(raceListDir)) {
            logger.warn(`RaceList ディレクトリが存在しません: ${raceListDir}`);
            return [];
        }

        let entries: string[] = [];
        try {
            entries = await fs.readdir(raceListDir);
        } catch (e) {
            logger.error(`RaceList ディレクトリの読み込みに失敗しました: ${raceListDir}`);
            return [];
        }

        const pad = (n: number) => String(n).padStart(2, "0");
        const targetStr = `${targetDate.getFullYear()}${pad(targetDate.getMonth() + 1)}${pad(targetDate.getDate())}`;

        const kaisaiDates = entries
            .filter((name) => /^\d{8}$/.test(name) && name >= targetStr)
            .sort();

        return kaisaiDates;
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
const year = args[0] ? parseInt(args[0], 10) : undefined;
const monthArg = args[1] ? parseInt(args[1], 10) : undefined;
const dayArg = args[2] ? parseInt(args[2], 10) : undefined;
const debugArg = typeof args[3] !== "undefined" ? (String(args[3]).toLowerCase() === "true") : undefined;

if (!year) {
    logger.error("年の指定が必要です（例: 2025）。");
    process.exit(1);
}

const main = new Main_Shutuba(year, monthArg, dayArg, debugArg);
main.run();