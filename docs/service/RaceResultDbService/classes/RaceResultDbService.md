[**keibakun**](../../../README.md)

***

[keibakun](../../../modules.md) / [service/RaceResultDbService](../README.md) / RaceResultDbService

# Class: RaceResultDbService

Defined in: [service/RaceResultDbService.ts:10](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/service/RaceResultDbService.ts#L10)

RaceResultDbService

スクレイピングしたレース結果を KeibakunServer の `POST /api/result` へ送信して
DB に格納するサービスクラス。

## Extends

- [`DbService`](../../DbService/classes/DbService.md)

## Constructors

### Constructor

> **new RaceResultDbService**(): `RaceResultDbService`

Defined in: [service/DbService.ts:14](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/service/DbService.ts#L14)

#### Returns

`RaceResultDbService`

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

> **store**(`raceId`, `data`): `Promise`\<`void`\>

Defined in: [service/RaceResultDbService.ts:17](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/service/RaceResultDbService.ts#L17)

レース結果を KeibakunServer へ POST して DB に格納します。

#### Parameters

##### raceId

`string`

12 桁のレースID

##### data

[`RaceResultWithRefund`](../../../scrapers/nk/raceResult/raceResultDBIF/interfaces/RaceResultWithRefund.md)

スクレイピング済みのレース結果データ

#### Returns

`Promise`\<`void`\>
