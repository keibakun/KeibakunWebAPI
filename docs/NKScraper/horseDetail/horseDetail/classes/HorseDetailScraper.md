[**keibakun**](../../../../README.md)

***

[keibakun](../../../../modules.md) / [NKScraper/horseDetail/horseDetail](../README.md) / HorseDetailScraper

# Class: HorseDetailScraper

Defined in: [NKScraper/horseDetail/horseDetail.ts:10](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetail.ts#L10)

HorseDetailクラス
PuppeteerのPageインスタンスを使用して馬の詳細情報を取得するクラス

## Constructors

### Constructor

> **new HorseDetailScraper**(`page`): `HorseDetailScraper`

Defined in: [NKScraper/horseDetail/horseDetail.ts:18](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetail.ts#L18)

コンストラクタ

#### Parameters

##### page

`Page`

PuppeteerのPageインスタンス

#### Returns

`HorseDetailScraper`

## Methods

### getHorseDetail()

> **getHorseDetail**(`horseId`): `Promise`\<[`HorseDetail`](../../horseDetailIF/interfaces/HorseDetail.md)\>

Defined in: [NKScraper/horseDetail/horseDetail.ts:28](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetail.ts#L28)

馬の詳細情報を取得するメソッド

#### Parameters

##### horseId

`string`

馬ID（例: "2020109107"）

#### Returns

`Promise`\<[`HorseDetail`](../../horseDetailIF/interfaces/HorseDetail.md)\>

馬のプロフィール・競争成績
