[**keibakun**](../../../../README.md)

***

[keibakun](../../../../modules.md) / [NKScraper/horseDetail/horseDetail](../README.md) / HorseDetailScraper

# Class: HorseDetailScraper

Defined in: [NKScraper/horseDetail/horseDetail.ts:347](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetail.ts#L347)

馬詳細情報スクレイパー。

2つのページから馬詳細情報を取得します。

**Step 1**: `https://db.netkeiba.com/horse/{horseId}`
- プロフィール（馬名・性齢・毛色・血統・調教師・馬主・生産者）
- 全成績テーブル（着順・タイム・騎手・コース・距離など）

**Step 2**: `https://race.sp.netkeiba.com/modal/horse.html?race_id={raceId}&horse_id={horseId}`
- 各成績のコメントを取得し Step 1 の成績テーブルに補完する。
- 「もっと見る」ボタンが存在する場合はクリックして全件展開する。

## Example

```typescript
const scraper = new HorseDetailScraper(page);
const detail = await scraper.getHorseDetail("202506010311", "2020109107", "3");
```

## Constructors

### Constructor

> **new HorseDetailScraper**(`page`): `HorseDetailScraper`

Defined in: [NKScraper/horseDetail/horseDetail.ts:355](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetail.ts#L355)

#### Parameters

##### page

`Page`

スクレイピングに使用する Puppeteer Page。
              1件ごとに新しいページを渡して状態汚染を防ぐこと。

#### Returns

`HorseDetailScraper`

## Methods

### getHorseDetail()

> **getHorseDetail**(`raceId`, `horseId`, `umaban`): `Promise`\<[`HorseDetail`](../../horseDetailIF/interfaces/HorseDetail.md)\>

Defined in: [NKScraper/horseDetail/horseDetail.ts:367](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetail.ts#L367)

馬の詳細情報を取得する。

#### Parameters

##### raceId

`string`

直近レースの raceId（SP モーダル URL に使用）

##### horseId

`string`

馬ID（例: `"2020109107"`）

##### umaban

馬番（SP モーダルの `i` パラメータ）

`string` | `number`

#### Returns

`Promise`\<[`HorseDetail`](../../horseDetailIF/interfaces/HorseDetail.md)\>
