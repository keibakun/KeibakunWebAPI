/**
 * レース結果テーブルの1行を表すインターフェース
 */
export interface RaceResultRow {
    rank: string;
    umaban: string;
    horseName: string;
    horseId: string;
    sexAge: string;
    kinryou: string;
    jockey: string;
    jockeyId: string;
    time: string;
    chakusa: string;
    ninki: string;
    odds: string;
    agari: string;
    tsuuka: string;
    trainer: string;
    trainerId: string;
    bataijuu: string;
}

/**
 * 払い戻し情報の集合を表すインターフェース
 */
export interface RefundIF {
    tansho: { umaban: string; payout: string; ninki: string }[];
    fukusho: { umaban: string; payout: string; ninki: string }[];
    wakuren: { combination: string[]; payout: string; ninki: string }[];
    umaren: { combination: string[]; payout: string; ninki: string }[];
    wide: { combination: string[]; payout: string; ninki: string }[];
    umatan: { combination: string[]; payout: string; ninki: string }[];
    sanrenpuku: { combination: string[]; payout: string; ninki: string }[];
    sanrentan: { combination: string[]; payout: string; ninki: string }[];
}

/**
 * コーナー通過順を表すインターフェース
 */
export interface CornerOrderIF {
    corner1: string;
    corner2: string;
    corner3: string;
    corner4: string;
}

/**
 * ラップタイム（ヘッダーと各馬のタイム行）を表すインターフェース
 */
export interface LapTimeIF {
    pace: string;
    headers: string[];
    times: string[][];
}

/**
 * レース結果と関連情報をまとめたコンテナ型
 */
export interface RaceResultWithRefund {
    result: RaceResultRow[];
    refund: RefundIF;
    cornerOrder: CornerOrderIF;
    lapTime: LapTimeIF;
}