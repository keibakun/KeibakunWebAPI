/**
 * アップグレード情報のインターフェース
 * @interface UpgradeInfo
 * @property {string} date - アップグレード日付（例: "2025年05月20日00:17"）
 * @property {string} title - アップグレードタイトル
 * @property {string} description - アップグレード説明（100字以下）
 */
export interface UpgradeInfo {
    date: string;
    title: string;
    description: string;
}