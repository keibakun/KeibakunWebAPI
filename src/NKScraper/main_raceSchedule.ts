import path from "path";
import fs from "fs/promises";

import getRaceSchedule from "./raceSchedule/raceSchedule";

// レースの開催日程を取得します
async function main_raceSchedule() {
    const year = 2025;
    const month = 4;

    const schedule = await getRaceSchedule(year, month);

    // レース一覧のJSONファイルを生成
    const dp = path.join(__dirname as string, `../../../RaceSchedule`, year.toString(), month.toString());
    const fp = path.join(dp, "index.html");
    await fs.writeFile(fp, JSON.stringify(schedule, null, 2), "utf-8");
    
    console.log(JSON.stringify(schedule, null, 2));
}

main_raceSchedule();