[**keibakun**](../../../../../README.md)

***

[keibakun](../../../../../modules.md) / [scrapers/nk/raceResult/raceResultDBIF](../README.md) / LapTimeIF

# Interface: LapTimeIF

Defined in: scrapers/nk/raceResult/raceResultDBIF.ts:218

ラップタイム情報。

 LapTimeIF

## Properties

### headers

> **headers**: `string`[]

Defined in: scrapers/nk/raceResult/raceResultDBIF.ts:229

距離ヘッダー。
例: `["200m", "400m", "600m", "800m", "1000m", "1200m", "1400m", "1600m"]`

***

### pace

> **pace**: `number`

Defined in: scrapers/nk/raceResult/raceResultDBIF.ts:223

ペースコード。
`1`=スロー(S) / `2`=ミドル(M) / `3`=ハイ(H) / `0`=不明

***

### times

> **times**: `string`[][]

Defined in: scrapers/nk/raceResult/raceResultDBIF.ts:236

ラップタイム2行。
`times[0]` = 累積タイム（例: `["12.4", "23.6", ..., "1:33.8"]`）
`times[1]` = 区間タイム（例: `["12.4", "11.2", ..., "11.4"]`）
