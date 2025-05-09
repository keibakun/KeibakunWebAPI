/**
 * レース一覧から取得したレース情報のインターフェイス
 */

export interface Race {
    /**レース情報 */
    NextRace: {
        /** レースID */
        RaceId: string;
        /** レース名 */
        RaceName: string;
        /** グレード */
        RaceGrade: string;
        /** 発走日時 */
        StartTime: Date | undefined;
        /** 出走条件 */
        EntryCondition: string;
    }
    /** コース情報 */
    CourseInfo: {
        /** 開催場 */
        Venue: string;
        /** 開催回数 */
        VenueTimes: string;
        /** コース形態 */
        CourseForm: string;
        /** 芝スタートかどうか */
        isTurfStart: boolean;
        /** コース状態 */
        CourseState?: string;
        /** 芝のクッション値 */
        TurfCushionValue?: number;
    }
    /** 天候 */
    Weather?: string;
    /** 出走馬 */
    EntryHorse: {
        /** 枠番 */
        Wakuban: number | undefined;
        /** 馬番 */
        Umaban: number | undefined;
        /** 馬 */
        Horse: {
            /** 馬ID */
            HorseId: string;
            /** 馬名 */
            HorseName: string;
        }
        /** 性別 */
        Sex: string;
        /** 馬齢 */
        Age: number;
        /** 馬体重 */
        Weight: {
            /** 馬体重値 */
            WeightValue: number | undefined;
            /** 馬体重増減 */
            InOrDecreaseValue: number | string | undefined;
        }
    }
    /** 騎手 */
    Kisyu: {
        /** 騎手ID */
        KisyuId: string | undefined;
        /** 騎手名 */
        KisyuName: string | undefined;
        /** 斤量 */
        Kinryou: string | undefined;
    }
}

export interface NextRace {
    RaceName: string;
    RaceDetails: {
        RaceTime: string;
        RaceCourse: string;
        HeadCount: string;
    };
    RaceID: string | null;
}

export interface Horse {
    // 未出走の場合も考慮して全てのプロパティは任意
    RaceData: {
        RaceName?: string | null;
        RaceID?: string;
        Comment?: string | null;
    }
}

export interface Syutuba {
    RaceName: string | null;
    RaceData: string | null;
    Umaban: number | null,
    HorseName: string | null;
    HorseID: string | null;
    HorseAge: string | null;
    Jockey: string | null;
    Kinryou: string | null;
    Weight: string | null;
}

export interface RaceTop {
    RaceName: string | null;
    RaceDetails: {
        RaceTime: string | null;
        RaceDay: string | null;
        RaceCourse: string | null;
        HeadCount: string | null;
    };
    RaceID: string | null;
    Umaban: number | null,
    HorseName: string | null;
    HorseURL: string | null;
    HorseAge: string | null;
    Jockey?: string | null;
    Kinryou?: string | null;
    Weight?: string | null;
}