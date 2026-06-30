/**
 * main_horseDetail_modalOnly.ts
 *
 * モーダルコメント補完のみを単独で実行するエントリポイント。
 *
 * 処理の流れ:
 *   1. RaceSchedule → RaceList → Shutuba から horseEntry を収集して workPool を生成
 *   2. Main_HorseDetail_Modal を実行（HorseDetail ファイルが存在しない馬はスキップ）
 *   3. workPool を削除
 *
 * 使い方:
 *   npx tsx src/NKScraper/main_horseDetail_modalOnly.ts YYYY MM [DD]
 *   例) npx tsx src/NKScraper/main_horseDetail_modalOnly.ts 2026 7
 *   例) npx tsx src/NKScraper/main_horseDetail_modalOnly.ts 2026 7 5
 */

import fs from "fs/promises";
import path from "path";
import { Logger } from "../utils/Logger";
import { FileUtil } from "../utils/FileUtil";
import {
    WORK_POOL_DIR,
    getOldestWorkPoolFile,
} from "./main_horseDetail_db";
import { Main_HorseDetail_Modal } from "./main_horseDetail_modal";

const logger = new Logger();

/** workPool の1エントリ */
interface HorseEntry {
    raceId: string;
    horseId: string;
    umaban: string;
}

// =============================================================================
// コーディネーター
// =============================================================================

export class Main_HorseDetail_ModalOnly {
    private year: number;
    private monthArg: number;
    private dayArg?: number;

    /**
     * @param year 対象年
     * @param monthArg 対象月（1-12）
     * @param dayArg 対象日（1-31）。省略時は月全体を対象にする
     */
    constructor(year: number, monthArg: number, dayArg?: number) {
        this.year = year;
        this.monthArg = monthArg;
        this.dayArg = dayArg;
    }

    async run(): Promise<void> {
        if (isNaN(this.monthArg) || this.monthArg < 1 || this.monthArg > 12) {
            logger.error("月の指定が無効です。1～12の範囲で指定してください。");
            return;
        }
        if (this.dayArg !== undefined && (isNaN(this.dayArg) || this.dayArg < 1 || this.dayArg > 31)) {
            logger.error("日の指定が無効です。1～31の範囲で指定してください。");
            return;
        }

        const formattedMonth = this.monthArg.toString().padStart(2, "0");
        const formattedDay   = this.dayArg !== undefined ? this.dayArg.toString().padStart(2, "0") : undefined;
        const logSuffix = formattedDay ? ` day=${formattedDay}` : "";
        logger.info(`モーダルのみモードで起動しました: year=${this.year} month=${formattedMonth}${logSuffix}`);

        const horseEntries = await this.collectHorseEntries(formattedMonth, formattedDay);
        if (horseEntries.length === 0) {
            logger.warn("処理対象の horseEntry が見つかりませんでした。");
            return;
        }

        await this.writeWorkPool(horseEntries);

        logger.info("モーダルコメント補完を開始します。");
        await new Main_HorseDetail_Modal().run();
        logger.info("モーダルコメント補完が完了しました。");

        await this.deleteOldestWorkPool();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // private
    // ─────────────────────────────────────────────────────────────────────────

    private async deleteOldestWorkPool(): Promise<void> {
        const fileName = await getOldestWorkPoolFile(WORK_POOL_DIR);
        if (!fileName) {
            logger.info("削除対象の workPool ファイルが存在しません。");
            return;
        }
        const filePath = path.join(WORK_POOL_DIR, fileName);
        await fs.rm(filePath, { force: true });
        logger.info(`workPool を削除しました: ${fileName}`);
    }

    private async writeWorkPool(entries: HorseEntry[]): Promise<void> {
        await fs.mkdir(WORK_POOL_DIR, { recursive: true });
        const existing = await fs.readdir(WORK_POOL_DIR).catch(() => [] as string[]);
        for (const name of existing) {
            if (/^workPool\d*\.json$/i.test(name)) {
                await fs.rm(path.join(WORK_POOL_DIR, name), { force: true });
            }
        }
        await fs.writeFile(
            path.join(WORK_POOL_DIR, "workPool0.json"),
            JSON.stringify({ horses: entries }, null, 4),
            "utf-8",
        );
        logger.info(`workPool0.json を作成しました: ${entries.length} 件`);
    }

    private async collectHorseEntries(formattedMonth: string, formattedDay?: string): Promise<HorseEntry[]> {
        const ROOT = path.join(__dirname, "../../");
        const schedulePath = path.join(ROOT, `RaceSchedule/${this.year}${formattedMonth}/index.html`);
        if (!await FileUtil.exists(schedulePath)) {
            logger.warn(`RaceSchedule の index.html が存在しません: ${schedulePath}`);
            return [];
        }

        const scheduleContent = await fs.readFile(schedulePath, "utf-8");
        let kaisaiDates = this.extractKaisaiDates(scheduleContent, schedulePath);
        if (kaisaiDates.length === 0) {
            logger.warn(`開催日が見つかりませんでした: ${schedulePath}`);
            return [];
        }

        if (formattedDay) {
            const targetDate = `${this.year}${formattedMonth}${formattedDay}`;
            kaisaiDates = kaisaiDates.filter((d) => d === targetDate);
            if (kaisaiDates.length === 0) {
                logger.warn(`指定された日付 ${targetDate} は開催日に含まれていません。`);
                return [];
            }
        }

        logger.info(`見つかった開催日の数: ${kaisaiDates.length}`);

        const raceIds: string[] = [];
        for (const kaisaiDate of kaisaiDates) {
            const raceListPath = path.join(ROOT, `RaceList/${kaisaiDate}/index.html`);
            if (!await FileUtil.exists(raceListPath)) {
                logger.warn(`RaceList の index.html が存在しません: ${raceListPath}`);
                continue;
            }
            const content = await fs.readFile(raceListPath, "utf-8");
            const matches = content.match(/"raceId":\s*"([^"]+)"/g) ?? [];
            for (const m of matches) {
                const id = m.match(/"raceId":\s*"([^"]+)"/)?.[1];
                if (id) raceIds.push(id);
            }
        }

