[**keibakun**](../../../../README.md)

***

[keibakun](../../../../modules.md) / [scripts/base/MainScraper](../README.md) / MainScraper

# Abstract Class: MainScraper

Defined in: [scripts/base/MainScraper.ts:11](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/scripts/base/MainScraper.ts#L11)

Puppeteerを使用するデータ取得エントリポイントの共通基底クラスです。

サブクラスはスクレイピング対象と保存処理だけを実装し、ブラウザやPageの
ライフサイクル管理はこのクラスに委譲します。

## Extended by

- [`MainJraNews`](../../../jra/MainJraNews/classes/MainJraNews.md)
- [`MainRaceList`](../../../race/MainRaceList/classes/MainRaceList.md)
- [`MainRaceResult`](../../../race/MainRaceResult/classes/MainRaceResult.md)
- [`MainRaceSchedule`](../../../race/MainRaceSchedule/classes/MainRaceSchedule.md)
- [`MainShutuba`](../../../race/MainShutuba/classes/MainShutuba.md)

## Constructors

### Constructor

> **new MainScraper**(): `MainScraper`

#### Returns

`MainScraper`

## Properties

### logger

> `protected` `readonly` **logger**: [`Logger`](../../../../utils/Logger/classes/Logger.md)

Defined in: [scripts/base/MainScraper.ts:12](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/scripts/base/MainScraper.ts#L12)

## Methods

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
