import puppeteer from "puppeteer";

import { RaceItem, RaceTitle, RaceData } from "./raceListIF";

export default async function getRaceList(kaisaiDate: string): Promise<RaceData[]> {
    // レースリストのURL
    const url: string = `https://race.netkeiba.com/top/race_list.html?kaisai_date=${kaisaiDate}`;

    console.info("netkeibaからのスクレイピングを開始します");

    const browser = await puppeteer.launch({ headless: true }); // ヘッドレスモードでブラウザを起動
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded" });

    // ページ表示後に任意の時間待機（例: 10秒）
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // 取得結果の入れ物
    let raceList: RaceData[] = [];

    try {
        // レースリストをスクレイピング
        raceList = await page.$$eval("div.RaceList_Box.clearfix", (raceListBoxes): RaceData[] => {
            const results: RaceData[] = [];

            raceListBoxes.forEach((box) => {
                // dl.RaceList_DataList を左の列から順に取得
                const dataLists = box.querySelectorAll("dl.RaceList_DataList");
                dataLists.forEach((dataList) => {
                    const rawTitle: string = dataList.querySelector("p.RaceList_DataTitle")?.textContent?.trim() || "";

                    // タイトルを分割
                    const titleMatch = rawTitle.match(/(\d+回)\s*(\S+)\s*(\d+日目)/);
                    const title: RaceTitle = {
                        kaiji: titleMatch?.[1] || "",
                        venue: titleMatch?.[2] || "",
                        times: titleMatch?.[3] || "",
                    };

                    const shiba: string = dataList.querySelector("span.Shiba")?.textContent?.trim() || ""; // 芝
                    const da: string = dataList.querySelector("span.Da")?.textContent?.trim() || ""; // ダート

                    // div.RaceList_ItemContent を取得してパース
                    const items: RaceItem[] = Array.from(dataList.querySelectorAll("div.RaceList_ItemContent")).map(
                        (item) => {
                            const text: string = item.textContent?.replace(/\s+/g, " ").trim() || ""; // 改行や余分な空白を削除
                            const match = text.match(/^(.*?) (\d{2}:\d{2}) (.*?) (\d+頭)$/); // 正規表現でパース

                            // 親要素 li.RaceList_DataItem の a[href] から raceId を取得
                            const parentLi = item.closest("li.RaceList_DataItem");
                            const href = parentLi?.querySelector("a")?.getAttribute("href") || "";
                            const raceIdMatch = href.match(/race_id=(\d{12})/); // 12桁の数列を抽出
                            const raceId = raceIdMatch?.[1] || ""; // レースID

                            // レースグレードを取得
                            const gradeSpan = item.querySelector("span.Icon_GradeType");
                            const gradeClassList = Array.from(gradeSpan?.classList || []); // クラス名を配列として取得
                            const grade = gradeClassList
                                .find((className) => className.startsWith("Icon_GradeType") && className !== "Icon_GradeType") // Icon_GradeType〇〇 を取得
                                ?.replace("Icon_", ""); // "Icon_" を削除して "GradeType〇〇" に変換

                            return {
                                raceName: match?.[1] || "", // レース名
                                raceTime: match?.[2] || "", // レース時間
                                raceCourse: match?.[3] || "", // コース情報
                                tousuu: match?.[4] || "", // 頭数
                                raceId, // レースID
                                grade: grade || "", // レースグレード ("GradeType〇〇" の形式)
                            };
                        }
                    );

                    // 結果を追加
                    results.push({ title, shiba, da, items });
                });
            });
            return results;
        });

        console.info("レースリストの取得に成功しました");
    } catch (error) {
        console.error("レースリストの取得中にエラーが発生しました:", error);
    } finally {
        await browser.close();
    }

    return raceList;
}