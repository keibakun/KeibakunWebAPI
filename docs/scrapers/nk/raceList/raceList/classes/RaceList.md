[**keibakun**](../../../../../README.md)

***

[keibakun](../../../../../modules.md) / [scrapers/nk/raceList/raceList](../README.md) / RaceList

# Class: RaceList

Defined in: [scrapers/nk/raceList/raceList.ts:11](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/scrapers/nk/raceList/raceList.ts#L11)

RaceListクラス
PuppeteerのPageインスタンスを使用してレースリストを取得するクラス

## Constructors

### Constructor

> **new RaceList**(`page`): `RaceList`

Defined in: [scrapers/nk/raceList/raceList.ts:15](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/scrapers/nk/raceList/raceList.ts#L15)

#### Parameters

##### page

`Page`

#### Returns

`RaceList`

## Methods

### getRaceList()

> **getRaceList**(`kaisaiDate`): `Promise`\<[`RaceData`](../../raceListIF/interfaces/RaceData.md)[]\>

Defined in: [scrapers/nk/raceList/raceList.ts:25](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/scrapers/nk/raceList/raceList.ts#L25)

レースリストを取得するメソッド

#### Parameters

##### kaisaiDate

`string`

開催日（YYYYMMDD形式）

#### Returns

`Promise`\<[`RaceData`](../../raceListIF/interfaces/RaceData.md)[]\>

レースデータの配列
