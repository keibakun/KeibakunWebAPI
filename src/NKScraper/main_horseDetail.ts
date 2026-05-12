import { PuppeteerManager } from "../utils/PuppeteerManager";
import { HorseDetailScraper } from "./horseDetail/horseDetail";
import fs from "fs/promises";
import path from "path";
import { Logger } from "../utils/Logger";
import { FileUtil } from "../utils/FileUtil";
import { JsonFileWriterUtil } from "../utils/JsonFileWriterUtil";

const logger = new Logger();
const jsonWriter = new JsonFileWriterUtil(logger);
const DEFAULT_CONCURRENCY = 3;

/** 1件の馬エントリ */
interface HorseEntry {
    raceId: string;
    horseId: string;
    umaban: string;
}

/**
 * Main_HorseDetail
 *
 * `RaceSchedule/{year}{month}/index.html` から開催日を取得し、
 * `RaceList/{kaisaiDate}/index.html` から raceId を取得、
 * `Shutuba/{raceId}/index.html` から horseId を抽出、
 * `HorseDetail` に各馬の詳細を保存する処理を行うクラスです。
 */
export class Main_HorseDetail {
    private year: number;
    private monthArg?: number;
    private production: boolean;

    /**
     * コンストラクタ
     * @param year 対象年
     * @param monthArg 対象月（1-12）
     * @param production 本番実行フラグ（true の場合は workPool から horseId を取得）
     */
    constructor(year: number, monthArg?: number, production?: boolean) {
        this.year = year;
        this.monthArg = monthArg;
        this.production = production ?? false;
    }

    /**
     * エントリポイント: Puppeteer を初期化して horse detail を収集します。
     */
    async run(): Promise<void> {
        if (this.production) {
            await this.runProductionMode();
            return;
        }

        // month 引数のバリデーション
        if (!this.monthArg || isNaN(this.monthArg) || this.monthArg < 1 || this.monthArg > 12) {
            logger.error("月の指定が無効です。1～12の範囲で指定してください。");
            return;
        }

        const formattedMonth = this.monthArg.toString().padStart(2, "0");
        logger.info(`指定された年: ${this.year}, 月: ${formattedMonth}`);

        const outDir = path.join(process.cwd(), "HorseDetail");

        // Puppeteer 初期化
        const pm = new PuppeteerManager();
        await pm.init();

        try {
            // RaceSchedule の index.html を読み、kaisaiDate を抽出
            const schedulePath = path.join(__dirname, `../../RaceSchedule/${this.year}${formattedMonth}/index.html`);
            if (! await FileUtil.exists(schedulePath)) {
                logger.warn(`RaceSchedule の index.html が存在しません: ${schedulePath}`);
                return;
            }

            const scheduleContent = await fs.readFile(schedulePath, "utf-8");
            const kaisaiDates = this.extractKaisaiDates(scheduleContent, schedulePath);
            if (kaisaiDates.length === 0) {
                logger.warn(`指定された年 (${this.year}) の月 (${formattedMonth}) の開催日が見つかりませんでした。`);
                return;
            }

            logger.info(`見つかった開催日の数: ${kaisaiDates.length}`);

            // RaceList から raceId を収集
            const raceIds: string[] = [];
            for (const kaisaiDate of kaisaiDates) {
                const raceListPath = path.join(__dirname, `../../RaceList/${kaisaiDate}/index.html`);
                if (! await FileUtil.exists(raceListPath)) {
                    logger.warn(`RaceList の index.html が存在しません: ${raceListPath}`);
                    continue;
                }
                const raceListContent = await fs.readFile(raceListPath, "utf-8");
                const matches = raceListContent.match(/"raceId":\s*"([^"]+)"/g) || [];
                const extracted = matches.map((m) => m.match(/"raceId":\s*"([^"]+)"/)?.[1] || "").filter((s) => s !== "");
                raceIds.push(...extracted);
            }

            if (raceIds.length === 0) {
                logger.warn("raceId が見つかりませんでした。");
                return;
            }

            logger.info(`見つかった raceId の数: ${raceIds.length}`);

            const uniqueRaceIds = [...new Set(raceIds)];

            // Shutuba ファイルから horseEntry を抽出
            const horseEntries: HorseEntry[] = [];
            const seenHorseIds = new Set<string>();
            for (const raceId of uniqueRaceIds) {
                try {
                    const shutubaPath = this.getShutubaPath(raceId);
                    if (! await FileUtil.exists(shutubaPath)) {
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
                } catch (e: any) {
                    logger.warn(`raceId: ${raceId} のShutubaファイルが存在しないかraceId形式が不正です: ${String(e)}`);
                }
            }

            horseEntries.sort((a, b) => a.horseId.localeCompare(b.horseId));
            logger.info(`抽出した horseId 件数: ${horseEntries.length}`);

            await this.scrapeAndSaveHorseDetails(horseEntries, pm, outDir, false);
        } catch (e: any) {
            logger.error(`処理中にエラー: ${String(e)}`);
        } finally {
            await pm.close();
        }
    }

