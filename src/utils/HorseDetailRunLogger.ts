import fs from "fs/promises";
import path from "path";

export interface LogEntry {
    level: "FAIL" | "SKIP";
    horseId: string;
    reason: string;
}

/**
 * 競走馬詳細取得の失敗・スキップを記録し、ログファイルに出力するクラス。
 *
 * ログファイルは `{outDir}/{prefix}_{YYYYMMDDHHmm}.log` に保存される。
 * エントリが0件の場合はファイルを生成しない。
 *
 * @example
 * ```typescript
 * const log = new HorseDetailRunLogger("main_horseDetail_db", path.join(process.cwd(), "Log/HorseDetail"));
 * log.recordFail("2019104567", "DB取得エラー: timeout");
 * log.recordSkip("2019104568", "HorseDetailが存在しない");
 * const saved = await log.save();
 * if (saved) logger.info(`ログを保存しました: ${saved}`);
 * ```
 */
export class HorseDetailRunLogger {
    private readonly entries: LogEntry[] = [];
    private readonly filePath: string;

    /**
     * @param prefix    ログファイル名のプレフィックス（実行中の main ファイル名、例: "main_horseDetail_db"）
     * @param outDir    ログファイルの出力ディレクトリ（例: path.join(process.cwd(), "Log/HorseDetail")）
     */
    constructor(prefix: string, outDir: string) {
        const ts = HorseDetailRunLogger.formatTimestamp(new Date());
        this.filePath = path.join(outDir, `${prefix}_${ts}.log`);
    }

    /** 処理失敗した競走馬 ID を記録する */
    recordFail(horseId: string, reason: string): void {
        this.entries.push({ level: "FAIL", horseId, reason });
    }

    /** スキップした競走馬 ID を記録する */
    recordSkip(horseId: string, reason: string): void {
        this.entries.push({ level: "SKIP", horseId, reason });
    }

    /** 記録済みエントリが1件以上あるか返す */
    hasEntries(): boolean {
        return this.entries.length > 0;
    }

    /**
     * エントリが1件以上ある場合にのみログファイルを書き出す。
     * @returns 保存したファイルのパス。エントリなし（0件）の場合は `null`
     */
    async save(): Promise<string | null> {
        if (this.entries.length === 0) return null;
        await fs.mkdir(path.dirname(this.filePath), { recursive: true });
        const lines = this.entries.map(
            (e) => `[${e.level}] horseId=${e.horseId} reason=${e.reason}`
        );
        await fs.writeFile(this.filePath, lines.join("\n") + "\n", "utf-8");
        return this.filePath;
    }

    private static formatTimestamp(date: Date): string {
        const pad = (n: number) => String(n).padStart(2, "0");
        return (
            String(date.getFullYear()) +
            pad(date.getMonth() + 1) +
            pad(date.getDate()) +
            pad(date.getHours()) +
            pad(date.getMinutes())
        );
    }
}
