import path from "path";
import fs from "fs";

import getRaceSchedule from "./raceSchedule/raceSchedule";
import { Schedule } from "./raceSchedule/raceShceduleIF";

// レースの開催日程を取得します
async function main_raceSchedule() {
    // コマンドライン引数から year を取得
    const args = process.argv.slice(2);
    const year = parseInt(args[0], 10) || 2025; // デフォルト値: 2025

    console.info(`指定された年: ${year}`);

    for (let i = 0; i < 12; i++) {
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
        console.info(`開催日程を ${fp} に保存しました`);
    }
}

main_raceSchedule();