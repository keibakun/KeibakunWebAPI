[**keibakun**](../../../../README.md)

***

[keibakun](../../../../modules.md) / [NKScraper/horseDetail/horseDetailIF](../README.md) / RaceInfo

# Interface: RaceInfo

Defined in: [NKScraper/horseDetail/horseDetailIF.ts:113](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetailIF.ts#L113)

レース自体の情報（開催・コース・条件など）

 RaceInfo

## Properties

### baba

> **baba**: `number`

Defined in: [NKScraper/horseDetail/horseDetailIF.ts:150](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetailIF.ts#L150)

馬場状態コード。
`1`=良 / `2`=稍重 / `3`=重 / `4`=不良 / `0`=不明

***

### course

> **course**: `number`

Defined in: [NKScraper/horseDetail/horseDetailIF.ts:138](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetailIF.ts#L138)

コース種別コード。`1`=芝 / `2`=ダート / `3`=障害

***

### date

> **date**: `string`

Defined in: [NKScraper/horseDetail/horseDetailIF.ts:115](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetailIF.ts#L115)

開催日（YYYY/MM/DD）

***

### day

> **day**: `number`

Defined in: [NKScraper/horseDetail/horseDetailIF.ts:121](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetailIF.ts#L121)

開催日目（例: 3日目なら 3）

***

### distance

> **distance**: `number`

Defined in: [NKScraper/horseDetail/horseDetailIF.ts:140](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetailIF.ts#L140)

距離（m）

***

### grade

> **grade**: `number`

Defined in: [NKScraper/horseDetail/horseDetailIF.ts:134](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetailIF.ts#L134)

グレード区分（数値）。
`1`=G1 / `2`=G2 / `3`=G3 / `4`=重賞 / `5`=OP /
`6`=1600下 / `7`=1000下 / `9`=500下 /
`10`=JG1 / `11`=JG2 / `12`=JG3 /
`15`=L / `16`=3勝 / `17`=2勝 / `18`=1勝 / `19`=新馬 / `20`=未勝利
該当なし・不明の場合は `0`。

***

### kaiji

> **kaiji**: `number`

Defined in: [NKScraper/horseDetail/horseDetailIF.ts:117](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetailIF.ts#L117)

回次（例: 2回開催なら 2）

***

### R

> **R**: `number`

Defined in: [NKScraper/horseDetail/horseDetailIF.ts:136](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetailIF.ts#L136)

R（レース番号）

***

### raceId

> **raceId**: `string`

Defined in: [NKScraper/horseDetail/horseDetailIF.ts:123](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetailIF.ts#L123)

レースID（`/race/<raceId>/` から抽出）

***

### raceName

> **raceName**: `string`

Defined in: [NKScraper/horseDetail/horseDetailIF.ts:125](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetailIF.ts#L125)

レース名（グレード括弧なし）

***

### tousuu

> **tousuu**: `number`

Defined in: [NKScraper/horseDetail/horseDetailIF.ts:152](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetailIF.ts#L152)

頭数

***

### venue

> **venue**: `number`

Defined in: [NKScraper/horseDetail/horseDetailIF.ts:119](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetailIF.ts#L119)

競馬場コード。JRA以外（地方/海外）は `null`

***

### weather

> **weather**: `number`

Defined in: [NKScraper/horseDetail/horseDetailIF.ts:145](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetailIF.ts#L145)

天気コード。
`1`=晴 / `2`=曇 / `3`=雨 / `4`=小雨 / `5`=雪 / `0`=不明
