[**keibakun**](../../../../README.md)

***

[keibakun](../../../../modules.md) / [scripts/race/main\_raceSchedule](../README.md) / Main\_RaceSchedule

# Class: Main\_RaceSchedule

Defined in: scripts/race/main\_raceSchedule.ts:18

Main_RaceSchedule

指定年の月ごとに `RaceSchedule` をスクレイピングして
KeibakunServer 経由で DB に保存するクラスです。

## Constructors

### Constructor

> **new Main\_RaceSchedule**(`year`): `Main_RaceSchedule`

Defined in: scripts/race/main\_raceSchedule.ts:21

#### Parameters

##### year

`number`

#### Returns

`Main_RaceSchedule`

## Methods

### run()

> **run**(): `Promise`\<`void`\>

Defined in: scripts/race/main\_raceSchedule.ts:27

指定年のすべての月についてレース日程を取得して保存します。

#### Returns

`Promise`\<`void`\>
