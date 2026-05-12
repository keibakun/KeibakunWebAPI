[**keibakun**](../../../../README.md)

***

[keibakun](../../../../modules.md) / [JRAScraper/News/JraNews](../README.md) / JraNews

# Class: JraNews

Defined in: [JRAScraper/News/JraNews.ts:15](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/JRAScraper/News/JraNews.ts#L15)

JRAニュースをスクレイピングするクラス

使い方の例:
 const pm = new PuppeteerManager();
 await pm.init();
 const page = pm.getPage();
 const scraper = new JraNews(page);
 const news = await scraper.getNews();

## Constructors

### Constructor

> **new JraNews**(`page`): `JraNews`

Defined in: [JRAScraper/News/JraNews.ts:20](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/JRAScraper/News/JraNews.ts#L20)

#### Parameters

##### page

`Page`

#### Returns

`JraNews`

## Methods

### getNews()

> **getNews**(`yyyymm?`): `Promise`\<[`JraNewsIF`](../../JraNewsIF/type-aliases/JraNewsIF.md)\>

Defined in: [JRAScraper/News/JraNews.ts:39](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/JRAScraper/News/JraNews.ts#L39)

年月パラメータを受け取りスクレイピング先を切替える

#### Parameters

##### yyyymm?

`string`

optional 年月（yyyymm）。未指定の場合は現行のニュース一覧（/news/）を使用

#### Returns

`Promise`\<[`JraNewsIF`](../../JraNewsIF/type-aliases/JraNewsIF.md)\>
