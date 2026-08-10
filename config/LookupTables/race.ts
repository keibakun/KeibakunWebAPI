/**
 * レースに関する情報を定義するルックアップテーブル
 *
 * @remarks
 * コース種別・天候・馬場・グレード・競走条件など、
 * レースそのものに関するコード変換マッピングを提供します。
 * ブラウザ文脈に渡す場合は plain object として定義されています。
 */

/** コース種別文字列 → CourseType コード */
export const COURSE_MAP: Record<string, number> = {
    芝: 1, ダート: 2, 障: 3,
};

/** コース先頭1文字（出馬表コース文字列の先頭）→ CourseType コード */
export const COURSE_CHAR_MAP: Record<string, number> = {
    芝: 1, ダ: 2, 障: 3,
};

/** 回り文字列 → MawariCode */
export const MAWARI_MAP: Record<string, number> = {
    右: 1, 左: 2, 直線: 3, 右外: 4, 左外: 5,
};

/** 天気文字列 → WeatherCode */
export const WEATHER_MAP: Record<string, number> = {
    晴: 1, 曇: 2, 雨: 3, 小雨: 4, 雪: 5,
};

/** 馬場状態文字列 → BabaCode（芝・ダート共通） */
export const BABA_MAP: Record<string, number> = {
    良: 1, 稍: 2, 稍重: 2, 重: 3, 不: 4, 不良: 4,
};

/** 芝コース種別文字 → ShibaCourseCode (0=なし, 1=A, 2=B, 3=C, 4=D) */
export const SHIBA_COURSE_MAP: Record<string, number> = {
    A: 1, B: 2, C: 3, D: 4,
};

/** レースグレード文字列 → GRADE コード */
export const GRADE_MAP: Record<string, number> = {
    GI: 1, G1: 1, "Ｇ１": 1, "GradeType1": 1,
    GII: 2, G2: 2, "Ｇ２": 2, "GradeType2": 2,
    GIII: 3, G3: 3, "Ｇ３": 3, "GradeType3": 3,
    重賞: 4, "GradeType4": 4,
    オープン: 5, OP: 5, "GradeType5": 5,
    "1600万下": 6, "GradeType6": 6,
    "1000万下": 7, "GradeType7": 7,
    "500万下": 8, "GradeType8": 8,
    新馬: 9, "GradeType9": 9,
    JG1: 10, "ＪＧ１": 10, "GradeType10": 10,
    JG2: 11, "ＪＧ２": 11, "GradeType11": 11,
    JG3: 12, "ＪＧ３": 12, "GradeType12": 12,
    L: 15, "Ｌ": 15, "GradeType15": 15,
    "3勝クラス": 16, "３勝クラス": 16, "GradeType16": 16,
    "2勝クラス": 17, "２勝クラス": 17, "GradeType17": 17,
    "1勝クラス": 18, "１勝クラス": 18, "GradeType18": 18,
    未勝利: 19, "GradeType19": 19,
};

/** 馬カテゴリ文字列 → HorseCategoryCode */
export const HORSE_CATEGORY_MAP: Record<string, number> = {
    "サラ系２歳": 1,
    "サラ系３歳": 2,
    "サラ系３歳以上": 3,
    "サラ系４歳以上": 4,
    "障害３歳以上": 5,
    "障害４歳以上": 6,
};

/**
 * 競走条件フラグ定数
 *
 * @remarks
 * 各フラグのビット値を定義します。
 * 実際の条件コードは JOKEN_TOKEN_MAP を使ってトークンを検出し、フラグの OR で構成します。
 *
 * ビット割り当て:
 *   0x01 (  1) = MIX      混合（牡牝混合・地方馬含む）
 *   0x02 (  2) = INTL     国際競走
 *   0x04 (  4) = MARE     牝馬限定
 *   0x08 (  8) = KORYU    交流指定 [指]
 *   0x10 ( 16) = TOKUSHI  特別指定 (指)/(特指)
 *   0x20 ( 32) = KYUSHU   九州産馬限定
 *   0x40 ( 64) = MINARAI  見習騎手
 */
export const JOKEN_FLAG = {
    MIX:     0x01,
    INTL:    0x02,
    MARE:    0x04,
    KORYU:   0x08,
    TOKUSHI: 0x10,
    KYUSHU:  0x20,
    MINARAI: 0x40,
} as const;

/**
 * 競走条件トークン → JokenFlag
 *
 * @remarks
 * 条件文字列から各トークンを検出し、対応するフラグを OR して条件コードを構成します。
 * "牡・牝" は性別制限なしの明示なので牝フラグを立てません。
 * 解析時は `jokenStr.replace("牡・牝", "")` で正規化してから本マップを適用します。
 *
 * 実データで確認済みの全28パターンと対応コード:
 *   ""                    → 0x00
 *   "(混)"                → 0x01
 *   "(国際)"               → 0x02
 *   "(混) 牝"              → 0x05  MIX|MARE
 *   "(混)[指]"             → 0x09  MIX|KORYU
 *   "(混)(指)"             → 0x11  MIX|TOKUSHI
 *   "(混)(特指)"            → 0x11  MIX|TOKUSHI        ※(指)=(特指)
 *   "[指]"                → 0x08
 *   "(特指)"               → 0x10
 *   "(国際)[指]"            → 0x0A  INTL|KORYU
 *   "(国際)(指)"            → 0x12  INTL|TOKUSHI
 *   "(国際)(特指)"           → 0x12  INTL|TOKUSHI       ※(指)=(特指)
 *   "(国際) 牡・牝(指)"      → 0x12  INTL|TOKUSHI       ※牡・牝=制限なし
 *   "(国際) 牡・牝"          → 0x02  INTL               ※牡・牝=制限なし
 *   "牝"                  → 0x04
 *   "(混) 牝(指)"          → 0x15  MIX|MARE|TOKUSHI
 *   "(混) 牝(特指)"         → 0x15  MIX|MARE|TOKUSHI   ※(指)=(特指)
 *   "(国際) 牝"             → 0x06  INTL|MARE
 *   "(国際) 牝(指)"         → 0x16  INTL|MARE|TOKUSHI
 *   "(国際) 牝(特指)"        → 0x16  INTL|MARE|TOKUSHI  ※(指)=(特指)
 *   "牝(特指)"              → 0x14  MARE|TOKUSHI
 *   "牝[指]"               → 0x0C  MARE|KORYU
 *   "(混) 牝[指]"           → 0x0D  MIX|MARE|KORYU
 *   "(国際) 牝[指]"          → 0x0E  INTL|MARE|KORYU
 *   "九州産馬"               → 0x20
 *   "九州産馬(指)"            → 0x30  KYUSHU|TOKUSHI
 *   "九州産馬[指]"            → 0x28  KYUSHU|KORYU
 *   "見習騎手"               → 0x40
 */
export const JOKEN_TOKEN_MAP: Record<string, number> = {
    "(混)":   JOKEN_FLAG.MIX,
    "(国際)": JOKEN_FLAG.INTL,
    "牝":     JOKEN_FLAG.MARE,
    "[指]":   JOKEN_FLAG.KORYU,
    "(指)":   JOKEN_FLAG.TOKUSHI,
    "(特指)": JOKEN_FLAG.TOKUSHI,
    "九州産馬": JOKEN_FLAG.KYUSHU,
    "見習騎手": JOKEN_FLAG.MINARAI,
};

/** 重量区分文字列 → JyuryoKubunCode */
export const JYURYO_KUBUN_MAP: Record<string, number> = {
    馬齢: 1, 定量: 2, 別定: 3, ハンデ: 4,
};
