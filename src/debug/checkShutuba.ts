/**
 * Shutuba フォルダの過不足調査スクリプト
 *
 * 処理概要:
 * 1. 2015〜2026年の各年月について RaceList から raceId 一覧を収集
 *    → temp/work/shutuba/target/{year}{MM}.json に一時保存（処理後削除）
 * 2. 各 raceId に対して Shutuba/{year}/{month}/{rest}/index.html の存在と
 *    syutuba プロパティが空でないことを確認
 * 3. 問題のある raceId が存在した年月をコンソールに出力
 */

import path from "path";
import fs from "fs/promises";

const ROOT = path.join(__dirname, "../../");
const RACE_LIST_ROOT = path.join(ROOT, "RaceList");
const SHUTUBA_ROOT = path.join(ROOT, "Shutuba");
const TARGET_DIR = path.join(ROOT, "temp/work/shutuba/target");

const START_YEAR = 2015;
const END_YEAR = 2026;

// -----------------------------------------------------------------------

async function ensureDir(dir: string): Promise<void> {
    await fs.mkdir(dir, { recursive: true });
}

async function fileExists(filePath: string): Promise<boolean> {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

/**
 * RaceList/{YYYYMMDD}/index.html から raceId を抽出する
 */
async function extractRaceIds(kaisaiDate: string): Promise<string[]> {
    const indexPath = path.join(RACE_LIST_ROOT, kaisaiDate, "index.html");
    if (!await fileExists(indexPath)) return [];

    let raw: string;
    try {
        raw = await fs.readFile(indexPath, "utf-8");
    } catch {
        return [];
    }

    let data: any[];
    try {
        data = JSON.parse(raw);
    } catch {
        console.warn(`  [WARN] JSONパース失敗: ${indexPath}`);
        return [];
    }

    const ids: string[] = [];
    for (const venue of data) {
        if (Array.isArray(venue?.items)) {
            for (const item of venue.items) {
                if (item?.raceId) ids.push(item.raceId);
            }
        }
    }
    return ids;
}

/**
 * 指定年月の raceId 一覧を RaceList から収集する
 * @returns raceId の配列
 */
async function collectRaceIds(year: number, month: number): Promise<string[]> {
    const mm = month.toString().padStart(2, "0");
    const prefix = `${year}${mm}`;

    let entries: string[];
    try {
        entries = await fs.readdir(RACE_LIST_ROOT);
    } catch {
        return [];
    }

    const matchedDates = entries.filter((e) => e.startsWith(prefix));
    const raceIds: string[] = [];
    for (const date of matchedDates) {
        const ids = await extractRaceIds(date);
        raceIds.push(...ids);
    }
    return raceIds;
}

/**
 * raceId に対応する Shutuba ファイルをチェックする
 * @returns 問題の種別: "missing"（ファイルなし）| "empty_syutuba"（syutubaが空）| null（正常）
 */
async function checkShutuba(raceId: string): Promise<"missing" | "empty_syutuba" | null> {
    const year = raceId.substring(0, 4);
    const month = raceId.substring(4, 6);
    const rest = raceId.substring(6);
    const filePath = path.join(SHUTUBA_ROOT, year, month, rest, "index.html");

    if (!await fileExists(filePath)) {
        return "missing";
    }

    let raw: string;
    try {
        raw = await fs.readFile(filePath, "utf-8");
    } catch {
        return "missing";
    }

    let data: any;
    try {
        data = JSON.parse(raw);
    } catch {
        return "empty_syutuba";
    }

    if (!Array.isArray(data?.syutuba) || data.syutuba.length === 0) {
        return "empty_syutuba";
    }

    return null;
}

// -----------------------------------------------------------------------

interface ProblemEntry {
    raceId: string;
    reason: "missing" | "empty_syutuba";
}

async function main(): Promise<void> {
    await ensureDir(TARGET_DIR);

    const summaryLines: string[] = [];

    for (let year = START_YEAR; year <= END_YEAR; year++) {
        for (let month = 1; month <= 12; month++) {
            const mm = month.toString().padStart(2, "0");
            const ym = `${year}${mm}`;

            // ① raceId 一覧を収集して target に保存
            const raceIds = await collectRaceIds(year, month);

            const targetPath = path.join(TARGET_DIR, `${ym}.json`);
            await fs.writeFile(targetPath, JSON.stringify(raceIds, null, 2), "utf-8");

            if (raceIds.length === 0) {
                console.log(`[${ym}] RaceList なし（スキップ）`);
                continue;
            }

            console.log(`[${ym}] ${raceIds.length} 件の raceId を確認中...`);

            // ② Shutuba を走査して問題を収集
            const problems: ProblemEntry[] = [];
            for (const raceId of raceIds) {
                const reason = await checkShutuba(raceId);
                if (reason !== null) {
                    problems.push({ raceId, reason });
                }
            }

            if (problems.length > 0) {
                const line = `[${ym}] 問題あり: ${problems.length}件 / ${raceIds.length}件`;
                console.warn(`  ⚠ ${line}`);
                problems.forEach((p) => console.warn(`      ${p.raceId} (${p.reason})`));
                summaryLines.push(line);
            } else {
                console.log(`  ✓ 問題なし`);
            }
        }
    }

    console.log("\n========== 調査完了 ==========");
    if (summaryLines.length === 0) {
        console.log("全年月で問題は見つかりませんでした。");
    } else {
        console.log("問題のあった年月一覧:");
        summaryLines.forEach((l) => console.log(`  ${l}`));
    }

    // target フォルダを削除
    await fs.rm(TARGET_DIR, { recursive: true, force: true });
    console.log("temp/work/shutuba/target を削除しました。");
}

main().catch((err) => {
    console.error("スクリプト実行中にエラーが発生しました:", err);
    process.exit(1);
});
