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

export interface CornerOrderIF {
    corner1: string;
    corner2: string;
    corner3: string;
    corner4: string;
}

export interface LapTimeIF {
    pace: string;
    headers: string[];
    times: string[][];
}

export interface RaceResultWithRefund {
    result: RaceResultRow[];
    refund: RefundIF;
    cornerOrder: CornerOrderIF;
    lapTime: LapTimeIF;
}