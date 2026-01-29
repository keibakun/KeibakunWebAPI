[**keibakun**](../../../README.md)

***

[keibakun](../../../modules.md) / [NKScraper/main\_raceResult](../README.md) / Main\_RaceResult

# Class: Main\_RaceResult

Defined in: [NKScraper/main\_raceResult.ts:18](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/main_raceResult.ts#L18)

Main_RaceResult

年月から `RaceList` を走査し、各 `raceId` に対して `RaceResult` を取得して
`RaceResult/<year><month><rest>/index.html` に JSON を保存するクラスです。

## Constructors

### Constructor

> **new Main\_RaceResult**(`year`, `monthArg?`): `Main_RaceResult`

Defined in: [NKScraper/main\_raceResult.ts:27](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/main_raceResult.ts#L27)

コンストラクタ

#### Parameters

##### year

`number`

対象の年（例: 2025）

##### monthArg?

`number`

対象の月（省略時は全月）

#### Returns

`Main_RaceResult`

## Methods

### run()

> **run**(): `Promise`\<`void`\>

Defined in: [NKScraper/main\_raceResult.ts:35](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/main_raceResult.ts#L35)

エントリポイント: Puppeteer を初期化して対象月すべての処理を実行します。

#### Returns

`Promise`\<`void`\>
