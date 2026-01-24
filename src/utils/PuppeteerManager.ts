import puppeteer, { Browser, Page, LaunchOptions } from "puppeteer";
import { Logger } from "./Logger";

/**
 * Puppeteerを管理するクラス
 * - ブラウザの起動/終了はinit/closeで管理
 * - getPageは何度でも呼び出し可能
 * - クラスの状態（browser, page）は持たず、都度返す
 */
export class PuppeteerManager {
    private browser: Browser | null = null;
    private page: Page | null = null;
    private logger = new Logger();

    /**
     * ブラウザ・ページの初期化
     * 環境変数を使ってローカルの Chrome/Chromium 実行ファイルを指定できます:
     *   PUPPETEER_EXECUTABLE_PATH=/path/to/chrome
     *   PUPPETEER_HEADLESS=new|false|true
     */
    async init(options?: LaunchOptions) {
        const execPathFromEnv = process.env.PUPPETEER_EXECUTABLE_PATH;
        const headlessFromEnv = process.env.PUPPETEER_HEADLESS;
        const isCI = !!process.env.CI || process.env.GITHUB_ACTIONS === 'true';

        // 環境変数や引数から headless の設定を決定
        // デフォルトは "new"（可能な場合は新しい headless モード）
        const headlessSetting: any = headlessFromEnv !== undefined
            ? (headlessFromEnv === 'false' ? false : (headlessFromEnv === 'true' ? true : headlessFromEnv))
            : (options && (options as any).headless !== undefined ? (options as any).headless : 'new');

        const defaultArgs: string[] = isCI
            ? ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
            : ['--disable-dev-shm-usage', '--disable-accelerated-2d-canvas'];

        const launchOptions: any = {
            headless: headlessSetting,
            args: [...defaultArgs],
            ...options
        };

        if (execPathFromEnv) {
            launchOptions.executablePath = execPathFromEnv;
            this.logger.info(`Puppeteer: using executablePath from PUPPETEER_EXECUTABLE_PATH: ${execPathFromEnv}`);
        } else if (isCI) {
            // CI 環境では puppeteer が自動でバイナリをダウンロードする想定だが、念のためログを出す
            this.logger.info('Puppeteer: running in CI mode, relying on bundled/downloaded Chromium');
        }

        try {
            this.browser = await puppeteer.launch(launchOptions);
            this.page = await this.browser.newPage();
        } catch (err: any) {
            // 失敗時に原因のヒントをログ出力して再スロー
            this.logger.error('Puppeteer failed to launch browser.');
            if (execPathFromEnv) {
                this.logger.error(`Tried executablePath: ${execPathFromEnv}`);
            }
            this.logger.error(String(err));
            throw err;
        }
    }

    /**
     * ブラウザ・ページのクローズ
     */
    async close() {
        if (this.page) {
            await this.page.close();
            this.page = null;
        }
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }

    /**
     * Pageインスタンス取得
     */
    getPage(): Page {
        if (!this.page) {
            this.logger.error("PuppeteerManager: init()を先に呼んでください");
            throw new Error("PuppeteerManager: init()を先に呼んでください");
        }
        return this.page;
    }

    /**
     * Browserインスタンス取得
     */
    getBrowser(): Browser {
        if (!this.browser) {
            this.logger.error("PuppeteerManager: init()を先に呼んでください");
            throw new Error("PuppeteerManager: init()を先に呼んでください");
        }
        return this.browser;
    }
}