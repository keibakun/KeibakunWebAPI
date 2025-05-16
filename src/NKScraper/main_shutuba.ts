import path from "path";
import fs from "fs";
import getShutuba from "./shutuba/shutuba";
import { RaceIF } from "./shutuba/syutubaIF";

async function main_shutuba(): Promise<void> {
    // コマンドライン引数から年と月を取得
    const args: string[] = process.argv.slice(2);
    const year: number = parseInt(args[0], 10) || 2025; // デフォルト値: 2025
    const month: number = parseInt(args[1], 10); // 月を引数から取得（必須）

    if (isNaN(month) || month < 1 || month > 12) {
        console.error("月の指定が無効です。1～12の範囲で指定してください。");
        return;
    }

    console.info(`指定された年: ${year}, 月: ${month}`);

    const kaisaiDates: string[] = [];

    // 月を2桁にフォーマット
    const formattedMonth: string = month.toString().padStart(2, "0");

    // RaceSchedule の index.html を参照
    const schedulePath: string = path.join(__dirname, `../../RaceSchedule/${year}${formattedMonth}/index.html`);

    if (!fs.existsSync(schedulePath)) {
        console.warn(`index.html が存在しません: ${schedulePath}`);
        return; // ファイルが存在しない場合は終了
    }

    const scheduleContent: string = fs.readFileSync(schedulePath, "utf-8");

    // kaisaiDate を抽出
    const kaisaiDateMatches: RegExpMatchArray | null = scheduleContent.match(/"kaisaiDate":\s*"(\d{8})"/g);
    if (!kaisaiDateMatches) {
        console.warn(`kaisaiDate が見つかりません: ${schedulePath}`);
        return;
    }

    // 抽出した kaisaiDate を配列に追加
    const extractedDates: string[] = kaisaiDateMatches.map((match: string): string => {
        const dateMatch: RegExpMatchArray | null = match.match(/"kaisaiDate":\s*"(\d{8})"/);
        return dateMatch?.[1] || "";
    }).filter((date: string): boolean => date !== "");

    kaisaiDates.push(...extractedDates);

    if (kaisaiDates.length === 0) {
        console.warn(`指定された年 (${year}) の月 (${month}) の開催日が見つかりませんでした。`);
        return;
    }

    // RaceList 配下のフォルダを参照
    for (const kaisaiDate of kaisaiDates) {
        const raceListPath: string = path.join(__dirname, `../../RaceList/${kaisaiDate}/index.html`);
        if (!fs.existsSync(raceListPath)) {
            console.warn(`RaceList の index.html が存在しません: ${raceListPath}`);
            continue;
        }

        const raceListContent: string = fs.readFileSync(raceListPath, "utf-8");

        // raceId を抽出
        const raceIdMatches: RegExpMatchArray | null = raceListContent.match(/"raceId":\s*"(\d{12})"/g);
        if (!raceIdMatches) {
            console.warn(`raceId が見つかりません: ${raceListPath}`);
            continue;
        }

        const raceIds: string[] = raceIdMatches.map((match: string): string => {
            const idMatch: RegExpMatchArray | null = match.match(/"raceId":\s*"(\d{12})"/);
            return idMatch?.[1] || "";
        }).filter((id: string): boolean => id !== "");

        // 各 raceId に対して getShutuba を実行
        for (const raceId of raceIds) {
            console.info(`レースID: ${raceId} の出馬表を取得します`);

            try {
                const raceData: RaceIF = await getShutuba(raceId);

                // raceId を分割してディレクトリを構築
                const year: string = raceId.substring(0, 4);
                const month: string = raceId.substring(4, 6);
                const rest: string = raceId.substring(6);

                // ディレクトリパスを構築
                const dp: string = path.join(__dirname, `../../Shutuba/`, year, month, rest);
                const outputDir: string = path.resolve(dp);
                if (!fs.existsSync(outputDir)) {
                    console.log("指定のディレクトリが存在しないため作成します");
                    fs.mkdirSync(outputDir, { recursive: true });
                } else {
                    console.log("指定のディレクトリが存在するため上書きします");
                }

                // ファイルパスを構築
                const fp: string = path.join(outputDir, "index.html");
                fs.writeFileSync(fp, JSON.stringify(raceData, null, 2), "utf-8");
                console.info(`出馬表を${fp} に保存しました`);
            } catch (error) {
                console.error(`レースID: ${raceId} の出馬表取得中にエラーが発生しました:`, error);
            }
        }
    }
}

main_shutuba();