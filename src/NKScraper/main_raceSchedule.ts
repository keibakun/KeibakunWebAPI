import path from "path";
import fs from "fs";

import getRaceSchedule from "./raceSchedule/raceSchedule";
import { Schedule } from "./raceSchedule/raceShceduleIF";

// レースの開催日程を取得します
async function main_raceSchedule() {
    // 取得対象の年を指定
    const year = 2025;

    for (let i = 4; i < 5; i++) {
        const month = i + 1;
        // 月を2桁にフォーマット
        const formattedMonth: string = month.toString().padStart(2, "0");
        const schedule: Schedule[] = await getRaceSchedule(year, month);

        // 開催日程のJSONファイルを生成
        const dp = path.join(__dirname as string, `../../RaceSchedule`, year.toString() + formattedMonth.toString());
        const outputDir = path.resolve(dp);
        if (!fs.existsSync(outputDir)) {
            console.log("指定のディレクトリが存在しないため作成します");
            await fs.mkdirSync(outputDir, { recursive: true });
        } else {
            console.log("指定のディレクトリが存在するため上書きします");
        }
        const fp = path.join(dp, "index.html");
        await fs.writeFileSync(fp, JSON.stringify(schedule, null, 2), "utf-8");

        console.log(JSON.stringify(schedule, null, 2));
    }
}

main_raceSchedule();