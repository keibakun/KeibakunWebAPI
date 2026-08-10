import { Page } from "puppeteer";
import { RaceItem, RaceTitle, RaceData, Condition } from "./raceListIF";
import { Logger } from "../../utils/Logger";
import { VENUE_MAP } from "../../../config/LookupTables/venue";
import { COURSE_CHAR_MAP, BABA_MAP, SHIBA_COURSE_MAP } from "../../../config/LookupTables/race";

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
                parseRaceListBoxes,
                VENUE_MAP as Record<string, number>,
                COURSE_CHAR_MAP as Record<string, number>,
                BABA_MAP as Record<string, number>,
                SHIBA_COURSE_MAP as Record<string, number>
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
 * @param venueMap 開催場名 → VenueCode のマップ
 * @returns パースされたレースデータの配列
 */
function parseRaceListBoxes(
    raceListBoxes: Element[],
    venueMap: Record<string, number>,
    courseCharMap: Record<string, number>,
    babaMap: Record<string, number>,
    shibaCourseMap: Record<string, number>,
): RaceData[] {

    const results: RaceData[] = [];
    raceListBoxes.forEach((box) => {
        const dataLists = box.querySelectorAll("dl.RaceList_DataList");
        dataLists.forEach((dataList) => {
            const rawTitle: string = dataList.querySelector("p.RaceList_DataTitle")?.textContent?.trim() || "";
            const titleMatch = rawTitle.match(/(\d+回)\s*(\S+)\s*(\d+日目)/);

            const kaijiRaw = titleMatch?.[1] || "";
            const venueRaw = titleMatch?.[2] || "";
            const timesRaw = titleMatch?.[3] || "";

            const title: RaceTitle = {
                kaiji: parseInt(kaijiRaw.match(/(\d+)/)?.[1] || "0"),
                venue: venueMap[venueRaw] ?? 0,
                times: parseInt(timesRaw.match(/(\d+)/)?.[1] || "0"),
            };

            // 芝馬場: "芝(C)：良" → shibaCourse=3(C), condition.shiba=1
            //         "芝：良"    → shibaCourse=0,    condition.shiba=1
            const shibaRaw: string = dataList.querySelector("span.Shiba")?.textContent?.trim() || "";
            const shibaCourseStr: string = shibaRaw.match(/芝\(([A-Z])\)/)?.[1] || "";
            const shibaCourse: number = shibaCourseMap[shibaCourseStr] ?? 0;
            const shibaCondStr: string = shibaRaw.match(/：(.+)$/)?.[1] || "";
            const shibaCondCode: number = babaMap[shibaCondStr] ?? 0;

            // ダート馬場: "ダ：稍" → condition.dart=2
            const daRaw: string = dataList.querySelector("span.Da")?.textContent?.trim() || "";
            const daCondStr: string = daRaw.match(/：(.+)$/)?.[1] || "";
            const dartCondCode: number = babaMap[daCondStr] ?? 0;

            const condition: Condition = { shiba: shibaCondCode, dart: dartCondCode };

            const items: RaceItem[] = Array.from(dataList.querySelectorAll("div.RaceList_ItemContent")).map((item) => {
                const text: string = item.textContent?.replace(/\s+/g, " ").trim() || "";
                const match = text.match(/^(.*?) (\d{2}:\d{2}) (.*?) (\d+頭)$/);

                const parentLi = item.closest("li.RaceList_DataItem");
                const href = parentLi?.querySelector("a")?.getAttribute("href") || "";
                const raceIdMatch = href.match(/race_id=(\d{12})/);
                const raceId = raceIdMatch?.[1] || "";

                // コース種別・距離のパース ("ダ1800m" → raceCourse=2, raceDistance=1800)
                const raceCourseRaw = match?.[3] || "";
                const courseTypeStr = raceCourseRaw.match(/^(芝|ダ|障)/)?.[1] || "";
                const raceCourse: number = courseCharMap[courseTypeStr] ?? 0;
                const raceDistance: number = parseInt(raceCourseRaw.match(/(\d+)/)?.[1] || "0");

                // 頭数のパース ("16頭" → 16)
                const tousuu: number = parseInt((match?.[4] || "").match(/(\d+)/)?.[1] || "0");

                // グレードのパース (CSSクラス "Icon_GradeType1" → 1)
                const gradeSpan = item.querySelector("span.Icon_GradeType");
                const gradeClassList = Array.from(gradeSpan?.classList || []);
                const gradeClassName = gradeClassList.find((c) => c.startsWith("Icon_GradeType") && c !== "Icon_GradeType") || "";
                const grade: number = parseInt(gradeClassName.replace("Icon_GradeType", "")) || 0;

                return {
                    raceName: match?.[1] || "",
                    raceTime: match?.[2] || "",
                    raceCourse,
                    raceDistance,
                    tousuu,
                    raceId,
                    grade,
                };
            });

            results.push({ title, condition, shibaCourse, items });
        });
    });
    return results;
}