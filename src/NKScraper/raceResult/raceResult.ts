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
        const rows = Array.from(table.querySelectorAll("tbody tr"));
        rows.forEach((row) => {
            const th = row.querySelector("th");
            if (!th) return;
            const label = th.textContent?.trim() ?? "";
            const resultCell = row.querySelector("td.Result");
            const payoutCell = row.querySelector("td.Payout");
            const ninkiCell = row.querySelector("td.Ninki");

            // extract result numbers (can be multiple groups of <ul> or multiple <div><span>)
            const results: string[] = [];
            if (resultCell) {
                const spans = Array.from(resultCell.querySelectorAll("span"));
                spans.forEach(s => {
                    const t = s.textContent?.trim() ?? "";
                    if (t) results.push(t);
                });
            }

            // payouts: may contain <br> separated values
            const payouts: string[] = [];
            if (payoutCell) {
                const txt = payoutCell.textContent ?? "";
                txt.split(/\r?\n/).map(s => s.trim()).filter(Boolean).forEach(p => payouts.push(p));
                if (payouts.length === 0 && txt.trim()) payouts.push(txt.trim());
            }

            const ninkis: string[] = [];
            if (ninkiCell) {
                Array.from(ninkiCell.querySelectorAll("span")).forEach(s => {
                    const t = s.textContent?.trim() ?? "";
                    if (t) ninkis.push(t);
                });
                if (ninkis.length === 0 && (ninkiCell.textContent ?? "").trim()) ninkis.push((ninkiCell.textContent ?? "").trim());
            }

            const getPayout = (i: number) => payouts[i] ?? payouts[0] ?? "";
            const getNinki = (i: number) => ninkis[i] ?? ninkis[0] ?? "";

            if (label.includes("単勝")) {
                if (results.length >= 1) {
                    tansho.push({ umaban: results[0], payout: getPayout(0), ninki: getNinki(0) });
                }
            } else if (label.includes("複勝")) {
                for (let i = 0; i < results.length; i++) {
                    fukusho.push({ umaban: results[i], payout: getPayout(i), ninki: getNinki(i) });
                }
            } else if (label.includes("枠連")) {
                const comb = results.filter(Boolean);
                if (comb.length) wakuren.push({ combination: comb, payout: getPayout(0), ninki: getNinki(0) });
            } else if (label.includes("馬連")) {
                const comb = results.filter(Boolean);
                if (comb.length) umaren.push({ combination: comb, payout: getPayout(0), ninki: getNinki(0) });
            } else if (label.includes("ワイド")) {
                const lists = resultCell ? Array.from(resultCell.querySelectorAll("ul")) : [];
                if (lists.length > 0) {
                    lists.forEach((ul, idx) => {
                        const comb = Array.from(ul.querySelectorAll("span")).map(s => s.textContent?.trim() ?? "").filter(Boolean);
                        if (comb.length) wide.push({ combination: comb, payout: getPayout(idx), ninki: getNinki(idx) });
                    });
                } else {
                    const comb = results.filter(Boolean);
                    if (comb.length) wide.push({ combination: comb, payout: getPayout(0), ninki: getNinki(0) });
                }
            } else if (label.includes("馬単")) {
                const comb = results.filter(Boolean);
                if (comb.length) umatan.push({ combination: comb, payout: getPayout(0), ninki: getNinki(0) });
            } else if (label.includes("三連複")) {
                const comb = results.filter(Boolean);
                if (comb.length) sanrenpuku.push({ combination: comb, payout: getPayout(0), ninki: getNinki(0) });
            } else if (label.includes("三連単")) {
                const comb = results.filter(Boolean);
                if (comb.length) sanrentan.push({ combination: comb, payout: getPayout(0), ninki: getNinki(0) });
            }
        });
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