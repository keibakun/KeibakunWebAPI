[**keibakun**](../../../../../README.md)

***

[keibakun](../../../../../modules.md) / [scrapers/nk/raceSchedule/raceSchedule](../README.md) / RaceSchedule

# Class: RaceSchedule

Defined in: [scrapers/nk/raceSchedule/raceSchedule.ts:10](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/scrapers/nk/raceSchedule/raceSchedule.ts#L10)

RaceScheduleクラス
PuppeteerのPageインスタンスを使用してレース開催日程を取得するクラス

## Constructors

### Constructor

> **new RaceSchedule**(`page`): `RaceSchedule`

Defined in: [scrapers/nk/raceSchedule/raceSchedule.ts:14](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/scrapers/nk/raceSchedule/raceSchedule.ts#L14)

#### Parameters

##### page

`Page`

#### Returns

`RaceSchedule`

## Methods

### getRaceSchedule()

> **getRaceSchedule**(`year`, `month`): `Promise`\<[`Schedule`](../../raceShceduleIF/interfaces/Schedule.md)[]\>

Defined in: [scrapers/nk/raceSchedule/raceSchedule.ts:25](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/scrapers/nk/raceSchedule/raceSchedule.ts#L25)

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
