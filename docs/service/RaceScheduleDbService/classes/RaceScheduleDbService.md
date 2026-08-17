[**keibakun**](../../../README.md)

***

[keibakun](../../../modules.md) / [service/RaceScheduleDbService](../README.md) / RaceScheduleDbService

# Class: RaceScheduleDbService

Defined in: [service/RaceScheduleDbService.ts:20](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/service/RaceScheduleDbService.ts#L20)

RaceScheduleDbService

スクレイピングした月次開催日程を KeibakunServer の `POST /api/race-schedule` へ
送信して DB に格納するサービスクラス。

ネストした `Schedule[]` を `kaisaiDate × venue` のフラット形式に変換してから送信します。
kaisaiDate が空（開催なし）または venue が 0 のエントリは除外します。

## Extends

- [`DbService`](../../DbService/classes/DbService.md)

## Constructors

### Constructor

> **new RaceScheduleDbService**(): `RaceScheduleDbService`

Defined in: [service/DbService.ts:14](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/service/DbService.ts#L14)

#### Returns

`RaceScheduleDbService`

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

> **store**(`yyyymm`, `schedules`): `Promise`\<`void`\>

Defined in: [service/RaceScheduleDbService.ts:27](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/service/RaceScheduleDbService.ts#L27)

月次開催日程を KeibakunServer へ POST して DB に格納します。

#### Parameters

##### yyyymm

`string`

対象年月（例: "202601"）

##### schedules

[`Schedule`](../../../scrapers/nk/raceSchedule/raceShceduleIF/interfaces/Schedule.md)[]

スクレイピング済みの月次日程

#### Returns

`Promise`\<`void`\>
