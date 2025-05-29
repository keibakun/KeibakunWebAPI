import path from "path";
import fs from "fs";

import getRaceList from "./raceList/raceList";
import { RaceData } from "./raceList/raceListIF";

// レースリストを取得します
async function main_raceList() {
    // コマンドライン引数から year, month を取得
    const args = process.argv.slice(2);
    const year = parseInt(args[0], 10) || 2025; // デフォルト値: 2025
    const monthArg = args[1] ? parseInt(args[1], 10) : undefined;

    console.info(`指定された年: ${year}${monthArg ? `, 月: ${monthArg}` : ""}`);

    // 月指定があればその月だけ、なければ1～12月ループ
    const months = monthArg && monthArg >= 1 && monthArg <= 12 ? [monthArg] : Array.from({ length: 12 }, (_, i) => i + 1);

    for (const month of months) {
        const formattedMonth: string = month.toString().padStart(2, "0");

        // index.html のパスを指定
        const indexPath = path.join(__dirname, `../../RaceSchedule/${year}${formattedMonth}/index.html`);

        console.info(`index.html のパス: ${indexPath}`);

        // index.html を読み込む
        if (!fs.existsSync(indexPath)) {
            console.warn(`index.html が存在しません: ${indexPath}`);
            continue;
        }

        const htmlContent = fs.readFileSync(indexPath, "utf-8");

        // kaisaiDate をすべて抽出
        const kaisaiDateMatches = htmlContent.match(/"kaisaiDate":\s*"(\d{8})"/g);
        if (!kaisaiDateMatches) {
            console.error(`kaisaiDate が見つかりませんでした: ${indexPath}`);
            continue;
        }

        const kaisaiDates = kaisaiDateMatches.map((match) => {
            const dateMatch = match.match(/"kaisaiDate":\s*"(\d{8})"/);
            return dateMatch?.[1] || "";
        }).filter((date) => date !== "");

        console.info(`抽出された kaisaiDate: ${kaisaiDates.join(", ")}`);

        for (const kaisaiDate of kaisaiDates) {
            console.info(`kaisaiDate: ${kaisaiDate} を使用してレースリストを取得します`);
            const raceList: RaceData[] = await getRaceList(kaisaiDate);

            // レースリストのJSONファイルを生成
            const dp = path.join(__dirname, `../../RaceList/`, kaisaiDate);
            const outputDir = path.resolve(dp);
            if (!fs.existsSync(outputDir)) {
                console.log("指定のディレクトリが存在しないため作成します");
                fs.mkdirSync(outputDir, { recursive: true });
            } else {
                console.log("指定のディレクトリが存在するため上書きします");
            }
            const fp = path.join(dp, "index.html");
            fs.writeFileSync(fp, JSON.stringify(raceList, null, 2), "utf-8");
            console.info(`レースリストを ${fp} に保存しました`);
        }
    }
}

main_raceList();