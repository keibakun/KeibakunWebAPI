[**keibakun**](../../../../README.md)

***

[keibakun](../../../../modules.md) / [scripts/race/MainShutuba](../README.md) / MainShutuba

# Class: MainShutuba

Defined in: [scripts/race/MainShutuba.ts:24](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/scripts/race/MainShutuba.ts#L24)

開催日の出馬表を取得・保存するエントリポイントです。

KeibakunServerから開催日と `raceId` を取得し、
各 `raceId` に対して `getShutuba` を呼び出し、KeibakunServerへ保存します。
デバッグモードフラグはデフォルトで false です。

## Extends

- [`MainScraper`](../../../base/MainScraper/classes/MainScraper.md)

## Constructors

### Constructor

> **new MainShutuba**(`year`, `month?`, `day?`, `debug?`, `concurrency?`, `singleRaceId?`): `MainShutuba`

Defined in: [scripts/race/MainShutuba.ts:40](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/scripts/race/MainShutuba.ts#L40)

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

`MainShutuba`

#### Overrides

[`MainScraper`](../../../base/MainScraper/classes/MainScraper.md).[`constructor`](../../../base/MainScraper/classes/MainScraper.md#constructor)

## Properties

### logger

> `protected` `readonly` **logger**: [`Logger`](../../../../utils/Logger/classes/Logger.md)

Defined in: [scripts/base/MainScraper.ts:12](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/scripts/base/MainScraper.ts#L12)

#### Inherited from

[`MainScraper`](../../../base/MainScraper/classes/MainScraper.md).[`logger`](../../../base/MainScraper/classes/MainScraper.md#logger)

## Methods

### run()

> **run**(): `Promise`\<`void`\>

Defined in: [scripts/race/MainShutuba.ts:55](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/scripts/race/MainShutuba.ts#L55)

Server APIから開催日とraceIdを取得して出馬表の処理を開始します。
`singleRaceId` が指定された場合は年月日・debug フラグを無視し、その1件のみ処理します。

#### Returns

`Promise`\<`void`\>

#### Throws

ワーカープールまたはブラウザ処理で発生したエラー

***

### withPage()

> `protected` **withPage**\<`T`\>(`task`): `Promise`\<`T`\>

Defined in: [scripts/base/MainScraper.ts:21](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/scripts/base/MainScraper.ts#L21)

Pageを1枚使用する処理を実行します。

タスクの成功・失敗にかかわらず、処理完了後にブラウザを終了します。

#### Type Parameters

##### T

`T`

#### Parameters

##### task

(`page`) => `Promise`\<`T`\>

初期化済みPageを受け取る処理

#### Returns

`Promise`\<`T`\>

タスクの戻り値

#### Inherited from

[`MainScraper`](../../../base/MainScraper/classes/MainScraper.md).[`withPage`](../../../base/MainScraper/classes/MainScraper.md#withpage)

***

### withWorkerPages()

> `protected` **withWorkerPages**\<`T`\>(`items`, `concurrency`, `task`): `Promise`\<`void`\>

Defined in: [scripts/base/MainScraper.ts:40](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/scripts/base/MainScraper.ts#L40)

複数のPageを使って項目を並列処理します。

項目は共有カーソルから一度ずつ取り出されます。使用するPage数は、
指定された並列数と項目数の小さい方に制限されます。

#### Type Parameters

##### T

`T`

#### Parameters

##### items

`T`[]

処理対象の項目一覧

##### concurrency

`number`

最大同時実行数

##### task

(`page`, `item`, `index`, `workerId`) => `Promise`\<`void`\>

Page、項目、項目の位置、ワーカー番号を受け取る処理

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`MainScraper`](../../../base/MainScraper/classes/MainScraper.md).[`withWorkerPages`](../../../base/MainScraper/classes/MainScraper.md#withworkerpages)
