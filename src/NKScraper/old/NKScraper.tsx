import puppeteer, { LaunchOptions } from "puppeteer";

import { ScrapingError, ScrapingErrorHandler } from "../../Error/ScrapingError";
import { NextRace, Syutuba } from "../../Interfaces/NKScraperIF";


/**
 * netkeibaスクレイピングクラス
 * 
 * @param {boolean} isJRA - 主催者がJRAかどうか
 */
export class NKscraper {
    /** 主催者がJRAかどうか */
    isJRA: boolean;

    // コンストラクタ
    constructor(isJRA: boolean) {
        this.isJRA = isJRA;
    }

    /**
     * レース一覧を取得します
     * @returns レース一覧を取得する
     */
    public async getRaceList(raceListURL: string): Promise<NextRace[]> {

        console.info("今週のレース一覧を取得します");

        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto(raceListURL);

        let raceName: (string | null)[] = [];
        let raceData: (string | null)[] = [];
        let raceURL: (string | null)[] = [];

        try {
            // レース名を取得してnullチェックを行う
            raceName = await page.$$eval("dt.Race_Name", list => list.map(e => e.textContent));
            if (raceName.includes(null)) {
                ScrapingErrorHandler.handleNullOrEmpty("レース名取得の結果にnullがあります");
            }
            // レースデータを取得する
            raceData = await page.$$eval("dd.Race_Data", list => list.map(e => e.textContent));
            if (raceData.includes(null)) {
                ScrapingErrorHandler.handleNullOrEmpty("レースデータ取得の結果にnullがあります");
            }
            // レースURLを取得する
            raceURL = await page.$$eval("div.RaceList_Main_Box a", list => list.map(e => e.href));
            if (raceURL.includes(null)) {
                ScrapingErrorHandler.handleNullOrEmpty("レースURL取得の結果にnullがあります");
            }
        } catch (e: any) {
            throw new ScrapingError(`スクレイピング失敗:${raceListURL}のスクレイピングでエラーが発生しました。エラー： ${e.message}`);
        } finally {
            await browser.close();
        }

        const raceNameMount: number = raceName.length;

        // raceNameのnullチェックと改行削除する
        raceName = raceName.map(name => {
            if (name === null || name === undefined) {
                return null;
            } else {
                return name.replace(/\n/g, "");
            }
        });

        // raceDataから時刻、コース、頭数を抽出する
        const raceDetails = raceData.map(data => {
            if (data === null) {
                ScrapingErrorHandler.handleNullOrEmpty("レースデータがnullです。そのためnullを返します");
                return {
                    RaceTime: "null",
                    RaceCourse: "null",
                    HeadCount: "null"
                };
            } else {
                const timeMatch = data.match(/\d{2}:\d{2}/); // 時刻の正規表現
                const courseTypeMatch = data.match(/芝|ダ|障|直/); // コースの正規表現
                const raceLengthMatch = data.match(/\d{3,4}m/); // 距離の正規表現
                const headCountMatch = data.match(/\d+頭/); // 頭数の正規表現

                return {
                    RaceTime: timeMatch ? timeMatch[0] : "時刻データがありません",
                    RaceCourse: courseTypeMatch && raceLengthMatch ? courseTypeMatch[0] + raceLengthMatch[0] : "レースコースデータがありません",
                    HeadCount: headCountMatch ? headCountMatch[0] : "頭数データがありません"
                };
            }
        });

        // レースURLから12桁のレースIDを抽出する
        const twevleDigitRegex: RegExp = /\d{12}/;
        const raceID: (string | null)[] = raceURL.map(url => {
            if (url === null || url === undefined) {
                throw new ScrapingError("レースURLがnullです。");
            } else {
                const match = url.match(twevleDigitRegex);
                return match ? match[0] : "レースIDがありません";
            }
        }).filter(id => id !== null);

        // 取得したレース情報を結合する
        const raceInfo: NextRace[] = [];
        for (let i = 0; i < raceNameMount; i++) {
            raceInfo.push({
                RaceName: raceName[i]!,
                RaceDetails: raceDetails[i],
                RaceID: raceID[i]
            });
        }

        // raceIDをもとに昇順にソートする
        raceInfo.sort((a, b) => {
            if (a.RaceID && b.RaceID) {
                return a.RaceID.localeCompare(b.RaceID);
            }
            return 0;
        });

        console.log(raceInfo);

        return raceInfo;
    }

