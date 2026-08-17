[**keibakun**](../../../README.md)

***

[keibakun](../../../modules.md) / [service/ShutubaDbService](../README.md) / ShutubaDbService

# Class: ShutubaDbService

Defined in: [service/ShutubaDbService.ts:10](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/service/ShutubaDbService.ts#L10)

ShutubaDbService

スクレイピングした出馬表を KeibakunServer の `POST /shutuba` へ送信して
DB に格納するサービスクラス。

## Extends

- [`DbService`](../../DbService/classes/DbService.md)

## Constructors

### Constructor

> **new ShutubaDbService**(): `ShutubaDbService`

Defined in: [service/DbService.ts:14](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/service/DbService.ts#L14)

#### Returns

`ShutubaDbService`

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

Defined in: [service/ShutubaDbService.ts:17](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/service/ShutubaDbService.ts#L17)

出馬表を KeibakunServer へ POST して DB に格納します。

#### Parameters

##### raceId

`string`

12 桁のレースID

##### data

[`RaceIF`](../../../scrapers/nk/shutuba/ShutubaIF/interfaces/RaceIF.md)

スクレイピング済みの出馬表データ

#### Returns

`Promise`\<`void`\>
