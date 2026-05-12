[**keibakun**](../../../README.md)

***

[keibakun](../../../modules.md) / [NKScraper/main\_shutuba\_temp](../README.md) / Main\_Shutuba

# Class: Main\_Shutuba

Defined in: [NKScraper/main\_shutuba\_temp.ts:25](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/main_shutuba_temp.ts#L25)

Main_Shutuba

`RaceSchedule/<YYYYMM>/index.html` から開催日を抽出し、
`RaceList/<kaisaiDate>/index.html` を参照して `raceId` を取り出し、
各 `raceId` に対して `getShutuba` を呼び出して出馬表を保存するクラスです。
デバッグモードフラグはデフォルトで false です。

## Constructors

### Constructor

> **new Main\_Shutuba**(`year`, `month?`, `day?`, `debug?`, `concurrency?`): `Main_Shutuba`

Defined in: [NKScraper/main\_shutuba\_temp.ts:39](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/main_shutuba_temp.ts#L39)

コンストラクタ

#### Parameters

##### year

`number`

対象年（例: 2026）

##### month?

`number`

対象月（1-12）

##### day?

`number`

対象日（1-31）

##### debug?

`boolean`

デバッグモードフラグ

##### concurrency?

`number`

並列実行数（デフォルト: 3）

#### Returns

`Main_Shutuba`

## Methods

### run()

> **run**(): `Promise`\<`void`\>

Defined in: [NKScraper/main\_shutuba\_temp.ts:50](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/main_shutuba_temp.ts#L50)

エントリポイント: スケジュールから開催日を抽出して処理を開始します。

#### Returns

`Promise`\<`void`\>
