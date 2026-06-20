/**
 * main_horseDetail.ts
 *
 * DB（成績）・モーダル（コメント）・血統 の各 main を順に呼び出して
 * 競走馬詳細データを取得するコーディネーター。
 *
 * Actions workflow (production_horseDetail.yaml) と同じ順序で処理する:
 *   Step② main_horseDetail_db      – db.netkeiba からプロフィール＋成績取得
 *   Step③ main_horseDetail_modal   – SP モーダルからコメント補完
 *   Step④ main_horseDetail_pedigree – 5代血統表取得
 *   Step⑤ workPool 削除
 */
import fs from "fs/promises";
import path from "path";
import { Logger } from "../utils/Logger";
import { FileUtil } from "../utils/FileUtil";
import {
    WORK_POOL_DIR,
    getOldestWorkPoolFile,
    Main_HorseDetail_Db,
} from "./main_horseDetail_db";
import { Main_HorseDetail_Modal } from "./main_horseDetail_modal";
import { Main_HorseDetail_Pedigree } from "./main_horseDetail_pedigree";

const logger = new Logger();

/** 1件の馬エントリ */
interface HorseEntry {
    raceId: string;
    horseId: string;
    umaban: string;
}

// =============================================================================
// コーディネーター
// =============================================================================

/**
 * Main_HorseDetail
 *
 * `RaceSchedule/{year}{month}/index.html` から開催日を取得し、
 * `RaceList/{kaisaiDate}/index.html` から raceId を取得、
 * `Shutuba/{raceId}/index.html` から horseId を抽出して workPool を生成後、
 * main_horseDetail_db → main_horseDetail_modal → main_horseDetail_pedigree
 * の順に呼び出して HorseDetail を保存するコーディネータークラスです。
 */
export class Main_HorseDetail {
    private year: number;
    private monthArg?: number;
    private dayArg?: number;
    private production: boolean;
    private localScheduled: boolean;

    /**
     * コンストラクタ
     * @param year 対象年
     * @param monthArg 対象月（1-12）
     * @param dayArg 対象日（1-31）。省略時は月全体を対象にする
     * @param production 本番実行フラグ（true の場合は workPool から horseId を取得）
     * @param localScheduled ローカル定期実行フラグ（true の場合は workPool を2回処理する）
     */
    constructor(year: number, monthArg?: number, dayArg?: number, production?: boolean, localScheduled?: boolean) {
        this.year = year;
        this.monthArg = monthArg;
        this.dayArg = dayArg;
        this.production = production ?? false;
        this.localScheduled = localScheduled ?? false;
    }

    /**
     * エントリポイント
     */
    async run(): Promise<void> {
        if (this.localScheduled) {
            await this.runLocalScheduledMode();
            return;
        }

        if (this.production) {
            await this.runProductionMode();
            return;
        }

        // month 引数のバリデーション
        if (!this.monthArg || isNaN(this.monthArg) || this.monthArg < 1 || this.monthArg > 12) {
            logger.error("月の指定が無効です。1～12の範囲で指定してください。");
            return;
        }

        // day 引数のバリデーション（省略可）
        if (this.dayArg !== undefined && (isNaN(this.dayArg) || this.dayArg < 1 || this.dayArg > 31)) {
            logger.error("日の指定が無効です。1～31の範囲で指定してください。");
            return;
        }

        await this.runManualMode();
    }

