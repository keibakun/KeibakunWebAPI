import puppeteer from "puppeteer";

import {
    RaceResultRow,
    RefundIF,
    CornerOrderIF,
    LapTimeIF,
    RaceResultWithRefund,
} from "./raceResultIF";

export default async function getRaceResult(raceId: string): Promise<RaceResultWithRefund> {
    const url = `https://race.netkeiba.com/race/result.html?race_id=${raceId}&rf=race_list`;
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.setViewport({ width: 2000, height: 5000 });
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await new Promise((resolve) => setTimeout(resolve, 2000));

    let result: RaceResultRow[] = [];
    let refund: RefundIF = {
        tansho: [],
        fukusho: [],
        wakuren: [],
        umaren: [],
        wide: [],
        umatan: [],
        sanrenpuku: [],
        sanrentan: [],
    };
    let cornerOrder: CornerOrderIF = {
        corner1: "",
        corner2: "",
        corner3: "",
        corner4: "",
    };
    let lapTime: LapTimeIF = {
        pace: "",
        headers: [],
        times: [],
    };

    try {
        // レース結果
        result = await page.$$eval("#All_Result_Table tbody tr", (rows) => {
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
        });

        // 払い戻し情報
        refund = await page.$$eval("table.Payout_Detail_Table", (tables) => {
            const tansho: { umaban: string; payout: string; ninki: string }[] = [];
            const fukusho: { umaban: string; payout: string; ninki: string }[] = [];
            const wakuren: { combination: string[]; payout: string; ninki: string }[] = [];
            const umaren: { combination: string[]; payout: string; ninki: string }[] = [];
            const wide: { combination: string[]; payout: string; ninki: string }[] = [];
            const umatan: { combination: string[]; payout: string; ninki: string }[] = [];
            const sanrenpuku: { combination: string[]; payout: string; ninki: string }[] = [];
            const sanrentan: { combination: string[]; payout: string; ninki: string }[] = [];

            tables.forEach((table) => {
                const rows = table.querySelectorAll("tr");
                rows.forEach((tr) => {
                    if (tr.classList.contains("Tansho")) {
                        const umaban = tr.querySelector("td.Result div span")?.textContent?.trim() ?? "";
                        const payout = tr.querySelector("td.Payout span")?.textContent?.replace(/,|円/g, "").trim() ?? "";
                        const ninki = tr.querySelector("td.Ninki span")?.textContent?.replace("人気", "").trim() ?? "";
                        if (umaban) {
                            tansho.push({ umaban, payout, ninki });
                        }
                    }
                    if (tr.classList.contains("Fukusho")) {
                        const umabans = Array.from(tr.querySelectorAll("td.Result div span")).map(el => el.textContent?.trim() ?? "").filter(Boolean);
                        const payouts = (tr.querySelector("td.Payout span")?.innerHTML.split("<br>") ?? []).map(s => s.replace(/,|円/g, "").trim());
                        const ninkis = Array.from(tr.querySelectorAll("td.Ninki span")).map(el => el.textContent?.replace("人気", "").trim() ?? "");
                        umabans.forEach((umaban, i) => {
                            fukusho.push({
                                umaban,
                                payout: payouts[i] ?? "",
                                ninki: ninkis[i] ?? "",
                            });
                        });
                    }
                    if (tr.classList.contains("Wakuren")) {
                        const comb = Array.from(tr.querySelectorAll("td.Result ul li span")).map(el => el.textContent?.trim() ?? "").filter(Boolean);
                        const payout = tr.querySelector("td.Payout span")?.textContent?.replace(/,|円/g, "").trim() ?? "";
                        const ninki = tr.querySelector("td.Ninki span")?.textContent?.replace("人気", "").trim() ?? "";
                        if (comb.length > 0) {
                            wakuren.push({ combination: comb, payout, ninki });
                        }
                    }
                    if (tr.classList.contains("Umaren")) {
                        const comb = Array.from(tr.querySelectorAll("td.Result ul li span")).map(el => el.textContent?.trim() ?? "").filter(Boolean);
                        const payout = tr.querySelector("td.Payout span")?.textContent?.replace(/,|円/g, "").trim() ?? "";
                        const ninki = tr.querySelector("td.Ninki span")?.textContent?.replace("人気", "").trim() ?? "";
                        if (comb.length > 0) {
                            umaren.push({ combination: comb, payout, ninki });
                        }
                    }
                    if (tr.classList.contains("Wide")) {
                        const resultTd = tr.querySelector("td.Result");
                        if (resultTd) {
                            const ulList = resultTd.querySelectorAll("ul");
                            const payouts = (tr.querySelector("td.Payout span")?.innerHTML.split("<br>") ?? []).map(s => s.replace(/,|円/g, "").trim());
                            const ninkis = Array.from(tr.querySelectorAll("td.Ninki span")).map(el => el.textContent?.replace("人気", "").trim() ?? "");
                            ulList.forEach((ul, i) => {
                                const comb = Array.from(ul.querySelectorAll("li span")).map(el => el.textContent?.trim() ?? "").filter(Boolean);
                                if (comb.length > 0) {
                                    wide.push({
                                        combination: comb,
                                        payout: payouts[i] ?? "",
                                        ninki: ninkis[i] ?? "",
                                    });
                                }
                            });
                        }
                    }
                    if (tr.classList.contains("Umatan")) {
                        const comb = Array.from(tr.querySelectorAll("td.Result ul li span")).map(el => el.textContent?.trim() ?? "").filter(Boolean);
                        const payout = tr.querySelector("td.Payout span")?.textContent?.replace(/,|円/g, "").trim() ?? "";
                        const ninki = tr.querySelector("td.Ninki span")?.textContent?.replace("人気", "").trim() ?? "";
                        if (comb.length > 0) {
                            umatan.push({ combination: comb, payout, ninki });
                        }
                    }
                    if (tr.classList.contains("Fuku3")) {
                        const comb = Array.from(tr.querySelectorAll("td.Result ul li span")).map(el => el.textContent?.trim() ?? "").filter(Boolean);
                        const payout = tr.querySelector("td.Payout span")?.textContent?.replace(/,|円/g, "").trim() ?? "";
                        const ninki = tr.querySelector("td.Ninki span")?.textContent?.replace("人気", "").trim() ?? "";
                        if (comb.length > 0) {
                            sanrenpuku.push({ combination: comb, payout, ninki });
                        }
                    }
                    if (tr.classList.contains("Tan3")) {
                        const comb = Array.from(tr.querySelectorAll("td.Result ul li span")).map(el => el.textContent?.trim() ?? "").filter(Boolean);
                        const payout = tr.querySelector("td.Payout span")?.textContent?.replace(/,|円/g, "").trim() ?? "";
                        const ninki = tr.querySelector("td.Ninki span")?.textContent?.replace("人気", "").trim() ?? "";
                        if (comb.length > 0) {
                            sanrentan.push({ combination: comb, payout, ninki });
                        }
                    }
                });
            });

            return { tansho, fukusho, wakuren, umaren, wide, umatan, sanrenpuku, sanrentan };
        });

        // コーナー通過順
        cornerOrder = await page.$$eval("table.Corner_Num tr", (rows) => {
            return {
                corner1: rows[0] && rows[0].children[1] ? rows[0].children[1].textContent?.replace(/\s+/g, "") ?? "" : "",
                corner2: rows[1] && rows[1].children[1] ? rows[1].children[1].textContent?.replace(/\s+/g, "") ?? "" : "",
                corner3: rows[2] && rows[2].children[1] ? rows[2].children[1].textContent?.replace(/\s+/g, "") ?? "" : "",
                corner4: rows[3] && rows[3].children[1] ? rows[3].children[1].textContent?.replace(/\s+/g, "") ?? "" : "",
            };
        });

        // ラップタイム
        lapTime = await page.evaluate(() => {
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
        });

    } catch (error) {
        console.error("レース結果の取得中にエラー:", error);
        throw error;
    } finally {
        await browser.close();
    }

    return { result, refund, cornerOrder, lapTime };
}