import puppeteer from "puppeteer";

import { Schedule, Race } from "./raceShceduleIF";

export default async function getRaceSchedule(year: number, month: number): Promise<Schedule[]> {
    // レースカレンダーのURL
    const url: string = `https://race.netkeiba.com/top/calendar.html?year=${year}&month=${month}`;

    console.info("レースカレンダーをnetkeibaから取得します");

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded" });

    // 取得結果の入れ物
    let raceSchedule: Schedule[] = [];

    try {
        // カレンダー全体をスクレイピング
        raceSchedule = await page.$$eval(
            "table.Calendar_Table",
            (table): Schedule[] => {
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
                        const href: string = new URL(cell.querySelector("a")?.getAttribute("href") || "", "https://race.netkeiba.com").toString(); // セル全体のリンク

                        // 開催場とレースを取得
                        const races: Race[] = Array.from(cell.querySelectorAll("div")).flatMap((div) => {
                            return Array.from(div.querySelectorAll("p"))
                                .slice(1) // 1回目の p 要素は空になるためスキップ
                                .map((p) => {
                                    const venue: string = p.querySelector("span.JyoName")?.textContent?.trim() || ""; // 開催場
                                    const raceName: string = p.querySelector("span.JName")?.textContent?.trim() || ""; // レース名（ない場合は空文字）
                                    return { venue, raceName };
                                });
                        });

                        schedule.push({ date, day, href, races });
                    }
                }

                return schedule;
            }
        );

        console.info("レースカレンダーの取得に成功しました");
    } catch (error) {
        console.error("レースカレンダーの取得中にエラーが発生しました:", error);
    } finally {
        await browser.close();
    }

    return raceSchedule;
}