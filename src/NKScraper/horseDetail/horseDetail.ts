import { Page } from "puppeteer";
import { Logger } from "../../utils/Logger";

import { HorseProfile, HorseRaceResultRow, HorseDetail } from "./horseDetailIF";

/**
 * HorseDetailクラス
 * PuppeteerのPageインスタンスを使用して馬の詳細情報を取得するクラス。
 * スクレイピング先: race.sp.netkeiba.com/modal/horse.html（SP版モーダル）
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
     *
     * スクレイピング先: `https://race.sp.netkeiba.com/modal/horse.html`
     * - クエリパラメータ `race_id`, `horse_id`, `i`（馬番-1）, `rf=shutuba_modal` を使用します。
     * - SP版（スマートフォン向け）モーダルページのセレクタを使用します。
     *
     * @param raceId レースID（12桁, 例: "202401010303"）
     * @param horseId 馬ID（例: "2020109107"）
     * @param umaban 馬番（1始まり文字列, 例: "3"）。URLクエリの `i` には `Number(umaban) - 1` を渡します。
     * @returns 馬のプロフィール・競争成績
     */
    async getHorseDetail(raceId: string, horseId: string, umaban: string): Promise<HorseDetail> {
        // i パラメータは馬番の 0 始まりインデックス
        const iParam = Math.max(0, Number(umaban) - 1);
        const url = `https://race.sp.netkeiba.com/modal/horse.html?race_id=${raceId}&horse_id=${horseId}&i=${iParam}&rf=shutuba_modal`;
        this.logger.info(`馬情報ページへアクセス: ${url}`);

        // SP版モーダルページ用モバイルUA
        const mobileUserAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

        for (let attempt = 1; attempt <= 2; attempt++) {
            try {
                await this.page.setUserAgent(mobileUserAgent);
                await this.page.setViewport({ width: 390, height: 844, isMobile: true });
                await this.page.setExtraHTTPHeaders({
                    "accept-language": "ja,en-US;q=0.9,en;q=0.8",
                });

                // ページ遷移し、主要要素が描画されるまで待機する
                await this.page.goto(url, { waitUntil: "domcontentloaded" });
                try {
                    // プロフィール表または過去レース行のいずれかが表示されるまで待つ
                    await Promise.race([
                        this.page.waitForSelector('.horse_prof', { timeout: 15000 }),
                        this.page.waitForSelector('table.past_race_list', { timeout: 15000 }),
                        this.page.waitForSelector('table tbody tr', { timeout: 15000 }),
                    ]);
                    await this.page.waitForFunction(() => document.readyState === 'complete', { timeout: 8000 }).catch(() => {});
                } catch (e) {
                    this.logger.warn(`主要要素の待機がタイムアウトしました（attempt=${attempt}）。フォールバック待機を行います。`);
                    await new Promise((r) => setTimeout(r, 2500));
                }

                // profile を必須フィールドで初期化（空文字デフォルト）
                let profile: HorseProfile = { name: '', status: '', sexage: '', type: '', birthDate: '', owner: '', breeder: '', trainer: '', career: '' };

                // プロフィールテーブルを raw に取得（ラベル => 値 のマップ）
                // SP版では .horse_prof テーブルの th/td ペア、または dl の dt/dd ペアを使用する
                const rawProfile = await this.page.evaluate(() => {
                    const obj: Record<string, string> = {};

                    // 1) テーブル形式: .horse_prof table または table.horse_prof の th/td
                    const profTable = document.querySelector('.horse_prof table, table.horse_prof, .prof_table');
                    if (profTable) {
                        const rows = Array.from(profTable.querySelectorAll('tr'));
                        rows.forEach(row => {
                            const label = row.querySelector('th')?.textContent?.trim() ?? '';
                            const td = row.querySelector('td');
                            const value = td
                                ? Array.from(td.childNodes).map(n => (n.textContent ?? '').trim()).filter(Boolean).join(' ')
                                : '';
                            if (label) obj[label] = value;
                        });
                    }

                    // 2) フォールバック: 定義リスト形式 dl dt/dd
                    if (Object.keys(obj).length === 0) {
                        const dl = document.querySelector('dl.horse_prof, .horse_detail dl, dl');
                        if (dl) {
                            const dts = Array.from(dl.querySelectorAll('dt'));
                            dts.forEach(dt => {
                                const label = dt.textContent?.trim() ?? '';
                                const dd = dt.nextElementSibling;
                                const value = dd ? (dd.textContent ?? '').trim() : '';
                                if (label) obj[label] = value;
                            });
                        }
                    }

                    // 3) フォールバック: プロフィールキーワードを含む任意のテーブル
                    if (Object.keys(obj).length === 0) {
                        const tables = Array.from(document.querySelectorAll('table'));
                        for (const table of tables) {
                            const text = table.textContent ?? '';
                            if (/生年月日|調教師|馬主|生産者/.test(text)) {
                                const rows = Array.from(table.querySelectorAll('tr'));
                                rows.forEach(row => {
                                    const label = row.querySelector('th')?.textContent?.trim() ?? '';
                                    const td = row.querySelector('td');
                                    const value = td
                                        ? Array.from(td.childNodes).map(n => (n.textContent ?? '').trim()).filter(Boolean).join(' ')
                                        : '';
                                    if (label) obj[label] = value;
                                });
                                if (Object.keys(obj).length > 0) break;
                            }
                        }
                    }

                    return obj;
                }) as Record<string, string>;

                // 日本語ラベルを英語キーへ変換
                try {
                    const mapped: HorseProfile = { name: '', status: '', sexage: '', type: '', birthDate: '', owner: '', breeder: '', trainer: '', career: '' };
                    for (const k of Object.keys(rawProfile)) {
                        const v = (rawProfile as any)[k] as string;
                        switch (k) {
                            case '生年月日': mapped.birthDate = v; break;
                            case '馬主': mapped.owner = v; break;
                            case '生産者': mapped.breeder = v; break;
                            case '調教師': mapped.trainer = v; break;
                            case '通算成績': mapped.career = v; break;
                            case '馬名': mapped.name = v; break;
                            case '性齢': mapped.sexage = v; break;
                            default:
                                break;
                        }
                    }
                    profile = mapped;
                } catch (e) {
                    this.logger.warn('プロフィールラベルのマッピングに失敗しました: ' + (e as Error).message);
                }

                // ページ上部の馬名・状態行を抽出して profile に反映する
                // SP版では .horse_title や .horse_name などのクラスが使われることが多い
                try {
                    const header = await this.page.evaluate(() => {
                        // 複数のセレクタ候補を試す
                        const nameCandidates = [
                            '.horse_title h1', '.horse_title h2', '.horse_title h3',
                            '.horse_name', 'h1.horse_name', 'h2.horse_name', 'h3.horse_name',
                            '.Modal_Horse_Name', '.horse_detail h1', '.horse_detail h2',
                        ];
                        let name = '';
                        for (const sel of nameCandidates) {
                            const el = document.querySelector(sel);
                            if (el) { name = el.textContent?.trim() ?? ''; break; }
                        }

                        const txtCandidates = [
                            '.horse_title .txt_01', '.horse_title .txt_horse',
                            '.horse_status', '.horse_info_txt', '.horse_detail_status',
                        ];
                        let txt = '';
                        for (const sel of txtCandidates) {
                            const el = document.querySelector(sel);
                            if (el) { txt = el.textContent?.trim() ?? ''; break; }
                        }

                        return { name, txt };
                    });
                    if (header && (header.name || header.txt)) {
                        const parts = header.txt ? header.txt.split(/\s+|　+/).map(s => s.trim()).filter(Boolean) : [];
                        const status = parts[0] ?? '';
                        const sexage = parts[1] ?? '';
                        const type = parts[2] ?? '';
                        profile.name = header.name || profile.name;
                        profile.status = status || profile.status;
                        profile.sexage = sexage || profile.sexage;
                        profile.type = type || profile.type;
                    }
                } catch (e) {
                    this.logger.warn('ヘッダ情報の抽出に失敗しました: ' + (e as Error).message);
                }

                // 過去レース成績の取得
                // SP版では table.past_race_list または類似クラスの tbody tr を使用する
                const raceResults: HorseRaceResultRow[] = await this.page.evaluate(() => {
                    // 過去レーステーブルを複数のセレクタ候補から探す
                    const tableCandidates = [
                        'table.past_race_list',
                        'table.Past_Race_List',
                        'table.race_result',
                        'table.Race_Result',
                        '.past_race table',
                        '.Past_Race table',
                        '.race_history table',
                    ];
                    let raceTable: Element | null = null;
                    for (const sel of tableCandidates) {
                        raceTable = document.querySelector(sel);
                        if (raceTable) break;
                    }
                    // いずれも見つからない場合は、最初の tbody が複数 tr を持つテーブルを探す
                    if (!raceTable) {
                        const allTables = Array.from(document.querySelectorAll('table'));
                        for (const tbl of allTables) {
                            const trs = tbl.querySelectorAll('tbody tr');
                            // ヘッダ行を除いて2行以上あればレース結果テーブルと見なす
                            if (trs.length >= 2) {
                                raceTable = tbl;
                                break;
                            }
                        }
                    }
                    if (!raceTable) return [];

                    const rows = Array.from(raceTable.querySelectorAll('tbody tr'));
                    return rows.map(row => {
                        const cells = row.querySelectorAll('td');

                        // レースへのリンクから raceId を抽出する
                        let raceId = '';
                        for (let i = 0; i < cells.length; i++) {
                            const a = cells[i].querySelector('a');
                            const href = a ? (a.getAttribute('href') ?? '') : '';
                            const m = href.match(/race_id=(\d{12})/);
                            if (m) { raceId = m[1]; break; }
                            const m2 = href.match(/\/race\/([^\/\?"#]+)\/?/);
                            if (m2) { raceId = m2[1]; break; }
                        }

                        // SP版のテーブル列は以下の順番を想定（実際のページ構造に合わせること）:
                        // 0:日付, 1:場所, 2:天気, 3:R, 4:レース名, 5:頭数,
                        // 6:枠番, 7:馬番, 8:オッズ, 9:人気, 10:着順,
                        // 11:騎手, 12:斤量, 13:距離, 14:馬場, 15:タイム,
                        // 16:着差, 17:通過, 18:ペース, 19:上り3F, 20:馬体重,
                        // 21:コメント, 22:勝ち馬, 23:賞金
                        const c = (idx: number) => cells[idx]?.textContent?.trim() ?? '';
                        const raceNameCell = cells[4];
                        const raceName = raceNameCell?.textContent?.trim() ?? '';

                        return {
                            date:             c(0),
                            place:            c(1),
                            weather:          c(2),
                            R:                c(3),
                            raceName:         raceName,
                            grade:            '',
                            tousuu:           c(5),
                            wakuban:          c(6),
                            umaban:           c(7),
                            odds:             c(8),
                            popularity:       c(9),
                            rank:             c(10),
                            jockey:           c(11),
                            kinryou:          c(12),
                            distance:         c(13),
                            baba:             c(14),
                            time:             c(15),
                            tyakusa:          c(16),
                            tuuka:            c(17),
                            pace:             c(18),
                            last3f:           c(19),
                            weight:           c(20),
                            comment:          cells[21]?.querySelector('a')?.getAttribute('href') ?? '',
                            winnerOrSecondary: c(22),
                            prize:            c(23),
                            raceId:           raceId,
                        };
                    });
                });

                const isProfileEmpty = Object.values(profile).every(v => v === '');
                const isRaceResultsEmpty = raceResults.length === 0;
                if (isProfileEmpty && isRaceResultsEmpty) {
                    const title = await this.page.title().catch(() => '');
                    const bodySnippet = await this.page.evaluate(() => document.body?.innerText?.slice(0, 300) ?? '').catch(() => '');
                    throw new Error(`空データを検知しました title=${title} body=${bodySnippet}`);
                }

                this.logger.info(`馬情報の取得に成功しました（attempt=${attempt}）`);
                return { profile, raceResults };
            } catch (error) {
                this.logger.warn(`馬情報取得 attempt=${attempt} で失敗: ${String(error)}`);
                // TargetCloseError はページが死んでいるため同じページでのリトライは無意味
                if (error instanceof Error && error.name === 'TargetCloseError') {
                    this.logger.error(`ページが閉じられているためリトライをスキップします: ${error}`);
                    throw error;
                }
                if (attempt >= 2) {
                    this.logger.error(`馬情報の取得中にエラー: ${error}`);
                    throw error;
                }
                await new Promise((r) => setTimeout(r, 2000));
            }
        }

        throw new Error(`馬情報の取得に失敗しました: raceId=${raceId} horseId=${horseId}`);
    }
}