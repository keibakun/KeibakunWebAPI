[**keibakun**](../../../../README.md)

***

[keibakun](../../../../modules.md) / [service/db/RaceListDbService](../README.md) / RaceListDbService

# Class: RaceListDbService

Defined in: [service/db/RaceListDbService.ts:14](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/service/db/RaceListDbService.ts#L14)

RaceListDbService

スクレイピングした RaceList を KeibakunServer の `POST /race-list` へ送信して
DB に格納するサービスクラス。

## Extends

- [`DbService`](../../../base/DbService/classes/DbService.md)

## Constructors

### Constructor

> **new RaceListDbService**(): `RaceListDbService`

Defined in: [service/base/DbService.ts:14](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/service/base/DbService.ts#L14)

#### Returns

`RaceListDbService`

#### Inherited from

[`DbService`](../../../base/DbService/classes/DbService.md).[`constructor`](../../../base/DbService/classes/DbService.md#constructor)

## Properties

### serverUrl

> `protected` `readonly` **serverUrl**: `string`

Defined in: [service/base/DbService.ts:12](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/service/base/DbService.ts#L12)

#### Inherited from

[`DbService`](../../../base/DbService/classes/DbService.md).[`serverUrl`](../../../base/DbService/classes/DbService.md#serverurl)

## Methods

### findRaceIds()

> **findRaceIds**(`date`): `Promise`\<`string`[]\>

Defined in: [service/db/RaceListDbService.ts:18](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/service/db/RaceListDbService.ts#L18)

指定開催日の raceId 一覧を KeibakunServer から取得します。

#### Parameters

##### date

`string`

#### Returns

`Promise`\<`string`[]\>

***

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

> **store**(`date`, `data`): `Promise`\<`void`\>

Defined in: [service/db/RaceListDbService.ts:33](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/service/db/RaceListDbService.ts#L33)

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
