[**keibakun**](../../../../README.md)

***

[keibakun](../../../../modules.md) / [scripts/race/main\_shutuba](../README.md) / Main\_Shutuba

# Class: Main\_Shutuba

Defined in: scripts/race/main\_shutuba.ts:25

Main_Shutuba

`RaceSchedule/<YYYYMM>/index.html` から開催日を抽出し、
`RaceList/<kaisaiDate>/index.html` を参照して `raceId` を取り出し、
各 `raceId` に対して `getShutuba` を呼び出して出馬表を保存するクラスです。
デバッグモードフラグはデフォルトで false です。

## Constructors

### Constructor

> **new Main\_Shutuba**(`year`, `month?`, `day?`, `debug?`, `concurrency?`, `singleRaceId?`): `Main_Shutuba`

Defined in: scripts/race/main\_shutuba.ts:41

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

並列実行数（デフォルト: 5）

##### singleRaceId?

`string`

1件だけ取得する raceId（指定時は年月日を無視）

#### Returns

`Main_Shutuba`

## Methods

### run()

> **run**(): `Promise`\<`void`\>

Defined in: scripts/race/main\_shutuba.ts:54

エントリポイント: スケジュールから開催日を抽出して処理を開始します。
`singleRaceId` が指定された場合は年月日・debug フラグを無視し、その1件のみ処理します。

#### Returns

`Promise`\<`void`\>
