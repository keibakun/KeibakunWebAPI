import puppeteer from "puppeteer";

import { ScrapingError, ScrapingErrorHandler } from "../Error/ScrapingError";
import { NextRace, Syutuba } from "../Interfaces/NKScraperIF";


/**
 * スクレイピングクラス
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
    public async getRaceList(raceListURL: string): Promise<(NextRace)[]> {

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
            if (name === null) {
                ScrapingErrorHandler.handleNullOrEmpty("レース名がnullです。そのためnullを返します");
                return "null";
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
            if (url === null) {
                ScrapingErrorHandler.handleNullOrEmpty("レースURLがnullです。そのためnullを返します");
                return null;
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
    async getRaceSyutuba(raceID : string): Promise<(Syutuba)[]> {

        console.info("レースURL：" + raceID + " の出走リストを取得します")

        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto(this.getSyutubaURL(raceID));

        let horseName: (string | null)[] = [];
        let horseURL: (string | null)[] = [];
        let horseAge: (string | null)[] = [];
        let jockey: (string | null)[] = [];
        let kinryou: (string | null)[] = [];
        let weight: (string | null)[] = [];

        try {
            // 出馬票の馬名を取得する
            horseName = await page.$$eval("td.Horse_Info dl.fc dt.Horse.HorseLink a", list => list.map(e => e.textContent));
            if (horseName.includes(null)) {
                ScrapingErrorHandler.handleNullOrEmpty("出馬表取得の結果にnullがあります");
            }
            // 馬の個別URLを取得する
            horseURL = await page.$$eval("dt.Horse.HorseLink a", list => list.map(e => e.href));
            if (horseName.includes(null)) {
                ScrapingErrorHandler.handleNullOrEmpty("出馬表取得の結果にnullがあります");
            }
            // 馬齢を取得する
            horseAge = await page.$$eval("dd.Age", list => list.map(e => e.textContent));
            if (horseName.includes(null)) {
                ScrapingErrorHandler.handleNullOrEmpty("出馬表取得の結果にnullがあります");
            }
            // 騎手を取得する
            jockey = await page.$$eval("dd.Jockey a em", list => list.map(e => e.textContent));
            if (horseName.includes(null)) {
                ScrapingErrorHandler.handleNullOrEmpty("出馬表取得の結果にnullがあります");
            }
            // 斤量を取得する
            kinryou = await page.$$eval("dd.Jockey a", list => list.map(e => e.textContent));
            if (horseName.includes(null)) {
                ScrapingErrorHandler.handleNullOrEmpty("出馬表取得の結果にnullがあります");
            }
            // 馬体重を取得する
            weight = await page.$$eval("td.Weight", list => list.map(e => e.textContent));
            if (horseName.includes(null)) {
                ScrapingErrorHandler.handleNullOrEmpty("出馬表取得の結果にnullがあります");
            }
        } catch (e) {
            throw e;
        } finally {
            await browser.close();
        }

        const horseNameMount: number = horseName.length;

        // horseNameのnullチェックと空白削除をする
        horseName = horseName.map(name => {
            if (name === null) {
                ScrapingErrorHandler.handleNullOrEmpty("馬名がnullです。そのためnullを返します");
                return null;
            } else {
                return name.replace(/\s+/g, "");
            }
        })

        // horseURLから10桁の馬IDを抽出する
        const tenDigitRegex: RegExp = /horse_id=(\d{10})/;
        const horseID: (string | null)[] = horseURL.map(url => {
            if (url === null) {
                ScrapingErrorHandler.handleNullOrEmpty("馬の個別URLがnullです。そのためnullを返します");
                return null;
            } else {
                const match = url.match(tenDigitRegex);
                return match ? match[0] : "--";
            }
        }).filter(id => id != null);

        // horseAgeから馬齢と性別を取得する
        const horseAgeSex: (string | null)[] = horseAge.map(text => {
            if(text === null) {
                ScrapingErrorHandler.handleNullOrEmpty("馬齢データがnullです。そのためnullを返します")
                return null;
            }else{
                const ageSexMatch = text.match(/[牡牝セ]\d{1,2}/g);
                return ageSexMatch ? ageSexMatch[0] :"--"
            }
        }).filter(id => id != null);

        // jockeyから騎手名、斤量を抽出する
        
        const kinryouData = kinryou.map(text => {
            if(text === null){
                ScrapingErrorHandler.handleNullOrEmpty("騎手データがありません。そのため騎手名と斤量はnullを返します");
                    return "null";
            }else{
                const kinryouMatch = text.match(/\d{1,2}.\d{1}/);
                return kinryouMatch ? kinryouMatch[0] : "--";
            }
        }).filter(id => id != null);

        // weightから馬体重を抽出する
        const weightData = weight.map(text => {
            if(text === null){
                ScrapingErrorHandler.handleNullOrEmpty("馬体重データがありません。そのため、nullを返します")
                return null;
            }else{
                const weightMatch = text.match(/\d{3}/);
                return weightMatch ? weightMatch[0]: "--";
            }
        }).filter(id => id != null);

        console.log();

        // 取得した出馬データを結合する
        const syutubaData: Syutuba[] = [];
        for (let i = 0; i<horseNameMount; i++){
            syutubaData.push({
                Umaban: i+1,
                HorseName: horseName[i],
                HorseURL: horseID[i],
                HorseAge: horseAgeSex[i],
                Jockey: jockey[i],
                Kinryou: kinryouData[i],
                Weight: weightData[i]
            })
        }

        console.log(syutubaData)
        
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
        const horseURL : string = this.getHorseURL(horseID, raceID, umaban);
        await page.goto(horseURL);

        let horseName: (string | null)[] = [];
        const selecter_horseID: string = "ul.RacingResultList.result_" + horseID;

        try {
            // レース名を取得してnullチェックを行う
            horseName = await page.$$eval(selecter_horseID + " li", list => list.map(e => e.textContent));
            if (horseName.includes(null)) {
                ScrapingErrorHandler.handleNullOrEmpty("馬名取得の結果にnullがあります");
            }
        } catch (e: any) {
            throw new ScrapingError(`スクレイピング失敗:${horseURL}のスクレイピングでエラーが発生しました。エラー： ${e.message}`);
        } finally {
            await browser.close();
        }

        return horseName
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
     * @param raceID - レースID
     * @param houseID - 馬ID
     * @returns 馬の個別ページのURL
     */

    public getHorseURL(houseID: string, raceID: string, umaban: number): string {
        // 主催者がJRAの場合
        if (this.isJRA) {
            return "https://race.sp.netkeiba.com/modal/horse.html?race_id=" + raceID + "&" + houseID + "&i=" + umaban +"&rf=shutuba_modal";
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