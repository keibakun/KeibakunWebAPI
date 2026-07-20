# KeibakunWebAPI

netkeibaスクレイパー群とデータ保存ユーティリティです。

**概要**
- netkeiba の公開ページから「開催スケジュール」「レース一覧」「出馬表」「レース結果」「馬詳細」を取得してローカルにJSONで保存します。

**要求環境**
- Node.js (推奨: 16+)
- Chrome / Chromium（ヘッドレスでのスクレイピングに使用）

**セットアップ**
1. 依存パッケージをインストールします:

```
npm install
```

2. （任意）TypeScript の型チェック:

```
npx tsc --noEmit
```

**重要な環境変数**
- `KEIBAKUN_SERVER_URL`: KeibakunServer のベース URL（例: https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/Prod）→URLは管理者に確認してください
- `PUPPETEER_EXECUTABLE_PATH`: ローカルのChrome/Chromium実行ファイルパス（macOS 例: /Applications/Google Chrome.app/Contents/MacOS/Google Chrome）
- `PUPPETEER_HEADLESS`: `true`/`false`/`new` で Puppeteer の headless モードを切替

これらの環境変数は、`.env` ファイルに記述してください。`.env` ファイルは git 管理外にしてください。

例（macOS, ローカルChromeを使って、コマンド実行時に環境変数を指定する場合（ただし `.env` ファイルに記述する方法が推奨。あくまで一時的対応））:

```
PUPPETEER_EXECUTABLE_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" PUPPETEER_HEADLESS="false" npx tsx src/NKScraper/main_raceResult.ts 2025 10
```

**主要スクリプト（場所: src/NKScraper）**
- `main_raceSchedule.ts` : 年を指定して1年分の開催スケジュールを取得します。
	- 実行例: `npx tsx src/NKScraper/main_raceSchedule.ts 2025`
- `main_raceList.ts` : 開催日（kaisaiDate）ごとのレース一覧を取得します。
	- 実行例: `npx tsx src/NKScraper/main_raceList.ts 2025 6`
- `main_shutuba.ts` : 指定年月から開催日を取得し、各レースの出馬表を取得します。
	- 実行例: `npx tsx src/NKScraper/main_shutuba.ts 2025 6`
- `main_raceResult.ts` : RaceList から raceId を取得してレース結果を取得します。
	- 実行例: `npx tsx src/NKScraper/main_raceResult.ts 2025 6`
- `main_horseDetail.ts` : Shutuba から抽出した horseId を使って馬の詳細を取得します。
	- 実行例: `npx tsx src/NKScraper/main_horseDetail.ts 2025 6`

**出力先ディレクトリ**
- RaceSchedule/ : カレンダー（<YYYYMM>/index.html）
- RaceList/     : 開催日ごとのレース一覧（<kaisaiDate>/index.html）
- Shutuba/      : 出馬表（<year>/<month>/<day+raceNo>/index.html）
- RaceResult/   : レース結果（<year>/<month>/<rest>/index.html）
- HorseDetail/  : 馬の詳細（階層ディレクトリまたは <horseId>.html）

**内部ユーティリティ**
- src/utils/PuppeteerManager.ts : Puppeteer の起動・ページ管理を行う共通クラス
- src/utils/JsonFileWriterUtil.ts : JSON 保存（ディレクトリ作成含む）ユーティリティ
- src/utils/FileUtil.ts : 非同期ファイル存在チェック
- src/utils/Logger.ts : 簡易ログ出力

**開発フローの例**
1. 依存をインストール
2. 必要な環境変数を設定して各 main_*.ts を実行
3. 出力ディレクトリを確認