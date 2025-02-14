import { NKscraper } from "./NKScraper";
import { NextRace, Syutuba } from "../Interfaces/NKScraperIF";
import fs from 'fs';
import path from 'path';

const scrapingAll_Jra = async () => {
    // レース一覧を取得
    const scraper: NKscraper = new NKscraper(true);
    const raceListResult: (NextRace)[] = await scraper.getRaceList(scraper.getRaceListURL());

    // レース一覧のJSONファイルを生成
    const fp = path.join(__dirname as string, "../../../data/RaceListResult.json")
    fs.writeFileSync(fp, JSON.stringify(raceListResult, null, 2), "utf-8")

    // レース一覧が取得できた場合、レースIDをキーにして出走馬を取得
    let syutubaResult: (Syutuba)[] = [];
    if (raceListResult !== null) {
        const raceListResultLength = raceListResult.length;
        for (let i = 0; i < raceListResultLength; i++) {
            if (raceListResult[i].RaceID) {
                syutubaResult = await scraper.getRaceSyutuba(raceListResult[i].RaceID as string);

                // syutubaresultをファイルに保存
                const filePath = path.join(__dirname as string, '../../../data/SyutubaResult' + raceListResult[i].RaceID + '.json');
                fs.writeFileSync(filePath, JSON.stringify(syutubaResult, null, 2), 'utf-8');
            }
        }
    }
    
}

scrapingAll_Jra();