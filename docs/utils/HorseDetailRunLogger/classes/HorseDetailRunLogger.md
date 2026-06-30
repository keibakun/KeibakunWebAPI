[**keibakun**](../../../README.md)

***

[keibakun](../../../modules.md) / [utils/HorseDetailRunLogger](../README.md) / HorseDetailRunLogger

# Class: HorseDetailRunLogger

Defined in: [utils/HorseDetailRunLogger.ts:25](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/utils/HorseDetailRunLogger.ts#L25)

競走馬詳細取得の失敗・スキップを記録し、ログファイルに出力するクラス。

ログファイルは `{outDir}/{prefix}_{YYYYMMDDHHmm}.log` に保存される。
エントリが0件の場合はファイルを生成しない。

## Example

```typescript
const log = new HorseDetailRunLogger("main_horseDetail_db", path.join(process.cwd(), "Log/HorseDetail"));
log.recordFail("2019104567", "DB取得エラー: timeout");
log.recordSkip("2019104568", "HorseDetailが存在しない");
const saved = await log.save();
if (saved) logger.info(`ログを保存しました: ${saved}`);
```

## Constructors

### Constructor

> **new HorseDetailRunLogger**(`prefix`, `outDir`): `HorseDetailRunLogger`

Defined in: [utils/HorseDetailRunLogger.ts:33](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/utils/HorseDetailRunLogger.ts#L33)

#### Parameters

##### prefix

`string`

ログファイル名のプレフィックス（実行中の main ファイル名、例: "main_horseDetail_db"）

##### outDir

`string`

ログファイルの出力ディレクトリ（例: path.join(process.cwd(), "Log/HorseDetail")）

#### Returns

`HorseDetailRunLogger`

## Methods

### hasEntries()

> **hasEntries**(): `boolean`

Defined in: [utils/HorseDetailRunLogger.ts:49](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/utils/HorseDetailRunLogger.ts#L49)

記録済みエントリが1件以上あるか返す

#### Returns

`boolean`

***

### recordFail()

> **recordFail**(`horseId`, `reason`): `void`

Defined in: [utils/HorseDetailRunLogger.ts:39](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/utils/HorseDetailRunLogger.ts#L39)

処理失敗した競走馬 ID を記録する

#### Parameters

##### horseId

`string`

##### reason

`string`

#### Returns

`void`

***

### recordSkip()

> **recordSkip**(`horseId`, `reason`): `void`

Defined in: [utils/HorseDetailRunLogger.ts:44](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/utils/HorseDetailRunLogger.ts#L44)

スキップした競走馬 ID を記録する

#### Parameters

##### horseId

`string`

##### reason

`string`

#### Returns

`void`

***

### save()

> **save**(): `Promise`\<`string`\>

Defined in: [utils/HorseDetailRunLogger.ts:57](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/utils/HorseDetailRunLogger.ts#L57)

エントリが1件以上ある場合にのみログファイルを書き出す。

#### Returns

`Promise`\<`string`\>

保存したファイルのパス。エントリなし（0件）の場合は `null`