    /**
     * 出走馬の情報を取得して返します
     * 
     * @param raceID レースの個別URL
     * @returns 
     */
    async getRaceSyutuba(raceID: string): Promise<(Syutuba)[]> {

        console.info("レースID:" + raceID + " の出走リストを取得します")

        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto(this.getSyutubaURL(raceID));

        // レース名、レース情報、馬名、馬ID、馬齢、騎手、斤量、馬体重を取得する
        let raceName: (string | null)[] = [];
        let raceData: (string | null)[] = [];
        let horseName: (string | null)[] = [];
        let horseURL: (string | null)[] = [];
        let horseAge: (string | null)[] = [];
        let jockey: (string | null)[] = [];
        let kinryou: (string | null)[] = [];
        let weight: (string | null)[] = [];

        try {
            raceName = await page.$$eval("h1.Race_Name", list => list.map(e => e.textContent));
            if (horseName.includes(null)) {
                ScrapingErrorHandler.handleNullOrEmpty("レース名取得の結果にnullがあります");
            }
            raceData = await page.$$eval("div.Race_Data", list => list.map(e => e.textContent));
            if (horseName.includes(null)) {
                ScrapingErrorHandler.handleNullOrEmpty("レース名取得の結果にnullがあります");
            }
            horseName = await page.$$eval("td.Horse_Info dl.fc dt.Horse.HorseLink a", list => list.map(e => e.textContent));
            if (horseName.includes(null)) {
                ScrapingErrorHandler.handleNullOrEmpty("出馬表取得の結果にnullがあります");
            }
            horseURL = await page.$$eval("dt.Horse.HorseLink a", list => list.map(e => e.href));
            if (horseName.includes(null)) {
                ScrapingErrorHandler.handleNullOrEmpty("馬の個別URL取得の結果にnullがあります");
            }
            horseAge = await page.$$eval("dd.Age", list => list.map(e => e.textContent));
            if (horseName.includes(null)) {
                ScrapingErrorHandler.handleNullOrEmpty("馬齢取得の結果にnullがあります");
            }
            jockey = await page.$$eval("dd.Jockey a em", list => list.map(e => e.textContent));
            if (horseName.includes(null)) {
                ScrapingErrorHandler.handleNullOrEmpty("騎手取得の結果にnullがあります");
            }
            kinryou = await page.$$eval("dd.Jockey a", list => list.map(e => e.textContent));
            if (horseName.includes(null)) {
                ScrapingErrorHandler.handleNullOrEmpty("斤量取得の結果にnullがあります");
            }
            weight = await page.$$eval("td.Weight", list => list.map(e => e.textContent));
            if (horseName.includes(null)) {
                ScrapingErrorHandler.handleNullOrEmpty("馬体重取得の結果にnullがあります");
            }
        } catch (e) {
            throw e;
        } finally {
            await browser.close();
        }

        const horseNameMount: number = horseName.length;

        // raceNameのnullチェックをする
        raceName = raceName.map(name => {
            if (name === null || name === undefined) {
                return "--";
            } else {
                return name
            }
        })

        // raceDataのnullチェックをする
        raceData = raceData.map(data => {
            if (data === null || data === undefined) {
                return "--";
            } else {
                return data.replace(/\n/g, "");
            }
        })

        // horseNameのnullチェックと空白削除をする
        horseName = horseName.map(name => {
            if (name === null || name === undefined) {
                return "--";
            } else {
                return name.replace(/\s+/g, "");
            }
        })

        // horseURLから10桁の馬IDを抽出する
        const tenDigitRegex: RegExp = /horse_id=(\d{10})/;
        const horseID: (string | null)[] = horseURL.map(url => {
            if (url === null || url === undefined) {
                return "--";
            } else {
                const match = url.match(tenDigitRegex);
                return match ? match[1] : "--";
            }
        }).filter(id => id != null);

        // horseAgeから馬齢と性別を取得する
        const horseAgeSex: (string | null)[] = horseAge.map(text => {
            if (text === null || text === undefined) {
                return "--";
            } else {
                const ageSexMatch = text.match(/[牡牝セ]\d{1,2}/g);
                return ageSexMatch ? ageSexMatch[0] : "--"
            }
        }).filter(id => id != null);

        // jockeyから騎手名、斤量を抽出する

        const kinryouData = kinryou.map(text => {
            if (text === null || text === undefined) {
                return "--";
            } else {
                const kinryouMatch = text.match(/\d{1,2}.\d{1}/);
                return kinryouMatch ? kinryouMatch[0] : "--";
            }
        }).filter(id => id != null);

        // weightから馬体重を抽出する
        const weightData = weight.map(text => {
            if (text === null || text === undefined) {
                return "--";
            } else {
                const weightMatch = text.match(/\d{3}/);
                return weightMatch ? weightMatch[0] : "--";
            }
        }).filter(id => id != null);

        // 取得した出馬データを結合する
        const syutubaData: Syutuba[] = [];
        for (let i = 0; i < horseNameMount; i++) {
            syutubaData.push({
                RaceName: raceName[0],
                RaceData: raceData[0],
                Umaban: i + 1,
                HorseName: horseName[i],
                HorseID: horseID[i],
                HorseAge: horseAgeSex[i],
                Jockey: jockey[i],
                Kinryou: kinryouData[i],
                Weight: weightData[i]
            })
        }

        return syutubaData;
    }

