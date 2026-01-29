[**keibakun**](../../../README.md)

***

[keibakun](../../../modules.md) / [NKScraper/main\_horseDetail](../README.md) / Main\_HorseDetail

# Class: Main\_HorseDetail

Defined in: [NKScraper/main\_horseDetail.ts:20](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/main_horseDetail.ts#L20)

Main_HorseDetail

`RaceSchedule/{year}{month}/index.html` から開催日を取得し、
`RaceList/{kaisaiDate}/index.html` から raceId を取得、
`Shutuba/{raceId}/index.html` から horseId を抽出、
`HorseDetail` に各馬の詳細を保存する処理を行うクラスです。

## Constructors

### Constructor

> **new Main\_HorseDetail**(`year`, `monthArg?`): `Main_HorseDetail`

Defined in: [NKScraper/main\_horseDetail.ts:29](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/main_horseDetail.ts#L29)

コンストラクタ

#### Parameters

##### year

`number`

対象年

##### monthArg?

`number`

対象月（1-12）

#### Returns

`Main_HorseDetail`

## Methods

### run()

> **run**(): `Promise`\<`void`\>

Defined in: [NKScraper/main\_horseDetail.ts:37](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/main_horseDetail.ts#L37)

エントリポイント: Puppeteer を初期化して horse detail を収集します。

#### Returns

`Promise`\<`void`\>
