[**keibakun**](../../../../README.md)

***

[keibakun](../../../../modules.md) / [service/db/RaceResultDbService](../README.md) / RaceResultDbService

# Class: RaceResultDbService

Defined in: service/db/RaceResultDbService.ts:10

RaceResultDbService

スクレイピングしたレース結果を KeibakunServer の `POST /api/result` へ送信して
DB に格納するサービスクラス。

## Extends

- [`DbService`](../../../base/DbService/classes/DbService.md)

## Constructors

### Constructor

> **new RaceResultDbService**(): `RaceResultDbService`

Defined in: service/base/DbService.ts:14

#### Returns

`RaceResultDbService`

#### Inherited from

[`DbService`](../../../base/DbService/classes/DbService.md).[`constructor`](../../../base/DbService/classes/DbService.md#constructor)

## Properties

### serverUrl

> `protected` `readonly` **serverUrl**: `string`

Defined in: service/base/DbService.ts:12

#### Inherited from

[`DbService`](../../../base/DbService/classes/DbService.md).[`serverUrl`](../../../base/DbService/classes/DbService.md#serverurl)

## Methods

### post()

> `protected` **post**\<`T`\>(`endpoint`, `body`, `expectedStatus`): `Promise`\<`void`\>

Defined in: service/base/DbService.ts:26

KeibakunServer の指定エンドポイントへ JSON を POST します。

#### Type Parameters

##### T

`T`

#### Parameters

##### endpoint

`string`

パス（例: "/api/result"）

##### body

`T`

リクエストボディ（JSON シリアライズ可能なオブジェクト）

##### expectedStatus

`number` = `201`

期待する成功ステータスコード（デフォルト: 201）

#### Returns

`Promise`\<`void`\>

#### Throws

HTTP エラーまたはネットワーク障害時

#### Inherited from

[`DbService`](../../../base/DbService/classes/DbService.md).[`post`](../../../base/DbService/classes/DbService.md#post)

***

### store()

> **store**(`raceId`, `data`): `Promise`\<`void`\>

Defined in: service/db/RaceResultDbService.ts:17

レース結果を KeibakunServer へ POST して DB に格納します。

#### Parameters

##### raceId

`string`

12 桁のレースID

##### data

[`RaceResultWithRefund`](../../../../scrapers/nk/raceResult/raceResultDBIF/interfaces/RaceResultWithRefund.md)

スクレイピング済みのレース結果データ

#### Returns

`Promise`\<`void`\>
