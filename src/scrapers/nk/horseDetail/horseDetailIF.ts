/**
 * 馬の性別（血統ノード用文字列型）
 */
export type HorseGender = '牡' | '牝' | 'せん';

/**
 * 性別コード。
 * `1`=牡 / `2`=牝 / `3`=せん / `0`=不明
 */
export type HorseSex = number;

/**
 * 毛色コード（JRA公認8毛色）。
 * `1`=鹿毛 / `2`=黒鹿毛 / `3`=青鹿毛 / `4`=青毛 /
 * `5`=栗毛 / `6`=栃栗毛 / `7`=芦毛 / `8`=白毛 / `0`=不明
 */
export type HorseCoatColor = number;

/**
 * 競馬場コード（JRA10場）。
 * `1`=札幌 / `2`=函館 / `3`=福島 / `4`=新潟 / `5`=東京 /
 * `6`=中山 / `7`=中京 / `8`=京都 / `9`=阪神 / `10`=小倉
 * JRA以外（地方・海外）の場合は `null`。
 */
export type VenueCode = number | null;

/**
 * コース種別コード。
 * `1`=芝 / `2`=ダート / `3`=障害 / `null`=不明
 */
export type CourseType = number | null;

/**
 * 天気コード。
 * `1`=晴 / `2`=曇 / `3`=雨 / `4`=小雨 / `5`=雪 / `0`=不明
 */
export type WeatherCode = number;

/**
 * 馬場状態コード（芝・ダート共通）。
 * `1`=良 / `2`=稍重 / `3`=重 / `4`=不良 / `0`=不明
 */
export type BabaCode = number;

/**
 * 5代血統表の1ノード（1頭分）。
 *
 * @interface PedigreeNode
 */
export interface PedigreeNode {
    /** 馬ID（netkeiba horseId。不明の場合は空文字） */
    id: string;
    /** 馬名 */
    name: string;
    /** 性別 */
    gender: HorseGender;
}

/**
 * 5代血統表（ヒープ方式インデックス）。
 *
 * キーは整数のヒープインデックスを文字列化したもの。
 * - `"1"` : 本馬
 * - `"2"` : 父 / `"3"` : 母
 * - `"4"` : 父父 / `"5"` : 父母 / `"6"` : 母父 / `"7"` : 母母
 * - 偶数インデックス = 父系（牡） / 奇数インデックス = 母系（牝）
 * - 親ノードのインデックス `i` に対し、父 = `2i`、母 = `2i+1`
 * - 最大インデックス `"63"`（第5世代）
 */
export type Pedigree = Record<string, PedigreeNode>;

/**
 * 馬の個別データのインターフェース。
 *
 * @interface HorseProfile
 */
export interface HorseProfile {
    /** 馬名 */
    name: string;
    /** 現役/引退などの状態 */
    status: string;
    /** 性別コード。`1`=牡 / `2`=牝 / `3`=せん */
    sex: HorseSex;
    /** 馬齢（例：3） */
    age: number;
    /** 毛色コード */
    type: HorseCoatColor;
    /** 生年月日（元の表記） */
    birthDate: string;
    /** 調教師（調教師名） */
    trainer: string;
    /** 調教師ID */
    trainerId: string;
    /** 厩舎（美浦・栗東など） */
    kyuusya: string;
    /** 馬主 */
    owner: string;
    /** 馬主ID */
    ownerId: string;
    /** 生産者 */
    breeder: string;
    /** 生産者ID */
    breederId: string;
    /** 5代血統表（ヒープインデックス形式。未取得の場合は省略） */
    pedigree?: Pedigree;
}

/**
 * レース自体の情報（開催・コース・条件など）
 *
 * @interface RaceInfo
 */
export interface RaceInfo {
    /** 開催日（YYYY/MM/DD） */
    date: string;
    /** 回次（例: 2回開催なら 2） */
    kaiji: number | null;
    /** 競馬場コード。JRA以外（地方/海外）は `null` */
    venue: VenueCode;
    /** 開催日目（例: 3日目なら 3） */
    day: number | null;
    /** レースID（`/race/<raceId>/` から抽出） */
    raceId: string;
    /** レース名（グレード括弧なし） */
    raceName: string;
    /**
     * グレード区分（数値）。
     * `1`=G1 / `2`=G2 / `3`=G3 / `4`=重賞 / `5`=OP /
     * `6`=1600下 / `7`=1000下 / `9`=500下 /
     * `10`=JG1 / `11`=JG2 / `12`=JG3 /
     * `15`=L / `16`=3勝 / `17`=2勝 / `18`=1勝 / `19`=新馬 / `20`=未勝利
     * 該当なし・不明の場合は `0`。
     */
    grade: number;
    /** R（レース番号） */
    R: number | null;
    /** コース種別コード。`1`=芝 / `2`=ダート / `3`=障害 */
    course: CourseType;
    /** 距離（m） */
    distance: number | null;
    /**
     * 天気コード。
     * `1`=晴 / `2`=曇 / `3`=雨 / `4`=小雨 / `5`=雪 / `0`=不明
     */
    weather: WeatherCode;
    /**
     * 馬場状態コード。
     * `1`=良 / `2`=稍重 / `3`=重 / `4`=不良 / `0`=不明
     */
    baba: BabaCode;
    /** 頭数 */
    tousuu: number | null;
}

/**
 * 出走登録情報（馬・騎手に紐づく情報）
 *
 * @interface EntryInfo
 */
export interface EntryInfo {
    /** 枠番 */
    wakuban: number | null;
    /** 馬番 */
    umaban: number | null;
    /** 斤量 */
    kinryou: number | null;
    /** 騎手名 */
    jockey: string;
    /** 騎手ID */
    jockeyId: string;
    /** オッズ */
    odds: number | null;
    /** 人気 */
    popularity: number | null;
}

/**
 * 出走結果情報
 *
 * @interface ResultInfo
 */
export interface ResultInfo {
    /** 着順 */
    rank: string;
    /** タイム */
    time: string;
    /** 賞金（万円） */
    prize: number | null;
    /** 着差 */
    tyakusa: number | null;
    /** 1コーナー通過順位 */
    tuuka1c: number | null;
    /** 2コーナー通過順位 */
    tuuka2c: number | null;
    /** 3コーナー通過順位 */
    tuuka3c: number | null;
    /** 4コーナー通過順位 */
    tuuka4c: number | null;
    /** 上り（上がり3F秒） */
    last3f: number | null;
    /** 馬体重（kg） */
    weight: number | null;
    /** 厩舎コメント */
    comment: string;
    /** 勝ち馬（1着時は2着馬） */
    winnerOrSecondary: string;
}

/**
 * レース結果1行分（race / entry / result の3分割構造）
 *
 * @interface HorseRaceResultRow
 */
export interface HorseRaceResultRow {
    /** レース自体の情報 */
    race: RaceInfo;
    /** 出走登録情報（馬・騎手） */
    entry: EntryInfo;
    /** 出走結果情報 */
    result: ResultInfo;
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