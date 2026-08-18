import "dotenv/config";
import { PuppeteerManager } from "../../utils/PuppeteerManager";
import { RaceList } from "../../scrapers/nk/raceList/raceList";
import { RaceData } from "../../scrapers/nk/raceList/raceListIF";
import { Logger } from "../../utils/Logger";
import { RaceListDbService } from "../../service/db/RaceListDbService";
import { RaceScheduleDbService } from "../../service/db/RaceScheduleDbService";

const logger = new Logger();
const dbService = new RaceListDbService();
const scheduleDbService = new RaceScheduleDbService();

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
            throw e;
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
    * 指定年月をサーバーへ問い合わせ、開催日のレースリストを取得・保存
     * @param raceListScraper RaceListインスタンス
     * @param month 対象月
     */
    private async processMonth(raceListScraper: RaceList, month: number): Promise<void> {
        const formattedMonth = month.toString().padStart(2, "0");
        const yyyymm = `${this.year}${formattedMonth}`;
        logger.info(`指定年月の開催日を取得します: ${yyyymm}`);
        const kaisaiDates = await scheduleDbService.findKaisaiDates(yyyymm);

        logger.info(`抽出された kaisaiDate: ${kaisaiDates.join(", ")}`);

        for (const kaisaiDate of kaisaiDates) {
            await this.fetchAndSaveRaceList(raceListScraper, kaisaiDate);
        }
    }

    /**
     * レースリストを取得しDB格納APIへ送信する
     * @param raceListScraper RaceListインスタンス
     * @param kaisaiDate 開催日
     */
    private async fetchAndSaveRaceList(raceListScraper: RaceList, kaisaiDate: string): Promise<void> {
        logger.info(`kaisaiDate: ${kaisaiDate} のレースリストを取得します`);
        const raceList: RaceData[] = await raceListScraper.getRaceList(kaisaiDate);

        try {
            await dbService.store(kaisaiDate, raceList);
            logger.info(`DB格納API 完了: date=${kaisaiDate}, saved=${raceList.length}件`);
        } catch (e) {
            logger.error(`DB格納API 呼び出し失敗: ${e}`);
            throw e;
        }
    }
}

/**
 * コマンドライン引数からMain_RaceListを実行
 */
const args = process.argv.slice(2);
const year = parseInt(args[0], 10) || 2025;
const monthArg = args[1] ? parseInt(args[1], 10) : undefined;

const main = new Main_RaceList(year, monthArg);
main.run().catch((error) => {
    logger.error(`RaceList 実行中に致命的なエラーが発生しました: ${String(error)}`);
    process.exit(1);
});