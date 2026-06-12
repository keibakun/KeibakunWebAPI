/**
 * HorseDetail フォルダの過不足調査スクリプト
 *
 * 処理概要:
 * 1. 2015〜2026年の各年月について RaceList から raceId 一覧を収集
 * 2. 各 raceId に対して Shutuba を読み、syutuba[].horseId を抽出
 * 3. 抽出した horseId について HorseDetail の存在と主要プロパティ値を検証
 * 4. 問題のある horseId / raceId をコンソールに出力
 */

import path from "path";
import fs from "fs/promises";

const ROOT = path.join(__dirname, "../../");
const RACE_LIST_ROOT = path.join(ROOT, "RaceList");
const SHUTUBA_ROOT = path.join(ROOT, "Shutuba");
const HORSE_DETAIL_ROOT = path.join(ROOT, "HorseDetail");
const TARGET_DIR = path.join(ROOT, "temp/work/horseDetail/target");

const START_YEAR = 2015;
const END_YEAR = 2026;

// -----------------------------------------------------------------------

type ProblemReason =
    | "missing_shutuba"
    | "parse_error_shutuba"
    | "empty_syutuba"
    | "invalid_horseId"
    | "missing_horse_detail"
    | "parse_error_horse_detail"
    | "missing_profile"
    | "missing_raceResults"
    | "invalid_profile_name"
    | "invalid_profile_status"
    | "invalid_profile_sex"
    | "invalid_profile_age"
    | "invalid_profile_type"
    | "invalid_profile_birthDate"
    | "invalid_profile_trainer"
    | "invalid_profile_trainerId"
    | "invalid_profile_kyuusya"
    | "invalid_profile_owner"
    | "invalid_profile_ownerId"
    | "invalid_profile_breeder"
    | "invalid_profile_breederId";

interface HorseSource {
    raceId: string;
    horseId: string;
}

interface ProblemEntry {
    raceId: string;
    horseId: string;
    reason: ProblemReason;
}

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

function getShutubaPath(raceId: string): string {
    const year = raceId.substring(0, 4);
    const month = raceId.substring(4, 6);
    const rest = raceId.substring(6);
    return path.join(SHUTUBA_ROOT, year, month, rest, "index.html");
}

function getHorseDetailPath(horseId: string): string {
    if (horseId.length < 10) {
        return path.join(HORSE_DETAIL_ROOT, `${horseId}.html`);
    }
    const year = horseId.substring(0, 4);
    const month = horseId.substring(4, 6);
    const part3 = horseId.substring(6, 8);
    const part4 = horseId.substring(8, 10);
    return path.join(HORSE_DETAIL_ROOT, year, month, part3, part4, "index.html");
}

function isNonEmptyString(value: unknown): boolean {
    return typeof value === "string" && value.trim().length > 0;
}

