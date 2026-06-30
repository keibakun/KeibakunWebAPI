[**keibakun**](../../../README.md)

***

[keibakun](../../../modules.md) / [NKScraper/main\_horseDetail](../README.md) / Main\_HorseDetail

# Class: Main\_HorseDetail

Defined in: [NKScraper/main\_horseDetail.ts:47](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/main_horseDetail.ts#L47)

Main_HorseDetail

`RaceSchedule/{year}{month}/index.html` から開催日を取得し、
`RaceList/{kaisaiDate}/index.html` から raceId を取得、
`Shutuba/{raceId}/index.html` から horseId を抽出して workPool を生成後、
main_horseDetail_db → main_horseDetail_modal → main_horseDetail_pedigree
の順に呼び出して HorseDetail を保存するコーディネータークラスです。

## Constructors

### Constructor

> **new Main\_HorseDetail**(`year`, `monthArg?`, `dayArg?`, `production?`, `localScheduled?`): `Main_HorseDetail`

Defined in: [NKScraper/main\_horseDetail.ts:62](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/main_horseDetail.ts#L62)

コンストラクタ

#### Parameters

##### year

`number`

対象年

##### monthArg?

`number`

対象月（1-12）

##### dayArg?

`number`

対象日（1-31）。省略時は月全体を対象にする

##### production?

`boolean`

本番実行フラグ（true の場合は workPool から horseId を取得）

##### localScheduled?

`boolean`

ローカル定期実行フラグ（true の場合は workPool を2回処理する）

#### Returns

`Main_HorseDetail`

## Methods

### run()

> **run**(): `Promise`\<`void`\>

Defined in: [NKScraper/main\_horseDetail.ts:73](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/main_horseDetail.ts#L73)

エントリポイント

#### Returns

`Promise`\<`void`\>

***

### runSingle()

> **runSingle**(`horseId`, `raceId`): `Promise`\<`void`\>

Defined in: [NKScraper/main\_horseDetail.ts:103](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/main_horseDetail.ts#L103)

単体モード: horseId と raceId を直接指定して1件だけ取得します。
umaban は Shutuba ファイルがあれば自動取得し、なければ空文字でフォールバックします。

#### Parameters

##### horseId

`string`

##### raceId

`string`

#### Returns

`Promise`\<`void`\>
