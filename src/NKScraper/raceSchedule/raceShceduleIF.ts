/**
 * @interface Race
 * @description レース情報のインターフェース
 * @property {string} venue - 開催場
 * @property {string} raceName - レース名
 */
export interface Race {
    venue: string;
    raceName: string;
}

/**
 * @interface Schedule
 * @description 開催日程のインターフェース
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