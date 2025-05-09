import path from "path";
import fs from "fs";

import getRaceSchedule from "./raceSchedule/raceSchedule";

// レースの開催日程を取得します
async function main_raceSchedule() {
    const year = 2025;
    const month = 4;

    const schedule = await getRaceSchedule(year, month);

    // 開催日程のJSONファイルを生成
    const dp = path.join(__dirname as string, `../../../RaceSchedule`, year.toString() + month.toString());
    const outputDir = path.resolve(dp);
    if(!fs.existsSync(outputDir)) {
        console.log("Directory does not exist. Creating...");
        await fs.mkdirSync(outputDir, { recursive: true });
    } else {
        console.log("Directory already exists.");
    }
    const fp = path.join(dp, "index.html");
    await fs.writeFileSync(fp, JSON.stringify(schedule, null, 2), "utf-8");
    
    console.log(JSON.stringify(schedule, null, 2));
}

main_raceSchedule();