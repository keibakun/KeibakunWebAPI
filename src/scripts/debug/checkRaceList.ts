/**
 * RaceList の空配列チェックスクリプト
 *
 * 処理概要:
 * 1. 2010〜2026年の各 RaceList/{YYYYMMDD}/index.html を走査
 * 2. 以下の問題を検出してコンソールに出力する
 *    - JSONパース失敗
 *    - トップレベルが空配列
 *    - 各会場の items が空配列または存在しない
 *    - items 内のレースに raceId が存在しない
 */

import path from "path";
import fs from "fs/promises";

const RACE_LIST_ROOT = path.join(__dirname, "../../RaceList");

const START_YEAR = 2010;
const END_YEAR   = 2026;

// -----------------------------------------------------------------------

async function fileExists(filePath: string): Promise<boolean> {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

type IssueKind =
    | "parse_error"        // JSONパース失敗
    | "empty_root"         // トップレベルが空配列
    | "missing_items"      // venue.items が存在しない
    | "empty_items"        // venue.items が空配列
    | "missing_raceId";    // items 内に raceId がないレース

interface Issue {
    file: string;
    kind: IssueKind;
    detail?: string;
}

async function checkRaceListFile(kaisaiDate: string): Promise<Issue[]> {
    const filePath = path.join(RACE_LIST_ROOT, kaisaiDate, "index.html");
    const issues: Issue[] = [];

    let raw: string;
    try {
        raw = await fs.readFile(filePath, "utf-8");
    } catch {
        return issues; // 読み取れない場合はスキップ
    }

    let data: unknown;
    try {
        data = JSON.parse(raw);
    } catch {
        issues.push({ file: filePath, kind: "parse_error" });
        return issues;
    }

    if (!Array.isArray(data)) {
        issues.push({ file: filePath, kind: "parse_error", detail: "トップレベルが配列ではない" });
        return issues;
    }

    if (data.length === 0) {
        issues.push({ file: filePath, kind: "empty_root" });
        return issues;
    }

    for (let vi = 0; vi < data.length; vi++) {
        const venue = data[vi] as Record<string, unknown>;
        if (!Object.prototype.hasOwnProperty.call(venue, "items")) {
            issues.push({ file: filePath, kind: "missing_items", detail: `venue[${vi}]` });
            continue;
        }

        const items = venue.items;
        if (!Array.isArray(items)) {
            issues.push({ file: filePath, kind: "missing_items", detail: `venue[${vi}].items が配列でない` });
            continue;
        }

        if (items.length === 0) {
            issues.push({ file: filePath, kind: "empty_items", detail: `venue[${vi}]` });
            continue;
        }

        for (let ri = 0; ri < items.length; ri++) {
            const race = items[ri] as Record<string, unknown>;
            if (!race?.raceId) {
                issues.push({
                    file: filePath,
                    kind: "missing_raceId",
                    detail: `venue[${vi}].items[${ri}] raceName=${String(race?.raceName ?? "")}`,
                });
            }
        }
    }

    return issues;
}

async function main(): Promise<void> {
    let entries: string[];
    try {
        entries = await fs.readdir(RACE_LIST_ROOT);
    } catch {
        console.error(`RaceList ディレクトリが読み取れません: ${RACE_LIST_ROOT}`);
        process.exit(1);
    }

    // YYYYMMDD 形式かつ対象年範囲のディレクトリのみ対象
    const targets = entries
        .filter((e) => /^\d{8}$/.test(e))
        .filter((e) => {
            const y = parseInt(e.substring(0, 4), 10);
            return y >= START_YEAR && y <= END_YEAR;
        })
        .sort();

    console.log(`対象ディレクトリ数: ${targets.length}`);

    const allIssues: Issue[] = [];

    for (const kaisaiDate of targets) {
        const issues = await checkRaceListFile(kaisaiDate);
        if (issues.length > 0) {
            allIssues.push(...issues);
        }
    }

    if (allIssues.length === 0) {
        console.log("問題のあるファイルは見つかりませんでした。");
        return;
    }

    console.log(`\n問題件数: ${allIssues.length}`);
    console.log("─".repeat(80));

    // 種別ごとに集計して表示
    const byKind = new Map<IssueKind, Issue[]>();
    for (const issue of allIssues) {
        const list = byKind.get(issue.kind) ?? [];
        list.push(issue);
        byKind.set(issue.kind, list);
    }

    for (const [kind, issues] of byKind) {
        console.log(`\n[${kind}] ${issues.length} 件`);
        for (const issue of issues) {
            const detail = issue.detail ? ` (${issue.detail})` : "";
            console.log(`  ${issue.file}${detail}`);
        }
    }
}

main();
