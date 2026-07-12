/**
 * @file raceResultDBIF.ts
 * @description DB格納用レース結果インターフェース（仮）
 *
 * 現行の raceResultIF.ts / newRaceResultIF.ts を元に、
 * DB格納を想定して以下の変換方針を適用したドラフト版。
 *
 * ### 変換方針
 * | フィールド       | 旧                        | 新                                      |
 * |-----------------|---------------------------|-----------------------------------------|
 * | sexAge          | string "牝2"              | sex: number(コード) + age: number\|null  |
 * | kinryou         | string "55.0"             | number\|null                            |
 * | ninki           | string "2"                | number\|null                            |
 * | odds            | string "3.9"              | number\|null                            |
 * | agari           | string "33.9"             | number\|null                            |
 * | bataijuu        | string "460"              | number\|null                            |
 * | umaban          | string "5"                | number                                  |
 * | tsuuka          | string "3-3" / "3-3-3-3"  | tuuka1c〜4c: number\|null に分解        |
 * | rank            | string                    | 文字列のまま（"中止"/"取消"/"除外" あり） |
 * | chakusa         | string                    | 文字列のまま（馬身を表す文字列）          |
 * | time            | string "1:33.8"           | 文字列のまま                             |
 * | lapTime.pace    | string "S"/"M"/"H"        | number コード (1=S/2=M/3=H/0=不明)      |
 * | refund の数値   | string                    | number                                  |
 */

import { HorseSex } from '../horseDetail/horseDetailIF';

// ---------------------------------------------------------------------------
// 共通型
// ---------------------------------------------------------------------------

/**
 * ペースコード。
 * `1`=スロー(S) / `2`=ミドル(M) / `3`=ハイ(H) / `0`=不明
 */
export type PaceCode = number;

// ---------------------------------------------------------------------------
// レース結果行
// ---------------------------------------------------------------------------

/**
 * レース結果テーブルの1行（DB格納用）。
 *
 * @interface RaceResultRow
 */
export interface RaceResultRow {
    /**
     * 着順。
     * 通常は数値文字列 `"1"` 〜 `"18"` だが、
     * 競走中止・取消・除外の場合は `"中止"` / `"取消"` / `"除外"` となる。
     */
    rank: string;

    /** 馬番 */
    umaban: number;

    /** 馬名 */
    horseName: string;

    /** 馬ID（netkeiba horseId） */
    horseId: string;

    /**
     * 性別コード。
     * `1`=牡 / `2`=牝 / `3`=せん / `0`=不明
     */
    sex: HorseSex;

    /** 馬齢 */
    age: number | null;

    /** 斤量（kg） */
    kinryou: number | null;

    /** 騎手名 */
    jockey: string;

    /** 騎手ID */
    jockeyId: string;

    /**
     * タイム（元の文字列表記を保持）。
     * 例: `"1:33.8"`
     */
    time: string;

    /**
     * 着差（馬身を表す文字列をそのまま保持）。
     * 例: `""` (1着) / `"ハナ"` / `"クビ"` / `"アタマ"` /
     *     `"1/2"` / `"3/4"` / `"1.3/4"` / `"大"` / `"同着"`
     */
    chakusa: string;

    /** 人気 */
    ninki: number | null;

    /** 単勝オッズ */
    odds: number | null;

    /** 上がり3F（秒） */
    agari: number | null;

    /**
     * 1コーナー通過順位。
     * そのコーナーが存在しないコース（例: 1200m 等）は `null`。
     */
    tuuka1c: number | null;

    /** 2コーナー通過順位。存在しない場合は `null`。 */
    tuuka2c: number | null;

    /** 3コーナー通過順位。存在しない場合は `null`。 */
    tuuka3c: number | null;

    /** 4コーナー通過順位。存在しない場合は `null`。 */
    tuuka4c: number | null;

    /** 調教師名 */
    trainer: string;

    /** 調教師ID */
    trainerId: string;

    /** 馬体重（kg） */
    bataijuu: number | null;
}

// ---------------------------------------------------------------------------
// 払い戻し
// ---------------------------------------------------------------------------

/**
 * 払い戻し1件（単勝・複勝など馬番1頭指定系）。
 *
 * @interface RefundEntry
 */
export interface RefundEntry {
    /** 馬番 */
    umaban: number;
    /** 払戻金（円） */
    payout: number;
    /** 人気 */
    ninki: number;
}

/**
 * 払い戻し1件（馬連・三連複など複数馬番の組み合わせ系）。
 *
 * @interface RefundCombEntry
 */
export interface RefundCombEntry {
    /** 馬番の組み合わせ */
    combination: number[];
    /** 払戻金（円） */
    payout: number;
    /** 人気 */
    ninki: number;
}

/**
 * 払い戻し情報。
 *
 * @interface RefundIF
 */
export interface RefundIF {
    /** 単勝 */
    tansho: RefundEntry[];
    /** 複勝 */
    fukusho: RefundEntry[];
    /** 枠連 */
    wakuren: RefundCombEntry[];
    /** 馬連 */
    umaren: RefundCombEntry[];
    /** ワイド */
    wide: RefundCombEntry[];
    /** 馬単 */
    umatan: RefundCombEntry[];
    /** 三連複 */
    sanrenpuku: RefundCombEntry[];
    /** 三連単 */
    sanrentan: RefundCombEntry[];
}

// ---------------------------------------------------------------------------
// コーナー通過順（レース全体）
// ---------------------------------------------------------------------------

/**
 * コーナー通過順（レース全体のブロック文字列）。
 *
 * 各フィールドは、そのコーナー時点での全馬の位置関係を表す文字列。
 * 例: `"7-8,5(3,10)(2,6,9)(1,4)"`
 *
 * ※ 各馬の通過順位は {@link RaceResultRow} の `tuuka1c` 〜 `tuuka4c` を参照。
 *
 * @interface CornerOrderIF
 */
export interface CornerOrderIF {
    corner1: string;
    corner2: string;
    corner3: string;
    corner4: string;
}

// ---------------------------------------------------------------------------
// ラップタイム
// ---------------------------------------------------------------------------

/**
 * ラップタイム情報。
 *
 * @interface LapTimeIF
 */
export interface LapTimeIF {
    /**
     * ペースコード。
     * `1`=スロー(S) / `2`=ミドル(M) / `3`=ハイ(H) / `0`=不明
     */
    pace: PaceCode;

    /**
     * 距離ヘッダー。
     * 例: `["200m", "400m", "600m", "800m", "1000m", "1200m", "1400m", "1600m"]`
     */
    headers: string[];

    /**
     * ラップタイム2行。
     * `times[0]` = 累積タイム（例: `["12.4", "23.6", ..., "1:33.8"]`）
     * `times[1]` = 区間タイム（例: `["12.4", "11.2", ..., "11.4"]`）
     */
    times: string[][];
}

// ---------------------------------------------------------------------------
// コンテナ
// ---------------------------------------------------------------------------

/**
 * レース結果コンテナ（DB格納用）。
 *
 * @interface RaceResultWithRefund
 */
export interface RaceResultWithRefund {
    result: RaceResultRow[];
    refund: RefundIF;
    cornerOrder: CornerOrderIF;
    lapTime: LapTimeIF;
}
