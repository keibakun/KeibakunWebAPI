[**keibakun**](../../../../README.md)

***

[keibakun](../../../../modules.md) / [NKScraper/horseDetail/horseDetailIF](../README.md) / PedigreeNode

# Interface: PedigreeNode

Defined in: [NKScraper/horseDetail/horseDetailIF.ts:51](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetailIF.ts#L51)

血統ノード（再帰構造）。
generation=0 が対象馬本人、1 が父母、2 が祖父母 ... 最大5代まで。

 PedigreeNode

## Properties

### birthYear?

> `optional` **birthYear**: `number`

Defined in: [NKScraper/horseDetail/horseDetailIF.ts:61](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetailIF.ts#L61)

生年（世代整合性チェック用。不明な場合は省略）

***

### dam?

> `optional` **dam**: `PedigreeNode`

Defined in: [NKScraper/horseDetail/horseDetailIF.ts:65](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetailIF.ts#L65)

母

***

### gender

> **gender**: [`HorseGender`](../type-aliases/HorseGender.md)

Defined in: [NKScraper/horseDetail/horseDetailIF.ts:57](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetailIF.ts#L57)

性別

***

### generation

> **generation**: `number`

Defined in: [NKScraper/horseDetail/horseDetailIF.ts:59](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetailIF.ts#L59)

世代深度（0: 本人、1: 父母、2: 祖父母 ...）

***

### id

> **id**: `string`

Defined in: [NKScraper/horseDetail/horseDetailIF.ts:53](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetailIF.ts#L53)

馬ID

***

### name

> **name**: `string`

Defined in: [NKScraper/horseDetail/horseDetailIF.ts:55](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetailIF.ts#L55)

馬名

***

### sire?

> `optional` **sire**: `PedigreeNode`

Defined in: [NKScraper/horseDetail/horseDetailIF.ts:63](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetailIF.ts#L63)

父
