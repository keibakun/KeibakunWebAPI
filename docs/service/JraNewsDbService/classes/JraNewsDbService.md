[**keibakun**](../../../README.md)

***

[keibakun](../../../modules.md) / [service/JraNewsDbService](../README.md) / JraNewsDbService

# Class: JraNewsDbService

Defined in: [service/JraNewsDbService.ts:10](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/service/JraNewsDbService.ts#L10)

JraNewsDbService

スクレイピングした JRA_News を KeibakunServer の `POST /jra-news` へ送信して
DB に格納するサービスクラス。

## Extends

- [`DbService`](../../DbService/classes/DbService.md)

## Constructors

### Constructor

> **new JraNewsDbService**(): `JraNewsDbService`

Defined in: [service/DbService.ts:14](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/service/DbService.ts#L14)

#### Returns

`JraNewsDbService`

#### Inherited from

[`DbService`](../../DbService/classes/DbService.md).[`constructor`](../../DbService/classes/DbService.md#constructor)

## Properties

### serverUrl

> `protected` `readonly` **serverUrl**: `string`

Defined in: [service/DbService.ts:12](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/service/DbService.ts#L12)

#### Inherited from

[`DbService`](../../DbService/classes/DbService.md).[`serverUrl`](../../DbService/classes/DbService.md#serverurl)

## Methods

### post()

> `protected` **post**\<`T`\>(`endpoint`, `body`, `expectedStatus`): `Promise`\<`void`\>

Defined in: [service/DbService.ts:26](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/service/DbService.ts#L26)

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

[`DbService`](../../DbService/classes/DbService.md).[`post`](../../DbService/classes/DbService.md#post)

***

### store()

> **store**(`yyyymm`, `data`): `Promise`\<`void`\>

Defined in: [service/JraNewsDbService.ts:17](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/service/JraNewsDbService.ts#L17)

JRA_News を KeibakunServer へ POST して DB に格納します。

#### Parameters

##### yyyymm

`string`

取得対象年月（YYYYMM）

##### data

[`JraNewsIF`](../../../scrapers/jra/News/JraNewsIF/type-aliases/JraNewsIF.md)

スクレイピング済みのニュース配列

#### Returns

`Promise`\<`void`\>