    /**
     * 馬の出走成績を取得します
     * @param horseURL 出走馬の成績一覧を表示するURL
     * @returns レース一覧を取得する
     */
public async getHorseRecord(horseID: string, raceID: string, umaban: number): Promise<(string | null)[]> {

    console.info("馬の出走成績を取得します");

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(this.getHorseURL(false, horseID));

    let raceDate: (string | null)[] = [];
    let raceVenue: (string | null)[] = [];
    let weather: (string | null)[] = [];
    let raceNum: (string | null)[] = [];
    let raceName: (string | null)[] = [];
    let headCount: (string | null)[] = [];
    let wakuban: (string | null)[] = [];
    let raceUmaban: (string | null)[] = [];
    let odds: (string | null)[] = [];
    let popularity: (string | null)[] = [];
    let tyakuzyun: (string | null)[] = [];
    let jockey: (string | null)[] = [];
    let kinryou: (string | null)[] = [];
    let raceCourse: (string | null)[] = [];
    let courseState: (string | null)[] = [];
    let time: (string | null)[] = [];
    let tyakusa: (string | null)[] = [];
    let cournerRank: (string | null)[] = [];
    let racePace: (string | null)[] = [];
    let Time_3F: (string | null)[] = [];
    let horseWeight: (string | null)[] = [];

    try{
        raceDate = await page.$$eval("div.db_main_race.fc div table tbody tr td:nth-child(1)", cells => cells.map(cell => cell.textContent));
        raceVenue = await page.$$eval("div.db_main_race.fc div table tbody tr td:nth-child(2)", cells => cells.map(cell => cell.textContent));
        weather = await page.$$eval("div.db_main_race.fc div table tbody tr td:nth-child(3)", cells => cells.map(cell => cell.textContent));
        raceNum = await page.$$eval("div.db_main_race.fc div table tbody tr td:nth-child(4)", cells => cells.map(cell => cell.textContent));
        raceName = await page.$$eval("div.db_main_race.fc div table tbody tr td:nth-child(5)", cells => cells.map(cell => cell.textContent));
        headCount = await page.$$eval("div.db_main_race.fc div table tbody tr td:nth-child(7)", cells => cells.map(cell => cell.textContent));
        wakuban = await page.$$eval("div.db_main_race.fc div table tbody tr td:nth-child(8)", cells => cells.map(cell => cell.textContent));
        raceUmaban = await page.$$eval("div.db_main_race.fc div table tbody tr td:nth-child(9)", cells => cells.map(cell => cell.textContent));
        odds = await page.$$eval("div.db_main_race.fc div table tbody tr td:nth-child(10)", cells => cells.map(cell => cell.textContent));
        popularity = await page.$$eval("div.db_main_race.fc div table tbody tr td:nth-child(11)", cells => cells.map(cell => cell.textContent));
        tyakuzyun = await page.$$eval("div.db_main_race.fc div table tbody tr td:nth-child(12)", cells => cells.map(cell => cell.textContent));
        jockey = await page.$$eval("div.db_main_race.fc div table tbody tr td:nth-child(13)", cells => cells.map(cell => cell.textContent));
        kinryou = await page.$$eval("div.db_main_race.fc div table tbody tr td:nth-child(14)", cells => cells.map(cell => cell.textContent));
        raceCourse = await page.$$eval("div.db_main_race.fc div table tbody tr td:nth-child(15)", cells => cells.map(cell => cell.textContent));
        courseState = await page.$$eval("div.db_main_race.fc div table tbody tr td:nth-child(16)", cells => cells.map(cell => cell.textContent));
        time = await page.$$eval("div.db_main_race.fc div table tbody tr td:nth-child(17)", cells => cells.map(cell => cell.textContent));
        tyakusa = await page.$$eval("div.db_main_race.fc div table tbody tr td:nth-child(18)", cells => cells.map(cell => cell.textContent));
        cournerRank = await page.$$eval("div.db_main_race.fc div table tbody tr td:nth-child(21)", cells => cells.map(cell => cell.textContent));
        racePace = await page.$$eval("div.db_main_race.fc div table tbody tr td:nth-child(22)", cells => cells.map(cell => cell.textContent));
        Time_3F = await page.$$eval("div.db_main_race.fc div table tbody tr td:nth-child(23)", cells => cells.map(cell => cell.textContent));
        horseWeight = await page.$$eval("div.db_main_race.fc div table tbody tr td:nth-child(24)", cells => cells.map(cell => cell.textContent));
    }catch(e){
        throw new ScrapingError(`スクレイピング失敗:https://db.netkeiba.com/horse/${horseID}のスクレイピングでエラーが発生しました。エラー： ${e.message}`);
    }finally{
        await browser.close();
    }
    raceDate = raceDate.map(date => date ? date.replace(/\s+/g, "") : "-");
    raceVenue = raceVenue.map(venue => venue ? venue.replace(/\s+/g, "") : "-");
    weather = weather.map(w => w ? w.replace(/\s+/g, "") : "-");
    raceNum = raceNum.map(num => num ? num.replace(/\s+/g, "") : "-");
    raceName = raceName.map(name => name ? name.replace(/\s+/g, "") : "-");
    headCount = headCount.map(count => count ? count.replace(/\s+/g, "") : "-");
    wakuban = wakuban.map(waku => waku ? waku.replace(/\s+/g, "") : "-");
    raceUmaban = raceUmaban.map(uma => uma ? uma.replace(/\s+/g, "") : "-");
    odds = odds.map(o => o ? o.replace(/\s+/g, "") : "-");
    popularity = popularity.map(p => p ? p.replace(/\s+/g, "") : "-");
    tyakuzyun = tyakuzyun.map(t => t ? t.replace(/\s+/g, "") : "-");
    jockey = jockey.map(j => j ? j.replace(/\s+/g, "") : "-");
    kinryou = kinryou.map(k => k ? k.replace(/\s+/g, "") : "-");
    raceCourse = raceCourse.map(course => course ? course.replace(/\s+/g, "") : "-");
    time = time.map(t => t ? t.replace(/\s+/g, "") : "-");
    tyakusa = tyakusa.map(t => t ? t.replace(/\s+/g, "") : "-");
    cournerRank = cournerRank.map(rank => rank ? rank.replace(/\s+/g, "") : "-");
    racePace = racePace.map(pace => pace ? pace.replace(/\s+/g, "") : "-");
    Time_3F = Time_3F.map(t => t ? t.replace(/\s+/g, "") : "-");
    horseWeight = horseWeight.map(weight => weight ? weight.replace(/\s+/g, "") : "-");

    // const browser = await puppeteer.launch({
    //     args: [`--window-size=1920,3080`],
    //     defaultViewport: {
    //         width: 1920,
    //         height: 3080
    //     }
    // });
    // const smartphonePage = await browser.newPage();
    // const horseURL: string = this.getHorseURL(horseID, raceID, umaban);
    // await smartphonePage.goto(horseURL);

    // let raceName: (string | null)[] = [];
    // let raceDate: (string | null)[] = [];

    // try {
    //     // セレクタが「もっと見る」のボタンがある場合、クリックする
    //     const moreButtonSelector = `#RacingResultMore_${horseID}`;
    //     await smartphonePage.waitForSelector(moreButtonSelector, { visible: true, timeout: 60000 });
    //     const moreButton = await smartphonePage.$(moreButtonSelector);
    //     if (moreButton) {
    //         await moreButton.click();
    //         await smartphonePage.waitForSelector("span.RaceName", { visible: true, timeout: 60000 }); // 代表してRaceNameが表示されるまでページ遷移を待つ
    //     }
    //     // レース名を取得してnullチェックを行う
    //     raceName = await smartphonePage.$$eval("span.RaceName", list => list.map(e => e.textContent));
    //     if (raceName.includes(null)) {
    //         ScrapingErrorHandler.handleNullOrEmpty("馬名取得の結果にnullがあります");
    //     }
    //     if (raceName.length > 10) {
    //         raceName = raceName.slice(5, raceName.length - 5);
    //     } else {
    //         raceName = [];
    //     }
    //     // レース日時を取得してnullチェックを行う
    //     raceDate = await smartphonePage.$$eval("span.RaceDate", list => list.map(e => e.textContent));
    //     if (raceDate.includes(null)) {
    //         ScrapingErrorHandler.handleNullOrEmpty("馬名取得の結果にnullがあります");
    //     }
    //     if (raceDate.length > 10) {
    //         raceDate = raceDate.slice(5, raceDate.length - 5);
    //     } else {
    //         raceDate = [];
    //     }
    // } catch (e: any) {
    //     throw new ScrapingError(`スクレイピング失敗:${horseURL}のスクレイピングでエラーが発生しました。エラー： ${e.message}`);
    // } finally {
    //     await browser.close();
    // }

    return raceVenue;
}

