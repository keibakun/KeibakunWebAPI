import path from "path";
import fs from "fs";
import getRaceResult from "./raceResult/raceResult";

// メイン処理
async function main_raceResult() {
    // コマンドライン引数からkaisaiDateを取得
    const kaisaiDate = process.argv[2];
    if (!kaisaiDate) {
        console.error("kaisaiDateを指定してください。例: node main_raceResult.js 20240503");
        process.exit(1);
    }

    // RaceList/{kaisaiDate}/index.html のパス
    const raceListPath = path.join(__dirname, `../../RaceList/${kaisaiDate}/index.html`);
    if (!fs.existsSync(raceListPath)) {
        console.error(`RaceListファイルが存在しません: ${raceListPath}`);
        process.exit(1);
    }

    // レースリストを読み込む
    const raceListJson = fs.readFileSync(raceListPath, "utf-8");
    let raceList: any[] = [];
    try {
        raceList = JSON.parse(raceListJson);
    } catch (e) {
        console.error("RaceListのJSONパースに失敗しました");
        process.exit(1);
    }

    // raceId一覧を抽出
    // raceListは [{..., items: [...]}, ...] の配列なので、items配下のraceIdを全て取得
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
        console.error("raceIdが見つかりませんでした");
        process.exit(1);
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

main_raceResult();