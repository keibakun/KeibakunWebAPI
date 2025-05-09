import puppeteer from "puppeteer";
import { ScrapingError, ScrapingErrorHandler } from "../../Error/ScrapingError";
import { Horse } from "../../Interfaces/NKScraperIF";
export async function getHorseRaceResults(horseID: string, raceID: string): Promise<(Horse)[]> {
    console.info("馬の出走成績を取得します");

    // 開発用
    const url: string = "https://db.netkeiba.com/horse/" + horseID;


    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto(url);

    // 一時的な入れ物
    let sc_raceName: (string | null)[] = [];
    let sc_raceID: (string | null)[] = [];

    // デスクトップサイトからスクレイピングしてデータを取得
    try {
        sc_raceName = await page.$$eval("div.db_main_race.fc div table tbody tr td:nth-child(5)", cells => cells.map(cell => cell.textContent));
        sc_raceID = await page.$$eval("div.db_main_race.fc div table tbody tr td:nth-child(5) a", cells => cells.map(cell => cell.getAttribute('href')));
    } catch (e) {
        throw new ScrapingError(`スクレイピング失敗:https://db.netkeiba.com/horse/${horseID}のスクレイピングでエラーが発生しました。エラー： ${e.message}`);
    } finally {
        await browser.close();
    }
    // ここではレースIDのみを取得する
    console.log(sc_raceName);
    const raceName: string[] = sc_raceName.map(name => {
        if (name) {
            return name;
        } else {
            return "-";
        }
    });
    const syutubaRaceID: string[] = sc_raceID.map(id => {
        if (id) {
            return id.replace(/\/race\/|\/$/g, "");
        } else {
            return "-";
        }
    });

    // 未出走以外の場合の処理
    let sc_comment: (string | null)[] = [];
    let comment: string[] = [];
    // 未出走の場合はコメントを取得しない
    if (syutubaRaceID.length > 0) {
        // 備考欄はモバイルサイトでしか表示されないので、備考欄のみ取得する
        const mobileBrowser = await puppeteer.launch({
            args: [`--window-size=1920,3080`],
            defaultViewport: {
                width: 1920,
                height: 3080
            },
            headless: false,
        });
        const smartphonePage = await mobileBrowser.newPage();
        const horseURL: string = "https://race.sp.netkeiba.com/modal/horse.html?race_id=" + raceID + "&horse_id=" + horseID + "&rf=shutuba_modal"
        await smartphonePage.goto(horseURL);

        // モバイルサイトの場合、過去5走以上の出走は「もっと見る」ボタンが表示される
        try {
            // 5走以上の条件とコメントスクレイピング時の出走数とで噛み合わない場合がある
            if (syutubaRaceID.length > 5) {
                const moreButtonSelector = `#RacingResultMore_${horseID}`;
                await smartphonePage.waitForSelector(moreButtonSelector, { visible: true, timeout: 60000 });
                const moreButton = await smartphonePage.$(moreButtonSelector);
                if (moreButton) {
                    await moreButton.click();
                } else {
                    throw new ScrapingError(`スクレイピング失敗: "もっと見る" ボタンが見つかりませんでした。`);
                }
                await smartphonePage.waitForSelector("span.RaceName", { visible: true, timeout: 60000 }); // 代表してRaceNameが表示されるまでページ遷移を待つ
            }
            sc_comment = await smartphonePage.$$eval(`ul.RacingResultList.result_${horseID} li a div span.CornerWrap`, cells => cells.map(cell => cell.textContent));
            console.log(sc_comment);

            if (sc_comment.includes(null)) {
                ScrapingErrorHandler.handleNullOrEmpty("備考取得の結果にnullがあります");
            }
            if (sc_comment.length > 10) {
                comment = sc_comment.map(c => {
                    const match = c?.match(/\(([^)]+)\)/);
                    return match ? match[1].trim() : "-";
                });
            } else {
                comment = sc_comment.map(c => {
                    const match = c?.match(/\(([^)]+)\)/);
                    return match ? match[1].trim() : "-";
                });
            }
        } catch (e: any) {
            throw new ScrapingError(`スクレイピング失敗:${horseURL}のスクレイピングでエラーが発生しました。エラー： ${e.message}`);
        } finally {
            await mobileBrowser.close();
        }
    }

    const horseRecord: Horse[] = [];
    for (let i = 0, j = 0; i < syutubaRaceID.length;) { // i: SyutubaRaceIDとRaceNameのインデックス, j: Commentのインデックス
        if (syutubaRaceID.length === comment.length) {
            // SyutubaRaceIDとcommentのlengthが同じ場合
            horseRecord.push({
                RaceData: {
                    RaceName: raceName[i],
                    RaceID: syutubaRaceID[i],
                    Comment: comment[j],
                }
            });
            i++;
            j++;
        } else {
            // 海外競馬が含まれていて、lengthが異なる場合 (SyutubaRaceID > Comment)
            const raceID = syutubaRaceID[i];
            const raceNameEntry = raceName[i];
            let commentEntry = "**"; // デフォルト値として "**" を設定
    
            // SyutubaRaceIDに英字が含まれる場合
            if (!/[a-zA-Z]/.test(raceID) && j < comment.length) {
                commentEntry = comment[j]; // コメントを取得
                j++; // commentのインデックスを進める
            }
            horseRecord.push({
                RaceData: {
                    RaceName: raceNameEntry,
                    RaceID: raceID,
                    Comment: commentEntry,
                }
            });
            i++; // SyutubaRaceIDとRaceNameのインデックスを進める
        }
    }

    return horseRecord;
}