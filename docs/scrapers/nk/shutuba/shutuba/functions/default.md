[**keibakun**](../../../../../README.md)

***

[keibakun](../../../../../modules.md) / [scrapers/nk/shutuba/shutuba](../README.md) / default

# Function: default()

> **default**(`page`, `raceId`): `Promise`\<[`RaceIF`](../../ShutubaIF/interfaces/RaceIF.md)\>

Defined in: [scrapers/nk/shutuba/shutuba.ts:190](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/scrapers/nk/shutuba/shutuba.ts#L190)

出馬表を取得する関数

## Parameters

### page

`Page`

PuppeteerのPageインスタンス

### raceId

`string`

レースID

## Returns

`Promise`\<[`RaceIF`](../../ShutubaIF/interfaces/RaceIF.md)\>

- 出馬表の情報（コード化済み）
