[**keibakun**](../../../../README.md)

***

[keibakun](../../../../modules.md) / [service/db/RaceScheduleDbService](../README.md) / RaceScheduleDbService

# Class: RaceScheduleDbService

Defined in: [service/db/RaceScheduleDbService.ts:20](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/service/db/RaceScheduleDbService.ts#L20)

RaceScheduleDbService

スクレイピングした月次開催日程を KeibakunServer の `POST /api/race-schedule` へ
送信して DB に格納するサービスクラス。

ネストした `Schedule[]` を `kaisaiDate × venue` のフラット形式に変換してから送信します。
kaisaiDate が空（開催なし）または venue が 0 のエントリは除外します。

## Extends

- [`DbService`](../../../base/DbService/classes/DbService.md)

## Constructors

### Constructor

> **new RaceScheduleDbService**(): `RaceScheduleDbService`

Defined in: [service/base/DbService.ts:14](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/service/base/DbService.ts#L14)

#### Returns

`RaceScheduleDbService`

#### Inherited from

[`DbService`](../../../base/DbService/classes/DbService.md).[`constructor`](../../../base/DbService/classes/DbService.md#constructor)

## Properties

### serverUrl

> `protected` `readonly` **serverUrl**: `string`

Defined in: [service/base/DbService.ts:12](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/service/base/DbService.ts#L12)

#### Inherited from

[`DbService`](../../../base/DbService/classes/DbService.md).[`serverUrl`](../../../base/DbService/classes/DbService.md#serverurl)

## Methods

### findKaisaiDates()

> **findKaisaiDates**(`yyyymm`): `Promise`\<`string`[]\>

Defined in: [service/db/RaceScheduleDbService.ts:24](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/service/db/RaceScheduleDbService.ts#L24)

指定年月の開催日を KeibakunServer から取得します。

#### Parameters

##### yyyymm

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

> **store**(`yyyymm`, `schedules`): `Promise`\<`void`\>

Defined in: [service/db/RaceScheduleDbService.ts:37](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/service/db/RaceScheduleDbService.ts#L37)

月次開催日程を KeibakunServer へ POST して DB に格納します。

#### Parameters

##### yyyymm

`string`

対象年月（例: "202601"）

##### schedules

[`Schedule`](../../../../scrapers/nk/raceSchedule/raceShceduleIF/interfaces/Schedule.md)[]

スクレイピング済みの月次日程

#### Returns

`Promise`\<`void`\>
