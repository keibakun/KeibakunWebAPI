import path from "path";
import fs from "fs/promises";
import { PuppeteerManager } from "../utils/PuppeteerManager";
import { RaceResult } from "./raceResult/raceResult";
import { JsonFileWriterUtil } from "../utils/JsonFileWriterUtil";
import { FileUtil } from "../utils/FileUtil";
import { Logger } from "../utils/Logger";

const logger = new Logger();
const jsonWriter = new JsonFileWriterUtil(logger);

/**
 * Main_RaceResult
 *
 * 年月から `RaceList` を走査し、各 `raceId` に対して `RaceResult` を取得して
 * `RaceResult/<year><month><rest>/index.html` に JSON を保存するクラスです。
 */
export class Main_RaceResult {
    private year: number;
    private monthArg?: number;

    /**
     * コンストラクタ
     * @param year 対象の年（例: 2025）
     * @param monthArg 対象の月（省略時は全月）
     */
    constructor(year: number, monthArg?: number) {
        this.year = year;
        this.monthArg = monthArg;
    }

    /**
     * エントリポイント: Puppeteer を初期化して対象月すべての処理を実行します。
     */
    async run(): Promise<void> {
        logger.info(`指定された年: ${this.year}${this.monthArg ? `, 月: ${this.monthArg}` : ""}`);

        const months = this.getTargetMonths();

        // Puppeteer を起動して Page インスタンスを取得
        const pm = new PuppeteerManager();
        try {
            await pm.init(); // ブラウザ起動
            const page = pm.getPage(); // Page を取得
            const raceResultScraper = new RaceResult(page); // スクレイパーを初期化

            // 対象の月ごとに処理を行う
            for (const month of months) {
                await this.processMonth(raceResultScraper, month);
            }
        } catch (e) {
            logger.error(`致命的なエラー: ${String(e)}`);
        } finally {
            // ブラウザをクローズ
            await pm.close();
        }
    }

    /**
     * 対象とする月の配列を返します。
     */
    private getTargetMonths(): number[] {
        if (this.monthArg && this.monthArg >= 1 && this.monthArg <= 12) {
            return [this.monthArg];
        }
        return Array.from({ length: 12 }, (_, i) => i + 1);
    }

    /**
     * 指定月の RaceList ディレクトリを走査し、開催日ごとの処理を呼び出します。
     * @param raceResultScraper `RaceResult` スクレイパーインスタンス
     * @param month 対象月（1-12）
     */
    private async processMonth(raceResultScraper: RaceResult, month: number): Promise<void> {
        const formattedMonth = month.toString().padStart(2, "0");
        const raceListRoot = path.join(__dirname, `../../RaceList/`);

        let entries: string[] = [];
        try {
            // RaceList ルートのディレクトリ一覧を非同期取得
            entries = await fs.readdir(raceListRoot);
        } catch (err) {
            logger.warn(`RaceListディレクトリが見つかりません: ${raceListRoot}`);
            return;
        }

        const kaisaiDates: string[] = [];
        // entries を走査して対象年月の kaisaiDate ディレクトリを収集
        for (const name of entries) {
            const idxPath = path.join(raceListRoot, name, "index.html");
            if (name.startsWith(`${this.year}${formattedMonth}`) && await FileUtil.exists(idxPath)) {
                kaisaiDates.push(name);
            }
        }

        if (kaisaiDates.length === 0) {
            logger.warn(`RaceList/${this.year}${formattedMonth}**/index.html が見つかりません`);
            return;
        }

        // 各開催日ごとに詳細処理を行う
        for (const kaisaiDate of kaisaiDates) {
            await this.processKaisaiDate(raceResultScraper, raceListRoot, kaisaiDate);
        }
    }

    /**
     * 開催日（kaisaiDate）単位の処理:
     * - RaceList/index.html を読み込み JSON をパース
     * - 各 raceId を抽出して RaceResult を保存
     * @param raceResultScraper `RaceResult` スクレイパー
     * @param raceListRoot RaceList ルートパス
     * @param kaisaiDate 開催日文字列（YYYYMMDD）
     */
    private async processKaisaiDate(raceResultScraper: RaceResult, raceListRoot: string, kaisaiDate: string): Promise<void> {
        const raceListPath = path.join(raceListRoot, kaisaiDate, "index.html");
        if (! await FileUtil.exists(raceListPath)) {
            logger.warn(`RaceListファイルが存在しません: ${raceListPath}`);
            return;
        }

        let raceListJson = "";
        try {
            // index.html を読み込む（RaceList は JSON 配列が格納されている想定）
            raceListJson = await fs.readFile(raceListPath, "utf-8");
        } catch (e) {
            logger.error(`RaceListの読み込みに失敗しました: ${raceListPath}`);
            return;
        }

        let raceList: any[] = [];
        try {
            // JSON をパースして raceId を抽出
            raceList = JSON.parse(raceListJson);
        } catch (e) {
            logger.error("RaceListのJSONパースに失敗しました");
            return;
        }

        const raceIds: string[] = [];
        // raceId を走査して収集
        for (const venue of raceList) {
            if (venue.items && Array.isArray(venue.items)) {
                for (const item of venue.items) {
                    if (item.raceId) {
                        raceIds.push(item.raceId);
                    }
                }
            }
        }

        if (raceIds.length === 0) {
            logger.error(`raceIdが見つかりませんでした: ${kaisaiDate}`);
            return;
        }

        // 各 raceId について RaceResult を取得して保存
        for (const raceId of raceIds) {
            try {
                logger.info(`raceId: ${raceId} のレース結果を取得します`);
                const result = await raceResultScraper.getRaceResult(raceId); // スクレイピング実行

                // raceId から出力ディレクトリを構築（年・月・残り）
                const ry = raceId.substring(0, 4);
                const rm = raceId.substring(4, 6);
                const rest = raceId.substring(6);

                const outDir = path.join(__dirname, `../../RaceResult/`, ry, rm, rest);
                // JSON として保存
                await jsonWriter.writeJson(outDir, "index.html", result);
            } catch (err: any) {
                logger.error(`raceId: ${raceId} の取得・保存でエラー: ${String(err)}`);
            }
        }
    }
}

// CLI 実行
const args = process.argv.slice(2);
const year = parseInt(args[0], 10) || 2025;
const monthArg = args[1] ? parseInt(args[1], 10) : undefined;

const main = new Main_RaceResult(year, monthArg);
main.run();