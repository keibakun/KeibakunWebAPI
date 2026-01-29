[**keibakun**](../../../README.md)

***

[keibakun](../../../modules.md) / [utils/PuppeteerManager](../README.md) / PuppeteerManager

# Class: PuppeteerManager

Defined in: [utils/PuppeteerManager.ts:10](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/utils/PuppeteerManager.ts#L10)

Puppeteerを管理するクラス
- ブラウザの起動/終了はinit/closeで管理
- getPageは何度でも呼び出し可能
- クラスの状態（browser, page）は持たず、都度返す

## Constructors

### Constructor

> **new PuppeteerManager**(): `PuppeteerManager`

#### Returns

`PuppeteerManager`

## Methods

### close()

> **close**(): `Promise`\<`void`\>

Defined in: [utils/PuppeteerManager.ts:67](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/utils/PuppeteerManager.ts#L67)

ブラウザ・ページのクローズ

#### Returns

`Promise`\<`void`\>

***

### getBrowser()

> **getBrowser**(): `Browser`

Defined in: [utils/PuppeteerManager.ts:92](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/utils/PuppeteerManager.ts#L92)

Browserインスタンス取得

#### Returns

`Browser`

***

### getPage()

> **getPage**(): `Page`

Defined in: [utils/PuppeteerManager.ts:81](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/utils/PuppeteerManager.ts#L81)

Pageインスタンス取得

#### Returns

`Page`

***

### init()

> **init**(`options?`): `Promise`\<`void`\>

Defined in: [utils/PuppeteerManager.ts:21](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/utils/PuppeteerManager.ts#L21)

ブラウザ・ページの初期化
環境変数を使ってローカルの Chrome/Chromium 実行ファイルを指定できます:
  PUPPETEER_EXECUTABLE_PATH=/path/to/chrome
  PUPPETEER_HEADLESS=new|false|true

#### Parameters

##### options?

`LaunchOptions`

#### Returns

`Promise`\<`void`\>
