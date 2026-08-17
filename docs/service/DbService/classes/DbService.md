[**keibakun**](../../../README.md)

***

[keibakun](../../../modules.md) / [service/DbService](../README.md) / DbService

# Abstract Class: DbService

Defined in: [service/DbService.ts:11](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/service/DbService.ts#L11)

## Extended by

- [`HorseDetailDbService`](../../HorseDetailDbService/classes/HorseDetailDbService.md)
- [`JraNewsDbService`](../../JraNewsDbService/classes/JraNewsDbService.md)
- [`RaceListDbService`](../../RaceListDbService/classes/RaceListDbService.md)
- [`RaceResultDbService`](../../RaceResultDbService/classes/RaceResultDbService.md)
- [`RaceScheduleDbService`](../../RaceScheduleDbService/classes/RaceScheduleDbService.md)
- [`ShutubaDbService`](../../ShutubaDbService/classes/ShutubaDbService.md)

## Constructors

### Constructor

> **new DbService**(): `DbService`

Defined in: [service/DbService.ts:14](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/service/DbService.ts#L14)

#### Returns

`DbService`

## Properties

### serverUrl

> `protected` `readonly` **serverUrl**: `string`

Defined in: [service/DbService.ts:12](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/service/DbService.ts#L12)

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
