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

        // 保存先ディレクトリ: JRANews/YYYYMM/index.html
        // 出力先ディレクトリ: 指定があればその yyyymm を使い、なければ実行時の年月を使用
        const outYyyymm = useYyyymm
            ? useYyyymm
            : (() => {
                  const now = new Date();
                  const yyyy = now.getFullYear().toString();
                  const mm = (now.getMonth() + 1).toString().padStart(2, "0");
                  return `${yyyy}${mm}`;
              })();
        const outputDir = path.join(__dirname, `../../JRANews/${outYyyymm}`);

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

