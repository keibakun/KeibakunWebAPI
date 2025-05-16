import path from "path";
import fs from "fs";
import getShutuba from "./shutuba/shutuba";

async function main_shutuba() {
    // コマンドライン引数から年と月を取得
    const args = process.argv.slice(2);
    const year = parseInt(args[0], 10) || 2025; // デフォルト値: 2025
    const month = parseInt(args[1], 10) || 5; // 月を引数から取得（必須）

    if (isNaN(month) || month < 1 || month > 12) {
        console.error("月の指定が無効です。1～12の範囲で指定してください。");
        return;
    }

    console.info(`指定された年: ${year}, 月: ${month}`);

    const kaisaiDates: string[] = [];

    // 月を2桁にフォーマット
    const formattedMonth: string = month.toString().padStart(2, "0");

    // RaceSchedule の index.html を参照
    const schedulePath = path.join(__dirname, `../../RaceSchedule/${year}${formattedMonth}/index.html`);

    if (!fs.existsSync(schedulePath)) {
        console.warn(`index.html が存在しません: ${schedulePath}`);
        return; // ファイルが存在しない場合は終了
    }

    const scheduleContent = fs.readFileSync(schedulePath, "utf-8");

    // kaisaiDate を抽出
    const kaisaiDateMatches = scheduleContent.match(/"kaisaiDate":\s*"(\d{8})"/g);
    if (!kaisaiDateMatches) {
        console.warn(`kaisaiDate が見つかりません: ${schedulePath}`);
        return;
    }

    // 抽出した kaisaiDate を配列に追加
    const extractedDates = kaisaiDateMatches.map((match) => {
        const dateMatch = match.match(/"kaisaiDate":\s*"(\d{8})"/);
        return dateMatch?.[1] || "";
    }).filter((date) => date !== "");

    kaisaiDates.push(...extractedDates);

    if (kaisaiDates.length === 0) {
        console.warn(`指定された年 (${year}) の月 (${month}) の開催日が見つかりませんでした。`);
        return;
    }

    // RaceList 配下のフォルダを参照
    for (const kaisaiDate of kaisaiDates) {
        const raceListPath = path.join(__dirname, `../../RaceList/${kaisaiDate}/index.html`);
        if (!fs.existsSync(raceListPath)) {
            console.warn(`RaceList の index.html が存在しません: ${raceListPath}`);
            continue;
        }

        const raceListContent = fs.readFileSync(raceListPath, "utf-8");

        // raceId を抽出
        const raceIdMatches = raceListContent.match(/"raceId":\s*"(\d{12})"/g);
        if (!raceIdMatches) {
            console.warn(`raceId が見つかりません: ${raceListPath}`);
            continue;
        }

        const raceIds = raceIdMatches.map((match) => {
            const idMatch = match.match(/"raceId":\s*"(\d{12})"/);
            return idMatch?.[1] || "";
        }).filter((id) => id !== "");

        // 各 raceId に対して getShutuba を実行
        for (const raceId of raceIds) {
            console.info(`レースID: ${raceId} の出馬表を取得します`);
            const raceData = await getShutuba(raceId);

            // 出馬表を保存
            const dp = path.join(__dirname, `../../Shutuba/`, raceId);
            const outputDir = path.resolve(dp);
            if (!fs.existsSync(outputDir)) {
                console.log("指定のディレクトリが存在しないため作成します");
                fs.mkdirSync(outputDir, { recursive: true });
            } else {
                console.log("指定のディレクトリが存在するため上書きします");
            }

            const fp = path.join(dp, "index.html");
            fs.writeFileSync(fp, JSON.stringify(raceData, null, 2), "utf-8");
            console.info(`出馬表を${fp} に保存しました`);
        }
    }
}

main_shutuba();