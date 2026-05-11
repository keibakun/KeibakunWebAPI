import fs from "fs/promises";
import path from "path";
import { Logger } from "../utils/Logger";

const logger = new Logger();

const ROOT = path.join(__dirname, "../../");
const RACE_LIST_ROOT = path.join(ROOT, "RaceList");
const SHUTUBA_ROOT = path.join(ROOT, "Shutuba");
const WORK_POOL_DIR = path.join(ROOT, "temp/work/workPool/horseDetail");
const CHUNK_SIZE = 200;

/**
 * workPool に保存する 1 頭分のエントリ。
 * HorseDetailScraper.getHorseDetail() が必要とするパラメータを保持します。
 *
 * @property horseId - 馬ID（例: "2021107071"）
 * @property raceId  - 対象レースID（12桁, 例: "202401010303"）
 * @property umaban  - 馬番（1始まり文字列, 例: "3"）
 */
export interface HorseEntry {
    horseId: string;
    raceId: string;
    umaban: string;
}

/**
 * 指定パスが存在するかを返します。
 * @param targetPath 判定対象のファイルまたはディレクトリパス
 * @returns 存在する場合は true
 */
async function exists(targetPath: string): Promise<boolean> {
    try {
        await fs.access(targetPath);
        return true;
    } catch {
        return false;
    }
}

/**
 * 数値を2桁ゼロ埋め文字列に変換します。
 * @param value 変換対象の数値
 * @returns 2桁文字列
 */
function pad2(value: number): string {
    return String(value).padStart(2, "0");
}

/**
 * Date を YYYYMMDD 形式の文字列に変換します。
 * @param date 変換対象日時
 * @returns YYYYMMDD 文字列
 */
function formatDateYYYYMMDD(date: Date): string {
    return `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}`;
}

/**
 * 実行日時パラメータを Date に変換します。
 * 許可形式: YYYYMMDDHHmm, YYYYMMDD, Date が解釈可能な文字列。
 * @param input CLI 引数の日時文字列
 * @returns 変換済み Date
 * @throws 日時形式が不正な場合
 */
function parseExecutionDate(input?: string): Date {
    if (!input) {
        return new Date();
    }

    // compact format: YYYYMMDDHHmm
    if (/^\d{12}$/.test(input)) {
        const y = Number(input.slice(0, 4));
        const m = Number(input.slice(4, 6));
        const d = Number(input.slice(6, 8));
        const hh = Number(input.slice(8, 10));
        const mm = Number(input.slice(10, 12));
        const date = new Date(y, m - 1, d, hh, mm, 0, 0);
        if (!Number.isNaN(date.getTime())) {
            return date;
        }
    }

    // compact format: YYYYMMDD
    if (/^\d{8}$/.test(input)) {
        const y = Number(input.slice(0, 4));
        const m = Number(input.slice(4, 6));
        const d = Number(input.slice(6, 8));
        const date = new Date(y, m - 1, d, 0, 0, 0, 0);
        if (!Number.isNaN(date.getTime())) {
            return date;
        }
    }

    const parsed = new Date(input);
    if (Number.isNaN(parsed.getTime())) {
        throw new Error(`実行日時のパラメータ形式が不正です: ${input}`);
    }
    return parsed;
}

/**
 * 基準日時の翌日以降から、次の土日月火に該当する日付 (YYYYMMDD) を返す。
 * @param baseDate 基準日時
 * @returns 土日月火に該当する4日分の YYYYMMDD 配列
 */
function getTargetRaceDates(baseDate: Date): string[] {
    const targetWeekdays = new Set<number>([6, 0, 1, 2]); // 土, 日, 月, 火
    const dates: string[] = [];

    const cursor = new Date(baseDate);
    cursor.setHours(0, 0, 0, 0);

    for (let i = 0; i < 14 && dates.length < 4; i++) {
        cursor.setDate(cursor.getDate() + 1);
        if (targetWeekdays.has(cursor.getDay())) {
            dates.push(formatDateYYYYMMDD(cursor));
        }
    }

    return dates;
}