function isNonNegativeNumber(value: unknown): boolean {
    return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

/**
 * Shutuba から horseId を抽出する
 */
async function collectHorseSourcesFromShutuba(raceIds: string[]): Promise<{ horseSources: HorseSource[]; problems: ProblemEntry[] }> {
    const horseSources: HorseSource[] = [];
    const problems: ProblemEntry[] = [];
    const seen = new Set<string>();

    for (const raceId of raceIds) {
        const shutubaPath = getShutubaPath(raceId);

        if (!await fileExists(shutubaPath)) {
            problems.push({ raceId, horseId: "", reason: "missing_shutuba" });
            continue;
        }

        let raw: string;
        try {
            raw = await fs.readFile(shutubaPath, "utf-8");
        } catch {
            problems.push({ raceId, horseId: "", reason: "missing_shutuba" });
            continue;
        }

        let data: any;
        try {
            data = JSON.parse(raw);
        } catch {
            problems.push({ raceId, horseId: "", reason: "parse_error_shutuba" });
            continue;
        }

        if (!Array.isArray(data?.syutuba) || data.syutuba.length === 0) {
            problems.push({ raceId, horseId: "", reason: "empty_syutuba" });
            continue;
        }

        for (const item of data.syutuba) {
            const horseId = String(item?.horseId ?? "").trim();
            if (!/^\w{10,}$/.test(horseId)) {
                problems.push({ raceId, horseId, reason: "invalid_horseId" });
                continue;
            }

            if (!seen.has(horseId)) {
                seen.add(horseId);
                horseSources.push({ raceId, horseId });
            }
        }
    }

    return { horseSources, problems };
}

/**
 * horseId に対応する HorseDetail ファイルと主要プロパティをチェックする
 */
async function checkHorseDetail(source: HorseSource): Promise<ProblemEntry[]> {
    const { raceId, horseId } = source;
    const filePath = getHorseDetailPath(horseId);

    if (!await fileExists(filePath)) {
        return [{ raceId, horseId, reason: "missing_horse_detail" }];
    }

    let raw: string;
    try {
        raw = await fs.readFile(filePath, "utf-8");
    } catch {
        return [{ raceId, horseId, reason: "missing_horse_detail" }];
    }

    let data: any;
    try {
        data = JSON.parse(raw);
    } catch {
        return [{ raceId, horseId, reason: "parse_error_horse_detail" }];
    }

    const issues: ProblemEntry[] = [];

    if (!data || typeof data !== "object" || typeof data.profile !== "object" || data.profile === null) {
        issues.push({ raceId, horseId, reason: "missing_profile" });
        return issues;
    }

    if (!Array.isArray(data.raceResults)) {
        issues.push({ raceId, horseId, reason: "missing_raceResults" });
    }

    const profile = data.profile;

    if (!isNonEmptyString(profile.name)) issues.push({ raceId, horseId, reason: "invalid_profile_name" });
    if (!isNonEmptyString(profile.status)) issues.push({ raceId, horseId, reason: "invalid_profile_status" });
    if (!isNonNegativeNumber(profile.sex)) issues.push({ raceId, horseId, reason: "invalid_profile_sex" });
    if (!isNonNegativeNumber(profile.age)) issues.push({ raceId, horseId, reason: "invalid_profile_age" });
    if (!isNonNegativeNumber(profile.type)) issues.push({ raceId, horseId, reason: "invalid_profile_type" });
    if (!isNonEmptyString(profile.birthDate)) issues.push({ raceId, horseId, reason: "invalid_profile_birthDate" });
    if (!isNonEmptyString(profile.trainer)) issues.push({ raceId, horseId, reason: "invalid_profile_trainer" });
    if (!isNonEmptyString(profile.trainerId)) issues.push({ raceId, horseId, reason: "invalid_profile_trainerId" });
    if (!isNonEmptyString(profile.kyuusya)) issues.push({ raceId, horseId, reason: "invalid_profile_kyuusya" });
    if (!isNonEmptyString(profile.owner)) issues.push({ raceId, horseId, reason: "invalid_profile_owner" });
    if (!isNonEmptyString(profile.ownerId)) issues.push({ raceId, horseId, reason: "invalid_profile_ownerId" });
    if (!isNonEmptyString(profile.breeder)) issues.push({ raceId, horseId, reason: "invalid_profile_breeder" });
    if (!isNonEmptyString(profile.breederId)) issues.push({ raceId, horseId, reason: "invalid_profile_breederId" });

    return issues;
}

// -----------------------------------------------------------------------

async function main(): Promise<void> {
    await ensureDir(TARGET_DIR);

    const summaryLines: string[] = [];

    for (let year = START_YEAR; year <= END_YEAR; year++) {
        for (let month = 1; month <= 12; month++) {
            const mm = month.toString().padStart(2, "0");
            const ym = `${year}${mm}`;

            const raceIds = await collectRaceIds(year, month);

            const targetPath = path.join(TARGET_DIR, `${ym}.json`);
            await fs.writeFile(targetPath, JSON.stringify(raceIds, null, 2), "utf-8");

            if (raceIds.length === 0) {
                console.log(`[${ym}] RaceList なし（スキップ）`);
                continue;
            }

            console.log(`[${ym}] ${raceIds.length} 件の raceId から horseId を抽出中...`);

            const { horseSources, problems: shutubaProblems } = await collectHorseSourcesFromShutuba(raceIds);
            console.log(`  -> 抽出 horseId 数: ${horseSources.length}`);

            const horseProblems: ProblemEntry[] = [];
            for (const source of horseSources) {
                const issues = await checkHorseDetail(source);
                if (issues.length > 0) {
                    horseProblems.push(...issues);
                }
            }

            const problems = [...shutubaProblems, ...horseProblems];

            if (problems.length > 0) {
                const line = `[${ym}] 問題あり: ${problems.length}件 / horseId=${horseSources.length}件`;
                console.warn(`  ⚠ ${line}`);
                for (const p of problems) {
                    const racePart = p.raceId ? `raceId=${p.raceId}` : "raceId=-";
                    const horsePart = p.horseId ? `horseId=${p.horseId}` : "horseId=-";
                    console.warn(`      ${racePart} ${horsePart} (${p.reason})`);
                }
                summaryLines.push(line);
            } else {
                console.log("  ✓ 問題なし");
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

    await fs.rm(TARGET_DIR, { recursive: true, force: true });
    console.log("temp/work/horseDetail/target を削除しました。");
}

main().catch((err) => {
    console.error("スクリプト実行中にエラーが発生しました:", err);
    process.exit(1);
});
