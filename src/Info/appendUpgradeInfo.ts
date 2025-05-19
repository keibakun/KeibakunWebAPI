import fs from "fs";
import path from "path";
import { UpgradeInfo } from "./UpgradeInfoIF";

/**
 * コマンドライン引数でタイトル・説明を受け取り、実行日とともにInfo/upgrade/index.htmlへ追記する（JSON形式で保存）
 * 日時フォーマットは yyyy年MM月dd日hh:mm
 */
function appendUpgradeInfo(): void {
    const args: string[] = process.argv.slice(2);
    if (args.length < 2) {
        console.error("タイトルと説明（100字以下）を指定してください。");
        process.exit(1);
    }
    const title: string = args[0];
    const description: string = args[1];

    if (description.length > 100) {
        console.error("説明は100字以下で入力してください。");
        process.exit(1);
    }

    const now: Date = new Date();
    const dateStr: string =
        `${now.getFullYear()}年${String(now.getMonth() + 1).padStart(2, "0")}月${String(now.getDate()).padStart(2, "0")}日`
        + `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    // ディレクトリとファイルパスを構築
    const dirPath: string = path.join(__dirname, '../../info/upgrade');
    const filePath: string = path.join(dirPath, "index.html");

    // ディレクトリがなければ作成
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }

    // 既存データの読み込み
    let existing: UpgradeInfo[] = [];
    if (fs.existsSync(filePath)) {
        try {
            const fileContent: string = fs.readFileSync(filePath, "utf-8");
            const parsed: unknown = JSON.parse(fileContent);
            if (Array.isArray(parsed)) {
                existing = parsed as UpgradeInfo[];
            }
        } catch {
            existing = [];
        }
    }

    // 新しいエントリをJSONとして作成
    const entry: UpgradeInfo = {
        date: dateStr,
        title,
        description
    };

    // 既存データに追記（新しいものを先頭に追加）
    const newContent: UpgradeInfo[] = [entry, ...existing];

    fs.writeFileSync(filePath, JSON.stringify(newContent, null, 2), "utf-8");
    console.log("アップグレード情報をJSON形式で追記しました。");
}

appendUpgradeInfo();