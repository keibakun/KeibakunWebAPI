import { Page } from "puppeteer";
import { Logger } from "../../utils/Logger";
import { JraNewsIF, JraNewsItem } from "./JraNewsIF";

/**
 * JRAニュースをスクレイピングするクラス
 *
 * 使い方の例:
 *  const pm = new PuppeteerManager();
 *  await pm.init();
 *  const page = pm.getPage();
 *  const scraper = new JraNews(page);
 *  const news = await scraper.getNews();
 */
export class JraNews {
    private page: Page;
    private logger: Logger;
    private readonly baseUrl = "https://www.jra.go.jp";

    constructor(page: Page) {
        this.page = page;
        this.logger = new Logger();
    }

    /**
     * ニュース一覧ページをスクレイピングして、JraNewsIF 形式で返す
     * - 日付は h2.heading-leftline.h2 から取得
     * - 各ニュースのカテゴリは .icon p のテキスト
     * - タイトルは .txt のテキスト
     * - link は a[href] を取得して相対パスの場合は baseUrl を付与
     * - カテゴリに「イベント関連」を含むものは除外する
     *
     * @returns {Promise<JraNewsIF>} ニュースアイテム配列
     */
    /**
     * 年月パラメータを受け取りスクレイピング先を切替える
     * @param yyyymm optional 年月（yyyymm）。未指定の場合は現行のニュース一覧（/news/）を使用
     */
    async getNews(yyyymm?: string): Promise<JraNewsIF> {
        let url = `${this.baseUrl}/news/`;
        if (yyyymm && /^\d{6}$/.test(yyyymm)) {
            url = `${this.baseUrl}/news/${yyyymm}/`;
            this.logger.info(`JraNews: 開始 ${url} (yyyymm=${yyyymm})`);
        } else {
            this.logger.info(`JraNews: 開始 ${url}`);
            if (yyyymm) {
                this.logger.warn(`JraNews: yyyymm パラメータの形式が不正です: ${yyyymm}`);
            }
        }

        // ページ遷移して主要要素の読み込みを待つ
        await this.page.goto(url, { waitUntil: "domcontentloaded" });
        try {
            await this.page.waitForSelector(".news_unit_area", { timeout: 10000 });
        } catch (e) {
            this.logger.warn("news_unit_area の待機がタイムアウトしました。続行します。");
        }

        try {
            // ブラウザ側で DOM をパースして必要な情報を抽出する
            const items: JraNewsItem[] = await this.page.$$eval(
                ".news_unit_area .news_unit",
                (units: Element[], base: string) => {
                    const results: JraNewsItem[] = [];

                    units.forEach((unit) => {
                        const dateEl = unit.querySelector("h2.heading-leftline.h2");
                        const dateText = dateEl?.textContent?.trim() || "";

                        const lis = Array.from(unit.querySelectorAll("ul.news_line_list > li"));
                        lis.forEach((li) => {
                            const a = li.querySelector("a") as HTMLAnchorElement | null;
                            const category = li.querySelector(".icon p")?.textContent?.trim() || "";
                            const title = li.querySelector(".txt")?.textContent?.trim() || "";
                            let href = a?.getAttribute("href") || "";

                            // イベント関連は除外
                            if (/イベント関連/.test(category)) {
                                return;
                            }

                            // 相対パスの場合は base を補完
                            if (href && href.startsWith("/")) {
                                href = base + href;
                            }

                            results.push({ date: dateText, category, title, link: href });
                        });
                    });

                    return results;
                },
                this.baseUrl
            );

            this.logger.info(`JraNews: 取得件数 ${items.length}`);
            console.log(items);
            return items;
        } catch (err) {
            this.logger.error(`JraNews: スクレイピング中にエラーが発生しました: ${err}`);
            throw err;
        }
    }
}
