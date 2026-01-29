import { Page } from "puppeteer";
import {
    RaceResultRow,
    RefundIF,
    CornerOrderIF,
    LapTimeIF,
    RaceResultWithRefund,
} from "./raceResultIF";
import { Logger } from "../../utils/Logger";

/**
 * RaceResultクラス
 * PuppeteerのPageインスタンスを使用してレース結果を取得するクラス
 */
export class RaceResult {
    private page: Page;
    private logger: Logger;

    /**
     * コンストラクタ
     * @param page PuppeteerのPageインスタンス
     */
    constructor(page: Page) {
        this.page = page;
        this.logger = new Logger();
    }

    /**
     * レース結果を取得するメソッド
     * @param raceId レースID
     * @returns レース結果・払い戻し・コーナー通過順・ラップタイム
     */
    async getRaceResult(raceId: string): Promise<RaceResultWithRefund> {
        const url = `https://race.netkeiba.com/race/result.html?race_id=${raceId}&rf=race_list`;
        this.logger.info(`レース結果ページへアクセス: ${url}`);

        await this.page.setViewport({ width: 2000, height: 5000 });
        await this.page.goto(url, { waitUntil: "domcontentloaded" });
        await new Promise((resolve) => setTimeout(resolve, 2000));

        try {
            const [result, refund, cornerOrder, lapTime] = await Promise.all([
                this.page.$$eval("#All_Result_Table tbody tr", parseResultRows),
                this.page.$$eval("table.Payout_Detail_Table", parseRefundTables),
                this.page.$$eval("table.Corner_Num tr", parseCornerOrderRows),
                this.page.evaluate(parseLapTime),
            ]);
            this.logger.info("レース結果の取得に成功しました");
            return { result, refund, cornerOrder, lapTime };
        } catch (error) {
            this.logger.error(`レース結果の取得中にエラー: ${error}`);
            throw error;
        }
    }
}

/**
 * レース結果テーブルの各行をパースする関数
 */
function parseResultRows(rows: Element[]): RaceResultRow[] {
    return Array.from(rows).map((row) => {
        const horseA = row.querySelector("td:nth-child(4) a");
        const horseName = horseA?.textContent?.trim() ?? "";
        const horseId = horseA?.getAttribute("href")?.match(/horse\/(\d+)/)?.[1] ?? "";

        const jockeyA = row.querySelector("td:nth-child(7) a");
        const jockey = jockeyA?.textContent?.trim() ?? "";
        const jockeyId = jockeyA?.getAttribute("href")?.match(/jockey\/result\/recent\/(\d+)/)?.[1] ?? "";

        const trainerA = row.querySelector("td:nth-child(14) a");
        const trainer = trainerA?.textContent?.trim() ?? "";
        const trainerId = trainerA?.getAttribute("href")?.match(/trainer\/result\/recent\/(\d+)/)?.[1] ?? "";

        const bataijuuTd = row.querySelector("td:nth-child(15)");
        const bataijuu = bataijuuTd?.textContent?.replace(/\s+/g, "").replace(/\(.*\)/, "") ?? "";

        return {
            rank: row.querySelector("td:nth-child(1) .Rank")?.textContent?.trim() ?? "",
            umaban: row.querySelector("td:nth-child(3) div")?.textContent?.trim() ?? "",
            horseName,
            horseId,
            sexAge: row.querySelector("td:nth-child(5) span")?.textContent?.trim() ?? "",
            kinryou: row.querySelector("td:nth-child(6) .JockeyWeight")?.textContent?.trim() ?? "",
            jockey,
            jockeyId,
            time: row.querySelector("td:nth-child(8) .RaceTime")?.textContent?.trim() ?? "",
            chakusa: row.querySelector("td:nth-child(9) .RaceTime")?.textContent?.trim() ?? "",
            ninki: row.querySelector("td:nth-child(10) .OddsPeople")?.textContent?.trim() ?? "",
            odds: row.querySelector("td:nth-child(11) span")?.textContent?.trim() ?? "",
            agari: row.querySelector("td:nth-child(12)")?.textContent?.trim() ?? "",
            tsuuka: row.querySelector("td:nth-child(13)")?.textContent?.trim() ?? "",
            trainer,
            trainerId,
            bataijuu,
        };
    });
}

/**
 * 払い戻しテーブルをパースする関数
 */
