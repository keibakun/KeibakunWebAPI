import path from "path";
import { PuppeteerManager } from "../utils/PuppeteerManager";
import { Logger } from "../utils/Logger";
import { RaceSchedule } from "./raceSchedule/raceSchedule";
import { Schedule } from "./raceSchedule/raceShceduleIF";
import { JsonFileWriterUtil } from "../utils/JsonFileWriterUtil";

const logger = new Logger();
const jsonWriter = new JsonFileWriterUtil(logger);

/**
 * メインのレース開催日程取得クラス
 */
export class Main_RaceSchedule {
    private year: number;

    constructor(year: number) {
        this.year = year;
    }

    async run() {
        logger.info(`指定された年: ${this.year}`);

        const pm = new PuppeteerManager();
        try {
            await pm.init();
            const page = pm.getPage();
            const raceScheduleScraper = new RaceSchedule(page);

            for (let i = 0; i < 12; i++) {
                const month = i + 1;
                const formattedMonth: string = month.toString().padStart(2, "0");
                logger.info(`カレンダー取得: ${this.year}年${formattedMonth}月`);

                const schedule: Schedule[] = await raceScheduleScraper.getRaceSchedule(this.year, month);

                // 開催日程のJSONファイルを生成
                const outputDir = path.join(__dirname, "../../RaceSchedule", this.year.toString() + formattedMonth);
                await jsonWriter.writeJson(outputDir, "index.html", schedule);
            }
        } catch (e) {
            logger.error(`致命的なエラー: ${e}`);
        } finally {
            await pm.close();
        }
    }
}

// コマンドライン引数から呼び出し
const args = process.argv.slice(2);
const year = parseInt(args[0], 10) || 2025;

const main = new Main_RaceSchedule(year);
main.run();