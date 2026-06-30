[**keibakun**](../../../../README.md)

***

[keibakun](../../../../modules.md) / [NKScraper/horseDetail/horseDetailIF](../README.md) / HorseProfile

# Interface: HorseProfile

Defined in: [NKScraper/horseDetail/horseDetailIF.ts:77](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetailIF.ts#L77)

馬の個別データのインターフェース。

 HorseProfile

## Properties

### age

> **age**: `number`

Defined in: [NKScraper/horseDetail/horseDetailIF.ts:85](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetailIF.ts#L85)

馬齢（例：3）

***

### birthDate

> **birthDate**: `string`

Defined in: [NKScraper/horseDetail/horseDetailIF.ts:89](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetailIF.ts#L89)

生年月日（元の表記）

***

### breeder

> **breeder**: `string`

Defined in: [NKScraper/horseDetail/horseDetailIF.ts:101](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetailIF.ts#L101)

生産者

***

### breederId

> **breederId**: `string`

Defined in: [NKScraper/horseDetail/horseDetailIF.ts:103](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetailIF.ts#L103)

生産者ID

***

### kyuusya

> **kyuusya**: `string`

Defined in: [NKScraper/horseDetail/horseDetailIF.ts:95](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetailIF.ts#L95)

厩舎（美浦・栗東など）

***

### name

> **name**: `string`

Defined in: [NKScraper/horseDetail/horseDetailIF.ts:79](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetailIF.ts#L79)

馬名

***

### owner

> **owner**: `string`

Defined in: [NKScraper/horseDetail/horseDetailIF.ts:97](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetailIF.ts#L97)

馬主

***

### ownerId

> **ownerId**: `string`

Defined in: [NKScraper/horseDetail/horseDetailIF.ts:99](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetailIF.ts#L99)

馬主ID

***

### pedigree?

> `optional` **pedigree**: [`Pedigree`](../type-aliases/Pedigree.md)

Defined in: [NKScraper/horseDetail/horseDetailIF.ts:105](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetailIF.ts#L105)

5代血統表（ヒープインデックス形式。未取得の場合は省略）

***

### sex

> **sex**: `number`

Defined in: [NKScraper/horseDetail/horseDetailIF.ts:83](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetailIF.ts#L83)

性別コード。`1`=牡 / `2`=牝 / `3`=せん

***

### status

> **status**: `string`

Defined in: [NKScraper/horseDetail/horseDetailIF.ts:81](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetailIF.ts#L81)

現役/引退などの状態

***

### trainer

> **trainer**: `string`

Defined in: [NKScraper/horseDetail/horseDetailIF.ts:91](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetailIF.ts#L91)

調教師（調教師名）

***

### trainerId

> **trainerId**: `string`

Defined in: [NKScraper/horseDetail/horseDetailIF.ts:93](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetailIF.ts#L93)

調教師ID

***

### type

> **type**: `number`

Defined in: [NKScraper/horseDetail/horseDetailIF.ts:87](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetailIF.ts#L87)

毛色コード