function parseRefundTables(tables: Element[]): RefundIF {
    const tansho: any[] = [];
    const fukusho: any[] = [];
    const wakuren: any[] = [];
    const umaren: any[] = [];
    const wide: any[] = [];
    const umatan: any[] = [];
    const sanrenpuku: any[] = [];
    const sanrentan: any[] = [];

    tables.forEach((table) => {
        const caption = table.querySelector("caption")?.textContent?.trim() ?? "";
        const rows = table.querySelectorAll("tr");
        if (caption.includes("単勝")) {
            rows.forEach((row, i) => {
                if (i === 0) return;
                const cells = row.querySelectorAll("td");
                if (cells.length >= 2) {
                    tansho.push({
                        umaban: cells[0].textContent?.trim() ?? "",
                        payout: cells[1].textContent?.trim() ?? "",
                    });
                }
            });
        } else if (caption.includes("複勝")) {
            rows.forEach((row, i) => {
                if (i === 0) return;
                const cells = row.querySelectorAll("td");
                if (cells.length >= 2) {
                    fukusho.push({
                        umaban: cells[0].textContent?.trim() ?? "",
                        payout: cells[1].textContent?.trim() ?? "",
                    });
                }
            });
        } else if (caption.includes("枠連")) {
            rows.forEach((row, i) => {
                if (i === 0) return;
                const cells = row.querySelectorAll("td");
                if (cells.length >= 2) {
                    wakuren.push({
                        wakuban: cells[0].textContent?.trim() ?? "",
                        payout: cells[1].textContent?.trim() ?? "",
                    });
                }
            });
        } else if (caption.includes("馬連")) {
            rows.forEach((row, i) => {
                if (i === 0) return;
                const cells = row.querySelectorAll("td");
                if (cells.length >= 3) {
                    umaren.push({
                        umaban: cells[0].textContent?.trim() ?? "",
                        umaban2: cells[1].textContent?.trim() ?? "",
                        payout: cells[2].textContent?.trim() ?? "",
                    });
                }
            });
        } else if (caption.includes("ワイド")) {
            rows.forEach((row, i) => {
                if (i === 0) return;
                const cells = row.querySelectorAll("td");
                if (cells.length >= 3) {
                    wide.push({
                        umaban: cells[0].textContent?.trim() ?? "",
                        umaban2: cells[1].textContent?.trim() ?? "",
                        payout: cells[2].textContent?.trim() ?? "",
                    });
                }
            });
        } else if (caption.includes("馬単")) {
            rows.forEach((row, i) => {
                if (i === 0) return;
                const cells = row.querySelectorAll("td");
                if (cells.length >= 3) {
                    umatan.push({
                        umaban: cells[0].textContent?.trim() ?? "",
                        umaban2: cells[1].textContent?.trim() ?? "",
                        payout: cells[2].textContent?.trim() ?? "",
                    });
                }
            });
        } else if (caption.includes("三連複")) {
            rows.forEach((row, i) => {
                if (i === 0) return;
                const cells = row.querySelectorAll("td");
                if (cells.length >= 4) {
                    sanrenpuku.push({
                        umaban: cells[0].textContent?.trim() ?? "",
                        umaban2: cells[1].textContent?.trim() ?? "",
                        umaban3: cells[2].textContent?.trim() ?? "",
                        payout: cells[3].textContent?.trim() ?? "",
                    });
                }
            });
        } else if (caption.includes("三連単")) {
            rows.forEach((row, i) => {
                if (i === 0) return;
                const cells = row.querySelectorAll("td");
                if (cells.length >= 5) {
                    sanrentan.push({
                        umaban: cells[0].textContent?.trim() ?? "",
                        umaban2: cells[1].textContent?.trim() ?? "",
                        umaban3: cells[2].textContent?.trim() ?? "",
                        payout: cells[4].textContent?.trim() ?? "",
                    });
                }
            });
        }
    });

    return {
        tansho,
        fukusho,
        wakuren,
        umaren,
        wide,
        umatan,
        sanrenpuku,
        sanrentan,
    };
}

/**
 * コーナー通過順テーブルをパースする関数
 */
function parseCornerOrderRows(rows: Element[]): CornerOrderIF {
    return {
        corner1: rows[0] && rows[0].children[1] ? rows[0].children[1].textContent?.replace(/\s+/g, "") ?? "" : "",
        corner2: rows[1] && rows[1].children[1] ? rows[1].children[1].textContent?.replace(/\s+/g, "") ?? "" : "",
        corner3: rows[2] && rows[2].children[1] ? rows[2].children[1].textContent?.replace(/\s+/g, "") ?? "" : "",
        corner4: rows[3] && rows[3].children[1] ? rows[3].children[1].textContent?.replace(/\s+/g, "") ?? "" : "",
    };
}

/**
 * ラップタイムテーブルをパースする関数
 */
function parseLapTime(): LapTimeIF {
    const paceElem = document.querySelector(".RapPace_Title span");
    const pace = paceElem ? paceElem.textContent?.trim() ?? "" : "";

    const headers: string[] = [];
    const times: string[][] = [];
    const table = document.querySelector("table.Race_HaronTime");
    if (table) {
        // ヘッダー取得
        const headerTr = table.querySelector("tr.Header");
        if (headerTr) {
            headerTr.querySelectorAll("th").forEach(th => {
                headers.push(th.textContent?.trim() ?? "");
            });
        }
        // タイム取得
        const trs = table.querySelectorAll("tr.HaronTime");
        trs.forEach(tr => {
            const row: string[] = [];
            tr.querySelectorAll("td").forEach(td => {
                row.push(td.textContent?.trim() ?? "");
            });
            times.push(row);
        });
    }
    return { pace, headers, times };
}