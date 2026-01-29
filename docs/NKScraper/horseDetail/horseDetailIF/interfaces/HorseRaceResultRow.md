[**keibakun**](../../../../README.md)

***

[keibakun](../../../../modules.md) / [NKScraper/horseDetail/horseDetailIF](../README.md) / HorseRaceResultRow

# Interface: HorseRaceResultRow

Defined in: [NKScraper/horseDetail/horseDetailIF.ts:34](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetailIF.ts#L34)

Single race result row for a horse.

フィールドはすべて必須で、値が無い場合は空文字になります。

 HorseRaceResultRow

## Properties

### baba

> **baba**: `string`

Defined in: [NKScraper/horseDetail/horseDetailIF.ts:72](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetailIF.ts#L72)

馬場状態（例: "良"）

***

### comment

> **comment**: `string`

Defined in: [NKScraper/horseDetail/horseDetailIF.ts:84](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetailIF.ts#L84)

厩舎コメントなどのリンク（href）を格納する場合がある

***

### date

> **date**: `string`

Defined in: [NKScraper/horseDetail/horseDetailIF.ts:36](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetailIF.ts#L36)

開催日（表示用）

***

### distance

> **distance**: `string`

Defined in: [NKScraper/horseDetail/horseDetailIF.ts:70](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetailIF.ts#L70)

距離（例: "芝2000"）

***

### grade

> **grade**: `string`

Defined in: [NKScraper/horseDetail/horseDetailIF.ts:42](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetailIF.ts#L42)

グレード等（未取得なら空文字）

***

### jockey

> **jockey**: `string`

Defined in: [NKScraper/horseDetail/horseDetailIF.ts:46](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetailIF.ts#L46)

騎手名

***

### kinryou

> **kinryou**: `string`

Defined in: [NKScraper/horseDetail/horseDetailIF.ts:68](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetailIF.ts#L68)

斤量（数値表示）

***

### last3f

> **last3f**: `string`

Defined in: [NKScraper/horseDetail/horseDetailIF.ts:80](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetailIF.ts#L80)

上り（上がり3Fなど）

***

### odds

> **odds**: `string`

Defined in: [NKScraper/horseDetail/horseDetailIF.ts:50](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetailIF.ts#L50)

オッズ

***

### pace

> **pace**: `string`

Defined in: [NKScraper/horseDetail/horseDetailIF.ts:78](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetailIF.ts#L78)

ペース（表示）

***

### place

> **place**: `string`

Defined in: [NKScraper/horseDetail/horseDetailIF.ts:38](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetailIF.ts#L38)

開催情報（例: "4東京11"）

***

### popularity

> **popularity**: `string`

Defined in: [NKScraper/horseDetail/horseDetailIF.ts:52](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetailIF.ts#L52)

人気（表示）

***

### prize

> **prize**: `string`

Defined in: [NKScraper/horseDetail/horseDetailIF.ts:54](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetailIF.ts#L54)

賞金（表示）

***

### R

> **R**: `string`

Defined in: [NKScraper/horseDetail/horseDetailIF.ts:60](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetailIF.ts#L60)

R（ラウンド／レース番号の表示）

***

### raceId

> **raceId**: `string`

Defined in: [NKScraper/horseDetail/horseDetailIF.ts:56](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetailIF.ts#L56)

レースID（`/race/<raceId>/` から抽出）

***

### raceName

> **raceName**: `string`

Defined in: [NKScraper/horseDetail/horseDetailIF.ts:40](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetailIF.ts#L40)

レース名（表示用）

***

### rank

> **rank**: `string`

Defined in: [NKScraper/horseDetail/horseDetailIF.ts:44](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetailIF.ts#L44)

着順

***

### time

> **time**: `string`

Defined in: [NKScraper/horseDetail/horseDetailIF.ts:48](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetailIF.ts#L48)

タイム

***

### tousuu

> **tousuu**: `string`

Defined in: [NKScraper/horseDetail/horseDetailIF.ts:62](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetailIF.ts#L62)

頭数

***

### tuuka

> **tuuka**: `string`

Defined in: [NKScraper/horseDetail/horseDetailIF.ts:76](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetailIF.ts#L76)

通過（例: "9-6-8"）

***

### tyakusa

> **tyakusa**: `string`

Defined in: [NKScraper/horseDetail/horseDetailIF.ts:74](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetailIF.ts#L74)

着差

***

### umaban

> **umaban**: `string`

Defined in: [NKScraper/horseDetail/horseDetailIF.ts:66](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetailIF.ts#L66)

馬番

***

### wakuban

> **wakuban**: `string`

Defined in: [NKScraper/horseDetail/horseDetailIF.ts:64](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetailIF.ts#L64)

枠番

***

### weather

> **weather**: `string`

Defined in: [NKScraper/horseDetail/horseDetailIF.ts:58](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetailIF.ts#L58)

天気（例: "晴" / "曇"）

***

### weight

> **weight**: `string`

Defined in: [NKScraper/horseDetail/horseDetailIF.ts:82](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetailIF.ts#L82)

馬体重（例: "470(+4)"）

***

### winnerOrSecondary

> **winnerOrSecondary**: `string`

Defined in: [NKScraper/horseDetail/horseDetailIF.ts:86](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetailIF.ts#L86)

勝ち馬（および2着馬 表示）
