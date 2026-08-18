/**
 * DbService.ts
 *
 * KeibakunServer へ HTTP POST でデータを送信する DB サービスの基底クラス。
 *
 * 接続先は環境変数 KEIBAKUN_SERVER_URL で切り替えます（デフォルト: http://localhost:3000）。
 * `.env` ファイルは自動でロードします。
 */
import "dotenv/config";

export abstract class DbService {
    protected readonly serverUrl: string;

    constructor() {
        this.serverUrl = (process.env.KEIBAKUN_SERVER_URL ?? "http://localhost:3000").replace(/\/$/, "");
    }

    /**
     * KeibakunServer の指定エンドポイントへ JSON を POST します。
     *
     * @param endpoint       - パス（例: "/api/result"）
     * @param body           - リクエストボディ（JSON シリアライズ可能なオブジェクト）
     * @param expectedStatus - 期待する成功ステータスコード（デフォルト: 201）
     * @throws HTTP エラーまたはネットワーク障害時
     */
    protected async post<T>(endpoint: string, body: T, expectedStatus = 201): Promise<void> {
        const url = `${this.serverUrl}${endpoint}`;
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        if (res.status !== expectedStatus) {
            const text = await res.text().catch(() => "");
            throw new Error(
                `[${this.constructor.name}] POST ${url} failed: HTTP ${res.status} (expected ${expectedStatus}) ${text}`
            );
        }
    }

    protected async get<T>(endpoint: string): Promise<T> {
        const url = `${this.serverUrl}${endpoint}`;
        const res = await fetch(url, { method: "GET" });

        if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(`[${this.constructor.name}] GET ${url} failed: HTTP ${res.status} ${text}`);
        }

        return (await res.json()) as T;
    }
}