    /**
     * 単体モード: horseId と raceId を直接指定して1件だけ取得します。
     * umaban は Shutuba ファイルがあれば自動取得し、なければ空文字でフォールバックします。
     */
    async runSingle(horseId: string, raceId: string): Promise<void> {
        logger.info(`単体モードで起動しました: horseId=${horseId} raceId=${raceId}`);

        let umaban = "";
        try {
            const shutubaPath = this.getShutubaPath(raceId);
            if (await FileUtil.exists(shutubaPath)) {
                const content = await fs.readFile(shutubaPath, "utf8");
                const entries = this.extractHorseEntriesFromShutuba(content, raceId);
                const matched = entries.find((e) => e.horseId === horseId);
                if (matched) {
                    umaban = matched.umaban;
                    logger.info(`Shutuba から umaban を取得しました: umaban=${umaban}`);
                }
            }
        } catch (e) {
            logger.warn(`umaban の取得に失敗しました（空文字でフォールバック）: ${String(e)}`);
        }

        await this.writeWorkPool([{ raceId, horseId, umaban }]);
        await this.runSteps();
        await this.deleteOldestWorkPool();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // private
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * ローカル定期実行モード: 既存 workPool を2回処理する。
     * Actions と異なりローカルで定期実行する用途向け。
     */
    private async runLocalScheduledMode(): Promise<void> {
        logger.info("ローカル定期実行モードで起動しました。（2回実行）");
        for (let i = 1; i <= 2; i++) {
            const poolFile = await getOldestWorkPoolFile(WORK_POOL_DIR);
            if (!poolFile) {
                logger.info(`Round ${i}: 処理対象の workPool ファイルが存在しません。終了します。`);
                break;
            }
            logger.info(`Round ${i}/2 を開始します: ${poolFile}`);
            await this.runSteps();
            await this.deleteOldestWorkPool();
            logger.info(`Round ${i}/2 が完了しました。`);
        }
        logger.info("ローカル定期実行モードが完了しました。");
    }

    /**
     * 本番モード: 既存 workPool を消化して DB → モーダル → 血統 の順に取得する。
     */
    private async runProductionMode(): Promise<void> {
        logger.info("本番モードで起動しました。");
        await this.runSteps();
        await this.deleteOldestWorkPool();
    }

    /**
     * 手動モード: RaceSchedule → RaceList → Shutuba から horseId を収集して
     * workPool を生成し、DB → モーダル → 血統 の順に取得する。
     */
    private async runManualMode(): Promise<void> {
        const formattedMonth = this.monthArg!.toString().padStart(2, "0");
        const formattedDay = this.dayArg !== undefined ? this.dayArg.toString().padStart(2, "0") : undefined;
        const logSuffix = formattedDay ? ` day=${formattedDay}` : "";
        logger.info(`手動モードで起動しました: year=${this.year} month=${formattedMonth}${logSuffix}`);

        const horseEntries = await this.collectHorseEntries(formattedMonth, formattedDay);
        if (horseEntries.length === 0) {
            logger.warn("処理対象の horseEntry が見つかりませんでした。");
            return;
        }

        await this.writeWorkPool(horseEntries);
        await this.runSteps();
        await this.deleteOldestWorkPool();
    }

    /**
     * DB → モーダル → 血統 の各 main を順に呼び出す。
     * Actions の fetch_db → fetch_modal → fetch_pedigree と同じ順序。
     */
    private async runSteps(): Promise<void> {
        logger.info("Step②: DB取得を開始します。");
        await new Main_HorseDetail_Db().run();
        logger.info("Step②: DB取得が完了しました。");

        logger.info("Step③: モーダルコメント補完を開始します。");
        await new Main_HorseDetail_Modal().run();
        logger.info("Step③: モーダルコメント補完が完了しました。");

        logger.info("Step④: 血統取得を開始します。");
        await new Main_HorseDetail_Pedigree().run();
        logger.info("Step④: 血統取得が完了しました。");
    }

    /**
     * 最古の workPool ファイルを削除する（Step⑤相当）。
     */
    private async deleteOldestWorkPool(): Promise<void> {
        const fileName = await getOldestWorkPoolFile(WORK_POOL_DIR);
        if (!fileName) {
            logger.info("削除対象の workPool ファイルが存在しません。");
            return;
        }
        const filePath = path.join(WORK_POOL_DIR, fileName);
        await fs.rm(filePath, { force: true });
        logger.info(`Step⑤: workPool を削除しました: ${fileName}`);
    }

    /**
     * horseEntry 一覧を workPool0.json に書き出す。
     * 既存の workPool*.json はすべて削除してから書き出す。
     */
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

    /**
     * RaceSchedule → RaceList → Shutuba の順に horseEntry を収集する。
     */
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

        // 日付指定がある場合はその開催日のみに絞り込む
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

const args = process.argv.slice(2);
const isBooleanLiteral = (value?: string): boolean => {
    if (typeof value === "undefined") return false;
    return /^(true|false)$/i.test(String(value));
};

// --horseId=XXX --raceId=YYY の名前付き引数を解析
const namedArgs: Record<string, string> = {};
const positionalArgs: string[] = [];
for (const arg of args) {
    const m = arg.match(/^--([\w]+)=(.+)$/);
    if (m) {
        namedArgs[m[1]] = m[2];
    } else {
        positionalArgs.push(arg);
    }
}

if (namedArgs["horseId"] && namedArgs["raceId"]) {
    // 単体モード: --horseId=XXX --raceId=YYY
    const main = new Main_HorseDetail(new Date().getFullYear());
    main.runSingle(namedArgs["horseId"], namedArgs["raceId"]).catch((err) => {
        logger.error(`main_horseDetail の実行で異常終了: ${String(err)}`);
        process.exit(1);
    });
} else {
    let year = new Date().getFullYear();
    let monthArg: number | undefined;
    let dayArg: number | undefined;
    let productionArg = false;
    // --local フラグ: ローカル定期実行モード
    const localScheduledArg = "local" in namedArgs
        ? String(namedArgs["local"]).toLowerCase() !== "false"
        : false;

    // production=true の場合は YYYY / MM なしで実行できるようにする
    if (isBooleanLiteral(positionalArgs[0])) {
        productionArg = String(positionalArgs[0]).toLowerCase() === "true";
    } else {
        year = parseInt(positionalArgs[0], 10) || new Date().getFullYear();
        monthArg = positionalArgs[1] ? parseInt(positionalArgs[1], 10) : undefined;
        // positionalArgs[2] が数値なら日、ブール値なら production フラグ
        if (positionalArgs[2] && !isBooleanLiteral(positionalArgs[2])) {
            const parsed = parseInt(positionalArgs[2], 10);
            if (!isNaN(parsed) && parsed >= 1 && parsed <= 31) {
                dayArg = parsed;
            }
        }
        const productionIdx = dayArg !== undefined ? 3 : 2;
        if (isBooleanLiteral(positionalArgs[productionIdx])) {
            productionArg = String(positionalArgs[productionIdx]).toLowerCase() === "true";
        }
    }

    const main = new Main_HorseDetail(year, monthArg, dayArg, productionArg, localScheduledArg);
    main.run().catch((err) => {
        logger.error(`main_horseDetail の実行で異常終了: ${String(err)}`);
        process.exit(1);
    });
}

