[**keibakun**](../../../../README.md)

***

[keibakun](../../../../modules.md) / [NKScraper/horseDetail/horseDetailIF](../README.md) / Pedigree

# Type Alias: Pedigree

> **Pedigree** = `Record`\<`string`, [`PedigreeNode`](../interfaces/PedigreeNode.md)\>

Defined in: [NKScraper/horseDetail/horseDetailIF.ts:70](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horseDetailIF.ts#L70)

5代血統表（ヒープ方式インデックス）。

キーは整数のヒープインデックスを文字列化したもの。
- `"1"` : 本馬
- `"2"` : 父 / `"3"` : 母
- `"4"` : 父父 / `"5"` : 父母 / `"6"` : 母父 / `"7"` : 母母
- 偶数インデックス = 父系（牡） / 奇数インデックス = 母系（牝）
- 親ノードのインデックス `i` に対し、父 = `2i`、母 = `2i+1`
- 最大インデックス `"63"`（第5世代）
