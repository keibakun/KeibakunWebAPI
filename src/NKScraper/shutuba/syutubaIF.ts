/**
 * @interface SyutubaIF
 * 出走馬情報のインターフェース
 * @property {string} umaban - 馬番
 * @property {string} horseName - 馬名
 * @property {string} horseId - 馬ID
 * @property {string} sexage - 性齢
 * @property {string} kinryou - 斤量
 * @property {string} jockey - 騎手名
 * @property {string} jockeyId - 騎手ID
 * @property {string} trainer - 調教師名
 * @property {string} trainerId - 調教師ID
 * @property {string} weight - 馬体重
 */
export interface SyutubaIF {
    umaban: string;
    horseName: string;
    horseId: string;
    sexage: string;
    kinryou: string;
    jockey: string;
    jockeyId: string;
    trainer: string;
    trainerId: string;
    weight: string;
}

/**
 * @interface RaceIF
 * レース情報のインターフェース
 * @property {string} raceNum - レースナンバー
 * @property {string} raceName - レース名
 * @property {string} grade - レースグレード
 * @property {string} raceTime - 出走時刻
 * @property {string} course - コース
 * @property {string} weather - 天候
 * @property {string} baba - 馬場
 * @property {string[]} raceData - レースデータ
 * @property {SyutubaIF[]} syutuba - 出走馬情報
 */
export interface RaceIF {
    raceNum: string;
    raceName: string;
    grade: string;
    raceTime: string;
    course: string;
    weather: string;
    baba: string;
    raceData: string[];
    syutuba: SyutubaIF[];
}