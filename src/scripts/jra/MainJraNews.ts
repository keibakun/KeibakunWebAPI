import { JraNews } from "../../scrapers/jra/News/JraNews";
import { JraNewsDbService } from "../../service/db/JraNewsDbService";
import { MainScraper } from "../base/MainScraper";

/**
 * JRAニューススクレイパーの簡易実行エントリ
 *
 * 実行例:
 * PUPPETEER_EXECUTABLE_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npx tsx src/scripts/jra/MainJraNews.ts
 */
export class MainJraNews extends MainScraper {
    /**
     * 指定年月のJRAニュースを取得し、KeibakunServerへ保存します。
     * @param yyyymm 対象年月（YYYYMM）。省略時は現在年月
     * @throws PuppeteerまたはDB格納APIで発生したエラー
     */
    async run(yyyymm?: string): Promise<void> {
        const dbService = new JraNewsDbService();
        let useYyyymm = yyyymm;
        if (useYyyymm && !/^\d{6}$/.test(useYyyymm)) {
            // yyyymm パラメータの形式が不正な場合は警告を出して無視する
            this.logger.warn(`yyyymm パラメータの形式が不正です: ${useYyyymm} (期待: yyyymm)`);
            useYyyymm = undefined;
        }
        if (useYyyymm) this.logger.info(`yyyymm パラメータ: ${useYyyymm}`);

        try {
            this.logger.info("Puppeteer を初期化します");
            await this.withPage(async (page) => {
                const scraper = new JraNews(page);
                const items = await scraper.getNews(useYyyymm);

                this.logger.info(`取得したニュース件数: ${items.length}`);

                const targetYyyymm = useYyyymm ?? this.getCurrentYyyymm();
                await dbService.store(targetYyyymm, items);
                this.logger.info(`DB 保存完了: yyyymm=${targetYyyymm}, 件数=${items.length}`);
            });
        } catch (err: any) {
            this.logger.error(`実行中にエラー: ${err}`);
            throw err;
        }
    }

    /**
     * 実行時点の年月をYYYYMM形式で返します。
     */
    private getCurrentYyyymm(): string {
        const now = new Date();
        const yyyy = now.getFullYear().toString();
        const mm = (now.getMonth() + 1).toString().padStart(2, "0");
        return `${yyyy}${mm}`;
    }
}

if (require.main === module) {
    const main = new MainJraNews();
    main.run(process.argv[2]).catch((e) => {
        console.error(e);
        process.exit(1);
    });
}

