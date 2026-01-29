[**keibakun**](../../../README.md)

***

[keibakun](../../../modules.md) / [utils/JsonFileWriterUtil](../README.md) / JsonFileWriterUtil

# Class: JsonFileWriterUtil

Defined in: [utils/JsonFileWriterUtil.ts:9](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/utils/JsonFileWriterUtil.ts#L9)

JSONファイルの書き込みを行うユーティリティクラス

## Constructors

### Constructor

> **new JsonFileWriterUtil**(`logger?`): `JsonFileWriterUtil`

Defined in: [utils/JsonFileWriterUtil.ts:16](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/utils/JsonFileWriterUtil.ts#L16)

コンストラクタ

#### Parameters

##### logger?

[`Logger`](../../Logger/classes/Logger.md)

ログ出力用Loggerインスタンス（省略時は新規生成）

#### Returns

`JsonFileWriterUtil`

## Methods

### writeJson()

> **writeJson**(`outputDir`, `fileName`, `data`): `Promise`\<`void`\>

Defined in: [utils/JsonFileWriterUtil.ts:27](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/utils/JsonFileWriterUtil.ts#L27)

ディレクトリを作成し、JSONファイルを書き込む

#### Parameters

##### outputDir

`string`

出力ディレクトリ

##### fileName

`string`

ファイル名

##### data

`any`

保存するデータ（任意の型）

#### Returns

`Promise`\<`void`\>

書き込み完了時に解決されるPromise
