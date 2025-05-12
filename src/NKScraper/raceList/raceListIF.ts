/**
 * レースアイテムの型
 * @interface RaceItem
 * @property {string} raceName - レース名
 * @property {string} raceTime - レース時間
 * @property {string} raceCourse - コース情報
 * @property {string} tousuu - 頭数
 * @property {string} raceId - レースID
 */
export interface RaceItem {
    raceName: string;
    raceTime: string;
    raceCourse: string;
    tousuu: string;
    raceId: string;
}

/**
 * レースタイトルの型
 * @interface RaceTitle
 * @property {string} kaiji - 回次
 * @property {string} venue - 開催場
 * @property {string} times - 日目
 */
export interface RaceTitle {
    kaiji: string;
    venue: string;
    times: string;
}

/**
 * レースデータの型
 * @interface RaceData
 * @property {RaceTitle} title - レースタイトル
 * @property {string} shiba - 芝情報
 * @property {string} da - ダート情報
 * @property {RaceItem[]} items - レースアイテムの配列
 */
export interface RaceData {
    title: RaceTitle;
    shiba: string;
    da: string;
    items: RaceItem[];
}