[**keibakun**](../../../../README.md)

***

[keibakun](../../../../modules.md) / [NKScraper/horseDetail/horseModalCommentScraper](../README.md) / HorseModalCommentScraper

# Class: HorseModalCommentScraper

Defined in: [NKScraper/horseDetail/horseModalCommentScraper.ts:17](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseModalCommentScraper.ts#L17)

SP モーダルページ（race.sp.netkeiba.com）から厩舎コメントを取得して
成績テーブルの `comment` フィールドに補完するスクレイパー。

Step③ 専用。DB取得・血統取得は行わない。
既存の HorseDetail JSON を読み込み、comment を補完して上書き保存するフローで使う。

## Constructors

### Constructor

> **new HorseModalCommentScraper**(`page`): `HorseModalCommentScraper`

Defined in: [NKScraper/horseDetail/horseModalCommentScraper.ts:21](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseModalCommentScraper.ts#L21)

#### Parameters

##### page

`Page`

#### Returns

`HorseModalCommentScraper`

## Methods

### supplement()

> **supplement**(`raceId`, `horseId`, `umaban`, `raceResults`): `Promise`\<`void`\>

Defined in: [NKScraper/horseDetail/horseModalCommentScraper.ts:38](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseModalCommentScraper.ts#L38)

SP モーダルからコメントを取得し、raceResults の comment フィールドを破壊的に更新する。

- 失敗時はスキップして続行（comment が空のまま）。
- 全体タイムアウト: 150 秒（goto×3 + waitForSelector×2 の上限合計）。
- 毎回新規ページを作成して finally でクローズするため状態汚染がない。

#### Parameters

##### raceId

`string`

直近レースの raceId（SP モーダル URL に使用）

##### horseId

`string`

馬ID

##### umaban

馬番（SP モーダルの `i` パラメータ）

`string` | `number`

##### raceResults

[`HorseRaceResultRow`](../../horseDetailIF/interfaces/HorseRaceResultRow.md)[]

comment を補完する対象の成績行配列（破壊的更新）

#### Returns

`Promise`\<`void`\>
