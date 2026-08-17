[**keibakun**](../../../../README.md)

***

[keibakun](../../../../modules.md) / [service/db/HorseDetailDbService](../README.md) / HorseDetailDbService

# Class: HorseDetailDbService

Defined in: service/db/HorseDetailDbService.ts:10

HorseDetailDbService

スクレイピングした HorseDetail を KeibakunServer の `POST /horse-detail` へ送信して
DB に格納するサービスクラス。

## Extends

- [`DbService`](../../../base/DbService/classes/DbService.md)

## Constructors

### Constructor

> **new HorseDetailDbService**(): `HorseDetailDbService`

Defined in: service/base/DbService.ts:14

#### Returns

`HorseDetailDbService`

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

> **store**(`horseId`, `data`): `Promise`\<`void`\>

Defined in: service/db/HorseDetailDbService.ts:17

HorseDetail を KeibakunServer へ POST して DB に格納します。

#### Parameters

##### horseId

`string`

10桁の馬ID

##### data

[`HorseDetail`](../../../../scrapers/nk/horseDetail/horseDetailIF/interfaces/HorseDetail.md)

スクレイピング済みの HorseDetail データ

#### Returns

`Promise`\<`void`\>
