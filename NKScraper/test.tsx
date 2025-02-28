import { NKscraper } from "./NKScraper";

// スクレイピングテスト用
const test = async() =>{

    const horseID = "2022105365";
    const raceID = "202505010804";
    const umaban = 10;
    const scraper = new NKscraper(true);
    const url = scraper.getHorseURL(horseID, raceID, umaban);
    console.log(url);

    const result = await scraper.getHorseRecord(horseID, raceID, umaban);
    console.log(result);
}

export default test();