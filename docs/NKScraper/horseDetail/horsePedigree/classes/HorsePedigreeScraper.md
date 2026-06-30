[**keibakun**](../../../../README.md)

***

[keibakun](../../../../modules.md) / [NKScraper/horseDetail/horsePedigree](../README.md) / HorsePedigreeScraper

# Class: HorsePedigreeScraper

Defined in: [NKScraper/horseDetail/horsePedigree.ts:96](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horsePedigree.ts#L96)

馬の5代血統表スクレイパー。

`https://db.netkeiba.com/horse/ped/{horseId}/` から血統を取得し、
ヒープインデックス形式の [Pedigree](../../horseDetailIF/type-aliases/Pedigree.md) として返す。

`HorseDetailScraper` とは別ページを渡して単独で使用すること。

## Example

```typescript
const page = await pm.newPage();
try {
    const scraper = new HorsePedigreeScraper(page);
    const pedigree = await scraper.scrapePedigree(horseId, profile);
} finally {
    await page.close();
}
```

## Constructors

### Constructor

> **new HorsePedigreeScraper**(`page`): `HorsePedigreeScraper`

Defined in: [NKScraper/horseDetail/horsePedigree.ts:104](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horsePedigree.ts#L104)

#### Parameters

##### page

`Page`

スクレイピングに使用する Puppeteer Page。
              1件ごとに新しいページを渡して状態汚染を防ぐこと。

#### Returns

`HorsePedigreeScraper`

## Methods

### scrapePedigree()

> **scrapePedigree**(`horseId`, `profile`): `Promise`\<[`Pedigree`](../../horseDetailIF/type-aliases/Pedigree.md)\>

Defined in: [NKScraper/horseDetail/horsePedigree.ts:119](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/NKScraper/horseDetail/horsePedigree.ts#L119)

db.netkeiba の血統ページ（`/horse/ped/{horseId}/`）から5代血統表を取得する。

- ヒープインデックス方式（`"2"`=父 / `"3"`=母 / ... / `"63"`=第5世代）
- インデックス `"1"` には本馬自身を追加する。
- エラー発生時は空オブジェクトを返し処理を継続する。

#### Parameters

##### horseId

`string`

馬ID（例: `"2020109107"`）

##### profile

[`HorseProfile`](../../horseDetailIF/interfaces/HorseProfile.md)

`HorseDetailScraper` で取得した馬プロフィール（馬名・性別に使用）

#### Returns

`Promise`\<[`Pedigree`](../../horseDetailIF/type-aliases/Pedigree.md)\>
