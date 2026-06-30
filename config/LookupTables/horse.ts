/**
 * horse.ts
 *
 * @remarks
 * 競走馬に関する情報を定義するルックアップテーブル。
 * 競走馬の性別、毛色、競馬場、コース種別、天気、馬場状態、レースグレードなどの文字列をコードに変換するためのマッピングを提供します。
 * このファイルは、horseDbScraper.ts が Puppeteer の evaluate() に注入するルックアップテーブルとして使用されます。
 * ブラウザ文脈に渡すため、plain object として定義します。
 */

/** 性別文字列 → HorseSex コード */
export const SEX_MAP: Record<string, number> = {
    牡: 1, 牝: 2, せん: 3, セ: 3, セン: 3, 騸: 3,
};

/** 毛色文字列 → HorseCoatColor コード（JRA公認8毛色） */
export const COAT_MAP: Record<string, number> = {
    鹿毛: 1, 黒鹿毛: 2, 青鹿毛: 3, 青毛: 4,
    栗毛: 5, 栃栗毛: 6, 芦毛: 7, 白毛: 8,
};