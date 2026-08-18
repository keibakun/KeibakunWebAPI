[**keibakun**](../../../../README.md)

***

[keibakun](../../../../modules.md) / [service/db/JraNewsDbService](../README.md) / JraNewsDbService

# Class: JraNewsDbService

Defined in: [service/db/JraNewsDbService.ts:10](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/service/db/JraNewsDbService.ts#L10)

JraNewsDbService

スクレイピングした JRA_News を KeibakunServer の `POST /jra-news` へ送信して
DB に格納するサービスクラス。

## Extends

- [`DbService`](../../../base/DbService/classes/DbService.md)

## Constructors

### Constructor

> **new JraNewsDbService**(): `JraNewsDbService`

Defined in: [service/base/DbService.ts:14](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/service/base/DbService.ts#L14)

#### Returns

`JraNewsDbService`

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

> **store**(`yyyymm`, `data`): `Promise`\<`void`\>

Defined in: [service/db/JraNewsDbService.ts:17](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/service/db/JraNewsDbService.ts#L17)

JRA_News を KeibakunServer へ POST して DB に格納します。

#### Parameters

##### yyyymm

`string`

取得対象年月（YYYYMM）

##### data

[`JraNewsIF`](../../../../scrapers/jra/News/JraNewsIF/type-aliases/JraNewsIF.md)

スクレイピング済みのニュース配列

#### Returns

`Promise`\<`void`\>
