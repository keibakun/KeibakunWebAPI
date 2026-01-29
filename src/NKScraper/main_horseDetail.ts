import { PuppeteerManager } from "../utils/PuppeteerManager";
import { HorseDetailScraper } from "./horseDetail/horseDetail";
import fs from "fs/promises";
import path from "path";
import { Logger } from "../utils/Logger";
import { FileUtil } from "../utils/FileUtil";
import { JsonFileWriterUtil } from "../utils/JsonFileWriterUtil";

const logger = new Logger();
const jsonWriter = new JsonFileWriterUtil(logger);

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

    /**
     * コンストラクタ
     * @param year 対象年
     * @param monthArg 対象月（1-12）
     */
    constructor(year: number, monthArg?: number) {
        this.year = year;
        this.monthArg = monthArg;
    }

    /**
     * エントリポイント: Puppeteer を初期化して horse detail を収集します。
     */
    async run(): Promise<void> {
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
        const page = pm.getPage();
        const horseScraper = new HorseDetailScraper(page);

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

            // 各 horseId を処理して保存
            for (const horseId of horseIds) {
                try {
                    logger.info(`処理中: ${horseId}`);
                    const horseDetail = await horseScraper.getHorseDetail(horseId); // スクレイピング実行

                    const target = this.getHorseDetailOutPath(outDir, horseId);
                    // JsonFileWriterUtil を使用してディレクトリ作成と JSON 保存を一元化
                    await jsonWriter.writeJson(target.dir, 'index.html', horseDetail);
                    logger.info(`保存完了: ${target.file}`);
                } catch (e: any) {
                    logger.error(`horseId=${horseId} の取得でエラー: ${String(e)}`);
                }
            }
        } catch (e: any) {
            logger.error(`処理中にエラー: ${String(e)}`);
        } finally {
            await pm.close();
        }
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
const year = parseInt(args[0], 10) || new Date().getFullYear();
const monthArg = args[1] ? parseInt(args[1], 10) : undefined;

const main = new Main_HorseDetail(year, monthArg);
main.run();