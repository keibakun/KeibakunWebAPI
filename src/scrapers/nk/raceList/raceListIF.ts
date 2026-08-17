/**
 * @interface RaceItem
 * レースアイテムの情報を表すインターフェース
 * @property {string} raceName - レース名
 * @property {string} raceTime - レース時間
 * @property {number} raceCourse - コース種別コード (1:芝, 2:ダ, 3:障)
 * @property {number} raceDistance - 距離（メートル）
 * @property {number} tousuu - 頭数
 * @property {string} raceId - レースID
 * @property {number} grade - レースグレードコード
 */
export interface RaceItem {
    raceName: string;
    raceTime: string;
    raceCourse: number;
    raceDistance: number;
    tousuu: number;
    raceId: string;
    grade: number;
}

/**
 * @interface RaceTitle
 * レースタイトルの情報を表すインターフェース
 * @property {number} kaiji - 回次
 * @property {number} venue - 開催場コード (VENUE_MAP準拠)
 * @property {number} times - 日目
 */
export interface RaceTitle {
    kaiji: number;
    venue: number;
    times: number;
}

/**
 * @interface Condition
 * 馬場状態を表すインターフェース
 * @property {number} shiba - 芝馬場状態コード (BABA_MAP準拠、0=情報なし)
 * @property {number} dart - ダート馬場状態コード (BABA_MAP準拠、0=情報なし)
 */
export interface Condition {
    shiba: number;
    dart: number;
}

/**
 * @interface RaceData
 * レースデータの情報を表すインターフェース
 * @property {RaceTitle} title - レースタイトル
 * @property {Condition} condition - 馬場状態
 * @property {number} shibaCourse - 芝コース種別コード (0=なし, 1=A, 2=B, 3=C, 4=D)
 * @property {RaceItem[]} items - レースアイテムの配列
 */
export interface RaceData {
    title: RaceTitle;
    condition: Condition;
    shibaCourse: number;
    items: RaceItem[];
}