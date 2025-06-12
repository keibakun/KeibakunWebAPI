import path from "path";
import fs from "fs";
import getRaceResult from "./raceResult/raceResult";

// 年月からkaisaiDateを抽出し、各kaisaiDateのレースIDを一括取得してスクレイピング
async function main_raceResult() {
    // コマンドライン引数から year, month を取得
    const args = process.argv.slice(2);
    const year = parseInt(args[0], 10) || 2025; // デフォルト値: 2025
    const monthArg = args[1] ? parseInt(args[1], 10) : undefined;

    console.info(`指定された年: ${year}${monthArg ? `, 月: ${monthArg}` : ""}`);

    // 月指定があればその月だけ、なければ1～12月ループ
    const months = monthArg && monthArg >= 1 && monthArg <= 12 ? [monthArg] : Array.from({ length: 12 }, (_, i) => i + 1);

    for (const month of months) {
        const formattedMonth: string = month.toString().padStart(2, "0");
        const raceListDir = path.join(__dirname, `../../RaceList/`);
        // RaceList/{kaisaiDate}/index.html を探す
        const raceListRoot = path.join(raceListDir);

        // RaceList配下のディレクトリ一覧を取得
        const kaisaiDates = fs.readdirSync(raceListRoot)
            .filter((name) => name.startsWith(`${year}${formattedMonth}`) && fs.existsSync(path.join(raceListRoot, name, "index.html")));

        if (kaisaiDates.length === 0) {
            console.warn(`RaceList/${year}${formattedMonth}**/index.html が見つかりません`);
            continue;
        }

        for (const kaisaiDate of kaisaiDates) {
            const raceListPath = path.join(raceListRoot, kaisaiDate, "index.html");
            if (!fs.existsSync(raceListPath)) {
                console.warn(`RaceListファイルが存在しません: ${raceListPath}`);
                continue;
            }

            // レースリストを読み込む
            const raceListJson = fs.readFileSync(raceListPath, "utf-8");
            let raceList: any[] = [];
            try {
                raceList = JSON.parse(raceListJson);
            } catch (e) {
                console.error("RaceListのJSONパースに失敗しました");
                continue;
            }

            // raceId一覧を抽出
            const raceIds: string[] = [];
            for (const venue of raceList) {
                if (venue.items && Array.isArray(venue.items)) {
                    for (const item of venue.items) {
                        if (item.raceId) {
                            raceIds.push(item.raceId);
                        }
                    }
                }
            }

            if (raceIds.length === 0) {
                console.error(`raceIdが見つかりませんでした: ${kaisaiDate}`);
                continue;
            }

            // 各raceIdごとにgetRaceResultを実行し、保存
            for (const raceId of raceIds) {
                try {
                    console.info(`raceId: ${raceId} のレース結果を取得します`);
                    const result = await getRaceResult(raceId);

                    // 保存先ディレクトリ
                    const outDir = path.join(__dirname, `../../RaceResult/${raceId}`);
                    if (!fs.existsSync(outDir)) {
                        fs.mkdirSync(outDir, { recursive: true });
                    }
                    const outPath = path.join(outDir, "index.html");
                    fs.writeFileSync(outPath, JSON.stringify(result, null, 2), "utf-8");
                    console.info(`レース結果を ${outPath} に保存しました`);
                } catch (err) {
                    console.error(`raceId: ${raceId} の取得・保存でエラー:`, err);
                }
            }
        }
    }
}

main_raceResult();