/**
 * RaceList の index.html 内容から raceId を抽出します。
 * JSON 構造の抽出を優先し、失敗時に正規表現へフォールバックします。
 * @param content RaceList/index.html の内容
 * @returns raceId 配列
 */
function extractRaceIdsFromRaceList(content: string): string[] {
    // 1) JSON として読める場合は構造から抽出
    try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
            const raceIds: string[] = [];
            for (const venue of parsed) {
                if (Array.isArray(venue?.items)) {
                    for (const item of venue.items) {
                        if (item?.raceId) {
                            raceIds.push(String(item.raceId));
                        }
                    }
                }
            }
            return raceIds;
        }
    } catch {
        // フォールバックへ
    }

    // 2) 文字列から正規表現で抽出
    const matched = content.match(/"raceId"\s*:\s*"(\d{12})"/g) || [];
    return matched
        .map((m) => m.match(/"raceId"\s*:\s*"(\d{12})"/)?.[1] || "")
        .filter((id) => id !== "");
}

    /**
     * raceId から Shutuba/index.html のパスを生成します。
     * @param raceId 12桁の raceId
     * @returns Shutuba の index.html パス
     * @throws raceId 形式が不正な場合
     */
function raceIdToShutubaPath(raceId: string): string {
    if (!/^\d{12}$/.test(raceId)) {
        throw new Error(`raceId が12桁ではありません: ${raceId}`);
    }
    const year = raceId.substring(0, 4);
    const month = raceId.substring(4, 6);
    const day = raceId.substring(6, 8);
    const raceNo = raceId.substring(8, 12);
    const dirName = `${day}${raceNo}`;
    return path.join(SHUTUBA_ROOT, year, month, dirName, "index.html");
}

/**
 * Shutuba の内容から HorseEntry（horseId / raceId / umaban）を抽出します。
 * JSON 抽出を優先し、失敗時に文字列パターン抽出へフォールバックします。
 * @param content Shutuba/index.html の内容
 * @param raceId この Shutuba に対応するレースID
 * @returns HorseEntry 配列
 */
function extractHorseEntriesFromShutuba(content: string, raceId: string): HorseEntry[] {
    const entries = new Map<string, HorseEntry>(); // horseId をキーとして重複排除

    // 1) JSON として syutuba 配列から抽出
    try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed?.syutuba)) {
            for (const item of parsed.syutuba) {
                const horseId = item?.horseId ?? item?.horseid;
                const umaban = String(item?.umaban ?? '');
                if (horseId && !entries.has(String(horseId))) {
                    entries.set(String(horseId), { horseId: String(horseId), raceId, umaban });
                }
            }
        }
    } catch {
        // フォールバックへ
    }

    // 2) フォールバック: horseId キー形式（umaban は不明なため空文字）
    let match: RegExpExecArray | null;
    const kvRe = /"horseId"\s*:\s*"(\d+)"/g;
    while ((match = kvRe.exec(content)) !== null) {
        if (!entries.has(match[1])) {
            entries.set(match[1], { horseId: match[1], raceId, umaban: '' });
        }
    }

    // 3) フォールバック: /horse/{id}/ パス形式（umaban は不明なため空文字）
    const pathRe = /\/horse\/(\d+)\/?/g;
    while ((match = pathRe.exec(content)) !== null) {
        if (!entries.has(match[1])) {
            entries.set(match[1], { horseId: match[1], raceId, umaban: '' });
        }
    }

    return Array.from(entries.values());
}

/**
 * 既存の workPool*.json ファイルを削除します。
 * @param dirPath workPool ディレクトリ
 */
async function clearWorkPoolFiles(dirPath: string): Promise<void> {
    if (!await exists(dirPath)) {
        return;
    }

    const entries = await fs.readdir(dirPath);
    for (const name of entries) {
        if (/^workPool\d+\.json$/i.test(name)) {
            const full = path.join(dirPath, name);
            await fs.rm(full, { force: true });
        }
    }
}

