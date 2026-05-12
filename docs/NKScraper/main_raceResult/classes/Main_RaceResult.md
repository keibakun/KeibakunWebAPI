[**keibakun**](../../../README.md)

***

[keibakun](../../../modules.md) / [NKScraper/main\_raceResult](../README.md) / Main\_RaceResult

# Class: Main\_RaceResult

Defined in: [NKScraper/main\_raceResult.ts:23](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/main_raceResult.ts#L23)

Main_RaceResult

年月から `RaceList` を走査し、各 `raceId` に対して `RaceResult` を取得して
`RaceResult/<year><month><rest>/index.html` に JSON を保存するクラスです。
複数タブを使った並列スクレイピングに対応しています。

## Constructors

### Constructor

> **new Main\_RaceResult**(`year`, `monthArg?`, `concurrency?`, `singleRaceId?`): `Main_RaceResult`

Defined in: [NKScraper/main\_raceResult.ts:36](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/main_raceResult.ts#L36)

コンストラクタ

#### Parameters

##### year

`number`

対象の年（例: 2025）

##### monthArg?

`number`

対象の月（省略時は全月）

##### concurrency?

`number`

並列実行数（デフォルト: 5）

##### singleRaceId?

`string`

1件だけ取得する raceId（指定時は year/monthArg を無視）

#### Returns

`Main_RaceResult`

## Methods

### run()

> **run**(): `Promise`\<`void`\>

Defined in: [NKScraper/main\_raceResult.ts:47](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/main_raceResult.ts#L47)

エントリポイント: Puppeteer を初期化して対象月すべての処理を実行します。
`singleRaceId` が指定された場合は year/monthArg を無視し、その1件のみ処理します。

#### Returns

`Promise`\<`void`\>
