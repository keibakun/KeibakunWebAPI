import { PuppeteerManager } from "../utils/PuppeteerManager";
import { HorseDetailScraper } from "./horseDetail/horseDetail";
import fs from "fs/promises";
import path from "path";

/**
 * 馬情報取得のメイン関数
 * 引数:
 *  0: 西暦 (例: 2025)
 *  1: 月   (例: 06 または 6)
 *
 * RaceSchedule/{年}{月}/index.html から開催日を取得し、
 * RaceList/{開催日}/index.html からraceIdを取得して、
 * Shutuba/{raceId}/index.html から horseId を抽出し、
 * 取得 -> ./HorseDetail/{horseId}.html に上書き保存する。
 */
async function main_horseDetail(): Promise<void> {
    // コマンドライン引数から年と月を取得
    const args: string[] = process.argv.slice(2);
    const year: number = parseInt(args[0], 10) || new Date().getFullYear(); // デフォルト値: 現在年
    const monthRaw: number = parseInt(args[1], 10); // 月を引数から取得（必須）

    if (isNaN(monthRaw) || monthRaw < 1 || monthRaw > 12) {
        console.error("月の指定が無効です。1～12の範囲で指定してください。");
        return;
    }

    // 月を2桁にフォーマット
    const month: string = monthRaw.toString().padStart(2, "0");

    console.info(`指定された年: ${year}, 月: ${month}`);

    const outDir = path.join(process.cwd(), "HorseDetail");

    const pm = new PuppeteerManager();
    await pm.init();
    const page = pm.getPage();
    const horseScraper = new HorseDetailScraper(page);

    try {
        const kaisaiDates: string[] = [];

        // RaceSchedule の index.html を参照
        const schedulePath: string = path.join(__dirname, `../../RaceSchedule/${year}${month}/index.html`);

        try {
            await fs.stat(schedulePath);
        } catch (err) {
            console.error(`RaceSchedule の index.html が存在しません: ${schedulePath}`);
            return;
        }

        const scheduleContent: string = await fs.readFile(schedulePath, "utf-8");

        // kaisaiDate を抽出
        const kaisaiDateMatches: RegExpMatchArray | null = scheduleContent.match(/"kaisaiDate":\s*"(\d{8})"/g);
        if (!kaisaiDateMatches) {
            console.warn(`kaisaiDate が見つかりません: ${schedulePath}`);
            return;
        }

        // 抽出した kaisaiDate を配列に追加
        const extractedDates: string[] = kaisaiDateMatches.map((match: string): string => {
            const dateMatch: RegExpMatchArray | null = match.match(/"kaisaiDate":\s*"(\d{8})"/);
            return dateMatch?.[1] || "";
        }).filter((date: string): boolean => date !== "");

        kaisaiDates.push(...extractedDates);

        if (kaisaiDates.length === 0) {
            console.warn(`指定された年 (${year}) の月 (${month}) の開催日が見つかりませんでした。`);
            return;
        }

        console.log(`見つかった開催日の数: ${kaisaiDates.length}`);

        const raceIds: string[] = [];

        // RaceList 配下のフォルダを参照してraceIdを取得
        for (const kaisaiDate of kaisaiDates) {
            const raceListPath: string = path.join(__dirname, `../../RaceList/${kaisaiDate}/index.html`);
            try {
                await fs.stat(raceListPath);
                const raceListContent: string = await fs.readFile(raceListPath, "utf-8");
                
                // raceId を抽出
                const raceIdMatches: RegExpMatchArray | null = raceListContent.match(/"raceId":\s*"([^"]+)"/g);
                if (raceIdMatches) {
                    const extractedRaceIds: string[] = raceIdMatches.map((match: string): string => {
                        const raceIdMatch: RegExpMatchArray | null = match.match(/"raceId":\s*"([^"]+)"/);
                        return raceIdMatch?.[1] || "";
                    }).filter((raceId: string): boolean => raceId !== "");
                    
                    raceIds.push(...extractedRaceIds);
                }
            } catch (err) {
                console.warn(`RaceList の index.html が存在しません: ${raceListPath}`);
                continue;
            }
        }

        if (raceIds.length === 0) {
            console.warn(`raceId が見つかりませんでした。`);
            return;
        }

        console.log(`見つかった raceId の数: ${raceIds.length}`);

        // 重複排除
        const uniqueRaceIds = [...new Set(raceIds)];

        // HTML/JSON から horseId を抽出する関数（重複排除）
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

        // 各raceIdからShutubaディレクトリのindex.htmlを取得してhorseIdを抽出
        const horseIdSet = new Set<string>();

        // raceIdからShutubaのディレクトリパスを生成する関数
        function getShutubaPath(raceId: string): string {
            if (raceId.length !== 12) {
                throw new Error(`Invalid raceId format: ${raceId}`);
            }
            
            const year = raceId.substring(0, 4);   // 2025
            const month = raceId.substring(4, 6);  // 01
            const day = raceId.substring(6, 8);    // 01
            const raceNo = raceId.substring(8, 12); // 0101
            const dirName = `${day}${raceNo}`;     // 010101
            
            return path.join(__dirname, `../../Shutuba/${year}/${month}/${dirName}/index.html`);
        }

        for (const raceId of uniqueRaceIds) {
            try {
                const shutubaPath = getShutubaPath(raceId);
                await fs.stat(shutubaPath);
                const content = await fs.readFile(shutubaPath, "utf8");
                const ids = extractHorseIdsFromHtml(content);
                ids.forEach((id: string) => horseIdSet.add(id));
                console.log(`raceId: ${raceId} から ${ids.length} 件のhorseIdを抽出`);
            } catch (e) {
                console.warn(`raceId: ${raceId} のShutubaファイルが存在しないかraceId形式が不正です:`, e);
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
                // 出力先を HorseDetail/{year}/{month}/{day}/{raceNo}/index.html の形式にする
                function getHorseDetailOutPath(base: string, id: string): { dir: string; file: string } {
                    // 出力パスを分割するルール:
                    // 先頭から 4桁=year, 次の2桁=month, 次の2桁=part3, 次の2桁=part4
                    // 例: 2020109107 -> year=2020, month=10, part3=91, part4=07 -> /2020/10/91/07/index.html
                    if (id.length >= 10) {
                        const year = id.substring(0, 4);
                        const month = id.substring(4, 6);
                        const part3 = id.substring(6, 8);
                        const part4 = id.substring(8, 10);
                        const dir = path.join(base, year, month, part3, part4);
                        return { dir, file: path.join(dir, 'index.html') };
                    }

                    // 8桁以上10桁未満の場合は、year/month/part3 に出力して index.html とする
                    if (id.length >= 8) {
                        const year = id.substring(0, 4);
                        const month = id.substring(4, 6);
                        const part3 = id.substring(6, 8);
                        const dir = path.join(base, year, month, part3);
                        return { dir, file: path.join(dir, 'index.html') };
                    }

                    // フォールバック: 以前の平坦なファイル名
                    const dir = base;
                    return { dir, file: path.join(base, `${id}.html`) };
                }

                const target = getHorseDetailOutPath(outDir, horseId);
                // ディレクトリを作成してから保存
                await fs.mkdir(target.dir, { recursive: true });
                await fs.writeFile(target.file, JSON.stringify(horseDetail, null, 2), 'utf8');
                console.log(`保存完了: ${target.file}`);
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