import { NKscraper } from "./NKScraper";

// スクレイピングテスト用
const test = async() =>{

    const horseID = "horseid=2019105056";
    const raceID = "202505010411";
    const umaban = 1;
    const scraper = new NKscraper(true);
    const url = scraper.getHorseURL(horseID, raceID, 10);
    console.log(url);

    const result = await scraper.getHorseRecord(url, horseID, umaban);
    console.log(result);
}

export default test();