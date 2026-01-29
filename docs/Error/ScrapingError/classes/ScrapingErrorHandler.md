[**keibakun**](../../../README.md)

***

[keibakun](../../../modules.md) / [Error/ScrapingError](../README.md) / ScrapingErrorHandler

# Class: ScrapingErrorHandler

Defined in: [Error/ScrapingError.tsx:9](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/Error/ScrapingError.tsx#L9)

## Constructors

### Constructor

> **new ScrapingErrorHandler**(): `ScrapingErrorHandler`

#### Returns

`ScrapingErrorHandler`

## Methods

### handle()

> `static` **handle**(`e`): `void`

Defined in: [Error/ScrapingError.tsx:11](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/Error/ScrapingError.tsx#L11)

#### Parameters

##### e

`Error`

#### Returns

`void`

***

### handleNullOrEmpty()

> `static` **handleNullOrEmpty**(`message`): `void`

Defined in: [Error/ScrapingError.tsx:26](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/Error/ScrapingError.tsx#L26)

nullがある場合の処理

コンソールにエラーメッセージを表示します

#### Parameters

##### message

`string`

エラーメッセージ

#### Returns

`void`