/**
 * HorseEntry 配列を200件ごとに分割して workPool ファイルへ保存します。
 * エントリが0件でも workPool0.json を1件作成します。
 * 保存形式: `{ "horses": HorseEntry[] }`
 * @param entries 保存対象の HorseEntry 配列
 */
async function saveHorseEntriesAsWorkPoolFiles(entries: HorseEntry[]): Promise<void> {
    await fs.mkdir(WORK_POOL_DIR, { recursive: true });
    await clearWorkPoolFiles(WORK_POOL_DIR);

    // horseId で重複除去し、horseId 昇順でソートして安定した出力順を保証する
    const seen = new Set<string>();
    const normalized: HorseEntry[] = [];
    for (const e of entries) {
        const id = String(e.horseId).trim();
        if (!id || seen.has(id)) continue;
        seen.add(id);
        normalized.push({ horseId: id, raceId: String(e.raceId).trim(), umaban: String(e.umaban).trim() });
    }
    normalized.sort((a, b) => a.horseId.localeCompare(b.horseId));

    const fileCount = Math.max(1, Math.ceil(normalized.length / CHUNK_SIZE));

    for (let i = 0; i < fileCount; i++) {
        const chunk = normalized.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        const outPath = path.join(WORK_POOL_DIR, `workPool${i}.json`);
        const payload = { horses: chunk };
        await fs.writeFile(outPath, JSON.stringify(payload, null, 4), "utf-8");
        logger.info(`保存完了: ${outPath} (${chunk.length}件)`);
    }
}

/**
 * メイン処理。
 * 基準日時から対象開催日を算出し、RaceList -> Shutuba の順で HorseEntry（horseId / raceId / umaban）を抽出して
 * workPool ファイルへ保存します。
 */
async function main(): Promise<void> {
    const args = process.argv.slice(2);
    const baseDate = parseExecutionDate(args[0]);
    logger.info(`基準実行日時: ${baseDate.toISOString()}`);

    const targetDates = getTargetRaceDates(baseDate);
    logger.info(`対象開催日: ${targetDates.join(", ")}`);

    const raceIdSet = new Set<string>();

    // 対象開催日の RaceList から raceId を収集
    for (const yyyymmdd of targetDates) {
        const raceListPath = path.join(RACE_LIST_ROOT, yyyymmdd, "index.html");
        if (!await exists(raceListPath)) {
            logger.warn(`RaceList が見つかりません: ${raceListPath}`);
            continue;
        }

        const raceListContent = await fs.readFile(raceListPath, "utf-8");
        const raceIds = extractRaceIdsFromRaceList(raceListContent);
        logger.info(`RaceList ${yyyymmdd}: raceId ${raceIds.length}件`);

        raceIds.forEach((id) => raceIdSet.add(id));
    }

    const raceIds = Array.from(raceIdSet).sort((a, b) => a.localeCompare(b));
    logger.info(`抽出 raceId 合計: ${raceIds.length}件`);

    const allEntries: HorseEntry[] = [];

    // raceId に対応する Shutuba から HorseEntry を収集
    for (const raceId of raceIds) {
        let shutubaPath = "";
        try {
            shutubaPath = raceIdToShutubaPath(raceId);
        } catch (e: any) {
            logger.warn(String(e));
            continue;
        }

        if (!await exists(shutubaPath)) {
            logger.warn(`Shutuba が見つかりません: ${shutubaPath}`);
            continue;
        }

        const shutubaContent = await fs.readFile(shutubaPath, "utf-8");
        const entries = extractHorseEntriesFromShutuba(shutubaContent, raceId);
        allEntries.push(...entries);
    }

    logger.info(`抽出 HorseEntry 合計: ${allEntries.length}件`);

    await saveHorseEntriesAsWorkPoolFiles(allEntries);
}

main().catch((e: any) => {
    logger.error(`main_extractHorseId 異常終了: ${String(e)}`);
    process.exit(1);
});
