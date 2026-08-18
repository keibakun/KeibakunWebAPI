[**keibakun**](../../../../README.md)

***

[keibakun](../../../../modules.md) / [service/base/DbService](../README.md) / DbService

# Abstract Class: DbService

Defined in: [service/base/DbService.ts:11](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/service/base/DbService.ts#L11)

## Extended by

- [`HorseDetailDbService`](../../../db/HorseDetailDbService/classes/HorseDetailDbService.md)
- [`JraNewsDbService`](../../../db/JraNewsDbService/classes/JraNewsDbService.md)
- [`RaceListDbService`](../../../db/RaceListDbService/classes/RaceListDbService.md)
- [`RaceResultDbService`](../../../db/RaceResultDbService/classes/RaceResultDbService.md)
- [`RaceScheduleDbService`](../../../db/RaceScheduleDbService/classes/RaceScheduleDbService.md)
- [`ShutubaDbService`](../../../db/ShutubaDbService/classes/ShutubaDbService.md)

## Constructors

### Constructor

> **new DbService**(): `DbService`

Defined in: [service/base/DbService.ts:14](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/service/base/DbService.ts#L14)

#### Returns

`DbService`

## Properties

### serverUrl

> `protected` `readonly` **serverUrl**: `string`

Defined in: [service/base/DbService.ts:12](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/service/base/DbService.ts#L12)

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
