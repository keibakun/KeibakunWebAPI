import { Page } from "puppeteer";
import { Logger } from "../../utils/Logger";
import { HorseRaceResultRow } from "./horseDetailIF";

/** race.sp.netkeiba.com（SP版）User-Agent */
const MOBILE_UA =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 " +
    "(KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

/**
 * SP モーダルページ（race.sp.netkeiba.com）から厩舎コメントを取得して
 * 成績テーブルの `comment` フィールドに補完するスクレイパー。
 *
 * Step③ 専用。DB取得・血統取得は行わない。
 * 既存の HorseDetail JSON を読み込み、comment を補完して上書き保存するフローで使う。
 */
export class HorseModalCommentScraper {
    private readonly page: Page;
    private readonly logger: Logger;

    constructor(page: Page) {
        this.page   = page;
        this.logger = new Logger();
    }

    /**
     * SP モーダルからコメントを取得し、raceResults の comment フィールドを破壊的に更新する。
     *
     * - 失敗時はスキップして続行（comment が空のまま）。
     * - 全体タイムアウト: 150 秒（goto×3 + waitForSelector×2 の上限合計）。
     * - 毎回新規ページを作成して finally でクローズするため状態汚染がない。
     *
     * @param raceId     直近レースの raceId（SP モーダル URL に使用）
     * @param horseId    馬ID
     * @param umaban     馬番（SP モーダルの `i` パラメータ）
     * @param raceResults comment を補完する対象の成績行配列（破壊的更新）
     */
    async supplement(
        raceId: string,
        horseId: string,
        umaban: string | number,
        raceResults: HorseRaceResultRow[]
    ): Promise<void> {
        const OVERALL_MS = 150000;
        let timer: ReturnType<typeof setTimeout> | null = null;

        const killer = new Promise<void>((resolve) => {
            timer = setTimeout(() => {
                this.logger.warn(`SP comment 補完 全体タイムアウト（${OVERALL_MS / 1000}秒）- スキップ`);
                resolve();
            }, OVERALL_MS);
        });

        const work = this._doSupplement(raceId, horseId, umaban, raceResults)
            .finally(() => { if (timer !== null) clearTimeout(timer); })
            .catch(() => {});

        await Promise.race([work, killer]);
    }

    private async _doSupplement(
        raceId: string,
        horseId: string,
        umaban: string | number,
        raceResults: HorseRaceResultRow[]
    ): Promise<void> {
        const url =
            `https://race.sp.netkeiba.com/modal/horse.html` +
            `?race_id=${raceId}&horse_id=${horseId}&i=${Number(umaban)}&rf=shutuba_modal`;
        this.logger.info(`SP モーダルへアクセス（comment 補完）: ${url}`);

        const spPage = await this.page.browserContext().newPage();
        try {
            await spPage.setUserAgent(MOBILE_UA);
            await spPage.setViewport({ width: 390, height: 844, isMobile: true });
            await spPage.setExtraHTTPHeaders({
                "accept-language": "ja,en-US;q=0.9,en;q=0.8",
                Referer: `https://race.sp.netkeiba.com/race/shutuba.html?race_id=${raceId}`,
            });

            let gotoSuccess = false;
            for (let attempt = 1; attempt <= 3; attempt++) {
                try {
                    await spPage.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
                    gotoSuccess = true;
                    this.logger.info(`SP goto 成功（試行${attempt}/3）`);
                    break;
                } catch (e) {
                    this.logger.warn(`SP goto 試行${attempt}/3 失敗: ${String(e)}`);
                    if (attempt < 3) await new Promise((r) => setTimeout(r, 3000));
                }
            }
            if (!gotoSuccess) {
                this.logger.warn(`SP goto 3回試行後も失敗（comment 補完スキップ）: horseId=${horseId}`);
                return;
            }

            const selector =
                `horse_data[horse_id="${horseId}"] .RacingResultsArea, ` +
                `horse_data[horse-id="${horseId}"] .RacingResultsArea`;

            let selectorFound = await spPage.waitForSelector(selector, { timeout: 30000 })
                .then(() => true).catch(() => false);

            if (!selectorFound) {
                this.logger.warn(`SP selector 1回目タイムアウト、リロードして再試行: horseId=${horseId}`);
                await spPage.reload({ waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => {});
                selectorFound = await spPage.waitForSelector(selector, { timeout: 30000 })
                    .then(() => true).catch(() => false);
            }

            if (!selectorFound) {
                this.logger.warn(`SP horse_data 待機タイムアウト（2回試行後スキップ）: horseId=${horseId}`);
                return;
            }

            await this._expandAllResults(spPage, horseId);

            const commentMap: Record<string, string> = await spPage.evaluate((hid) => {
                const horseDataEl = document.querySelector(
                    `horse_data[horse-id="${hid}"], horse_data[horse_id="${hid}"]`
                );
                const listEl = horseDataEl?.querySelector(`.RacingResultList.result_${hid}`);
                if (!listEl) return {};

                const map: Record<string, string> = {};
                for (const li of listEl.querySelectorAll("li")) {
                    const dateText = li
                        .querySelector(".RaceDate")
                        ?.childNodes[0]?.textContent?.replace(/\s+/g, "")
                        .trim();
                    if (!dateText) continue;
                    const cwSpans = li.querySelectorAll(".CornerWrap span");
                    if (cwSpans.length < 2) continue;
                    const comment =
                        cwSpans[1].textContent?.trim().replace(/^\(\s*|\s*\)$/g, "").trim() ?? "";
                    if (comment) map[dateText] = comment;
                }
                return map;
            }, horseId);

            for (const row of raceResults) {
                if (commentMap[row.race.date]) row.result.comment = commentMap[row.race.date];
            }
            this.logger.info(`comment 補完完了: ${Object.keys(commentMap).length} 件`);

        } catch (error) {
            this.logger.warn(`comment 補完中にエラー（スキップ）: ${String(error)}`);
        } finally {
            await spPage.close().catch(() => {});
        }
    }

    private async _expandAllResults(spPage: Page, horseId: string): Promise<void> {
        const moreButton = await spPage.$(`#RacingResultMore_${horseId}`);
        if (!moreButton) return;

        const initialCount = await spPage.evaluate(
            (hid) => document.querySelectorAll(`.result_${hid} li`).length,
            horseId
        );
        await moreButton.click();
        this.logger.info(`「もっと見る」ボタンをクリック（horseId=${horseId}）`);

        await spPage
            .waitForFunction(
                (hid, cnt) => document.querySelectorAll(`.result_${hid} li`).length > cnt,
                { timeout: 8000 },
                horseId,
                initialCount
            )
            .catch(async () => {
                this.logger.warn(`もっと見る後の追加データ待機タイムアウト`);
                await new Promise((r) => setTimeout(r, 1500));
            });
    }
}
