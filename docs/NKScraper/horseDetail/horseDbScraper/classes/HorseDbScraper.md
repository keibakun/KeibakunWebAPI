[**keibakun**](../../../../README.md)

***

[keibakun](../../../../modules.md) / [NKScraper/horseDetail/horseDbScraper](../README.md) / HorseDbScraper

# Class: HorseDbScraper

Defined in: [NKScraper/horseDetail/horseDbScraper.ts:255](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDbScraper.ts#L255)

db.netkeiba.com の馬詳細ページからプロフィールと全成績を取得するスクレイパー。

Step② 専用。コメント補完・血統取得は行わない。
取得した { profile, raceResults } をそのまま HorseDetail JSON として保存する。

## Constructors

### Constructor

> **new HorseDbScraper**(`page`): `HorseDbScraper`

Defined in: [NKScraper/horseDetail/horseDbScraper.ts:259](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDbScraper.ts#L259)

#### Parameters

##### page

`Page`

#### Returns

`HorseDbScraper`

## Methods

### scrape()

> **scrape**(`horseId`): `Promise`\<\{ `profile`: [`HorseProfile`](../../horseDetailIF/interfaces/HorseProfile.md); `raceResults`: [`HorseRaceResultRow`](../../horseDetailIF/interfaces/HorseRaceResultRow.md)[]; \}\>

Defined in: [NKScraper/horseDetail/horseDbScraper.ts:269](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDbScraper.ts#L269)

db.netkeiba の馬詳細ページからプロフィールと全成績テーブルを取得する。
1件ごとに新規ページを作成して finally でクローズするため、
呼び出し側は任意のアンカー Page を渡せばよい。

#### Parameters

##### horseId

`string`

#### Returns

`Promise`\<\{ `profile`: [`HorseProfile`](../../horseDetailIF/interfaces/HorseProfile.md); `raceResults`: [`HorseRaceResultRow`](../../horseDetailIF/interfaces/HorseRaceResultRow.md)[]; \}\>
