[**keibakun**](../../../../../README.md)

***

[keibakun](../../../../../modules.md) / [scrapers/nk/horseDetail/horseDetailIF](../README.md) / HorseRaceResultRow

# Interface: HorseRaceResultRow

Defined in: [scrapers/nk/horseDetail/horseDetailIF.ts:214](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/scrapers/nk/horseDetail/horseDetailIF.ts#L214)

レース結果1行分（race / entry / result の3分割構造）

 HorseRaceResultRow

## Properties

### entry

> **entry**: [`EntryInfo`](EntryInfo.md)

Defined in: [scrapers/nk/horseDetail/horseDetailIF.ts:218](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/scrapers/nk/horseDetail/horseDetailIF.ts#L218)

出走登録情報（馬・騎手）

***

### race

> **race**: [`RaceInfo`](RaceInfo.md)

Defined in: [scrapers/nk/horseDetail/horseDetailIF.ts:216](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/scrapers/nk/horseDetail/horseDetailIF.ts#L216)

レース自体の情報

***

### result

> **result**: [`ResultInfo`](ResultInfo.md)

Defined in: [scrapers/nk/horseDetail/horseDetailIF.ts:220](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/scrapers/nk/horseDetail/horseDetailIF.ts#L220)

出走結果情報
