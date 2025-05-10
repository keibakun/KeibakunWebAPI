/**
 * レース情報の型
 */
export interface Race {
    /** 開催場 */
    venue: string;
    /** レース名 */
    raceName: string;
}

/**
 * 開催日程の型
 */
export interface Schedule {
    /** 日付 */
    date: string;
    /** 曜日 */
    day: string;
    /** リンク */
    kaisaiDate: string;
    /** レース情報の配列 */
    races: Race[];
}