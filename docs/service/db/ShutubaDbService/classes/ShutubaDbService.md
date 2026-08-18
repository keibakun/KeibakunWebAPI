[**keibakun**](../../../../README.md)

***

[keibakun](../../../../modules.md) / [service/db/ShutubaDbService](../README.md) / ShutubaDbService

# Class: ShutubaDbService

Defined in: [service/db/ShutubaDbService.ts:10](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/service/db/ShutubaDbService.ts#L10)

ShutubaDbService

スクレイピングした出馬表を KeibakunServer の `POST /shutuba` へ送信して
DB に格納するサービスクラス。

## Extends

- [`DbService`](../../../base/DbService/classes/DbService.md)

## Constructors

### Constructor

> **new ShutubaDbService**(): `ShutubaDbService`

Defined in: [service/base/DbService.ts:14](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/service/base/DbService.ts#L14)

#### Returns

`ShutubaDbService`

#### Inherited from

[`DbService`](../../../base/DbService/classes/DbService.md).[`constructor`](../../../base/DbService/classes/DbService.md#constructor)

## Properties

### serverUrl

> `protected` `readonly` **serverUrl**: `string`

Defined in: [service/base/DbService.ts:12](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/service/base/DbService.ts#L12)

#### Inherited from

[`DbService`](../../../base/DbService/classes/DbService.md).[`serverUrl`](../../../base/DbService/classes/DbService.md#serverurl)

## Methods

### get()

> `protected` **get**\<`T`\>(`endpoint`): `Promise`\<`T`\>

Defined in: [service/base/DbService.ts:42](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/service/base/DbService.ts#L42)

#### Type Parameters

##### T

`T`

#### Parameters

##### endpoint

`string`

#### Returns

`Promise`\<`T`\>

#### Inherited from

[`DbService`](../../../base/DbService/classes/DbService.md).[`get`](../../../base/DbService/classes/DbService.md#get)

***

### post()

> `protected` **post**\<`T`\>(`endpoint`, `body`, `expectedStatus`): `Promise`\<`void`\>

Defined in: [service/base/DbService.ts:26](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/service/base/DbService.ts#L26)

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

Defined in: [service/db/ShutubaDbService.ts:17](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/service/db/ShutubaDbService.ts#L17)

出馬表を KeibakunServer へ POST して DB に格納します。

#### Parameters

##### raceId

`string`

12 桁のレースID

##### data

[`RaceIF`](../../../../scrapers/nk/shutuba/ShutubaIF/interfaces/RaceIF.md)

スクレイピング済みの出馬表データ

#### Returns

`Promise`\<`void`\>
