
import { PuppeteerManager } from "../utils/PuppeteerManager";
import { HorseDetailScraper } from "./horseDetail/horseDetail";
import fs from "fs/promises";
import path from "path";
import { Logger } from "../utils/Logger";
import { FileUtil } from "../utils/FileUtil";
import { JsonFileWriterUtil } from "../utils/JsonFileWriterUtil";

const logger = new Logger();
const jsonWriter = new JsonFileWriterUtil(logger);

// HorseDetailの保存先ディレクトリロジック（main_horseDetail.tsより移植）
function getHorseDetailOutPath(base: string, id: string): { dir: string; file: string } {
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
    const dir = base;
    return { dir, file: path.join(base, `${id}.html`) };
}

interface HorseEntry {
    raceId: string;
    horseId: string;
    umaban: string;
}

function extractHorseEntriesFromShutuba(content: string, raceId: string): HorseEntry[] {
    const entries: HorseEntry[] = [];
    const seen = new Set<string>();

    // 1) JSON パースして syutuba 配列から抽出（umaban も取得）
    try {
        const obj = JSON.parse(content);
        if (obj && Array.isArray(obj.syutuba)) {
            for (const item of obj.syutuba) {
                const horseId = String(item?.horseId ?? item?.horseid ?? '').trim();
                const umaban = String(item?.umaban ?? '').trim();
                if (horseId && !seen.has(horseId)) {
                    seen.add(horseId);
                    entries.push({ raceId, horseId, umaban });
                }
            }
            return entries;
        }
    } catch {
        // JSON でなければフォールバックへ
    }

    // 2) フォールバック: "horseId":"123456" 形式（umaban 不明）
    let m: RegExpExecArray | null;
    const kvRe = /"horseId"\s*:\s*"(\d+)"/g;
    while ((m = kvRe.exec(content)) !== null) {
        const horseId = m[1];
        if (!seen.has(horseId)) {
            seen.add(horseId);
            entries.push({ raceId, horseId, umaban: '' });
        }
    }

    return entries;
}

/**
 * raceIdだけを指定して、そのレースの全馬のhorseDetailを収集する臨時main
 * 使い方: node main_horseDetail_raceIdOnly.js <raceId>
 */
async function main() {
    const raceId = process.argv[2];
    if (!raceId) {
        logger.error("raceIdをコマンドライン引数で指定してください。");
        process.exit(1);
    }

    // ShutubaファイルからhorseId/umaban一覧を取得
    if (raceId.length !== 12) {
        logger.error(`raceIdの形式が不正です（12桁必要）: ${raceId}`);
        process.exit(1);
    }
    const year  = raceId.substring(0, 4);
    const month = raceId.substring(4, 6);
    const day   = raceId.substring(6, 8);
    const raceNo = raceId.substring(8, 12);
    const shutubaPath = path.join(__dirname, `../../Shutuba/${year}/${month}/${day}${raceNo}/index.html`);
    if (!await FileUtil.exists(shutubaPath)) {
        logger.error(`Shutubaファイルが存在しません: ${shutubaPath}`);
        process.exit(1);
    }
    const content = await fs.readFile(shutubaPath, "utf8");
    const entries = extractHorseEntriesFromShutuba(content, raceId);
    if (!entries || entries.length === 0) {
        logger.error("Shutubaファイルから馬エントリが抽出できませんでした。");
        process.exit(1);
    }

    const outDir = path.join(process.cwd(), "HorseDetail");
    const pm = new PuppeteerManager();
    await pm.init();
    try {
        for (const entry of entries) {
            logger.info(`収集: horseId=${entry.horseId} umaban=${entry.umaban}`);
            const page = await pm.newPage();
            try {
                const scraper = new HorseDetailScraper(page);
                const detail = await scraper.getHorseDetail(raceId, entry.horseId, entry.umaban);
                const target = getHorseDetailOutPath(outDir, entry.horseId);
                await jsonWriter.writeJson(target.dir, "index.html", detail);
                logger.info(`保存完了: ${target.file}`);
            } catch (e) {
                logger.error(`horseId=${entry.horseId} の取得でエラー: ${String(e)}`);
            } finally {
                try { await page.close(); } catch {}
            }
            // レートリミット対策: 3〜7秒ランダム待機
            const waitMs = 3000 + Math.floor(Math.random() * 4000);
            await new Promise((r) => setTimeout(r, waitMs));
        }
    } catch (e) {
        logger.error(`処理中にエラー: ${String(e)}`);
    } finally {
        await pm.close();
    }
}

main();
