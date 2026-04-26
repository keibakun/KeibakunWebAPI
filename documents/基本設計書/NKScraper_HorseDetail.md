# NKScraper – HorseDetail 基本設計書

## 1. 概要

`HorseDetail` は出馬表に登録されている各馬のプロフィールと過去レース成績を取得し、
`HorseDetail/{year}/{month}/{part3}/{part4}/index.html` に JSON 形式で保存するモジュールです。

---

## 2. スクレイピング先（v2 以降）

| 項目 | 内容 |
|------|------|
| URL | `https://race.sp.netkeiba.com/modal/horse.html` |
| クエリパラメータ | `race_id={raceId}`, `horse_id={horseId}`, `i={umaban-1}`, `rf=shutuba_modal` |
| ページ種別 | SP版（スマートフォン向け）モーダルページ |
| ユーザーエージェント | モバイル UA（iPhone Safari） |

> **変更理由**: 旧スクレイピング先 (`db.netkeiba.com/horse/{horseId}/`) は数回のアクセスでブロックされるため、
> SP版モーダルページへ変更。

---

## 3. 取得データ

### 3.1 馬プロフィール（HorseProfile）

| フィールド | 説明 | マッピング元（日本語ラベル） |
|-----------|------|--------------------------|
| `name` | 馬名 | `馬名` またはページ見出し |
| `status` | 現役/引退等 | ヘッダテキスト先頭 |
| `sexage` | 性齢 | `性齢` またはヘッダテキスト |
| `type` | 毛色 | ヘッダテキスト 3番目トークン |
| `birthDate` | 生年月日 | `生年月日` |
| `owner` | 馬主 | `馬主` |
| `breeder` | 生産者 | `生産者` |
| `trainer` | 調教師 | `調教師` |
| `career` | 通算成績 | `通算成績` |

### 3.2 過去レース成績（HorseRaceResultRow）

SP版テーブル列は以下の順番を想定しています。実ページ構造と差異がある場合はセレクタを調整してください。

| インデックス | フィールド | 説明 |
|------------|-----------|------|
| 0 | `date` | 開催日 |
| 1 | `place` | 開催場所 |
| 2 | `weather` | 天気 |
| 3 | `R` | レース番号 |
| 4 | `raceName` | レース名 |
| 5 | `tousuu` | 頭数 |
| 6 | `wakuban` | 枠番 |
| 7 | `umaban` | 馬番 |
| 8 | `odds` | オッズ |
| 9 | `popularity` | 人気 |
| 10 | `rank` | 着順 |
| 11 | `jockey` | 騎手名 |
| 12 | `kinryou` | 斤量 |
| 13 | `distance` | 距離 |
| 14 | `baba` | 馬場状態 |
| 15 | `time` | タイム |
| 16 | `tyakusa` | 着差 |
| 17 | `tuuka` | 通過順 |
| 18 | `pace` | ペース |
| 19 | `last3f` | 上り3F |
| 20 | `weight` | 馬体重 |
| 21 | `comment` | コメントリンク |
| 22 | `winnerOrSecondary` | 勝ち馬（2着馬） |
| 23 | `prize` | 賞金 |

`raceId` はレース名セルの `<a>` 要素の `href` から正規表現で抽出します。

---

## 4. パラメータ変更

### 4.1 `HorseDetailScraper.getHorseDetail()` シグネチャ変更

```
// v1（旧）
getHorseDetail(horseId: string): Promise<HorseDetail>

// v2（新）
getHorseDetail(raceId: string, horseId: string, umaban: string): Promise<HorseDetail>
```

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| `raceId` | `string` | 12桁レースID (例: `"202401010303"`) |
| `horseId` | `string` | 馬ID (例: `"2021107071"`) |
| `umaban` | `string` | 1始まりの馬番文字列。URL の `i` パラメータは `Number(umaban) - 1` を使用 |

### 4.2 workPool ファイル形式変更

```jsonc
// v1（旧）
{ "horseId": ["2021107071", "2021104861", ...] }

// v2（新）
{
  "horses": [
    { "horseId": "2021107071", "raceId": "202401010303", "umaban": "1" },
    { "horseId": "2021104861", "raceId": "202401010303", "umaban": "2" },
    ...
  ]
}
```

> **後方互換性**: `readHorseEntriesFromWorkPoolFile()` は旧形式も読み込めます（raceId / umaban は空文字補完）。

---

## 5. 処理フロー

```
main_extractHorseId.ts
  └─ RaceList/{yyyymmdd}/index.html から raceId 収集
  └─ Shutuba/{year}/{month}/{dirName}/index.html から HorseEntry(horseId/raceId/umaban) 抽出
  └─ workPool/{workPool*.json} へ保存（形式: { horses: HorseEntry[] }）

production_extractHorseId.yaml (毎週金曜 JST 19:34 実行)
  └─ main_extractHorseId.ts を実行

production_horseDetail.yaml (毎週金曜 JST 21:03〜22:43 を20分おきで実行)
  └─ main_horseDetail.ts true を実行
      └─ workPool から先頭ファイルを1件取得
      └─ HorseDetailScraper.getHorseDetail(raceId, horseId, umaban) を並列2で実行
      └─ HorseDetail/{year}/{month}/{part3}/{part4}/index.html へ保存
      └─ 処理済みworkPoolファイルを削除
```

---

## 6. セレクタ戦略

SP版モーダルページのセレクタは以下の優先順で試行します。

### プロフィール
1. `.horse_prof table tr` の `th`/`td`
2. `table.horse_prof tr` の `th`/`td`
3. `.prof_table tr` の `th`/`td`
4. `dl.horse_prof` / `.horse_detail dl` の `dt`/`dd`
5. フォールバック: `生年月日|調教師|馬主|生産者` を含む任意の `table`

### 馬名・ヘッダ
複数のセレクタ候補（`.horse_title h1`, `.horse_name`, `h1.horse_name` 等）を順に試行します。

### 過去レーステーブル
1. `table.past_race_list`
2. `table.Past_Race_List`
3. `table.race_result`
4. `table.Race_Result`
5. `.past_race table` / `.Past_Race table`
6. `.race_history table`
7. フォールバック: `tbody tr` が2行以上ある最初の `table`

---

## 7. GitHub Actions への影響

| ワークフロー | 変更有無 | 備考 |
|-------------|---------|------|
| `production_extractHorseId.yaml` | **なし** | スクリプトパス・引数変更なし |
| `production_horseDetail.yaml` | **なし** | スクリプトパス・引数変更なし |
| その他ワークフロー | **なし** | HorseDetail に依存しない |

---

## 8. 注意事項

- SP版モーダルのテーブル列順は実際のページ HTML と一致することを確認してください。列ずれがある場合は `horseDetail.ts` 内のインデックスを修正してください。
- umaban が空文字の場合、`i=0` としてアクセスします（フォールバック）。
- データ構造変更時は本設計書も更新してください。
