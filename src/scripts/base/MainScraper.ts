import { Page } from "puppeteer";
import { PuppeteerManager } from "../../utils/PuppeteerManager";
import { Logger } from "../../utils/Logger";

/**
 * Puppeteerを使用するデータ取得エントリポイントの共通基底クラスです。
 *
 * サブクラスはスクレイピング対象と保存処理だけを実装し、ブラウザやPageの
 * ライフサイクル管理はこのクラスに委譲します。
 */
export abstract class MainScraper {
    protected readonly logger = new Logger();

    /**
     * Pageを1枚使用する処理を実行します。
     *
     * タスクの成功・失敗にかかわらず、処理完了後にブラウザを終了します。
     * @param task 初期化済みPageを受け取る処理
     * @returns タスクの戻り値
     */
    protected async withPage<T>(task: (page: Page) => Promise<T>): Promise<T> {
        const pm = new PuppeteerManager();
        try {
            await pm.init();
            return await task(pm.getPage());
        } finally {
            await pm.close();
        }
    }

    /**
     * 複数のPageを使って項目を並列処理します。
     *
     * 項目は共有カーソルから一度ずつ取り出されます。使用するPage数は、
     * 指定された並列数と項目数の小さい方に制限されます。
     * @param items 処理対象の項目一覧
     * @param concurrency 最大同時実行数
     * @param task Page、項目、項目の位置、ワーカー番号を受け取る処理
     */
    protected async withWorkerPages<T>(
        items: T[],
        concurrency: number,
        task: (page: Page, item: T, index: number, workerId: number) => Promise<void>,
    ): Promise<void> {
        const pm = new PuppeteerManager();
        const pages: Page[] = [];
        let cursor = 0;

        try {
            await pm.init();

            // 対象件数を超えるPageは作成せず、空の入力ではワーカーも起動しません。
            for (let i = 0; i < Math.min(concurrency, items.length); i++) {
                pages.push(await pm.newPage());
            }

            const worker = async (page: Page, workerId: number) => {
                while (true) {
                    // cursorの更新と項目の割り当てをワーカー間で共有します。
                    const index = cursor++;
                    if (index >= items.length) return;
                    await task(page, items[index], index, workerId);
                }
            };

            await Promise.all(pages.map((page, workerId) => worker(page, workerId)));
        } finally {
            for (const page of pages) {
                await page.close().catch(() => {});
            }
            await pm.close();
        }
    }
}
