import { PuppeteerManager } from "../../utils/PuppeteerManager";
import { HorseDetailScraper } from "../horseDetail/horseDetail";
import fs from "fs/promises";
import path from "path";

/**
 * デバッグ用: レースID をコマンドライン引数に取り、そのレースの Shutuba/index.html を探して
 * 含まれる horseId をすべて抽出し、順に HorseDetail を取得して出力する。
 *
 * 実行例:
 *   npx tsx src/NKScraper/debug/main_horseDetail_test.ts 202501010101
 */

async function findShutubaIndexForRace(raceId: string): Promise<string | null> {
    // まず既知のパス形式を試す: /Shutuba/{year}/{month}/{day+raceNo}/index.html
    if (raceId.length === 12) {
        const year = raceId.substring(0, 4);
        const month = raceId.substring(4, 6);
        const day = raceId.substring(6, 8);
        const raceNo = raceId.substring(8, 12);
        const dirName = `${day}${raceNo}`; // 010101
        const candidate = path.join(process.cwd(), "Shutuba", year, month, dirName, "index.html");
        try {
            await fs.stat(candidate);
            return candidate;
        } catch (e) {
            // not found, fallthrough to recursive search
        }
    }

    // 再帰検索: Shutdown 配下の index.html を探して raceId が見つかるファイルを返す
    const shutubaRoot = path.join(process.cwd(), "Shutuba");
    async function recurse(dir: string): Promise<string | null> {
        let entries;
        try {
            entries = await fs.readdir(dir, { withFileTypes: true });
        } catch (e) {
            return null;
        }
        for (const e of entries) {
            const full = path.join(dir, e.name);
            if (e.isDirectory()) {
                const found = await recurse(full);
                if (found) return found;
            } else if (e.isFile() && e.name.toLowerCase() === 'index.html') {
                // ファイル名やパスに raceId の一部が含まれているか、内容に raceId が含まれているか確認
                if (full.includes(raceId)) return full;
                try {
                    const content = await fs.readFile(full, 'utf8');
                    if (content.includes(raceId)) return full;
                } catch (e) {
                    // skip
                }
            }
        }
        return null;
    }

    return await recurse(shutubaRoot);
}

function extractHorseIdsFromHtml(content: string): string[] {
    const ids = new Set<string>();

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
        // ignore
    }

    const re = /\/horse\/(\d+)\/?/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(content)) !== null) {
        ids.add(m[1]);
    }

    const kvRe = /"horseId"\s*:\s*"(\d+)"/g;
    while ((m = kvRe.exec(content)) !== null) {
        ids.add(m[1]);
    }

    return Array.from(ids);
}

function getHorseDetailOutPath(base: string, id: string): { dir: string; file: string } {
    // 先頭10桁を year(4)/month(2)/part3(2)/part4(2) に分割する
    if (id.length >= 10) {
        const year = id.substring(0, 4);
        const month = id.substring(4, 6);
        const part3 = id.substring(6, 8);
        const part4 = id.substring(8, 10);
        const dir = path.join(base, year, month, part3, part4);
        return { dir, file: path.join(dir, 'index.html') };
    }

    if (id.length >= 8) {
        const year = id.substring(0, 4);
        const month = id.substring(4, 6);
        const part3 = id.substring(6, 8);
        const dir = path.join(base, year, month, part3);
        return { dir, file: path.join(dir, 'index.html') };
    }

    return { dir: base, file: path.join(base, `${id}.html`) };
}

async function main(): Promise<void> {
    const args = process.argv.slice(2);
    const raceId = args[0];
    if (!raceId) {
        console.error('Usage: npx tsx src/NKScraper/debug/main_horseDetail_test.ts <raceId>');
        process.exit(1);
    }

    console.log('検索対象 raceId=', raceId);

    const shutubaIndex = await findShutubaIndexForRace(raceId);
    if (!shutubaIndex) {
        console.error('Shutuba index.html が見つかりませんでした for', raceId);
        process.exit(1);
    }

    console.log('Found Shutuba file:', shutubaIndex);

    const content = await fs.readFile(shutubaIndex, 'utf8');
    const horseIds = extractHorseIdsFromHtml(content);
    if (horseIds.length === 0) {
        console.warn('horseId が見つかりませんでした in', shutubaIndex);
        process.exit(0);
    }

    console.log(`抽出した horseId 件数: ${horseIds.length}`);
    console.log(horseIds.join(', '));

    const pm = new PuppeteerManager();
    await pm.init();
    const page = pm.getPage();
    const scraper = new HorseDetailScraper(page);

    try {
        for (const hid of horseIds) {
            try {
                console.log('処理中 horseId=', hid);
                const detail = await scraper.getHorseDetail(hid);
                const outDir = path.join(process.cwd(), 'HorseDetail');
                const target = getHorseDetailOutPath(outDir, hid);
                await fs.mkdir(target.dir, { recursive: true });
                await fs.writeFile(target.file, JSON.stringify(detail, null, 2), 'utf8');
                console.log('保存完了:', target.file);
            } catch (e) {
                console.error('horseId=', hid, 'の取得でエラー:', e);
            }
        }
    } finally {
        await pm.close();
    }
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
