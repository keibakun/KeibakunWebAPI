[**keibakun**](../../../../../README.md)

***

[keibakun](../../../../../modules.md) / [scrapers/nk/raceResult/raceResultDBIF](../README.md) / CornerOrderIF

# Interface: CornerOrderIF

Defined in: scrapers/nk/raceResult/raceResultDBIF.ts:202

コーナー通過順（レース全体のブロック文字列）。

各フィールドは、そのコーナー時点での全馬の位置関係を表す文字列。
例: `"7-8,5(3,10)(2,6,9)(1,4)"`

※ 各馬の通過順位は [RaceResultRow](RaceResultRow.md) の `tuuka1c` 〜 `tuuka4c` を参照。

 CornerOrderIF

## Properties

### corner1

> **corner1**: `string`

Defined in: scrapers/nk/raceResult/raceResultDBIF.ts:203

***

### corner2

> **corner2**: `string`

Defined in: scrapers/nk/raceResult/raceResultDBIF.ts:204

***

### corner3

> **corner3**: `string`

Defined in: scrapers/nk/raceResult/raceResultDBIF.ts:205

***

### corner4

> **corner4**: `string`

Defined in: scrapers/nk/raceResult/raceResultDBIF.ts:206
