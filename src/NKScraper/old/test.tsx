import { NKscraper } from "./NKScraper";
import { getHorseRaceResults } from "./ScraperEditting";

// スクレイピングテスト用
const test = async() =>{

    const horseID = "2021105743";
    const raceID = "202509020411";

    const result = await getHorseRaceResults(horseID, raceID);
    console.log(result);
}

export default test();