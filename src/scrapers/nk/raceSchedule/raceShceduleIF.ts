/**
 * @interface Race
 * レース情報のインターフェース
 * @property {number} venue - 開催場コード（VENUE_MAP: 東京=5, 阪神=9 ...）
 * @property {string} raceName - レース名
 */
export interface Race {
    venue: number;
    raceName: string;
}

/**
 * @interface Schedule
 * 開催日程のインターフェース
 * @property {string} date - 日付
 * @property {string} day - 曜日
 * @property {string} kaisaiDate - リンク
 * @property {string} races - レース情報の配列
 */
export interface Schedule {
    date: string;
    day: string;
    kaisaiDate: string;
    races: Race[];
}