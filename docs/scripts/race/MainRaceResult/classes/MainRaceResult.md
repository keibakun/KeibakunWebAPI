[**keibakun**](../../../../README.md)

***

[keibakun](../../../../modules.md) / [scripts/race/MainRaceResult](../README.md) / MainRaceResult

# Class: MainRaceResult

Defined in: [scripts/race/MainRaceResult.ts:21](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/scripts/race/MainRaceResult.ts#L21)

指定年月のレース結果を取得・保存するエントリポイントです。

年月をKeibakunServerへ問い合わせ、各 `raceId` に対して `RaceResult` を取得して
DBへ保存します。複数タブを使った並列スクレイピングに対応しています。
対象raceIdはKeibakunServerのレース一覧APIから取得します。

## Extends

- [`MainScraper`](../../../base/MainScraper/classes/MainScraper.md)

## Constructors

### Constructor

> **new MainRaceResult**(`year`, `monthArg?`, `concurrency?`, `singleRaceId?`): `MainRaceResult`

Defined in: [scripts/race/MainRaceResult.ts:34](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/scripts/race/MainRaceResult.ts#L34)

コンストラクタ

#### Parameters

##### year

`number`

対象の年（例: 2025）

##### monthArg?

`number`

対象の月（省略時は全月）

##### concurrency?

`number`

並列実行数（デフォルト: 5）

##### singleRaceId?

`string`

1件だけ取得する raceId（指定時は year/monthArg を無視）

#### Returns

`MainRaceResult`

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

Defined in: [scripts/race/MainRaceResult.ts:47](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/scripts/race/MainRaceResult.ts#L47)

対象月のraceIdを収集し、Puppeteerで結果取得を実行します。
 * `singleRaceId` が指定された場合は year/monthArg を無視し、その1件のみ処理します。

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
