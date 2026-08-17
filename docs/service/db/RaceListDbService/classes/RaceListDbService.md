[**keibakun**](../../../../README.md)

***

[keibakun](../../../../modules.md) / [service/db/RaceListDbService](../README.md) / RaceListDbService

# Class: RaceListDbService

Defined in: service/db/RaceListDbService.ts:10

RaceListDbService

スクレイピングした RaceList を KeibakunServer の `POST /race-list` へ送信して
DB に格納するサービスクラス。

## Extends

- [`DbService`](../../../base/DbService/classes/DbService.md)

## Constructors

### Constructor

> **new RaceListDbService**(): `RaceListDbService`

Defined in: service/base/DbService.ts:14

#### Returns

`RaceListDbService`

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

> **store**(`date`, `data`): `Promise`\<`void`\>

Defined in: service/db/RaceListDbService.ts:17

RaceList を KeibakunServer へ POST して DB に格納します。

#### Parameters

##### date

`string`

開催日（YYYYMMDD）

##### data

[`RaceData`](../../../../scrapers/nk/raceList/raceListIF/interfaces/RaceData.md)[]

スクレイピング済みの RaceList データ

#### Returns

`Promise`\<`void`\>
