import { Page } from "puppeteer";
import { Logger } from "../../utils/Logger";

import { HorseProfile, HorseRaceResultRow, HorseDetail } from "./horseDetailIF";

/**
 * HorseDetailクラス
 * PuppeteerのPageインスタンスを使用して馬の詳細情報を取得するクラス
 */
export class HorseDetailScraper {
    private page: Page;
    private logger: Logger;

    /**
     * コンストラクタ
     * @param page PuppeteerのPageインスタンス
     */
    constructor(page: Page) {
        this.page = page;
        this.logger = new Logger();
    }

    /**
 * 馬の詳細情報を取得するメソッド
 * @param horseId 馬ID（例: "2020109107"）
 * @returns 馬のプロフィール・競争成績
 */
    async getHorseDetail(horseId: string): Promise<HorseDetail> {
        const url = `https://db.netkeiba.com/horse/${horseId}/`;
        this.logger.info(`馬情報ページへアクセス: ${url}`);

        // ページ遷移し、主要要素が描画されるまで待機する
        await this.page.goto(url, { waitUntil: "domcontentloaded" });
        try {
            // プロフィール表または競走成績の行のいずれかが表示されるまで待つ（最大10秒）
            await Promise.race([
                this.page.waitForSelector('.db_prof_table.no_OwnerUnit', { timeout: 10000 }),
                this.page.waitForSelector('.db_h_race_results tbody tr', { timeout: 10000 }),
            ]);
            // ドキュメントの完全読み込みも軽く確認（失敗しても無視）
            await this.page.waitForFunction(() => document.readyState === 'complete', { timeout: 5000 }).catch(() => {});
        } catch (e) {
            this.logger.warn('主要要素の待機がタイムアウトしました。フォールバックで短時間待機します。');
<<<<<<< Updated upstream
            await new Promise((r) => setTimeout(r, 1500));
=======
            await new Promise((resolve) => setTimeout(resolve, 500));
>>>>>>> Stashed changes
        }

        try {
            // profile を必須フィールドで初期化（空文字デフォルト）
            let profile: HorseProfile = { name: '', status: '', sexage: '', type: '', birthDate: '', owner: '', breeder: '', trainer: '', career: '' };

            // プロフィールテーブルをまず raw に取得（ラベル=>値 のマップ）
            const rawProfile = await this.page.evaluate(() => {
                const rows = Array.from(document.querySelectorAll('.db_prof_table.no_OwnerUnit tr'));
                const obj: Record<string, string> = {};
                rows.forEach(row => {
                    const rawLabel = row.querySelector('th')?.textContent?.trim() ?? '';
                    const td = row.querySelector('td');
                    let value = '';
                    if (td) {
                        if (rawLabel === '主な勝鞍') {
                            const items: { text: string; href?: string }[] = [];
                            td.childNodes.forEach(n => {
                                if (n.nodeType === Node.TEXT_NODE) {
                                    const txt = (n.textContent ?? '').trim();
                                    if (!txt) return;
                                    txt.split(/、|,|，/).map(s => s.trim()).filter(Boolean).forEach(piece => items.push({ text: piece }));
                                } else if ((n as Element).nodeName === 'A') {
                                    const a = n as HTMLAnchorElement;
                                    const t = (a.textContent ?? '').trim();
                                    const href = a.getAttribute('href') ?? '';
                                    if (t) items.push({ text: t, href });
                                }
                            });
                            const first = items.find(i => i.text && i.text.length > 0);
                            const firstHrefItem = items.find(i => i.href);
                            if (first) {
                                value = first.text.replace(/[、,\s]+$/g, '').trim();
                                if (first.href) {
                                    obj['__majorWinsHref'] = first.href;
                                } else if (firstHrefItem) {
                                    obj['__majorWinsHref'] = firstHrefItem.href as string;
                                }
                            } else {
                                const textNodes = Array.from(td.childNodes)
                                    .filter(n => n.nodeType === Node.TEXT_NODE)
                                    .map(n => (n.textContent ?? '').trim())
                                    .filter(Boolean);
                                value = textNodes[0] ?? '';
                            }
                        } else {
                            value = Array.from(td.childNodes)
                                .map(node => (node.textContent ?? '').trim())
                                .filter(Boolean)
                                .join(' ');
                        }
                    }
                    if (rawLabel) obj[rawLabel] = value;
                });
                return obj;
            }) as Record<string, string>;

            // ブラウザで取得した日本語ラベルを英語キーへ変換
            try {
                const mapped: HorseProfile = { name: '', status: '', sexage: '', type: '', birthDate: '', owner: '', breeder: '', trainer: '', career: '' };
                for (const k of Object.keys(rawProfile)) {
                    const v = (rawProfile as any)[k] as string;
                    switch (k) {
                        case '生年月日': mapped.birthDate = v; break;
                        case '馬主': mapped.owner = v; break;
                        case '生産者': mapped.breeder = v; break;
                        case '調教師': mapped.trainer = v; break;
                        case '主な勝鞍': /* ignored */ break;
                        case '通算成績': mapped.career = v; break;
                        case '馬名': mapped.name = v; break;
                        case '性齢': mapped.sexage = v; break;
                        default:
                            // unknown labels are ignored for strict interface
                            break;
                    }
                }
                // 主な勝鞍は旧処理で利用されていたが、現在は不要のため無視
                // 必須プロパティなので空文字で埋められていることを保証して profile に渡す
                profile = mapped;
            } catch (e) {
                this.logger.warn('プロフィールラベルのマッピングに失敗しました: ' + (e as Error).message);
            }

            // フォールバック: 何も抽出できなかった場合、より広い範囲からプロフィールらしきテーブルを探す
            if (!profile || Object.values(profile).every(v => v === '')) {
                this.logger.warn('プロフィールが抽出できませんでした。代替ルールを試みます。');
                const alt = await this.page.evaluate(() => {
                    const tables = Array.from(document.querySelectorAll('table'));
                    for (const table of tables) {
                        const text = table.textContent ?? '';
                        if (/生年月日|性別|毛色|馬主|生産者/.test(text)) {
                            const rows = Array.from(table.querySelectorAll('tr'));
                            const obj: Record<string, string> = {};
                            rows.forEach(row => {
                                const thRaw = row.querySelector('th')?.textContent?.trim() ?? '';
                                const td = row.querySelector('td');
                                const value = td ? Array.from(td.childNodes).map(n => (n.textContent ?? '').trim()).filter(Boolean).join(' ') : '';
                                if (thRaw) obj[thRaw] = value;
                            });
                            return obj;
                        }
                    }
                    return {};
                });
                    if (alt && Object.keys(alt).length) {
                    const mappedAlt: HorseProfile = { name: '', status: '', sexage: '', type: '', birthDate: '', owner: '', breeder: '', trainer: '', career: '' };
                    for (const k of Object.keys(alt)) {
                        const v = (alt as any)[k] as string;
                        switch (k) {
                            case '生年月日': mappedAlt.birthDate = v; break;
                            case '馬主': mappedAlt.owner = v; break;
                            case '生産者': mappedAlt.breeder = v; break;
                            case '調教師': mappedAlt.trainer = v; break;
                            case '通算成績': mappedAlt.career = v; break;
                            case '馬名': mappedAlt.name = v; break;
                            case '性齢': mappedAlt.sexage = v; break;
                            default:
                                break;
                        }
                    }
                    profile = mappedAlt;
                }
            }

            // ページ上部の馬名・状態行（.horse_title）を抽出して profile の先頭に挿入する
            try {
                const header = await this.page.evaluate(() => {
                    const name = document.querySelector('.horse_title h1')?.textContent?.trim() ?? '';
                    const txt = document.querySelector('.horse_title .txt_01')?.textContent?.trim() ?? '';
                    return { name, txt };
                });
                if (header && (header.name || header.txt)) {
                    // txt 例: "現役　牡3歳　黒鹿毛"
                    const parts = header.txt ? header.txt.split(/\s+|　+/).map(s => s.trim()).filter(Boolean) : [];
                    const status = parts[0] ?? '';
                    const sexage = parts[1] ?? '';
                    const type = parts[2] ?? '';
                    // 明示的に上書き（既存は残す）
                    profile.name = header.name || profile.name;
                    profile.status = status || profile.status;
                    profile.sexage = sexage || profile.sexage;
                    profile.type = type || profile.type;
                }
            } catch (e) {
                this.logger.warn('ヘッダ情報の抽出に失敗しました: ' + (e as Error).message);
            }

            // 近親馬のスクレイピングおよび代替抽出は廃止

            // 競走成績テーブル
            const raceResults: HorseRaceResultRow[] = await this.page.evaluate(() => {
                const rows = Array.from(document.querySelectorAll('.db_h_race_results tbody tr'));
                return rows.map(row => {
                    const cells = row.querySelectorAll('td');
                    // レース名セル内のリンクから raceId を抽出
                    const raceCell = cells[4];
                    const a = raceCell ? raceCell.querySelector('a') : null;
                    const href = a ? (a.getAttribute('href') ?? '') : '';
                    let raceId = '';
                    try {
                        const m = href.match(/\/race\/([^\/\?"#]+)\/?/);
                        if (m) raceId = m[1];
                    } catch (e) {}
                    // 各セルからテキストまたはリンクを取得
                    const weather = cells[2]?.textContent?.trim() ?? '';
                    const R = cells[3]?.textContent?.trim() ?? '';
                    const tousuu = cells[6]?.textContent?.trim() ?? '';
                    const wakuban = cells[7]?.textContent?.trim() ?? '';
                    const umaban = cells[8]?.textContent?.trim() ?? '';
                    const odds = cells[9]?.textContent?.trim() ?? '';
                    const popularity = cells[10]?.textContent?.trim() ?? '';
                    const rank = cells[11]?.textContent?.trim() ?? '';
                    const jockey = cells[12]?.textContent?.trim() ?? '';
                    const kinryou = cells[13]?.textContent?.trim() ?? '';
                    const distance = cells[14]?.textContent?.trim() ?? '';
                    const baba = cells[16]?.textContent?.trim() ?? '';
                    const time = cells[18]?.textContent?.trim() ?? '';
                    const tyakusa = cells[19]?.textContent?.trim() ?? '';
                    const tuuka = cells[21]?.textContent?.trim() ?? '';
                    const pace = cells[22]?.textContent?.trim() ?? '';
                    const last3f = cells[23]?.textContent?.trim() ?? '';
                    const weight = cells[24]?.textContent?.trim() ?? '';
                    // comment セルのリンク (あれば href を格納)
                    const commentLink = cells[25]?.querySelector('a') ? (cells[25].querySelector('a')?.getAttribute('href') ?? '') : '';
                    const winnerOrSecondary = cells[27]?.textContent?.trim() ?? '';
                    const prize = cells[28]?.textContent?.trim() ?? '';

                    return {
                        date: cells[0]?.textContent?.trim() ?? '',
                        place: cells[1]?.textContent?.trim() ?? '',
                        weather: weather,
                        R: R,
                        raceName: cells[4]?.textContent?.trim() ?? '',
                        grade: '', // gradeはHTMLから直接取得できない場合は空文字
                        tousuu: tousuu,
                        wakuban: wakuban,
                        umaban: umaban,
                        odds: odds,
                        popularity: popularity,
                        rank: rank,
                        jockey: jockey,
                        kinryou: kinryou,
                        distance: distance,
                        baba: baba,
                        time: time,
                        tyakusa: tyakusa,
                        // timeIndex omitted
                        tuuka: tuuka,
                        pace: pace,
                        last3f: last3f,
                        weight: weight,
                        comment: commentLink,
                        winnerOrSecondary: winnerOrSecondary,
                        prize: prize,
                        raceId: raceId,
                    };
                });
            });

            this.logger.info("馬情報の取得に成功しました");
            return { profile, raceResults };
        } catch (error) {
            this.logger.error(`馬情報の取得中にエラー: ${error}`);
            throw error;
        }
    }
}