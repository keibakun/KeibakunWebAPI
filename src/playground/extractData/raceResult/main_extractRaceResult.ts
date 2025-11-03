import { extractRaceResult } from "./extractRaceResult";

// コマンドライン引数から年を取得して実行
async function main_extractRaceResult() {
    const args = process.argv.slice(2);
    const year = parseInt(args[0], 10) || 2025; // デフォルト値: 2025

    await extractRaceResult(year);
}

main_extractRaceResult();