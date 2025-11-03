import fs from "fs";
import path from "path";

// ① RaceListフォルダのうち、引数で渡された年数から始まるフォルダ名に格納されるindex.htmlをすべて走査
export async function extractRaceResult(year: number): Promise<void> {
    const raceListRoot = "/Users/mizukoshiasuto/Documents/project/KeibakunWebAPI/KeibakunWebAPI/RaceList";
    const raceResultRoot = "/Users/mizukoshiasuto/Documents/project/KeibakunWebAPI/KeibakunWebAPI/RaceResult";

    // ② 各index.htmlからtitle.venueとraceName、raceCourse、raceId、gradeを抽出
    const raceMetaList: {
        venue: string;
        raceName: string;
        raceCourse: string;
        raceId: string;
        grade: string;
    }[] = [];

    const kaisaiDirs = fs.readdirSync(raceListRoot)
        .filter(name => name.startsWith(year.toString()) && fs.existsSync(path.join(raceListRoot, name, "index.html")));

    for (const kaisaiDate of kaisaiDirs) {
        const indexPath = path.join(raceListRoot, kaisaiDate, "index.html");
        try {
            const json = fs.readFileSync(indexPath, "utf-8");
            const raceList = JSON.parse(json);
            for (const venueObj of raceList) {
                const venue = venueObj.title?.venue ?? "";
                if (venueObj.items && Array.isArray(venueObj.items)) {
                    for (const item of venueObj.items) {
                        raceMetaList.push({
                            venue,
                            raceName: item.raceName ?? "",
                            raceCourse: item.raceCourse ?? "",
                            raceId: item.raceId ?? "",
                            grade: item.grade ?? "",
                        });
                    }
                }
            }
        } catch (e) {
            console.warn(`RaceListの読み込み失敗: ${indexPath}`);
        }
    }

    // ③ venue, raceCourse, gradeごとにraceIdリストを作成
    const patternMap: { [key: string]: string[] } = {};
    raceMetaList.forEach(meta => {
        const key = `${meta.venue}_${meta.raceCourse}_${meta.grade}`;
        if (!patternMap[key]) patternMap[key] = [];
        patternMap[key].push(meta.raceId);
    });

    // ④ RaceResultフォルダの走査
    const result: any = {};
    for (const key in patternMap) {
        const raceIds = patternMap[key];
        result[key] = [];
        for (const raceId of raceIds) {
            // RaceResult/2025/03/010101/index.html のような分割パス
            const year = raceId.substring(0, 4);
            const month = raceId.substring(4, 6);
            const rest = raceId.substring(6);
            const resultPath = path.join(raceResultRoot, year, month, rest, "index.html");
            if (fs.existsSync(resultPath)) {
                try {
                    const raceResultJson = fs.readFileSync(resultPath, "utf-8");
                    const raceResult = JSON.parse(raceResultJson);
                    result[key].push({
                        raceId,
                        ...raceResult,
                    });
                } catch (e) {
                    // 読み込み失敗時はスキップ
                }
            }
        }
    }

    // ⑤ 統計的な表現（例：件数のみ出力、必要に応じて集計処理を追加）
    const stats = Object.entries(result).map(([key, races]) => {
        const raceArr = races as any[];
        return {
            pattern: key,
            count: raceArr.length,
            raceIds: raceArr.map((r: any) => r.raceId),
        };
    });

    console.log(JSON.stringify(stats, null, 2));
}