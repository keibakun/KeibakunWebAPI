import { PuppeteerManager } from "../utils/PuppeteerManager";
import { Logger } from "../utils/Logger";
import { JraNews } from "./News/JraNews";
import { JraNewsDbService } from "../service/JraNewsDbService";

/**
 * JRAニューススクレイパーの簡易実行エントリ
 *
 * 実行例:
 * PUPPETEER_EXECUTABLE_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npx tsx src/JRAScraper/main_JraNews.ts
 */
async function main(): Promise<void> {
    const logger = new Logger();
    const pm = new PuppeteerManager();
    const dbService = new JraNewsDbService();
    // コマンドライン引数から yyyymm を受け取る (例: node main_JraNews.js 202501)
    const argv = process.argv.slice(2);
    const yyyymmArg = argv[0];
    let useYyyymm: string | undefined = undefined;
    if (yyyymmArg) {
        if (/^\d{6}$/.test(yyyymmArg)) {
            useYyyymm = yyyymmArg;
            logger.info(`yyyymm パラメータ: ${useYyyymm}`);
        } else {
            logger.warn(`yyyymm パラメータの形式が不正です: ${yyyymmArg} (期待: yyyymm)`);
        }
    }

    try {
        logger.info("Puppeteer を初期化します");
        await pm.init();
        const page = pm.getPage();

        const scraper = new JraNews(page);
        const items = await scraper.getNews(useYyyymm);

        logger.info(`取得したニュース件数: ${items.length}`);

        const targetYyyymm = useYyyymm
            ? useYyyymm
            : (() => {
                const now = new Date();
                const yyyy = now.getFullYear().toString();
                const mm = (now.getMonth() + 1).toString().padStart(2, "0");
                return `${yyyy}${mm}`;
            })();

        await dbService.store(targetYyyymm, items);
        logger.info(`DB 保存完了: yyyymm=${targetYyyymm}, 件数=${items.length}`);
    } catch (err: any) {
        logger.error(`実行中にエラー: ${err}`);
        throw err;
    } finally {
        await pm.close();
        logger.info("Puppeteer をクローズしました");
    }
}

// スクリプトとして即実行
main().catch((e) => {
    // ここではエラーをそのまま表示
    console.error(e);
    process.exit(1);
});

