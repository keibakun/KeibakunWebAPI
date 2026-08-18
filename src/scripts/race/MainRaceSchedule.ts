import "dotenv/config";
import { Logger } from "../../utils/Logger";
import { RaceSchedule } from "../../scrapers/nk/raceSchedule/raceSchedule";
import { Schedule } from "../../scrapers/nk/raceSchedule/raceShceduleIF";
import { RaceScheduleDbService } from "../../service/db/RaceScheduleDbService";
import { MainScraper } from "../base/MainScraper";

const logger = new Logger();
const dbService = new RaceScheduleDbService();

/**
 * MainRaceSchedule
 *
 * 指定年の月ごとに `RaceSchedule` をスクレイピングして
 * KeibakunServer経由でDBに保存するエントリポイントです。
 */
export class MainRaceSchedule extends MainScraper {
    private year: number;

    constructor(year: number) {
        super();
        this.year = year;
    }

    /**
     * 指定年の1月から12月までレース日程を取得して保存します。
     * @throws PuppeteerまたはDB格納APIで発生したエラー
     */
    async run(): Promise<void> {
        logger.info(`指定された年: ${this.year}`);

        try {
            await this.withPage(async (page) => {
                const raceScheduleScraper = new RaceSchedule(page);
                // 月ごとに取得・保存し、1か月分の失敗を呼び出し元へ伝播します。
                for (let i = 0; i < 12; i++) {
                    const month = i + 1;
                    const formattedMonth: string = month.toString().padStart(2, "0");
                    logger.info(`カレンダー取得: ${this.year}年${formattedMonth}月`);
                    const schedule: Schedule[] = await raceScheduleScraper.getRaceSchedule(this.year, month);
                    const yyyymm = this.year.toString() + formattedMonth;
                    await dbService.store(yyyymm, schedule);
                    logger.info(`開催日程を DB に保存しました: ${yyyymm}`);
                }
            });
        } catch (e) {
            logger.error(`致命的なエラー: ${e}`);
            throw e;
        }
    }
}

// コマンドライン引数から呼び出し
const args = process.argv.slice(2);
const year = parseInt(args[0], 10) || 2026;

const main = new MainRaceSchedule(year);
main.run();