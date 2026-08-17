[**keibakun**](../../../README.md)

***

[keibakun](../../../modules.md) / [service/RaceListDbService](../README.md) / RaceListDbService

# Class: RaceListDbService

Defined in: [service/RaceListDbService.ts:10](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/service/RaceListDbService.ts#L10)

RaceListDbService

スクレイピングした RaceList を KeibakunServer の `POST /race-list` へ送信して
DB に格納するサービスクラス。

## Extends

- [`DbService`](../../DbService/classes/DbService.md)

## Constructors

### Constructor

> **new RaceListDbService**(): `RaceListDbService`

Defined in: [service/DbService.ts:14](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/service/DbService.ts#L14)

#### Returns

`RaceListDbService`

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

> **store**(`date`, `data`): `Promise`\<`void`\>

Defined in: [service/RaceListDbService.ts:17](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/service/RaceListDbService.ts#L17)

RaceList を KeibakunServer へ POST して DB に格納します。

#### Parameters

##### date

`string`

開催日（YYYYMMDD）

##### data

[`RaceData`](../../../scrapers/nk/raceList/raceListIF/interfaces/RaceData.md)[]

スクレイピング済みの RaceList データ

#### Returns

`Promise`\<`void`\>
