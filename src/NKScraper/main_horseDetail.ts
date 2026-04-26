import { PuppeteerManager } from "../utils/PuppeteerManager";
import { HorseDetailScraper } from "./horseDetail/horseDetail";
import { HorseEntry } from "./main_extractHorseId";
import { Page } from "puppeteer";
import fs from "fs/promises";
import path from "path";
import { Logger } from "../utils/Logger";
import { FileUtil } from "../utils/FileUtil";
import { JsonFileWriterUtil } from "../utils/JsonFileWriterUtil";

const logger = new Logger();
const jsonWriter = new JsonFileWriterUtil(logger);
const DEFAULT_CONCURRENCY = 2;

/**
 * Main_HorseDetail
 *
 * `RaceSchedule/{year}{month}/index.html` から開催日を取得し、
 * `RaceList/{kaisaiDate}/index.html` から raceId を取得、
 * `Shutuba/{raceId}/index.html` から horseId / raceId / umaban を抽出、
 * `HorseDetail` に各馬の詳細を保存する処理を行うクラスです。
 *
 * スクレイピング先は `race.sp.netkeiba.com/modal/horse.html` (SP版モーダル) を使用します。
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

            // Shutuba ファイルから HorseEntry（horseId / raceId / umaban）を抽出
            const horseEntryMap = new Map<string, HorseEntry>(); // horseId で重複排除
            for (const raceId of uniqueRaceIds) {
                try {
                    const shutubaPath = this.getShutubaPath(raceId);
                    if (! await FileUtil.exists(shutubaPath)) {
                        logger.warn(`Shutuba ファイルが存在しません: ${shutubaPath}`);
                        continue;
                    }
                    const content = await fs.readFile(shutubaPath, "utf8");
                    const entries = this.extractHorseEntriesFromHtml(content, raceId);
                    entries.forEach((e) => { if (!horseEntryMap.has(e.horseId)) horseEntryMap.set(e.horseId, e); });
                    logger.info(`raceId: ${raceId} から ${entries.length} 件のHorseEntryを抽出`);
                } catch (e: any) {
                    logger.warn(`raceId: ${raceId} のShutubaファイルが存在しないかraceId形式が不正です: ${String(e)}`);
                }
            }

            const horseEntries = Array.from(horseEntryMap.values()).sort((a, b) => a.horseId.localeCompare(b.horseId));
            logger.info(`抽出した HorseEntry 件数: ${horseEntries.length}`);

            await this.scrapeAndSaveHorseDetails(horseEntries, pm, outDir, false);
        } catch (e: any) {
            logger.error(`処理中にエラー: ${String(e)}`);
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
            logger.warn(`HorseEntry 配列が空のため処理をスキップします: ${targetFilePath}`);
            await fs.rm(targetFilePath, { force: true });
            logger.info(`処理済みファイルを削除しました: ${targetFilePath}`);
            return;
        }

        const outDir = path.join(process.cwd(), "HorseDetail");
        const pm = new PuppeteerManager();
        await pm.init();

        try {
            await this.scrapeAndSaveHorseDetails(horseEntries, pm, outDir, true);
            await fs.rm(targetFilePath, { force: true });
            logger.info(`処理済みファイルを削除しました: ${targetFilePath}`);
        } finally {
            await pm.close();
        }
    }

    /**
     * HorseEntry 一覧を並列処理して HorseDetail を保存します。
     * 並列数は最大2固定です。
     */
    private async scrapeAndSaveHorseDetails(
        horseEntries: HorseEntry[],
        pm: PuppeteerManager,
        outDir: string,
        failFast: boolean
    ): Promise<void> {
        if (horseEntries.length === 0) {
            return;
        }

        const workerCount = Math.min(DEFAULT_CONCURRENCY, horseEntries.length);
        logger.info(`horse detail を並列処理します（並列数: ${workerCount}）`);

        const pages: Page[] = [];
        const basePage = pm.getPage();
        pages.push(basePage);
        for (let i = 1; i < workerCount; i++) {
            const page = await pm.newPage();
            pages.push(page);
        }

        let cursor = 0;
        let firstError: Error | null = null;

        const worker = async (page: Page, workerId: number) => {
            const horseScraper = new HorseDetailScraper(page);
            while (true) {
                if (failFast && firstError) {
                    break;
                }

                const idx = cursor++;
                if (idx >= horseEntries.length) {
                    break;
                }

                const entry = horseEntries[idx];
                try {
                    logger.info(`[Worker${workerId}] (${idx + 1}/${horseEntries.length}) 処理中: horseId=${entry.horseId} raceId=${entry.raceId} umaban=${entry.umaban}`);
                    const horseDetail = await horseScraper.getHorseDetail(entry.raceId, entry.horseId, entry.umaban);

                    const target = this.getHorseDetailOutPath(outDir, entry.horseId);
                    await jsonWriter.writeJson(target.dir, "index.html", horseDetail);
                    logger.info(`[Worker${workerId}] 保存完了: ${target.file}`);
                } catch (e: any) {
                    logger.error(`[Worker${workerId}] horseId=${entry.horseId} の取得でエラー: ${String(e)}`);
                    if (failFast) {
                        firstError = new Error(`本番モードで horseId=${entry.horseId} の処理に失敗しました: ${String(e)}`);
                        break;
                    }
                }
                // レートリミット対策: リクエスト間にランダム待機（3〜7秒）
                const waitMs = 3000 + Math.floor(Math.random() * 4000);
                await new Promise((r) => setTimeout(r, waitMs));
            }
        };

        try {
            await Promise.all(pages.map((page, i) => worker(page, i)));
        } finally {
            for (const page of pages) {
                try {
                    await page.close();
                } catch {
                    // ページが既に閉じている場合は無視
                }
            }
        }

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
     * 後方互換性のため、旧形式（`string[]` / `{ horseId: string[] }`）も受け付け、
     * その場合は raceId・umaban を空文字として補完します。
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
        const asObj = json as Record<string, unknown>;
        if (asObj && typeof asObj === "object" && Array.isArray(asObj.horses)) {
            return (asObj.horses as unknown[])
                .filter((item): item is HorseEntry => !!item && typeof item === "object" && typeof (item as any).horseId === "string")
                .map((item) => ({
                    horseId: String((item as any).horseId).trim(),
                    raceId: String((item as any).raceId ?? '').trim(),
                    umaban: String((item as any).umaban ?? '').trim(),
                }))
                .filter((e) => e.horseId.length > 0)
                .sort((a, b) => a.horseId.localeCompare(b.horseId));
        }

        // 旧形式 (string[]): raceId / umaban は空文字で補完
        if (Array.isArray(json)) {
            return (json as unknown[])
                .map((item) => String(item).trim())
                .filter((id) => id.length > 0)
                .sort((a, b) => a.localeCompare(b))
                .map((id) => ({ horseId: id, raceId: '', umaban: '' }));
        }

        // 旧形式 ({ horseId: string[] }): raceId / umaban は空文字で補完
        if (asObj && typeof asObj === "object" && Array.isArray(asObj.horseId)) {
            return (asObj.horseId as unknown[])
                .map((item) => String(item).trim())
                .filter((id) => id.length > 0)
                .sort((a, b) => a.localeCompare(b))
                .map((id) => ({ horseId: id, raceId: '', umaban: '' }));
        }

        throw new Error(`workPool ファイルの形式が不正です: ${filePath}`);
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
     * Shutuba ファイルの HTML/JSON から HorseEntry（horseId / raceId / umaban）を抽出するユーティリティ
     * @param content Shutuba ファイルの内容
     * @param raceId この Shutuba に対応するレースID
     */
    private extractHorseEntriesFromHtml(content: string, raceId: string): HorseEntry[] {
        const entries = new Map<string, HorseEntry>(); // horseId で重複排除

        // 1) JSON パースして syutuba 配列から抽出
        try {
            const obj = JSON.parse(content);
            if (obj && Array.isArray(obj.syutuba)) {
                for (const item of obj.syutuba) {
                    const horseId = item?.horseId ?? item?.horseid;
                    const umaban = String(item?.umaban ?? '');
                    if (horseId && !entries.has(String(horseId))) {
                        entries.set(String(horseId), { horseId: String(horseId), raceId, umaban });
                    }
                }
            }
        } catch (e) {
            // JSONでなければフォールバックへ
        }

        // 2) /horse/123456/ のパス形式を抽出（umaban は不明のため空文字）
        const re = /\/horse\/(\d+)\/?/g;
        let m: RegExpExecArray | null;
        while ((m = re.exec(content)) !== null) {
            if (!entries.has(m[1])) {
                entries.set(m[1], { horseId: m[1], raceId, umaban: '' });
            }
        }

        // 3) "horseId":"123456" のようなキー/値パターン（umaban は不明のため空文字）
        const kvRe = /"horseId"\s*:\s*"(\d+)"/g;
        while ((m = kvRe.exec(content)) !== null) {
            if (!entries.has(m[1])) {
                entries.set(m[1], { horseId: m[1], raceId, umaban: '' });
            }
        }

        return Array.from(entries.values());
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

let year = new Date().getFullYear();
let monthArg: number | undefined;
let productionArg = false;

// production=true の場合は YYYY / MM なしで実行できるようにする
if (isBooleanLiteral(args[0])) {
    productionArg = String(args[0]).toLowerCase() === "true";
} else {
    year = parseInt(args[0], 10) || new Date().getFullYear();
    monthArg = args[1] ? parseInt(args[1], 10) : undefined;
    if (isBooleanLiteral(args[2])) {
        productionArg = String(args[2]).toLowerCase() === "true";
    }
}

const main = new Main_HorseDetail(year, monthArg, productionArg);
main.run().catch((err) => {
    logger.error(`main_horseDetail の実行で異常終了: ${String(err)}`);
    process.exit(1);
});