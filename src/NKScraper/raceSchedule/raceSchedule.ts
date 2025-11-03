import { Page } from "puppeteer";
import { Schedule, Race } from "./raceShceduleIF";
import { Logger } from "../../utils/Logger";

/**
 * RaceScheduleクラス
 * @description PuppeteerのPageインスタンスを使用してレース開催日程を取得するクラス
 */
export class RaceSchedule {
    private page: Page;
    private logger: Logger;

    constructor(page: Page) {
        this.page = page;
        this.logger = new Logger();
    }

    /**
     * レースの開催日程を取得するメソッド
     * @param year 年
     * @param month 月
     * @returns 開催日程の配列
     */
    async getRaceSchedule(year: number, month: number): Promise<Schedule[]> {
        const url: string = `https://race.netkeiba.com/top/calendar.html?year=${year}&month=${month}`;
        this.logger.info("レースカレンダーをnetkeibaから取得します");

        await this.page.goto(url, { waitUntil: "domcontentloaded" });

        try {
            const raceSchedule = await this.page.$$eval(
                "table.Calendar_Table",
                parseCalendarTable
            );
            this.logger.info("レースカレンダーの取得に成功しました");
            return raceSchedule;
        } catch (error) {
            this.logger.error(`レースカレンダーの取得中にエラーが発生しました: ${error}`);
            throw error;
        }
    }
}

/**
 * カレンダーテーブルをパースする関数
 * Puppeteerのコールバックとして使うためトップレベル関数で定義
 */
function parseCalendarTable(table: Element[]): Schedule[] {
    const schedule: Schedule[] = [];
    const rows = table[0].querySelectorAll("tbody tr");

    // ヘッダーから曜日を取得
    const days: string[] = Array.from(rows[0].querySelectorAll("th")).map(
        (th) => th.textContent?.trim() || ""
    );

    // 各列と各行のdivを処理
    for (let col = 0; col < 7; col++) {
        const day: string = days[col]; // 曜日
        for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
            const row = rows[rowIndex];
            const cell = row.querySelectorAll("td")[col];

            if (!cell) continue;

            const date: string = cell.querySelector("span.Day")?.textContent?.trim() || ""; // 日付
            const rawHref: string = cell.querySelector("a")?.getAttribute("href") || ""; // 元のリンク
            const kaisaiDate: string = rawHref.match(/kaisai_date=(\d{8})/)?.[1] || ""; // 「kaisai_date=」以降の8桁を抽出

            // 開催場とレースを取得
            const races: Race[] = Array.from(cell.querySelectorAll("div")).flatMap((div) => {
                return Array.from(div.querySelectorAll("p"))
                    .slice(1) // 1回目の p 要素をスキップ
                    .map((p) => {
                        const venue: string = p.querySelector("span.JyoName")?.textContent?.trim() || ""; // 開催場
                        const raceName: string = p.querySelector("span.JName")?.textContent?.trim() || ""; // レース名（ない場合は空文字）
                        return { venue, raceName };
                    });
            });

            schedule.push({ date, day, kaisaiDate, races });
        }
    }

    return schedule;
}