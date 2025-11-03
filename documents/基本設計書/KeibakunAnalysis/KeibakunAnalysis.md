# KeibakunAnalysis 基本設計書

## 1. 概要
KeibakunAnalysisは、以下で取得した競馬データを解析・分析するためのモジュール群です。
- NKScraper
- PakaraScraper

## 2. 目的
- 競馬データの統計解析
- データの可視化・傾向把握
- 予測・モデル構築の基盤提供

## 3. 構成
- データ取得: NKScraper, PakaraScraper
- データ格納: RaceList, RaceResult など
- 解析・分析: KeibakunAnalysis

## 4. 主な機能
- データ集計・統計処理
- レース条件ごとの傾向分析
- 馬・騎手・コースごとのパフォーマンス評価
- 可視化の元ネタとなる各種データ

## 5. ディレクトリ構成例
```
/KeibakunAnalysis/
  ├── extractShutuba/
  ├── extractRaceResult/
  ├── analysisRaceResult/
  ├── analysisHorse/
  ├── analysisJockey/
  ├── analysisTrainer/
  └── utils/
```

## 6. 利用方法
1. 前提：NKScraperでデータ取得
2. extract〜の各モジュールでデータ抽出処理を実行
3. analysis〜の各モジュールで解析・分析を実行

## 7. 注意事項
- データ構造変更時は本設計書も更新すること
- 解析結果の利用は自己責任で