[**keibakun**](../../../../README.md)

***

[keibakun](../../../../modules.md) / [NKScraper/raceList/raceList](../README.md) / RaceList

# Class: RaceList

Defined in: [NKScraper/raceList/raceList.ts:9](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/raceList/raceList.ts#L9)

RaceListクラス
PuppeteerのPageインスタンスを使用してレースリストを取得するクラス

## Constructors

### Constructor

> **new RaceList**(`page`): `RaceList`

Defined in: [NKScraper/raceList/raceList.ts:13](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/raceList/raceList.ts#L13)

#### Parameters

##### page

`Page`

#### Returns

`RaceList`

## Methods

### getRaceList()

> **getRaceList**(`kaisaiDate`): `Promise`\<[`RaceData`](../../raceListIF/interfaces/RaceData.md)[]\>

Defined in: [NKScraper/raceList/raceList.ts:23](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/raceList/raceList.ts#L23)

レースリストを取得するメソッド

#### Parameters

##### kaisaiDate

`string`

開催日（YYYYMMDD形式）

#### Returns

`Promise`\<[`RaceData`](../../raceListIF/interfaces/RaceData.md)[]\>

レースデータの配列
