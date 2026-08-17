import "dotenv/config";
import { PuppeteerManager } from "../../utils/PuppeteerManager";
import { Logger } from "../../utils/Logger";
import { RaceSchedule } from "../../scrapers/nk/raceSchedule/raceSchedule";
import { Schedule } from "../../scrapers/nk/raceSchedule/raceShceduleIF";
import { RaceScheduleDbService } from "../../service/RaceScheduleDbService";

const logger = new Logger();
const dbService = new RaceScheduleDbService();

/**
 * Main_RaceSchedule
 *
 * 指定年の月ごとに `RaceSchedule` をスクレイピングして
 * KeibakunServer 経由で DB に保存するクラスです。
 *
 */
export class Main_RaceSchedule {
    private year: number;

    constructor(year: number) {
        this.year = year;
    }
    /**
     * 指定年のすべての月についてレース日程を取得して保存します。
     */
    async run(): Promise<void> {
        logger.info(`指定された年: ${this.year}`);

        // Puppeteer 管理クラスを初期化して Page を取得
        const pm = new PuppeteerManager();
        try {
            await pm.init(); // ブラウザ起動
            const page = pm.getPage(); // ページ取得
            const raceScheduleScraper = new RaceSchedule(page); // スクレイパー初期化

            // 1月〜12月をループして各月のスケジュールを取得
            for (let i = 0; i < 12; i++) {
                const month = i + 1;
                const formattedMonth: string = month.toString().padStart(2, "0");
                logger.info(`カレンダー取得: ${this.year}年${formattedMonth}月`);

                // 指定の年・月のスケジュールをスクレイピング
                const schedule: Schedule[] = await raceScheduleScraper.getRaceSchedule(this.year, month);

                // 開催日程を DB に保存
                const yyyymm = this.year.toString() + formattedMonth;
                await dbService.store(yyyymm, schedule);
                logger.info(`開催日程を DB に保存しました: ${yyyymm}`);
            }
        } catch (e) {
            logger.error(`致命的なエラー: ${e}`);
            throw e;
        } finally {
            // ブラウザを必ずクローズ
            await pm.close();
        }
    }
}

// コマンドライン引数から呼び出し
const args = process.argv.slice(2);
const year = parseInt(args[0], 10) || 2026;

const main = new Main_RaceSchedule(year);
main.run();