    /**
     * 単体モード: horseId と raceId を直接指定して1件だけ取得・保存します。
     * umaban は Shutuba ファイルがあれば自動取得し、なければ空文字でフォールバックします。
     */
    async runSingle(horseId: string, raceId: string): Promise<void> {
        logger.info(`単体モードで起動しました: horseId=${horseId} raceId=${raceId}`);

        // umaban を Shutuba から取得（任意）
        let umaban = '';
        try {
            const shutubaPath = this.getShutubaPath(raceId);
            if (await FileUtil.exists(shutubaPath)) {
                const content = await fs.readFile(shutubaPath, 'utf8');
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

        const outDir = path.join(process.cwd(), 'HorseDetail');
        const pm = new PuppeteerManager();
        await pm.init();

        try {
            await this.scrapeAndSaveHorseDetails(
                [{ raceId, horseId, umaban }],
                pm,
                outDir,
                true
            );
        } finally {
            await pm.close();
        }
    }

    /**
     * 本番モード: workPool の先頭ファイルを1件消化して horse detail を収集します。
     */
    private async runProductionMode(): Promise<void> {
        const workPoolDir = path.join(__dirname, "../../temp/work/workPool/horseDetail");
        logger.info(`本番モードで起動しました: ${workPoolDir}`);

        const targetFileName = await this.getOldestWorkPoolFileName(workPoolDir);
        if (!targetFileName) {
            logger.info("workPool に処理対象ファイルがありません。正常終了します。");
            return;
        }

        const targetFilePath = path.join(workPoolDir, targetFileName);
        logger.info(`処理対象ファイル: ${targetFilePath}`);

        const horseEntries = await this.readHorseEntriesFromWorkPoolFile(targetFilePath);
        if (horseEntries.length === 0) {
            logger.warn(`horseId 配列が空のため処理をスキップします: ${targetFilePath}`);
            await fs.rm(targetFilePath, { force: true });
            logger.info(`処理済みファイルを削除しました: ${targetFilePath}`);
            return;
        }

        const outDir = path.join(process.cwd(), "HorseDetail");
        const pm = new PuppeteerManager();
        await pm.init();

        // CI 環境（GitHub Actions）ではメモリ節約のため並列数を1に制限する
        const isCI = !!process.env.CI || process.env.GITHUB_ACTIONS === "true";
        const concurrency = isCI ? 1 : 2;
        logger.info(`並列数: ${concurrency}${isCI ? " (CI環境)" : ""}`);

        try {
            await this.scrapeAndSaveHorseDetails(horseEntries, pm, outDir, false, concurrency);
            await fs.rm(targetFilePath, { force: true });
            logger.info(`処理済みファイルを削除しました: ${targetFilePath}`);
        } finally {
            await pm.close();
        }
    }

    /**
     * horseId 一覧を並列処理して HorseDetail を保存します。
     */
    private async scrapeAndSaveHorseDetails(
        horseEntries: HorseEntry[],
        pm: PuppeteerManager,
        outDir: string,
        failFast: boolean,
        concurrency: number = DEFAULT_CONCURRENCY
    ): Promise<void> {
        if (horseEntries.length === 0) {
            return;
        }

        const workerCount = Math.min(concurrency, horseEntries.length);
        logger.info(`horse detail を並列処理します（並列数: ${workerCount}）`);

        let cursor = 0;
        let firstError: Error | null = null;

        const worker = async (workerId: number) => {
            while (true) {
                if (failFast && firstError) {
                    break;
                }

                const idx = cursor++;
                if (idx >= horseEntries.length) {
                    break;
                }

                const entry = horseEntries[idx];
                const { raceId, horseId, umaban } = entry;

                // 1件ごとにフレッシュなページを作成・破棄（状態汚染を防ぐ）
                const page = await pm.newPage();
                try {
                    logger.info(`[Worker${workerId}] (${idx + 1}/${horseEntries.length}) 処理中: horseId=${horseId} raceId=${raceId}`);

                    const horseScraper = new HorseDetailScraper(page);
                    const horseDetail = await horseScraper.getHorseDetail(raceId, horseId, umaban);

                    const target = this.getHorseDetailOutPath(outDir, horseId);
                    await jsonWriter.writeJson(target.dir, "index.html", horseDetail);
                    logger.info(`[Worker${workerId}] 保存完了: ${target.file}`);
                } catch (e: any) {
                    logger.error(`[Worker${workerId}] horseId=${horseId} の取得でエラー: ${String(e)}`);
                    // ブラウザ自体が死んでいる場合はワーカーを即終了（failFast設定に関わらず）
                    if (e instanceof Error && e.name === "TargetCloseError") {
                        firstError = new Error(`ページが閉じられました: ${String(e)}`);
                        break;
                    }
                    if (failFast) {
                        firstError = new Error(`本番モードで horseId=${horseId} の処理に失敗しました: ${String(e)}`);
                        break;
                    }
                } finally {
                    try {
                        await page.close();
                    } catch {
                        // ページが既に閉じている場合は無視
                    }
                }

                // レートリミット対策: リクエスト間にランダム待機（3〜7秒）
                const waitMs = 3000 + Math.floor(Math.random() * 4000);
                await new Promise((r) => setTimeout(r, waitMs));
            }
        };

        const workers = Array.from({ length: workerCount }, (_, i) => worker(i));
        await Promise.all(workers);

        if (failFast && firstError) {
            throw firstError;
        }
    }

    /**
     * workPool ディレクトリから最小（昇順先頭）のファイル名を返します。
     */
    private async getOldestWorkPoolFileName(workPoolDir: string): Promise<string | null> {
        if (! await FileUtil.exists(workPoolDir)) {
            logger.info(`workPool ディレクトリが存在しません: ${workPoolDir}`);
            return null;
        }

        let entries: string[] = [];
        try {
            entries = await fs.readdir(workPoolDir);
        } catch (e: any) {
            throw new Error(`workPool の読み込みに失敗しました: ${String(e)}`);
        }

        const files: string[] = [];
        for (const name of entries) {
            const fullPath = path.join(workPoolDir, name);
            try {
                const stat = await fs.stat(fullPath);
                if (stat.isFile()) {
                    files.push(name);
                }
            } catch {
                // race condition 等で参照できない場合は無視
            }
        }

        if (files.length === 0) {
            return null;
        }

        files.sort((a, b) => a.localeCompare(b));
        return files[0];
    }

    /**
     * workPool の JSON ファイルを読み込み HorseEntry 配列を返します。
     * 新形式 { horses: HorseEntry[] } と旧形式 { horseId: string[] } / string[] の両方を許容します。
     */
    private async readHorseEntriesFromWorkPoolFile(filePath: string): Promise<HorseEntry[]> {
        let raw = "";
        try {
            raw = await fs.readFile(filePath, "utf-8");
        } catch (e: any) {
            throw new Error(`workPool ファイルの読み込みに失敗しました: ${filePath}, ${String(e)}`);
        }

        let json: unknown;
        try {
            json = JSON.parse(raw);
        } catch (e: any) {
            throw new Error(`workPool ファイルの JSON パースに失敗しました: ${filePath}, ${String(e)}`);
        }

        // 新形式: { horses: HorseEntry[] }
        if (json && typeof json === "object" && Array.isArray((json as { horses?: unknown }).horses)) {
            return (json as { horses: unknown[] }).horses
                .filter((item): item is { raceId?: unknown; horseId?: unknown; umaban?: unknown } => !!item && typeof item === "object")
                .map((item) => ({
                    raceId: String(item.raceId ?? '').trim(),
                    horseId: String(item.horseId ?? '').trim(),
                    umaban: String(item.umaban ?? '').trim(),
                }))
                .filter((e) => e.horseId.length > 0);
        }

        // 旧形式互換: { horseId: string[] } または string[] — raceId/umaban は空文字でフォールバック
        let horseIds: unknown[];
        if (Array.isArray(json)) {
            horseIds = json;
        } else if (json && typeof json === "object" && Array.isArray((json as { horseId?: unknown }).horseId)) {
            horseIds = (json as { horseId: unknown[] }).horseId;
        } else {
            throw new Error(`workPool ファイルの形式が不正です: ${filePath}`);
        }

        logger.warn(`workPool ファイルが旧形式です。raceId/umaban がないためエラーになる可能性があります: ${filePath}`);
        return horseIds
            .map((item) => String(item).trim())
            .filter((id) => id.length > 0)
            .map((horseId) => ({ raceId: '', horseId, umaban: '' }));
    }

    /**
     * index.html の内容から kaisaiDate を抽出します。
     */
    private extractKaisaiDates(htmlContent: string, indexPath: string): string[] {
        const kaisaiDateMatches = htmlContent.match(/"kaisaiDate":\s*"(\d{8})"/g);
        if (!kaisaiDateMatches) {
            logger.warn(`kaisaiDate が見つかりません: ${indexPath}`);
            return [];
        }
        return kaisaiDateMatches.map((m) => m.match(/"kaisaiDate":\s*"(\d{8})"/)?.[1] || "").filter((d) => d !== "");
    }

    /**
     * Shutuba ファイルの JSON から HorseEntry 配列を抽出するユーティリティ
     */
    private extractHorseEntriesFromShutuba(content: string, raceId: string): HorseEntry[] {
        const entries: HorseEntry[] = [];
        const seen = new Set<string>();

        // 1) JSON パースして syutuba 配列から抽出（umaban も取得）
        try {
            const obj = JSON.parse(content);
            if (obj && Array.isArray(obj.syutuba)) {
                for (const item of obj.syutuba) {
                    const horseId = String(item?.horseId ?? item?.horseid ?? '').trim();
                    const umaban = String(item?.umaban ?? '').trim();
                    if (horseId && !seen.has(horseId)) {
                        seen.add(horseId);
                        entries.push({ raceId, horseId, umaban });
                    }
                }
                return entries;
            }
        } catch (e) {
            // JSONでなければフォールバックへ
        }

        // 2) フォールバック: "horseId":"123456" 形式（umaban 不明）
        let m: RegExpExecArray | null;
        const kvRe = /"horseId"\s*:\s*"(\d+)"/g;
        while ((m = kvRe.exec(content)) !== null) {
            const horseId = m[1];
            if (!seen.has(horseId)) {
                seen.add(horseId);
                entries.push({ raceId, horseId, umaban: '' });
            }
        }

        return entries;
    }

    /**
     * raceId から Shutuba の index.html パスを生成します。
     */
    private getShutubaPath(raceId: string): string {
        if (raceId.length !== 12) {
            throw new Error(`Invalid raceId format: ${raceId}`);
        }
        const year = raceId.substring(0, 4);
        const month = raceId.substring(4, 6);
        const day = raceId.substring(6, 8);
        const raceNo = raceId.substring(8, 12);
        const dirName = `${day}${raceNo}`;
        return path.join(__dirname, `../../Shutuba/${year}/${month}/${dirName}/index.html`);
    }

    /**
     * horseId から出力先ディレクトリ/ファイルを決定します。
     */
    private getHorseDetailOutPath(base: string, id: string): { dir: string; file: string } {
        if (id.length >= 10) {
            const year = id.substring(0, 4);
            const month = id.substring(4, 6);
            const part3 = id.substring(6, 8);
            const part4 = id.substring(8, 10);
            const dir = path.join(base, year, month, part3, part4);
            return { dir, file: path.join(dir, 'index.html') };
        }
        if (id.length >= 8) {
            const year = id.substring(0, 4);
            const month = id.substring(4, 6);
            const part3 = id.substring(6, 8);
            const dir = path.join(base, year, month, part3);
            return { dir, file: path.join(dir, 'index.html') };
        }
        const dir = base;
        return { dir, file: path.join(base, `${id}.html`) };
    }
}

// CLI 実行
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
    let productionArg = false;

    // production=true の場合は YYYY / MM なしで実行できるようにする
    if (isBooleanLiteral(positionalArgs[0])) {
        productionArg = String(positionalArgs[0]).toLowerCase() === "true";
    } else {
        year = parseInt(positionalArgs[0], 10) || new Date().getFullYear();
        monthArg = positionalArgs[1] ? parseInt(positionalArgs[1], 10) : undefined;
        if (isBooleanLiteral(positionalArgs[2])) {
            productionArg = String(positionalArgs[2]).toLowerCase() === "true";
        }
    }

    const main = new Main_HorseDetail(year, monthArg, productionArg);
    main.run().catch((err) => {
        logger.error(`main_horseDetail の実行で異常終了: ${String(err)}`);
        process.exit(1);
    });
}