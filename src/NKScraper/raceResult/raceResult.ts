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
 * @description PuppeteerのPageインスタンスを使用してレース結果を取得するクラス
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
                this.page.$$eval("#All_Result_Table tbody tr", this.parseResultRows),
                this.page.$$eval("table.Payout_Detail_Table", this.parseRefundTables),
                this.page.$$eval("table.Corner_Num tr", this.parseCornerOrderRows),
                this.page.evaluate(this.parseLapTime),
            ]);

            this.logger.info("レース結果の取得に成功しました");
            return { result, refund, cornerOrder, lapTime };
        } catch (error) {
            this.logger.error(`レース結果の取得中にエラー: ${error}`);
            throw error;
        }
    }

    /**
     * レース結果テーブルの各行をパースする関数
     */
    private parseResultRows(rows: Element[]): RaceResultRow[] {
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
    private parseRefundTables(tables: Element[]): RefundIF {
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

            rows.forEach((row, i) => {
                // ヘッダー行をスキップ (ヘッダだけで td が無い場合)
                if (i === 0 && row.querySelectorAll("td").length === 0) return;

                // ラベル取得: caption -> th -> tr の class -> 空文字
                const label = (caption
                    || row.querySelector("th")?.textContent?.trim()
                    || row.getAttribute("class")?.trim()
                    || "").trim();

                // td.Payout は <br> 区切りで複数あることがある
                const payoutCell = row.querySelector("td.Payout");
                const payouts: string[] = [];
                if (payoutCell) {
                    const html = payoutCell.innerHTML ?? "";
                    html.split(/<br\s*\/?/i).forEach((s) => {
                        const t = s.replace(/<[^>]+>/g, "").trim();
                        if (t) payouts.push(t);
                    });
                }

                // td.Result から馬番の組み合わせリストを作成
                // - <ul> が複数ある場合は各 <ul> を 1 組とする
                // - そうでない場合は span 要素群を取得し、payouts の数で分割して複数組を推測する
                const resultCell = row.querySelector("td.Result");
                const combos: string[][] = [];
                if (resultCell) {
                    const ulList = resultCell.querySelectorAll("ul");
                    if (ulList.length > 0) {
                        ulList.forEach((ul) => {
                            const nums: string[] = [];
                            ul.querySelectorAll("li span").forEach((sp) => {
                                const t = sp.textContent?.trim() ?? "";
                                if (t) nums.push(t);
                            });
                            if (nums.length) combos.push(nums);
                        });
                    } else {
                        const spanElems = Array.from(resultCell.querySelectorAll("span"));
                        const spanTexts = spanElems.map(s => s.textContent?.trim() ?? "");
                        const nonEmpty = spanTexts.filter(Boolean);

                        if (payouts.length > 1 && spanTexts.length >= payouts.length) {
                            const chunkSize = Math.ceil(spanTexts.length / payouts.length);
                            for (let k = 0; k < payouts.length; k++) {
                                const chunk = spanTexts.slice(k * chunkSize, (k + 1) * chunkSize).map(x => x).filter(Boolean);
                                if (chunk.length) combos.push(chunk);
                            }
                        } else if (nonEmpty.length > 0) {
                            combos.push(nonEmpty);
                        } else {
                            // fallback: 直接テキストを分割
                            const txt = resultCell.textContent?.trim() ?? "";
                            if (txt) combos.push(...txt.split(/\s+/).map(s => s.trim()).filter(Boolean).map(s => [s]));
                        }
                    }
                }

                // td.Ninki の人気を配列で取得
                const ninki: string[] = [];
                row.querySelectorAll("td.Ninki span").forEach((el) => {
                    const t = el.textContent?.trim() ?? "";
                    if (t) ninki.push(t);
                });

                const isTansho = label.includes("単勝") || row.classList.contains("Tansho");
                const isFukusho = label.includes("複勝") || row.classList.contains("Fukusho");
                const isWakuren = label.includes("枠連") || row.classList.contains("Wakuren");
                const isUmaren = label.includes("馬連") || row.classList.contains("Umaren");
                const isWide = label.includes("ワイド") || row.classList.contains("Wide");
                const isUmatan = label.includes("馬単") || row.classList.contains("Umatan");
                const isSanrenpuku = /(三|3)連複/.test(label)
                    || row.classList.contains("Fuku3");

                const isSanrentan = /(三|3)連単/.test(label)
                    || row.classList.contains("Tan3");

                if (isTansho) {
                    // 単勝は複数組ある可能性があるため、全 combos を処理する
                    combos.forEach((combo, idx) => {
                        const payoutStr = payouts[idx] ?? payouts[0] ?? "";
                        const ninkiStr = ninki[idx] ?? ninki[0] ?? "";
                        const cleaned = (payoutStr ?? "").replace(/^>+/, "").replace(/,/g, "").replace(/\s/g, "").trim();
                        combo.forEach((h) => {
                            const normalizedTansho = { umaban: h, payout: cleaned, ninki: ninkiStr };
                            tansho.push(normalizedTansho);
                        });
                    });
                } else if (isFukusho) {
                    // 複勝は複数組 -> combos と payouts を対応させる
                    combos.forEach((combo, idx) => {
                        combo.forEach((num) => {
                                const cleanedPayoutF = (payouts[idx] ?? "").replace(/^>+/, "").replace(/,/g, "").replace(/\s/g, "").trim();
                                const normalizedFukusho = { umaban: num, payout: cleanedPayoutF, ninki: ninki[idx] ?? "" };
                                fukusho.push(normalizedFukusho);
                        });
                    });
                } else if (isWakuren) {
                    combos.forEach((combo, idx) => {
                        if (combo.length >= 1) {
                                const cleanedPayoutW = (payouts[idx] ?? "").replace(/^>+/, "").replace(/,/g, "").replace(/\s/g, "").trim();
                                const normalizedWakuren = { combination: combo, payout: cleanedPayoutW, ninki: ninki[idx] ?? "" };
                                wakuren.push(normalizedWakuren);
                        }
                    });
                } else if (isUmaren) {
                    combos.forEach((combo, idx) => {
                        if (combo.length >= 2) {
                                const cleanedPayoutU = (payouts[idx] ?? "").replace(/^>+/, "").replace(/,/g, "").replace(/\s/g, "").trim();
                                const normalizedUmaren = { combination: combo, payout: cleanedPayoutU, ninki: ninki[idx] ?? "" };
                                umaren.push(normalizedUmaren);
                        }
                    });
                } else if (isWide) {
                    combos.forEach((combo, idx) => {
                        if (combo.length >= 2) {
                                const cleanedPayoutWd = (payouts[idx] ?? "").replace(/^>+/, "").replace(/,/g, "").replace(/\s/g, "").trim();
                                const normalizedWide = { combination: combo, payout: cleanedPayoutWd, ninki: ninki[idx] ?? "" };
                                wide.push(normalizedWide);
                        }
                    });
                } else if (isUmatan) {
                    combos.forEach((combo, idx) => {
                        if (combo.length >= 2) {
                                const cleanedPayoutUt = (payouts[idx] ?? "").replace(/^>+/, "").replace(/,/g, "").replace(/\s/g, "").trim();
                                const normalizedUmatan = { combination: combo, payout: cleanedPayoutUt, ninki: ninki[idx] ?? "" };
                                umatan.push(normalizedUmatan);
                        }
                    });
                } else if (isSanrenpuku) {
                    combos.forEach((combo, idx) => {
                        if (combo.length >= 3) {
                                const cleanedPayoutSrp = (payouts[idx] ?? "").replace(/^>+/, "").replace(/,/g, "").replace(/\s/g, "").trim();
                                const normalizedSanrenpuku = { combination: combo, payout: cleanedPayoutSrp, ninki: ninki[idx] ?? "" };
                                sanrenpuku.push(normalizedSanrenpuku);
                        }
                    });
                } else if (isSanrentan) {
                    combos.forEach((combo, idx) => {
                        if (combo.length >= 3) {
                                const cleanedPayoutSrt = (payouts[idx] ?? "").replace(/^>+/, "").replace(/,/g, "").replace(/\s/g, "").trim();
                                const normalizedSanrentan = { combination: combo, payout: cleanedPayoutSrt, ninki: ninki[idx] ?? "" };
                                sanrentan.push(normalizedSanrentan);
                        }
                    });
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
    private parseCornerOrderRows(rows: Element[]): CornerOrderIF {
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
    private parseLapTime(): LapTimeIF {
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
}