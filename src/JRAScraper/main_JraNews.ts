import path from "path";
import { PuppeteerManager } from "../utils/PuppeteerManager";
import { Logger } from "../utils/Logger";
import { JraNews } from "./News/JraNews";
import { JsonFileWriterUtil } from "../utils/JsonFileWriterUtil";

/**
 * JRAニューススクレイパーの簡易実行エントリ
 *
 * 実行例:
 * PUPPETEER_EXECUTABLE_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npx tsx src/JRAScraper/News/main_JraNews.ts
 */
async function main(): Promise<void> {
    const logger = new Logger();
    const pm = new PuppeteerManager();

    try {
        logger.info("Puppeteer を初期化します");
        await pm.init();
        const page = pm.getPage();

        const scraper = new JraNews(page);
        const items = await scraper.getNews();

        logger.info(`取得したニュース件数: ${items.length}`);

        // 保存先ディレクトリ: JRANews/YYYYMM/index.html
        const now = new Date();
        const yyyy = now.getFullYear().toString();
        const mm = (now.getMonth() + 1).toString().padStart(2, "0");
        const yyyymm = `${yyyy}${mm}`;
        const outputDir = path.join(__dirname, `../../JRANews/${yyyymm}`);

        const writer = new JsonFileWriterUtil(logger);
        // writeJson はディレクトリ作成および上書きを行う
        await writer.writeJson(outputDir, "index.html", items);
        logger.info(`保存先: ${outputDir}/index.html`);
    } catch (err: any) {
        logger.error(`実行中にエラー: ${err}`);
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

