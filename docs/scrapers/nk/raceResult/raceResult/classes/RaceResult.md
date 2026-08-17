[**keibakun**](../../../../../README.md)

***

[keibakun](../../../../../modules.md) / [scrapers/nk/raceResult/raceResult](../README.md) / RaceResult

# Class: RaceResult

Defined in: [scrapers/nk/raceResult/raceResult.ts:15](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/scrapers/nk/raceResult/raceResult.ts#L15)

RaceResultクラス

## Description

PuppeteerのPageインスタンスを使用してレース結果を取得するクラス

## Constructors

### Constructor

> **new RaceResult**(`page`): `RaceResult`

Defined in: [scrapers/nk/raceResult/raceResult.ts:23](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/scrapers/nk/raceResult/raceResult.ts#L23)

コンストラクタ

#### Parameters

##### page

`Page`

PuppeteerのPageインスタンス

#### Returns

`RaceResult`

## Methods

### getRaceResult()

> **getRaceResult**(`raceId`): `Promise`\<[`RaceResultWithRefund`](../../raceResultDBIF/interfaces/RaceResultWithRefund.md)\>

Defined in: [scrapers/nk/raceResult/raceResult.ts:33](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/scrapers/nk/raceResult/raceResult.ts#L33)

レース結果を取得するメソッド

#### Parameters

##### raceId

`string`

レースID

#### Returns

`Promise`\<[`RaceResultWithRefund`](../../raceResultDBIF/interfaces/RaceResultWithRefund.md)\>

レース結果・払い戻し・コーナー通過順・ラップタイム
