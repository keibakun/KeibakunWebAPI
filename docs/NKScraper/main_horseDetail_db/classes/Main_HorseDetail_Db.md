[**keibakun**](../../../README.md)

***

[keibakun](../../../modules.md) / [NKScraper/main\_horseDetail\_db](../README.md) / Main\_HorseDetail\_Db

# Class: Main\_HorseDetail\_Db

Defined in: [NKScraper/main\_horseDetail\_db.ts:94](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/main_horseDetail_db.ts#L94)

workPool の先頭ファイルを消化して db.netkeiba からプロフィール＋成績を取得・保存する。

- comment は空文字のまま保存（Step③で補完する）
- pedigree は保存しない（Step④で補完する）
- workPool ファイルは削除しない（Step③④が同じファイルを参照するため Step⑤で削除）

## Constructors

### Constructor

> **new Main\_HorseDetail\_Db**(): `Main_HorseDetail_Db`

#### Returns

`Main_HorseDetail_Db`

## Methods

### run()

> **run**(): `Promise`\<`void`\>

Defined in: [NKScraper/main\_horseDetail\_db.ts:95](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/main_horseDetail_db.ts#L95)

#### Returns

`Promise`\<`void`\>
