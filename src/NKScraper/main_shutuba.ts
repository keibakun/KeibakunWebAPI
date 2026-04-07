import path from "path";
import fs from "fs/promises";
import { Page } from "puppeteer";
import getShutuba from "./shutuba/shutuba";
import { RaceIF } from "./shutuba/syutubaIF";
import { PuppeteerManager } from "../utils/PuppeteerManager";
import { Logger } from "../utils/Logger";
import { FileUtil } from "../utils/FileUtil";
import { JsonFileWriterUtil } from "../utils/JsonFileWriterUtil";

const logger = new Logger();
const jsonWriter = new JsonFileWriterUtil(logger);

/** 並列処理のデフォルト同時実行数 */
const DEFAULT_CONCURRENCY = 3;

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
    private concurrency: number;
    /**
     * コンストラクタ
     * @param year 対象年（例: 2026）
     * @param month 対象月（1-12）
     * @param day 対象日（1-31）
     * @param debug デバッグモードフラグ
     * @param concurrency 並列実行数（デフォルト: 3）
     */
    constructor(year: number, month?: number, day?: number, debug?: boolean, concurrency?: number) {
        this.year = year;
        this.month = month;
        this.day = day;
        this.debug = debug || false;
        this.concurrency = concurrency ?? DEFAULT_CONCURRENCY;
    }

    /**
     * エントリポイント: スケジュールから開催日を抽出して処理を開始します。
     */
    async run(): Promise<void> {
        let kaisaiDates: string[] = [];

        if (!this.debug) {
            if (!this.month || isNaN(this.month) || this.month < 1 || this.month > 12) {
                logger.error("月の指定が無効です。月は1～12の範囲で指定してください。");
                return;
            }

            if (this.day && !isNaN(this.day) && this.day >= 1 && this.day <= 31) {
                // 年月日指定: 翌日以降の RaceList を走査する
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
                // 年月のみ指定: 該当月の RaceList を全走査する
                logger.info(`指定された年: ${this.year}, 月: ${this.month}（debug=false, 月全体）`);

                kaisaiDates = await this.getKaisaiDatesFromRaceListByMonth(this.year, this.month);
                if (kaisaiDates.length === 0) {
                    logger.warn(`${this.year}年${this.month}月の RaceList に開催日が見つかりませんでした。`);
                    return;
                }
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

        // 各開催日について raceId を収集
        const allRaceIds: string[] = [];
        for (const kaisaiDate of kaisaiDates) {
            const ids = await this.collectRaceIds(kaisaiDate);
            allRaceIds.push(...ids);
        }

        if (allRaceIds.length === 0) {
            logger.warn("処理対象の raceId がありません");
            return;
        }

        logger.info(`合計 ${allRaceIds.length} 件の raceId を処理します（並列数: ${this.concurrency}）`);

        // Puppeteer を起動してワーカープールで並列処理
        const pm = new PuppeteerManager();
        const pages: Page[] = [];
        try {
            await pm.init();

            // 並列数ぶんのページ（タブ）を生成
            for (let i = 0; i < this.concurrency; i++) {
                const page = await pm.newPage();
                pages.push(page);
            }

            await this.runWorkerPool(pages, allRaceIds);
        } catch (e) {
            logger.error(`致命的なエラー: ${String(e)}`);
        } finally {
            for (const page of pages) {
                try { await page.close(); } catch {}
            }
            await pm.close();
        }
    }

    /**
     * ワーカープール: 各ページが共有キューから raceId を取り出して処理する
     * @param pages Puppeteer Page の配列
     * @param raceIds 処理対象の raceId 配列
     */
    private async runWorkerPool(pages: Page[], raceIds: string[]): Promise<void> {
        let cursor = 0;
        const total = raceIds.length;

        const worker = async (page: Page, workerId: number) => {
            while (true) {
                const idx = cursor++;
                if (idx >= total) break;
                const raceId = raceIds[idx];
                logger.info(`[Worker${workerId}] (${idx + 1}/${total}) レースID: ${raceId} の出馬表を取得します`);
                try {
                    const raceData: RaceIF = await getShutuba(page, raceId);

                    const ry = raceId.substring(0, 4);
                    const rm = raceId.substring(4, 6);
                    const rest = raceId.substring(6);
                    const outDir = path.join(__dirname, `../../Shutuba/`, ry, rm, rest);
                    await jsonWriter.writeJson(outDir, "index.html", raceData);
                } catch (error: any) {
                    logger.error(`[Worker${workerId}] レースID: ${raceId} の出馬表取得中にエラーが発生しました: ${String(error)}`);
                }
            }
        };

        await Promise.all(pages.map((page, i) => worker(page, i)));
    }

    /**
     * 開催日の RaceList/index.html から raceId を収集します（スクレイピングなし）。
     * @param kaisaiDate 開催日文字列（YYYYMMDD）
     */
    private async collectRaceIds(kaisaiDate: string): Promise<string[]> {
        const raceListPath = path.join(__dirname, `../../RaceList/${kaisaiDate}/index.html`);
        if (! await FileUtil.exists(raceListPath)) {
            logger.warn(`RaceList の index.html が存在しません: ${raceListPath}`);
            return [];
        }

        let raceListContent = "";
        try {
            raceListContent = await fs.readFile(raceListPath, "utf-8");
        } catch (e) {
            logger.error(`RaceList の読み込みに失敗しました: ${raceListPath}`);
            return [];
        }

        const raceIdMatches = raceListContent.match(/"raceId":\s*"(\d{12})"/g);
        if (!raceIdMatches) {
            logger.warn(`raceId が見つかりません: ${raceListPath}`);
            return [];
        }

        return raceIdMatches
            .map((match) => match.match(/"raceId":\s*"(\d{12})"/)?.[1] || "")
            .filter((id) => id !== "");
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
     * RaceList ディレクトリを走査し、指定年月に一致するディレクトリ名を返す
     * @param year 対象年
     * @param month 対象月（1-12）
     */
    private async getKaisaiDatesFromRaceListByMonth(year: number, month: number): Promise<string[]> {
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

        const prefix = `${year}${month.toString().padStart(2, "0")}`;

        return entries
            .filter((name) => /^\d{8}$/.test(name) && name.startsWith(prefix))
            .sort();
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