[**keibakun**](../../../README.md)

***

[keibakun](../../../modules.md) / [NKScraper/main\_horseDetail\_pedigree](../README.md) / Main\_HorseDetail\_Pedigree

# Class: Main\_HorseDetail\_Pedigree

Defined in: [NKScraper/main\_horseDetail\_pedigree.ts:40](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/main_horseDetail_pedigree.ts#L40)

workPool の先頭ファイルを参照し、HorseDetail JSON に5代血統表を補完して上書き保存する。
その後 workPool ファイルを削除する（Step⑤を兼ねる）。

前提: Step②③が完了済みであること。

**スキップ条件**: HorseDetail JSON 内の `profile.pedigree` が既に存在する場合はスキップ。
これにより再実行しても無駄なアクセスが発生しない。

## Constructors

### Constructor

> **new Main\_HorseDetail\_Pedigree**(): `Main_HorseDetail_Pedigree`

#### Returns

`Main_HorseDetail_Pedigree`

## Methods

### run()

> **run**(): `Promise`\<`void`\>

Defined in: [NKScraper/main\_horseDetail\_pedigree.ts:41](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/main_horseDetail_pedigree.ts#L41)

#### Returns

`Promise`\<`void`\>
