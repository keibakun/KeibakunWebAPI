import getShutuba from "../../scrapers/nk/shutuba/shutuba";
import { RaceIF } from "../../scrapers/nk/shutuba/ShutubaIF";
import { Logger } from "../../utils/Logger";
import { ShutubaDbService } from "../../service/db/ShutubaDbService";
import { RaceListDbService } from "../../service/db/RaceListDbService";
import { RaceScheduleDbService } from "../../service/db/RaceScheduleDbService";
import { MainScraper } from "../base/MainScraper";

const logger = new Logger();
const dbService = new ShutubaDbService();
const raceListDbService = new RaceListDbService();
const scheduleDbService = new RaceScheduleDbService();

/** 並列処理のデフォルト同時実行数 */
const DEFAULT_CONCURRENCY = 5;

/**
 * 開催日の出馬表を取得・保存するエントリポイントです。
 *
 * KeibakunServerから開催日と `raceId` を取得し、
 * 各 `raceId` に対して `getShutuba` を呼び出し、KeibakunServerへ保存します。
 * デバッグモードフラグはデフォルトで false です。
 */
export class Main_Shutuba extends MainScraper {
    private year: number;
    private month?: number;
    private day?: number;
    private debug: boolean;
    private concurrency: number;
    private singleRaceId?: string;
    /**
     * コンストラクタ
     * @param year 対象年（例: 2026）
     * @param month 対象月（1-12）
     * @param day 対象日（1-31）
     * @param debug デバッグモードフラグ
     * @param concurrency 並列実行数（デフォルト: 5）
     * @param singleRaceId 1件だけ取得する raceId（指定時は年月日を無視）
     */
    constructor(year: number, month?: number, day?: number, debug?: boolean, concurrency?: number, singleRaceId?: string) {
        super();
        this.year = year;
        this.month = month;
        this.day = day;
        this.debug = debug || false;
        this.concurrency = concurrency ?? DEFAULT_CONCURRENCY;
        this.singleRaceId = singleRaceId;
    }

    /**
     * Server APIから開催日とraceIdを取得して出馬表の処理を開始します。
     * `singleRaceId` が指定された場合は年月日・debug フラグを無視し、その1件のみ処理します。
     * @throws ワーカープールまたはブラウザ処理で発生したエラー
     */
    async run(): Promise<void> {
        // singleRaceId モード
        if (this.singleRaceId) {
            logger.info(`単一 raceId モード: ${this.singleRaceId}, 並列数: ${this.concurrency}`);
            await this.runWithRaceIds([this.singleRaceId]);
            return;
        }

        let kaisaiDates: string[] = [];

        if (this.debug && (!this.month || isNaN(this.month) || this.month < 1 || this.month > 12)) {
            logger.error("月の指定が無効です。1～12の範囲で指定してください。");
            return;
        }

        if (!this.month) {
            logger.info(`指定された年: ${this.year}（年全体）`);
            for (let month = 1; month <= 12; month++) {
                kaisaiDates.push(...await this.getKaisaiDatesFromServer(this.year, month));
            }
        } else if (isNaN(this.month) || this.month < 1 || this.month > 12) {
            logger.error("月の指定が無効です。月は1～12の範囲で指定してください。");
            return;
        } else if (this.day && !isNaN(this.day) && this.day >= 1 && this.day <= 31) {
            const targetDate = new Date(this.year, this.month - 1, this.day + 1);
            const targetString = this.formatDate(targetDate);
            for (let month = this.month; month <= 12; month++) {
                const dates = await this.getKaisaiDatesFromServer(this.year, month);
                kaisaiDates.push(...dates.filter((date) => date >= targetString));
            }
        } else {
            logger.info(`指定された年: ${this.year}, 月: ${this.month}${this.debug ? "（debug=true）" : ""}`);
            kaisaiDates = await this.getKaisaiDatesFromServer(this.year, this.month);
        }

        kaisaiDates = kaisaiDates
            .filter((date, index, dates) => dates.indexOf(date) === index)
            .sort();
        if (kaisaiDates.length === 0) {
            logger.warn("指定条件に一致する開催日が見つかりませんでした。");
            return;
        }

        // 開催日ごとにServer APIへ問い合わせ、出馬表取得対象を作成します。
        const allRaceIds: string[] = [];
        for (const kaisaiDate of kaisaiDates) {
            const ids = await this.collectRaceIds(kaisaiDate);
            allRaceIds.push(...ids);
        }

        await this.runWithRaceIds(allRaceIds);
    }

