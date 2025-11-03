import { PuppeteerManager } from "../utils/PuppeteerManager";
import { HorseDetailScraper } from "./horse/horse";
import fs from "fs/promises";
import path from "path";

/**
 * 馬情報取得のメイン関数
 * 引数:
 *  0: 西暦 (例: 2025)
 *  1: 月   (例: 06 または 6)
 *
 * 指定ディレクトリ: ./Shutuba/{年}/{月}/ 以下のすべての index.html（サブディレクトリ含む）から horseId を抽出し、
 * 取得 -> ./HorseDetail/{horseId}.html に上書き保存する。
 */
async function main_horseDetail() {
    const args = process.argv.slice(2);
    const year = String(args[0] ?? `${new Date().getFullYear()}`);
    const monthRaw = String(args[1] ?? `${new Date().getMonth() + 1}`);
    const month = monthRaw.padStart(2, "0");

    const baseDir = path.join(process.cwd(), "Shutuba", year, month);
    const outDir = path.join(process.cwd(), "HorseDetail");

    const pm = new PuppeteerManager();
    await pm.init();
    const page = pm.getPage();
    const horseScraper = new HorseDetailScraper(page);

    try {
        // baseDir 存在チェック
        try {
            const stat = await fs.stat(baseDir);
            if (!stat.isDirectory()) {
                console.error(`指定ディレクトリがディレクトリではありません: ${baseDir}`);
                return;
            }
        } catch (err) {
            console.error(`指定ディレクトリが存在しません: ${baseDir}`);
            return;
        }

        // index.html をサブディレクトリも含めて再帰収集
        async function collectIndexFiles(dir: string, acc: string[] = []): Promise<string[]> {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            for (const e of entries) {
                const full = path.join(dir, e.name);
                if (e.isDirectory()) {
                    await collectIndexFiles(full, acc);
                } else if (e.isFile() && e.name.toLowerCase() === "index.html") {
                    acc.push(full);
                }
            }
            return acc;
        }

        const indexFiles = await collectIndexFiles(baseDir);
        if (indexFiles.length === 0) {
            console.log("index.html が見つかりませんでした:", baseDir);
            return;
        }
        console.log(`見つかった index.html の数: ${indexFiles.length}`);
        indexFiles.forEach(f => console.log(`  - ${f}`));

        // HTML/JSON から horseId を抽出する（重複排除）
        function extractHorseIdsFromHtml(content: string): string[] {
            const ids = new Set<string>();

            // 1) 試しに JSON としてパースして syutuba 配列から horseId を抽出
            try {
                const obj = JSON.parse(content);
                if (obj && Array.isArray(obj.syutuba)) {
                    for (const item of obj.syutuba) {
                        if (item && (item.horseId || item.horseid)) {
                            ids.add(String(item.horseId ?? item.horseid));
                        }
                    }
                }
            } catch (e) {
                // JSONでなければ何もしない（フォールバックへ）
            }

            // 2) フォールバック: /horse/123456/ のようなリンクパターンを抽出
            const re = /\/horse\/(\d+)\/?/g;
            let m: RegExpExecArray | null;
            while ((m = re.exec(content)) !== null) {
                ids.add(m[1]);
            }

            // 3) フォールバック2: plain "horseId":"123456" のようなキー/値パターンも抽出
            const kvRe = /"horseId"\s*:\s*"(\d+)"/g;
            while ((m = kvRe.exec(content)) !== null) {
                ids.add(m[1]);
            }

            return Array.from(ids);
        }

        const horseIdSet = new Set<string>();
        for (const f of indexFiles) {
            try {
                const content = await fs.readFile(f, "utf8");
                const ids = extractHorseIdsFromHtml(content);
                ids.forEach(id => horseIdSet.add(id));
            } catch (e) {
                console.error(`ファイル読み取り失敗: ${f}`, e);
                // 続行
            }
        }
        const horseIds = Array.from(horseIdSet).sort();
        console.log(`抽出した horseId 件数: ${horseIds.length}`);

        // 出力ディレクトリ作成
        await fs.mkdir(outDir, { recursive: true });

        // 各 horseId を順に処理して上書き保存
        for (const horseId of horseIds) {
            try {
                console.log(`処理中: ${horseId}`);
                const horseDetail = await horseScraper.getHorseDetail(horseId);
                const outPath = path.join(outDir, `${horseId}.html`);
                // 要望により拡張子は .html のままだが内容は JSON。上書き保存する。
                await fs.writeFile(outPath, JSON.stringify(horseDetail, null, 2), "utf8");
                console.log(`保存完了: ${outPath}`);
            } catch (e) {
                console.error(`horseId=${horseId} の取得でエラー:`, e);
                // 続行
            }
        }
    } catch (e) {
        console.error("処理中にエラー:", e);
    } finally {
        await pm.close();
    }
}

main_horseDetail();