[**keibakun**](../../../../README.md)

***

[keibakun](../../../../modules.md) / [scripts/jra/MainJraNews](../README.md) / MainJraNews

# Class: MainJraNews

Defined in: [scripts/jra/MainJraNews.ts:11](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/scripts/jra/MainJraNews.ts#L11)

JRAニューススクレイパーの簡易実行エントリ

実行例:
PUPPETEER_EXECUTABLE_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npx tsx src/scripts/jra/MainJraNews.ts

## Extends

- [`MainScraper`](../../../base/MainScraper/classes/MainScraper.md)

## Constructors

### Constructor

> **new MainJraNews**(): `MainJraNews`

#### Returns

`MainJraNews`

#### Inherited from

[`MainScraper`](../../../base/MainScraper/classes/MainScraper.md).[`constructor`](../../../base/MainScraper/classes/MainScraper.md#constructor)

## Properties

### logger

> `protected` `readonly` **logger**: [`Logger`](../../../../utils/Logger/classes/Logger.md)

Defined in: [scripts/base/MainScraper.ts:12](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/scripts/base/MainScraper.ts#L12)

#### Inherited from

[`MainScraper`](../../../base/MainScraper/classes/MainScraper.md).[`logger`](../../../base/MainScraper/classes/MainScraper.md#logger)

## Methods

### run()

> **run**(`yyyymm?`): `Promise`\<`void`\>

Defined in: [scripts/jra/MainJraNews.ts:17](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/scripts/jra/MainJraNews.ts#L17)

指定年月のJRAニュースを取得し、KeibakunServerへ保存します。

#### Parameters

##### yyyymm?

`string`

対象年月（YYYYMM）。省略時は現在年月

#### Returns

`Promise`\<`void`\>

#### Throws

PuppeteerまたはDB格納APIで発生したエラー

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
