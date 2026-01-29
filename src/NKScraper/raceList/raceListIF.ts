/**
 * @interface RaceItem
 * レースアイテムの情報を表すインターフェース
 * @property {string} raceName - レース名
 * @property {string} raceTime - レース時間
 * @property {string} raceCourse - コース情報
 * @property {string} tousuu - 頭数
 * @property {string} raceId - レースID
 * @property {string} grade - レースグレード
 */
export interface RaceItem {
    raceName: string;
    raceTime: string;
    raceCourse: string;
    tousuu: string;
    raceId: string;
    grade: string;
}

/**
 * @interface RaceTitle
 * レースタイトルの情報を表すインターフェース
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
 * @interface RaceData
 * レースデータの情報を表すインターフェース
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