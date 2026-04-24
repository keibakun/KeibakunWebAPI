import { PuppeteerManager } from "../utils/PuppeteerManager";
import { HorseDetailScraper } from "./horseDetail/horseDetail";
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

            // Shutuba ファイルから horseId を抽出
            const horseIdSet = new Set<string>();
            for (const raceId of uniqueRaceIds) {
                try {
                    const shutubaPath = this.getShutubaPath(raceId);
                    if (! await FileUtil.exists(shutubaPath)) {
                        logger.warn(`Shutuba ファイルが存在しません: ${shutubaPath}`);
                        continue;
                    }
                    const content = await fs.readFile(shutubaPath, "utf8");
                    const ids = this.extractHorseIdsFromHtml(content);
                    ids.forEach((id) => horseIdSet.add(id));
                    logger.info(`raceId: ${raceId} から ${ids.length} 件のhorseIdを抽出`);
                } catch (e: any) {
                    logger.warn(`raceId: ${raceId} のShutubaファイルが存在しないかraceId形式が不正です: ${String(e)}`);
                }
            }

            const horseIds = Array.from(horseIdSet).sort();
            logger.info(`抽出した horseId 件数: ${horseIds.length}`);

            await this.scrapeAndSaveHorseDetails(horseIds, pm, outDir, false);
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

        const horseIds = await this.readHorseIdsFromWorkPoolFile(targetFilePath);
        if (horseIds.length === 0) {
            logger.warn(`horseId 配列が空のため処理をスキップします: ${targetFilePath}`);
            await fs.rm(targetFilePath, { force: true });
            logger.info(`処理済みファイルを削除しました: ${targetFilePath}`);
            return;
        }

        const outDir = path.join(process.cwd(), "HorseDetail");
        const pm = new PuppeteerManager();
        await pm.init();

        try {
            await this.scrapeAndSaveHorseDetails(horseIds, pm, outDir, true);
            await fs.rm(targetFilePath, { force: true });
            logger.info(`処理済みファイルを削除しました: ${targetFilePath}`);
        } finally {
            await pm.close();
        }
    }

    /**
     * horseId 一覧を並列処理して HorseDetail を保存します。
     * 並列数は最大2固定です。
     */
    private async scrapeAndSaveHorseDetails(
        horseIds: string[],
        pm: PuppeteerManager,
        outDir: string,
        failFast: boolean
    ): Promise<void> {
        if (horseIds.length === 0) {
            return;
        }

        const workerCount = Math.min(DEFAULT_CONCURRENCY, horseIds.length);
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
                if (idx >= horseIds.length) {
                    break;
                }

                const horseId = horseIds[idx];
                try {
                    logger.info(`[Worker${workerId}] (${idx + 1}/${horseIds.length}) 処理中: ${horseId}`);
                    const horseDetail = await horseScraper.getHorseDetail(horseId);

                    const target = this.getHorseDetailOutPath(outDir, horseId);
                    await jsonWriter.writeJson(target.dir, "index.html", horseDetail);
                    logger.info(`[Worker${workerId}] 保存完了: ${target.file}`);
                } catch (e: any) {
                    logger.error(`[Worker${workerId}] horseId=${horseId} の取得でエラー: ${String(e)}`);
                    if (failFast) {
                        firstError = new Error(`本番モードで horseId=${horseId} の処理に失敗しました: ${String(e)}`);
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
     * workPool の JSON ファイルを読み込み horseId 配列を返します。
     */
    private async readHorseIdsFromWorkPoolFile(filePath: string): Promise<string[]> {
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

        // 互換性のため、旧形式(string[])と新形式({ horseId: string[] })の両方を受け付ける
        let horseIds: unknown[];
        if (Array.isArray(json)) {
            horseIds = json;
        } else if (json && typeof json === "object" && Array.isArray((json as { horseId?: unknown }).horseId)) {
            horseIds = (json as { horseId: unknown[] }).horseId;
        } else {
            throw new Error(`workPool ファイルの形式が不正です（string[] または { horseId: string[] } ではありません）: ${filePath}`);
        }

        return horseIds
            .map((item) => String(item).trim())
            .filter((id) => id.length > 0)
            .sort((a, b) => a.localeCompare(b));
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
     * Shutuba ファイルの HTML/JSON から horseId を抽出するユーティリティ
     */
    private extractHorseIdsFromHtml(content: string): string[] {
        const ids = new Set<string>();
        // 1) JSON パースして syutuba 配列から抽出
        try {
            const obj = JSON.parse(content);
            if (obj && Array.isArray(obj.syutuba)) {
                for (const item of obj.syutuba) {
                    if (item && (item.horseId || item.horseid)) {
                        ids.add(String(item.horseId ?? item.horseid));
                    }
                }
            }
        } catch (e) {
            // JSONでなければフォールバックへ
        }

        // 2) /horse/123456/ のパス形式を抽出
        const re = /\/horse\/(\d+)\/?/g;
        let m: RegExpExecArray | null;
        while ((m = re.exec(content)) !== null) {
            ids.add(m[1]);
        }

        // 3) "horseId":"123456" のようなキー/値パターン
        const kvRe = /"horseId"\s*:\s*"(\d+)"/g;
        while ((m = kvRe.exec(content)) !== null) {
            ids.add(m[1]);
        }

        return Array.from(ids);
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