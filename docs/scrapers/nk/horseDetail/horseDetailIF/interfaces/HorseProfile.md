[**keibakun**](../../../../../README.md)

***

[keibakun](../../../../../modules.md) / [scrapers/nk/horseDetail/horseDetailIF](../README.md) / HorseProfile

# Interface: HorseProfile

Defined in: scrapers/nk/horseDetail/horseDetailIF.ts:77

馬の個別データのインターフェース。

 HorseProfile

## Properties

### age

> **age**: `number`

Defined in: scrapers/nk/horseDetail/horseDetailIF.ts:85

馬齢（例：3）

***

### birthDate

> **birthDate**: `string`

Defined in: scrapers/nk/horseDetail/horseDetailIF.ts:89

生年月日（元の表記）

***

### breeder

> **breeder**: `string`

Defined in: scrapers/nk/horseDetail/horseDetailIF.ts:101

生産者

***

### breederId

> **breederId**: `string`

Defined in: scrapers/nk/horseDetail/horseDetailIF.ts:103

生産者ID

***

### kyuusya

> **kyuusya**: `string`

Defined in: scrapers/nk/horseDetail/horseDetailIF.ts:95

厩舎（美浦・栗東など）

***

### name

> **name**: `string`

Defined in: scrapers/nk/horseDetail/horseDetailIF.ts:79

馬名

***

### owner

> **owner**: `string`

Defined in: scrapers/nk/horseDetail/horseDetailIF.ts:97

馬主

***

### ownerId

> **ownerId**: `string`

Defined in: scrapers/nk/horseDetail/horseDetailIF.ts:99

馬主ID

***

### pedigree?

> `optional` **pedigree**: [`Pedigree`](../type-aliases/Pedigree.md)

Defined in: scrapers/nk/horseDetail/horseDetailIF.ts:105

5代血統表（ヒープインデックス形式。未取得の場合は省略）

***

### sex

> **sex**: `number`

Defined in: scrapers/nk/horseDetail/horseDetailIF.ts:83

性別コード。`1`=牡 / `2`=牝 / `3`=せん

***

### status

> **status**: `string`

Defined in: scrapers/nk/horseDetail/horseDetailIF.ts:81

現役/引退などの状態

***

### trainer

> **trainer**: `string`

Defined in: scrapers/nk/horseDetail/horseDetailIF.ts:91

調教師（調教師名）

***

### trainerId

> **trainerId**: `string`

Defined in: scrapers/nk/horseDetail/horseDetailIF.ts:93

調教師ID

***

### type

> **type**: `number`

Defined in: scrapers/nk/horseDetail/horseDetailIF.ts:87

毛色コード
