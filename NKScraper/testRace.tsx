import { NKscraper } from "./NKScraper";

// スクレイピングテスト用
const test = async() =>{

    const raceID = "202506020211";
    const scraper = new NKscraper(true);
    const url = scraper.getSyutubaURL(raceID);

    const result = await scraper.getRaceSyutuba(raceID);
    console.log(result);
}

export default test();