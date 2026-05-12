[**keibakun**](../../../README.md)

***

[keibakun](../../../modules.md) / [NKScraper/main\_horseDetail](../README.md) / Main\_HorseDetail

# Class: Main\_HorseDetail

Defined in: [NKScraper/main\_horseDetail.ts:28](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/main_horseDetail.ts#L28)

Main_HorseDetail

`RaceSchedule/{year}{month}/index.html` から開催日を取得し、
`RaceList/{kaisaiDate}/index.html` から raceId を取得、
`Shutuba/{raceId}/index.html` から horseId を抽出、
`HorseDetail` に各馬の詳細を保存する処理を行うクラスです。

## Constructors

### Constructor

> **new Main\_HorseDetail**(`year`, `monthArg?`, `production?`): `Main_HorseDetail`

Defined in: [NKScraper/main\_horseDetail.ts:39](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/main_horseDetail.ts#L39)

コンストラクタ

#### Parameters

##### year

`number`

対象年

##### monthArg?

`number`

対象月（1-12）

##### production?

`boolean`

本番実行フラグ（true の場合は workPool から horseId を取得）

#### Returns

`Main_HorseDetail`

## Methods

### run()

> **run**(): `Promise`\<`void`\>

Defined in: [NKScraper/main\_horseDetail.ts:48](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/main_horseDetail.ts#L48)

エントリポイント: Puppeteer を初期化して horse detail を収集します。

#### Returns

`Promise`\<`void`\>

***

### runSingle()

> **runSingle**(`horseId`, `raceId`): `Promise`\<`void`\>

Defined in: [NKScraper/main\_horseDetail.ts:148](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/main_horseDetail.ts#L148)

単体モード: horseId と raceId を直接指定して1件だけ取得・保存します。
umaban は Shutuba ファイルがあれば自動取得し、なければ空文字でフォールバックします。

#### Parameters

##### horseId

`string`

##### raceId

`string`

#### Returns

`Promise`\<`void`\>
