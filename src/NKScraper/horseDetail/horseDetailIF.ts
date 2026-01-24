/**
 * Horse profile information.
 *
 * @interface HorseProfile
 */
export interface HorseProfile {
    /** 馬名 */
    name: string;
    /** 現役/引退などの状態 */
    status: string;
    /** 性齢（例: 牡3歳） */
    sexage: string;
    /** 毛色 */
    type: string;
    /** 生年月日（元の表記） */
    birthDate: string;
    /** 馬主 */
    owner: string;
    /** 生産者 */
    breeder: string;
    /** 調教師（名前＋所属） */
    trainer: string;
    /** 通算成績の表示（例: "16戦3勝 [ 3-3-1-9 ]"） */
    career: string;
}

/**
 * Single race result row for a horse.
 *
 * フィールドはすべて必須で、値が無い場合は空文字になります。
 *
 * @interface HorseRaceResultRow
 */
export interface HorseRaceResultRow {
    /** 開催日（表示用） */
    date: string;
    /** 開催情報（例: "4東京11"） */
    place: string;
    /** レース名（表示用） */
    raceName: string;
    /** グレード等（未取得なら空文字） */
    grade: string;
    /** 着順 */
    rank: string;
    /** 騎手名 */
    jockey: string;
    /** タイム */
    time: string;
    /** オッズ */
    odds: string;
    /** 人気（表示） */
    popularity: string;
    /** 賞金（表示） */
    prize: string;
    /** レースID（`/race/<raceId>/` から抽出） */
    raceId: string;
    /** 天気（例: "晴" / "曇"） */
    weather: string;
    /** R（ラウンド／レース番号の表示） */
    R: string;
    /** 頭数 */
    tousuu: string;
    /** 枠番 */
    wakuban: string;
    /** 馬番 */
    umaban: string;
    /** 斤量（数値表示） */
    kinryou: string;
    /** 距離（例: "芝2000"） */
    distance: string;
    /** 馬場状態（例: "良"） */
    baba: string;
    /** 着差 */
    tyakusa: string;
    /** 通過（例: "9-6-8"） */
    tuuka: string;
    /** ペース（表示） */
    pace: string;
    /** 上り（上がり3Fなど） */
    last3f: string;
    /** 馬体重（例: "470(+4)"） */
    weight: string;
    /** 厩舎コメントなどのリンク（href）を格納する場合がある */
    comment: string;
    /** 勝ち馬（および2着馬 表示） */
    winnerOrSecondary: string;
}

/**
 * Horse detail container: profile + race results.
 *
 * @interface HorseDetail
 */
export interface HorseDetail {
    profile: HorseProfile;
    raceResults: HorseRaceResultRow[];
}