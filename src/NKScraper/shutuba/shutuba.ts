import puppeteer, { Browser, Page } from "puppeteer";

import { RaceIF, SyutubaIF } from "./syutubaIF";

/**
 * 出馬表を取得する関数
 * @param {string} raceId - レースID
 * @returns {Promise<RaceIF>} - 出馬表の情報
 */
export default async function getShutuba(raceId: string): Promise<RaceIF> {
    // 出馬表のURL
    const url: string = `https://race.netkeiba.com/race/shutuba.html?race_id=${raceId}&rf=race_submenu`;

    console.info(`URL: ${url} から出馬表を取得します`);

    const browser: Browser = await puppeteer.launch({ headless: true });
    const page: Page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded" });

    let raceData: RaceIF;

    try {
        raceData = await page.$eval(
            'table[class*="Shutuba_Table"]',
            (table: Element): RaceIF => {
                const raceNum: string = document.querySelector("span.RaceNum")?.textContent?.trim() || "";
                const raceName: string = document.querySelector("h1.RaceName")?.textContent?.trim() || "";

                // レースグレードを取得
                const gradeSpan: Element | null = document.querySelector("span.Icon_GradeType");
                const gradeClassList: string[] = Array.from(gradeSpan?.classList || []);
                const grade: string =
                    gradeClassList
                        .find((className) => className.startsWith("Icon_GradeType") && className !== "Icon_GradeType")
                        ?.replace("Icon_GradeType", "GradeType") || "";

                // RaceData01 の情報を取得
                const raceData01: Element | null = document.querySelector("div.RaceData01");
                const raceTime: string = raceData01?.textContent?.match(/(\d{2}:\d{2})発走/)?.[1] || ""; // 時刻を取得

                // コース情報を取得（付加情報も含む）
                const courseMain: string = raceData01?.querySelector("span")?.textContent?.trim() || ""; // 芝1600m
                const courseExtra: string = raceData01?.textContent?.match(/\(([^)]+)\)/)?.[0] || ""; // (左 A)
                const course: string = `${courseMain}${courseExtra}`.trim(); // 芝1600m(左 A)

                const weather: string = raceData01?.textContent?.match(/天候:(\S+)/)?.[1] || ""; // 天候を取得
                const baba: string = raceData01?.querySelector("span.Item04")?.textContent?.match(/馬場:(\S+)/)?.[1] || ""; // 馬場情報

                const raceData02: string[] = Array.from(document.querySelectorAll("div.RaceData02 span")).map(
                    (span) => span.textContent?.trim() || ""
                );

                // 出走馬情報を取得
                const rows: Element[] = Array.from(table.querySelectorAll("tbody tr"));
                const syutuba: SyutubaIF[] = rows.map((row: Element): SyutubaIF => {
                    const umaban: string = row.querySelector("td:nth-child(2)")?.textContent?.trim() || "";
                    const horseAnchor: HTMLAnchorElement | null = row.querySelector("td:nth-child(4) a");
                    const horseName: string = horseAnchor?.textContent?.trim() || "";
                    const horseId: string = horseAnchor?.getAttribute("href")?.match(/horse\/(\d+)/)?.[1] || "";
                    const sexage: string = row.querySelector("td:nth-child(5)")?.textContent?.trim() || "";
                    const kinryou: string = row.querySelector("td:nth-child(6)")?.textContent?.trim() || "";

                    // 騎手情報を取得
                    const jockeyAnchor: HTMLAnchorElement | null = row.querySelector("td.Jockey a");
                    const jockey: string = jockeyAnchor?.textContent?.trim() || "";
                    const jockeyId: string = jockeyAnchor?.getAttribute("href")?.match(/jockey\/result\/recent\/(\d{5})/)?.[1] || "";

                    // 調教師情報を取得
                    const trainerAnchor: HTMLAnchorElement | null = row.querySelector("td.Trainer a");
                    const trainer: string = trainerAnchor?.textContent?.trim() || "";
                    const trainerId: string = trainerAnchor?.getAttribute("href")?.match(/trainer\/result\/recent\/(\d{5})/)?.[1] || "";

                    const weight: string = row.querySelector("td:nth-child(9)")?.textContent?.trim() || "";

                    return { umaban, horseName, horseId, sexage, kinryou, jockey, jockeyId, trainer, trainerId, weight };
                });

                return {
                    raceNum,
                    raceName,
                    grade,
                    raceTime,
                    course,
                    weather,
                    baba,
                    raceData: raceData02,
                    syutuba,
                };
            }
        );

        console.info("出馬表の取得に成功しました");
    } catch (error) {
        console.error("出馬表の取得中にエラーが発生しました:", error);
        throw error;
    } finally {
        await browser.close();
    }

    return raceData;
}