        if (raceIds.length === 0) {
            logger.warn("raceId が見つかりませんでした。");
            return [];
        }
        logger.info(`見つかった raceId の数: ${raceIds.length}`);

        const uniqueRaceIds = [...new Set(raceIds)];
        const horseEntries: HorseEntry[] = [];
        const seenHorseIds = new Set<string>();

        for (const raceId of uniqueRaceIds) {
            try {
                const shutubaPath = this.getShutubaPath(raceId);
                if (!await FileUtil.exists(shutubaPath)) {
                    logger.warn(`Shutuba ファイルが存在しません: ${shutubaPath}`);
                    continue;
                }
                const content = await fs.readFile(shutubaPath, "utf8");
                const entries = this.extractHorseEntriesFromShutuba(content, raceId);
                for (const e of entries) {
                    if (!seenHorseIds.has(e.horseId)) {
                        seenHorseIds.add(e.horseId);
                        horseEntries.push(e);
                    }
                }
                logger.info(`raceId: ${raceId} から ${entries.length} 件の馬エントリを抽出`);
            } catch (e) {
                logger.warn(`Shutuba 読み取りエラー raceId=${raceId}: ${String(e)}`);
            }
        }

        horseEntries.sort((a, b) => a.horseId.localeCompare(b.horseId));
        logger.info(`抽出した horseId 件数: ${horseEntries.length}`);
        return horseEntries;
    }

    private extractKaisaiDates(htmlContent: string, indexPath: string): string[] {
        const matches = htmlContent.match(/"kaisaiDate":\s*"(\d{8})"/g);
        if (!matches) {
            logger.warn(`kaisaiDate が見つかりません: ${indexPath}`);
            return [];
        }
        return matches.map((m) => m.match(/"kaisaiDate":\s*"(\d{8})"/)?.[1] ?? "").filter((d) => d !== "");
    }

    private extractHorseEntriesFromShutuba(content: string, raceId: string): HorseEntry[] {
        const entries: HorseEntry[] = [];
        const seen = new Set<string>();

        try {
            const obj = JSON.parse(content);
            if (obj && Array.isArray(obj.syutuba)) {
                for (const item of obj.syutuba) {
                    const horseId = String(item?.horseId ?? item?.horseid ?? "").trim();
                    const umaban  = String(item?.umaban  ?? "").trim();
                    if (horseId && !seen.has(horseId)) {
                        seen.add(horseId);
                        entries.push({ raceId, horseId, umaban });
                    }
                }
                return entries;
            }
        } catch {
            // フォールバックへ
        }

        let m: RegExpExecArray | null;
        const kvRe = /"horseId"\s*:\s*"(\d+)"/g;
        while ((m = kvRe.exec(content)) !== null) {
            const horseId = m[1];
            if (!seen.has(horseId)) {
                seen.add(horseId);
                entries.push({ raceId, horseId, umaban: "" });
            }
        }
        return entries;
    }

    private getShutubaPath(raceId: string): string {
        if (raceId.length !== 12) throw new Error(`Invalid raceId format: ${raceId}`);
        const year   = raceId.substring(0, 4);
        const month  = raceId.substring(4, 6);
        const day    = raceId.substring(6, 8);
        const raceNo = raceId.substring(8, 12);
        return path.join(__dirname, `../../Shutuba/${year}/${month}/${day}${raceNo}/index.html`);
    }
}

// =============================================================================
// CLI 実行
// =============================================================================

if (require.main === module) {
    const args = process.argv.slice(2);
    const year     = parseInt(args[0], 10) || new Date().getFullYear();
    const monthArg = parseInt(args[1], 10);
    const dayArg   = args[2] ? parseInt(args[2], 10) : undefined;

    new Main_HorseDetail_ModalOnly(year, monthArg, dayArg).run().catch((err) => {
        logger.error(`main_horseDetail_modalOnly の実行で異常終了: ${String(err)}`);
        process.exit(1);
    });
}