    /**
     * netkeibaのレース一覧ページのURLの文字列を返します
     * 
     * @assigntment 設定ファイルからURL文字列を取得するようにする
     * @returns レース一覧ページのURL
     */
    public getRaceListURL(): string {
        // 主催者がJRAの場合
        if (this.isJRA) {
            return "https://race.sp.netkeiba.com/?rf=navi"
        } else {
            return "https://nar.netkeiba.com/?rf=navi"
        }
    }

    /**
     * ネット競馬の出馬表（近走5走）または馬の個別ページのURLを生成して返します
     * @param isMobileSite - モバイルサイトかどうか
     * @param houseID - 馬ID
     * @param raceID - レースID
     * @param umaban - 馬番
     * @returns 馬の個別ページのURL
     */

    public getHorseURL(isMobileSite: boolean, houseID: string, raceID?: string, umaban?: number): string {
        // 主催者がJRAの場合
        if (this.isJRA) {
            if (isMobileSite) {
                return "https://race.sp.netkeiba.com/modal/horse.html?race_id=" + raceID + "&horse_id=" + houseID + "&i=" + umaban + "&rf=shutuba_modal";
            }
            return "https://db.netkeiba.com/horse/" + houseID;
            // 主催者がNARの場合 
        } else {
            return "https://db.netkeiba.com/horse/" + houseID;
        }
    }

    /**
     * レースIDから出馬票のURLを生成して返します
     * @param raceID 
     * @returns 出馬票のURL
     */
    public getSyutubaURL(raceID: string): string {
        // 主催者がJRAの場合
        if (this.isJRA) {
            return "https://race.sp.netkeiba.com/race/shutuba.html?race_id=" + raceID;
        } else {
            return "https://nar.netkeiba.com/race/shutuba_past.html?race_id=" + raceID + "&rf=shutuba_submenu";
        }
    }
}