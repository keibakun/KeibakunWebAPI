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
     */
    async init(options?: LaunchOptions) {
        this.browser = await puppeteer.launch({ headless: true, ...options });
        this.page = await this.browser.newPage();
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