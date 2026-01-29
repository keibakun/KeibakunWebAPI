import { Page } from "puppeteer";
import { RaceItem, RaceTitle, RaceData } from "./raceListIF";
import { Logger } from "../../utils/Logger";

/**
 * RaceListクラス
 * PuppeteerのPageインスタンスを使用してレースリストを取得するクラス
 */
export class RaceList {
    private page: Page;
    private logger: Logger;

    constructor(page: Page) {
        this.page = page;
        this.logger = new Logger();
    }

    /**
     * レースリストを取得するメソッド
     * @param kaisaiDate 開催日（YYYYMMDD形式）
     * @returns レースデータの配列
     */
    async getRaceList(kaisaiDate: string): Promise<RaceData[]> {
        const url: string = `https://race.netkeiba.com/top/race_list.html?kaisai_date=${kaisaiDate}`;
        this.logger.info("netkeibaからのレースリストのスクレイピングを開始します");

        // ページ遷移し、主要コンテントのロードを待つ
        await this.page.goto(url, { waitUntil: "domcontentloaded" });
        try {
            // RaceList ボックスが描画されるのを最大10秒待つ
            await this.page.waitForSelector("div.RaceList_Box.clearfix", { timeout: 10000 });
            // 要素数が期待値に達するまで待つ（必要なら調整）
            await this.page.waitForFunction(() => {
                return document.querySelectorAll("div.RaceList_Box.clearfix").length > 0;
            }, { timeout: 10000 });
        } catch (e) {
            this.logger.warn("RaceList 要素の待機がタイムアウトしました。ページが完全に描画されていない可能性があります。");
            // 軽く待ってから続行（フォールバック）
            await new Promise((resolve) => setTimeout(resolve, 500));
        }

        try {
            const raceList = await this.page.$$eval(
                "div.RaceList_Box.clearfix",
                parseRaceListBoxes
            );
            this.logger.info("レースリストの取得に成功しました");
            return raceList;
        } catch (error) {
            this.logger.error(`レースリストの取得に失敗しました: ${error}`);
            throw error;
        }
    }
}

/**
 * レースリストの各Box要素を取得してパースする関数
 * @param raceListBoxes レースリストのボックス要素の配列
 * @returns パースされたレースデータの配列
 */
function parseRaceListBoxes(raceListBoxes: Element[]): RaceData[] {
    const results: RaceData[] = [];
    raceListBoxes.forEach((box) => {
        const dataLists = box.querySelectorAll("dl.RaceList_DataList");
        dataLists.forEach((dataList) => {
            const rawTitle: string = dataList.querySelector("p.RaceList_DataTitle")?.textContent?.trim() || "";
            const titleMatch = rawTitle.match(/(\d+回)\s*(\S+)\s*(\d+日目)/);
            const title: RaceTitle = {
                kaiji: titleMatch?.[1] || "",
                venue: titleMatch?.[2] || "",
                times: titleMatch?.[3] || "",
            };

            const shiba: string = dataList.querySelector("span.Shiba")?.textContent?.trim() || "";
            const da: string = dataList.querySelector("span.Da")?.textContent?.trim() || "";

            // ここで直接パースする
            const items: RaceItem[] = Array.from(dataList.querySelectorAll("div.RaceList_ItemContent")).map((item) => {
                const text: string = item.textContent?.replace(/\s+/g, " ").trim() || "";
                const match = text.match(/^(.*?) (\d{2}:\d{2}) (.*?) (\d+頭)$/);

                const parentLi = item.closest("li.RaceList_DataItem");
                const href = parentLi?.querySelector("a")?.getAttribute("href") || "";
                const raceIdMatch = href.match(/race_id=(\d{12})/);
                const raceId = raceIdMatch?.[1] || "";

                const gradeSpan = item.querySelector("span.Icon_GradeType");
                const gradeClassList = Array.from(gradeSpan?.classList || []);
                const grade = gradeClassList
                    .find((className) => className.startsWith("Icon_GradeType") && className !== "Icon_GradeType")
                    ?.replace("Icon_", "");

                return {
                    raceName: match?.[1] || "",
                    raceTime: match?.[2] || "",
                    raceCourse: match?.[3] || "",
                    tousuu: match?.[4] || "",
                    raceId,
                    grade: grade || "",
                };
            });

            results.push({ title, shiba, da, items });
        });
    });
    return results;
}