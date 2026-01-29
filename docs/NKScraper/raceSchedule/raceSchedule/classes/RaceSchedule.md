[**keibakun**](../../../../README.md)

***

[keibakun](../../../../modules.md) / [NKScraper/raceSchedule/raceSchedule](../README.md) / RaceSchedule

# Class: RaceSchedule

Defined in: [NKScraper/raceSchedule/raceSchedule.ts:9](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/raceSchedule/raceSchedule.ts#L9)

RaceScheduleクラス
PuppeteerのPageインスタンスを使用してレース開催日程を取得するクラス

## Constructors

### Constructor

> **new RaceSchedule**(`page`): `RaceSchedule`

Defined in: [NKScraper/raceSchedule/raceSchedule.ts:13](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/raceSchedule/raceSchedule.ts#L13)

#### Parameters

##### page

`Page`

#### Returns

`RaceSchedule`

## Methods

### getRaceSchedule()

> **getRaceSchedule**(`year`, `month`): `Promise`\<[`Schedule`](../../raceShceduleIF/interfaces/Schedule.md)[]\>

Defined in: [NKScraper/raceSchedule/raceSchedule.ts:24](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/raceSchedule/raceSchedule.ts#L24)

レースの開催日程を取得するメソッド

#### Parameters

##### year

`number`

年

##### month

`number`

月

#### Returns

`Promise`\<[`Schedule`](../../raceShceduleIF/interfaces/Schedule.md)[]\>

開催日程の配列
