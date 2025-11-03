import path from "path";
import fs from "fs/promises";
import { PuppeteerManager } from "../utils/PuppeteerManager";
import { RaceList } from "./raceList/raceList";
import { RaceData } from "./raceList/raceListIF";
import { Logger } from "../utils/Logger";
import { FileUtil } from "../utils/FileUtil";
import { JsonFileWriterUtil } from "../utils/JsonFileWriterUtil";

const logger = new Logger();
const jsonWriter = new JsonFileWriterUtil(logger);

/**
 * レースリスト取得・保存のメインクラス
 */
export class Main_RaceList {
    private year: number;
    private monthArg?: number;

    /**
     * コンストラクタ
     * @param year 対象年
     * @param monthArg 対象月（省略時は全月）
     */
    constructor(year: number, monthArg?: number) {
        this.year = year;
        this.monthArg = monthArg;
    }

    /**
     * レースリスト取得処理のエントリポイント
     */
    async run(): Promise<void> {
        logger.info(`指定された年: ${this.year}${this.monthArg ? `, 月: ${this.monthArg}` : ""}`);

        const months = this.getTargetMonths();

        const pm = new PuppeteerManager();
        try {
            await pm.init();
            const page = pm.getPage();
            const raceListScraper = new RaceList(page);

            for (const month of months) {
                await this.processMonth(raceListScraper, month);
            }
        } catch (e) {
            logger.error(`致命的なエラー: ${e}`);
        } finally {
            await pm.close();
        }
    }

    /**
     * 対象月の配列を取得
     * @returns {number[]} 月の配列
     */
    private getTargetMonths(): number[] {
        if (this.monthArg && this.monthArg >= 1 && this.monthArg <= 12) {
            return [this.monthArg];
        }
        return Array.from({ length: 12 }, (_, i) => i + 1);
    }

    /**
     * 指定月のindex.htmlからkaisaiDateを抽出し、レースリストを取得・保存
     * @param raceListScraper RaceListインスタンス
     * @param month 対象月
     */
    private async processMonth(raceListScraper: RaceList, month: number): Promise<void> {
        const formattedMonth = month.toString().padStart(2, "0");
        const indexPath = path.join(__dirname, `../../RaceSchedule/${this.year}${formattedMonth}/index.html`);
        logger.info(`index.html のパス: ${indexPath}`);

        if (!(await FileUtil.exists(indexPath))) {
            logger.warn(`index.html が存在しません: ${indexPath}`);
            return;
        }

        const htmlContent = await fs.readFile(indexPath, "utf-8");
        const kaisaiDates = this.extractKaisaiDates(htmlContent, indexPath);

        logger.info(`抽出された kaisaiDate: ${kaisaiDates.join(", ")}`);

        for (const kaisaiDate of kaisaiDates) {
            await this.fetchAndSaveRaceList(raceListScraper, kaisaiDate);
        }
    }

    /**
     * index.htmlからkaisaiDateを抽出
     * @param htmlContent index.htmlの内容
     * @param indexPath ファイルパス（エラー時ログ用）
     * @returns {string[]} 抽出されたkaisaiDate配列
     */
    private extractKaisaiDates(htmlContent: string, indexPath: string): string[] {
        const kaisaiDateMatches = htmlContent.match(/"kaisaiDate":\s*"(\d{8})"/g);
        if (!kaisaiDateMatches) {
            logger.error(`kaisaiDate が見つかりませんでした: ${indexPath}`);
            return [];
        }
        return kaisaiDateMatches
            .map((match) => match.match(/"kaisaiDate":\s*"(\d{8})"/)?.[1] || "")
            .filter((date) => date !== "");
    }

    /**
     * レースリストを取得しJSONファイルとして保存
     * @param raceListScraper RaceListインスタンス
     * @param kaisaiDate 開催日
     */
    private async fetchAndSaveRaceList(raceListScraper: RaceList, kaisaiDate: string): Promise<void> {
        logger.info(`kaisaiDate: ${kaisaiDate} のレースリストを取得します`);
        const raceList: RaceData[] = await raceListScraper.getRaceList(kaisaiDate);
        const outputDir = path.join(__dirname, "../../RaceList/", kaisaiDate);
        await jsonWriter.writeJson(outputDir, "index.html", raceList);
    }
}

/**
 * コマンドライン引数からMain_RaceListを実行
 */
const args = process.argv.slice(2);
const year = parseInt(args[0], 10) || 2025;
const monthArg = args[1] ? parseInt(args[1], 10) : undefined;

const main = new Main_RaceList(year, monthArg);
main.run();