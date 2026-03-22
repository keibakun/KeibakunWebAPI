/**
 * JRAニュースのデータインターフェイス
 */
export interface JraNewsItem {
    /** 日付表示（例: "3月22日（日曜）"） */
    date: string;
    /** カテゴリ（例: "レース関連"） */
    category: string;
    /** ニュースのタイトル */
    title: string;
    /** 絶対URL（https://www.jra.go.jp が先頭） */
    link: string;
}

/**
 * スクレイパーが返却するJSON型データ（アイテム配列）
 */
export type JraNewsIF = JraNewsItem[];
