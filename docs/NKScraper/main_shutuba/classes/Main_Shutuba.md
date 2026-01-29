[**keibakun**](../../../README.md)

***

[keibakun](../../../modules.md) / [NKScraper/main\_shutuba](../README.md) / Main\_Shutuba

# Class: Main\_Shutuba

Defined in: [NKScraper/main\_shutuba.ts:19](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/main_shutuba.ts#L19)

Main_Shutuba

`RaceSchedule/<YYYYMM>/index.html` から開催日を抽出し、
`RaceList/<kaisaiDate>/index.html` を参照して `raceId` を取り出し、
各 `raceId` に対して `getShutuba` を呼び出して出馬表を保存するクラスです。

## Constructors

### Constructor

> **new Main\_Shutuba**(`year`, `monthArg?`): `Main_Shutuba`

Defined in: [NKScraper/main\_shutuba.ts:28](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/main_shutuba.ts#L28)

コンストラクタ

#### Parameters

##### year

`number`

対象年（例: 2025）

##### monthArg?

`number`

対象月（1-12）

#### Returns

`Main_Shutuba`

## Methods

### run()

> **run**(): `Promise`\<`void`\>

Defined in: [NKScraper/main\_shutuba.ts:36](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/main_shutuba.ts#L36)

エントリポイント: スケジュールから開催日を抽出して処理を開始します。

#### Returns

`Promise`\<`void`\>
