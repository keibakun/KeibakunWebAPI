export class ScrapingError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ScrapingError';
    }
}

// スクレイピング失敗処理のクラス
export class ScrapingErrorHandler {
    // スクレイピングエラーハンドリング
    static handle(e: Error): void {
        if (e instanceof ScrapingError) {
            console.error(`スクレイピング処理に失敗しました: ${e.message}`);
        } else {
            console.error(`予期しないエラーが発生しました。次のエラーメッセージを参照してください: ${e.message}`);
        }
    }

    /**
     * nullがある場合の処理
     * 
     * コンソールにエラーメッセージを表示します
     * 
     * @param message エラーメッセージ
     */
    static handleNullOrEmpty(message: string): void {
        console.error(message);
    }
}