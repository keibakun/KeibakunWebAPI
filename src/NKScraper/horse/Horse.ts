import { Page } from "puppeteer";
import { Logger } from "../../utils/Logger";

/**
 * 馬情報の型
 */
export interface HorseProfileRow {
    label: string;
    value: string;
    valueId?: string; // 追加：主な勝鞍のhrefから抽出したrace idを格納（例: "202504030411"）
}

export interface HorseRelativeRow {
    relation: string;
    name: string;
    info: string;
}

export interface HorseRaceResultRow {
    date: string;
    place: string;
    raceName: string;
    grade: string;
    rank: string;
    jockey: string;
    time: string;
    odds: string;
    popularity: string;
    prize: string;
}

export interface HorseDetail {
    profile: HorseProfileRow[];
    relatives: HorseRelativeRow[];
    raceResults: HorseRaceResultRow[];
}

/**
 * HorseDetailクラス
 * @description PuppeteerのPageインスタンスを使用して馬の詳細情報を取得するクラス
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
 * @returns 馬のプロフィール・近親馬・競争成績
 */
    async getHorseDetail(horseId: string): Promise<HorseDetail> {
        const url = `https://db.netkeiba.com/horse/${horseId}/`;
        this.logger.info(`馬情報ページへアクセス: ${url}`);

        await this.page.goto(url, { waitUntil: "domcontentloaded" });
        await new Promise((resolve) => setTimeout(resolve, 1000));

        try {
            // プロフィールテーブル
            const profile: HorseProfileRow[] = await this.page.evaluate(() => {
                const rows = Array.from(document.querySelectorAll('.db_prof_table.no_OwnerUnit tr'));
                return rows.map(row => {
                    const label = row.querySelector('th')?.textContent?.trim() ?? '';
                    const td = row.querySelector('td');
                    let value = '';
                    let valueId = '';
                    if (td) {
                        // 「主な勝鞍」はテキストと最初のリンク(href)を分離する
                        if (label === '主な勝鞍') {
                            const anchors = Array.from(td.querySelectorAll('a'));
                            // テキストノード（リンク以外の表示）を優先して取得
                            const textNodes = Array.from(td.childNodes)
                                .filter(n => n.nodeType === Node.TEXT_NODE)
                                .map(n => (n.textContent ?? '').trim())
                                .filter(Boolean);
                            value = textNodes[0] ?? (anchors[0]?.textContent?.trim() ?? '');
                            const href = anchors[0]?.getAttribute('href') ?? '';
                            if (href) {
                                const m = href.match(/\/race\/(\d+)\/?/);
                                valueId = m ? m[1] : href;
                            }
                        } else {
                            value = Array.from(td.childNodes)
                                .map(node => (node.textContent ?? '').trim())
                                .filter(Boolean)
                                .join(' ');
                        }
                    }
                    return valueId ? { label, value, valueId } : { label, value };
                });
            });

            // 近親馬（「近親馬」thの行のtd内aタグ一覧）
            const relatives: HorseRelativeRow[] = await this.page.evaluate(() => {
                const rows = Array.from(document.querySelectorAll('.db_prof_table.no_OwnerUnit tr'));
                const relativeRow = rows.find(row => row.querySelector('th')?.textContent?.includes('近親馬'));
                if (!relativeRow) return [];
                const td = relativeRow.querySelector('td');
                if (!td) return [];
                return Array.from(td.querySelectorAll('a')).map(a => ({
                    relation: '近親馬',
                    name: a.textContent?.trim() ?? '',
                    info: a.getAttribute('href') ?? '',
                }));
            });

            // 競走成績テーブル
            const raceResults: HorseRaceResultRow[] = await this.page.evaluate(() => {
                const rows = Array.from(document.querySelectorAll('.db_h_race_results tbody tr'));
                return rows.map(row => {
                    const cells = row.querySelectorAll('td');
                    return {
                        date: cells[0]?.textContent?.trim() ?? '',
                        place: cells[1]?.textContent?.trim() ?? '',
                        raceName: cells[4]?.textContent?.trim() ?? '',
                        grade: '', // gradeはHTMLから直接取得できない場合は空文字
                        rank: cells[11]?.textContent?.trim() ?? '',
                        jockey: cells[12]?.textContent?.trim() ?? '',
                        time: cells[18]?.textContent?.trim() ?? '',
                        odds: cells[9]?.textContent?.trim() ?? '',
                        popularity: cells[10]?.textContent?.trim() ?? '',
                        prize: cells[28]?.textContent?.trim() ?? '',
                    };
                });
            });

            this.logger.info("馬情報の取得に成功しました");
            return { profile, relatives, raceResults };
        } catch (error) {
            this.logger.error(`馬情報の取得中にエラー: ${error}`);
            throw error;
        }
    }
}

/**
 * 馬プロフィールテーブルの各行をパースする関数
 */
function parseHorseProfileRows(rows: Element[]): HorseProfileRow[] {
    return rows.map((row) => {
        const th = row.querySelector("th");
        const td = row.querySelector("td");
        const label = th?.textContent?.trim() ?? "";
        let value = "";
        let valueId: string | undefined = undefined;
        if (td) {
            if (label === '主な勝鞍') {
                const anchors = Array.from(td.querySelectorAll('a'));
                const textNodes = Array.from(td.childNodes)
                    .filter(n => n.nodeType === Node.TEXT_NODE)
                    .map(n => (n.textContent ?? '').trim())
                    .filter(Boolean);
                value = textNodes[0] ?? (anchors[0]?.textContent?.trim() ?? "");
                const href = anchors[0]?.getAttribute('href') ?? "";
                if (href) {
                    const m = href.match(/\/race\/(\d+)\/?/);
                    valueId = m ? m[1] : href;
                }
            } else {
                value = td.textContent?.trim() ?? "";
            }
        }
        return valueId ? { label, value, valueId } : { label, value };
    });
}

/**
 * 近親馬テーブルの各行をパースする関数
 */
function parseHorseRelativeRows(rows: Element[]): HorseRelativeRow[] {
    // 1行目はヘッダーなのでスキップ
    return rows.slice(1).map((row) => {
        const cells = row.querySelectorAll("td");
        return {
            relation: cells[0]?.textContent?.trim() ?? "",
            name: cells[1]?.textContent?.trim() ?? "",
            info: cells[2]?.textContent?.trim() ?? "",
        };
    });
}

/**
 * 競争成績テーブルの各行をパースする関数
 */
function parseHorseRaceResultRows(rows: Element[]): HorseRaceResultRow[] {
    // 1行目はヘッダーなのでスキップ
    return rows.slice(1).map((row) => {
        const cells = row.querySelectorAll("td");
        return {
            date: cells[0]?.textContent?.trim() ?? "",
            place: cells[1]?.textContent?.trim() ?? "",
            raceName: cells[4]?.textContent?.trim() ?? "",
            grade: cells[5]?.textContent?.trim() ?? "",
            rank: cells[6]?.textContent?.trim() ?? "",
            jockey: cells[9]?.textContent?.trim() ?? "",
            time: cells[10]?.textContent?.trim() ?? "",
            odds: cells[13]?.textContent?.trim() ?? "",
            popularity: cells[14]?.textContent?.trim() ?? "",
            prize: cells[16]?.textContent?.trim() ?? "",
        };
    });
}