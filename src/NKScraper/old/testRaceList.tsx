import { NKscraper } from "./NKScraper";
import { getHorseRaceResults } from "./ScraperEditting";

// スクレイピングテスト用
const testRaceList = async() =>{

    const test = new NKscraper(true);
    const url = test.getRaceListURL();
    console.log(url);
    const result = await test.getRaceList(url);
    console.log(result);
}

export default testRaceList();