    /**
     * raceId一覧を受け取り、共通ワーカープールで出馬表を取得・保存します。
     */
    private async runWithRaceIds(raceIds: string[]): Promise<void> {
        if (raceIds.length === 0) {
            logger.warn("処理対象の raceId がありません");
            return;
        }

        logger.info(`合計 ${raceIds.length} 件の raceId を処理します（並列数: ${this.concurrency}）`);

        try {
            await this.withWorkerPages(raceIds, this.concurrency, async (page, raceId, index, workerId) => {
                logger.info(`[Worker${workerId}] (${index + 1}/${raceIds.length}) レースID: ${raceId} の出馬表を取得します`);
                try {
                    const raceData: RaceIF = await getShutuba(page, raceId);
                    await dbService.store(raceId, raceData);
                    logger.info(`[Worker${workerId}] レースID: ${raceId} の出馬表をDBへ保存しました`);
                } catch (error: any) {
                    logger.error(`[Worker${workerId}] レースID: ${raceId} の出馬表取得または保存中にエラーが発生しました: ${String(error)}`);
                    throw error;
                }
            });
        } catch (e) {
            logger.error(`致命的なエラー: ${String(e)}`);
            throw e;
        }
    }

    /**
    * 開催日のレース一覧をKeibakunServerへ問い合わせ、raceIdを収集します。
     * @param kaisaiDate 開催日文字列（YYYYMMDD）
     */
    private async collectRaceIds(kaisaiDate: string): Promise<string[]> {
        try {
            return await raceListDbService.findRaceIds(kaisaiDate);
        } catch (e) {
            logger.error(`RaceList API の呼び出しに失敗しました: date=${kaisaiDate}`);
            return [];
        }
    }

    private async getKaisaiDatesFromServer(year: number, month: number): Promise<string[]> {
        const yyyymm = `${year}${month.toString().padStart(2, "0")}`;
        return scheduleDbService.findKaisaiDates(yyyymm);
    }

    /**
     * 指定日付の翌日をYYYYMMDD形式へ変換します。
     * @param date 変換対象の日付
     */
    private formatDate(date: Date): string {
        const pad = (value: number) => value.toString().padStart(2, "0");
        return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
    }
}

// CLI 実行
// args[0] が 4 文字より長い場合は raceId として扱い、年月日は無視する
const args = process.argv.slice(2);

if (args[0] && args[0].length > 4) {
    const singleRaceId = args[0];
    const concurrency = args[1] ? parseInt(args[1], 10) : undefined;
    const main = new Main_Shutuba(0, undefined, undefined, undefined, concurrency, singleRaceId);
    main.run();
} else {
    const year = args[0] ? parseInt(args[0], 10) : undefined;
    const monthArg = args[1] ? parseInt(args[1], 10) : undefined;
    const dayArg = args[2] ? parseInt(args[2], 10) : undefined;
    const debugArg = typeof args[3] !== "undefined" ? (String(args[3]).toLowerCase() === "true") : undefined;

    if (!year) {
        logger.error("年の指定が必要です（例: 2025）。");
        process.exit(1);
    }

    const main = new Main_Shutuba(year, monthArg, dayArg, debugArg);
    main.run().catch((error) => {
        logger.error(`Shutuba 実行中に致命的なエラーが発生しました: ${String(error)}`);
        process.exit(1);
    });
}