/**
 * @interface RawSyutubaIF
 * ブラウザ抽出段階の出走馬情報（文字列のまま）
 * @internal shutuba.ts 内部でのみ使用
 */
export interface RawSyutubaIF {
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
 * @interface SyutubaIF
 * @property {number} umaban - 馬番
 * @property {string} horseName - 馬名
 * @property {string} horseId - 馬ID
 * @property {number} sex - 性別コード（SEX_MAP: 牡=1, 牝=2, セン=3）
 * @property {number} age - 年齢
 * @property {number} kinryou - 斤量
 * @property {number} jockeyMark - 騎手マークコード（JOCKEY_MARK_MAP: 0=なし, 1=☆, 2=▲, 3=△, 4=◇）
 * @property {string} jockey - 騎手名（マーク除去済み）
 * @property {string} jockeyId - 騎手ID
 * @property {string} trainer - 調教師名
 * @property {string} trainerId - 調教師ID
 * @property {number} weightNum - 馬体重（kg）
 * @property {number} weightDiff - 馬体重増減（kg、符号付き）
 */
export interface SyutubaIF {
    umaban: number;
    horseName: string;
    horseId: string;
    sex: number;
    age: number;
    kinryou: number;
    jockeyMark: number;
    jockey: string;
    jockeyId: string;
    trainer: string;
    trainerId: string;
    weightNum: number;
    weightDiff: number;
}

/**
 * @interface RawRaceIF
 * ブラウザ抽出段階のレース情報（文字列のまま）
 * @internal shutuba.ts 内部でのみ使用
 */
export interface RawRaceIF {
    raceNum: string;
    raceName: string;
    grade: string;
    raceTime: string;
    course: string;
    weather: string;
    baba: string;
    raceData: string[];
    syutuba: RawSyutubaIF[];
}

/**
 * @interface RaceIF
 * レース情報（コード化済み）
 * @property {number} raceNum - レースナンバー（1〜12）
 * @property {string} raceName - レース名
 * @property {number} grade - グレードコード（GRADE_MAP: G1=1, G2=2, G3=3, L=15 ...）
 * @property {string} raceTime - 出走時刻（HH:MM）
 * @property {number} courseType - コース種別コード（COURSE_MAP: 芝=1, ダート=2, 障=3）
 * @property {number} distance - 距離（m）
 * @property {number} mawari - 回りコード（MAWARI_MAP: 右=1, 左=2, 直線=3, 右外=4, 左外=5）
 * @property {number} shibaKubun - 芝コース種別コード（SHIBA_COURSE_MAP: 0=なし, A=1, B=2, C=3, D=4）
 * @property {number} weather - 天候コード（WEATHER_MAP）
 * @property {number} baba - 馬場状態コード（BABA_MAP）
 * @property {number} kaisaiKai - 開催回（1〜3）
 * @property {number} venue - 競馬場コード（VENUE_MAP: 国内1〜90, 海外99, 香港100台, UAE200台, 仏300台, 英400台 ...）
 * @property {number} kaisaiDay - 開催日目（1〜12）
 * @property {number} horseCategory - 馬カテゴリコード（HORSE_CATEGORY_MAP）
 * @property {number} raceClass - クラスコード（GRADE_MAP: 未勝利=19, 1勝=18, 2勝=17, 3勝=16, OP=5, 新馬=9）
 * @property {number} joken - 条件ビットマスク（JOKEN_MAP）
 * @property {number} jyuryoKubun - 重量区分コード（JYURYO_KUBUN_MAP: 馬齢=1, 定量=2, 別定=3, ハンデ=4）
 * @property {number} tousu - 出走頭数
 * @property {number[]} honShokin - 本賞金（万円）配列（1着〜5着）
 * @property {SyutubaIF[]} syutuba - 出走馬情報
 */
export interface RaceIF {
    raceNum: number;
    raceName: string;
    grade: number;
    raceTime: string;
    courseType: number;
    distance: number;
    mawari: number;
    shibaKubun: number;
    weather: number;
    baba: number;
    kaisaiKai: number;
    venue: number;
    kaisaiDay: number;
    horseCategory: number;
    raceClass: number;
    joken: number;
    jyuryoKubun: number;
    tousu: number;
    honShokin: number[];
    syutuba: SyutubaIF[];
}
