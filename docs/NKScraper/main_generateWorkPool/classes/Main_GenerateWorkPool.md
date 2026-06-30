[**keibakun**](../../../README.md)

***

[keibakun](../../../modules.md) / [NKScraper/main\_generateWorkPool](../README.md) / Main\_GenerateWorkPool

# Class: Main\_GenerateWorkPool

Defined in: [NKScraper/main\_generateWorkPool.ts:127](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/main_generateWorkPool.ts#L127)

Shutuba フォルダを最新年度から走査して workPool ファイルを生成するクラス。

- Shutuba ディレクトリを **年→月→レース** の順で降順走査する（最新優先）。
- raceId / horseId / umaban を抽出し、CHUNK\_SIZE 件ごとに
  `temp/work/workPool/horseDetail/workPool{n}.json` へ保存する。
- horseId の重複は最初に出現したエントリのみ採用する。

## Example

```typescript
const gen = new Main_GenerateWorkPool();
await gen.run();
```

## Constructors

### Constructor

> **new Main\_GenerateWorkPool**(): `Main_GenerateWorkPool`

#### Returns

`Main_GenerateWorkPool`

## Methods

### run()

> **run**(): `Promise`\<`void`\>

Defined in: [NKScraper/main\_generateWorkPool.ts:132](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/main_generateWorkPool.ts#L132)

workPool 生成処理を実行する。

#### Returns

`Promise`\<`void`\>
