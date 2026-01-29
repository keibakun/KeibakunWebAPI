[**keibakun**](../../../README.md)

***

[keibakun](../../../modules.md) / [NKScraper/main\_raceSchedule](../README.md) / Main\_RaceSchedule

# Class: Main\_RaceSchedule

Defined in: [NKScraper/main\_raceSchedule.ts:18](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/main_raceSchedule.ts#L18)

Main_RaceSchedule

指定年の月ごとに `RaceSchedule` をスクレイピングして
`RaceSchedule/<YYYYMM>/index.html` を生成するクラスです。

## Constructors

### Constructor

> **new Main\_RaceSchedule**(`year`): `Main_RaceSchedule`

Defined in: [NKScraper/main\_raceSchedule.ts:21](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/main_raceSchedule.ts#L21)

#### Parameters

##### year

`number`

#### Returns

`Main_RaceSchedule`

## Methods

### run()

> **run**(): `Promise`\<`void`\>

Defined in: [NKScraper/main\_raceSchedule.ts:27](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/main_raceSchedule.ts#L27)

指定年のすべての月についてレース日程を取得して保存します。

#### Returns

`Promise`\<`void`\>
