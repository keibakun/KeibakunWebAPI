[**keibakun**](../../../README.md)

***

[keibakun](../../../modules.md) / [NKScraper/main\_horseDetail\_modal](../README.md) / Main\_HorseDetail\_Modal

# Class: Main\_HorseDetail\_Modal

Defined in: [NKScraper/main\_horseDetail\_modal.ts:38](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/main_horseDetail_modal.ts#L38)

workPool の先頭ファイルを参照し、HorseDetail JSON の comment を SP モーダルから補完する。

前提: Step② (main_horseDetail_db) が同じ workPool ファイルを処理済みであること。
HorseDetail ファイルが存在しない horseId はスキップ（Step② が失敗した場合）。
workPool ファイルは削除しない（Step④が参照するため）。

## Constructors

### Constructor

> **new Main\_HorseDetail\_Modal**(): `Main_HorseDetail_Modal`

#### Returns

`Main_HorseDetail_Modal`

## Methods

### run()

> **run**(): `Promise`\<`void`\>

Defined in: [NKScraper/main\_horseDetail\_modal.ts:39](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/main_horseDetail_modal.ts#L39)

#### Returns

`Promise`\<`void`\>
