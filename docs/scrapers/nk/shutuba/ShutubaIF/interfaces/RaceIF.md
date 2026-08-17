[**keibakun**](../../../../../README.md)

***

[keibakun](../../../../../modules.md) / [scrapers/nk/shutuba/ShutubaIF](../README.md) / RaceIF

# Interface: RaceIF

Defined in: scrapers/nk/shutuba/ShutubaIF.ts:92

RaceIF
レース情報（コード化済み）

## Properties

### baba

> **baba**: `number`

Defined in: scrapers/nk/shutuba/ShutubaIF.ts:102

馬場状態コード（BABA_MAP）

***

### courseType

> **courseType**: `number`

Defined in: scrapers/nk/shutuba/ShutubaIF.ts:97

コース種別コード（COURSE_MAP: 芝=1, ダート=2, 障=3）

***

### distance

> **distance**: `number`

Defined in: scrapers/nk/shutuba/ShutubaIF.ts:98

距離（m）

***

### grade

> **grade**: `number`

Defined in: scrapers/nk/shutuba/ShutubaIF.ts:95

グレードコード（GRADE_MAP: G1=1, G2=2, G3=3, L=15 ...）

***

### honShokin

> **honShokin**: `number`[]

Defined in: scrapers/nk/shutuba/ShutubaIF.ts:111

本賞金（万円）配列（1着〜5着）

***

### horseCategory

> **horseCategory**: `number`

Defined in: scrapers/nk/shutuba/ShutubaIF.ts:106

馬カテゴリコード（HORSE_CATEGORY_MAP）

***

### joken

> **joken**: `number`

Defined in: scrapers/nk/shutuba/ShutubaIF.ts:108

条件ビットマスク（JOKEN_MAP）

***

### jyuryoKubun

> **jyuryoKubun**: `number`

Defined in: scrapers/nk/shutuba/ShutubaIF.ts:109

重量区分コード（JYURYO_KUBUN_MAP: 馬齢=1, 定量=2, 別定=3, ハンデ=4）

***

### kaisaiDay

> **kaisaiDay**: `number`

Defined in: scrapers/nk/shutuba/ShutubaIF.ts:105

開催日目（1〜12）

***

### kaisaiKai

> **kaisaiKai**: `number`

Defined in: scrapers/nk/shutuba/ShutubaIF.ts:103

開催回（1〜3）

***

### mawari

> **mawari**: `number`

Defined in: scrapers/nk/shutuba/ShutubaIF.ts:99

回りコード（MAWARI_MAP: 右=1, 左=2, 直線=3, 右外=4, 左外=5）

***

### raceClass

> **raceClass**: `number`

Defined in: scrapers/nk/shutuba/ShutubaIF.ts:107

クラスコード（GRADE_MAP: 未勝利=19, 1勝=18, 2勝=17, 3勝=16, OP=5, 新馬=9）

***

### raceName

> **raceName**: `string`

Defined in: scrapers/nk/shutuba/ShutubaIF.ts:94

レース名

***

### raceNum

> **raceNum**: `number`

Defined in: scrapers/nk/shutuba/ShutubaIF.ts:93

レースナンバー（1〜12）

***

### raceTime

> **raceTime**: `string`

Defined in: scrapers/nk/shutuba/ShutubaIF.ts:96

出走時刻（HH:MM）

***

### shibaKubun

> **shibaKubun**: `number`

Defined in: scrapers/nk/shutuba/ShutubaIF.ts:100

芝コース種別コード（SHIBA_COURSE_MAP: 0=なし, A=1, B=2, C=3, D=4）

***

### syutuba

> **syutuba**: [`SyutubaIF`](SyutubaIF.md)[]

Defined in: scrapers/nk/shutuba/ShutubaIF.ts:112

出走馬情報

***

### tousu

> **tousu**: `number`

Defined in: scrapers/nk/shutuba/ShutubaIF.ts:110

出走頭数

***

### venue

> **venue**: `number`

Defined in: scrapers/nk/shutuba/ShutubaIF.ts:104

競馬場コード（VENUE_MAP: 国内1〜90, 海外99, 香港100台, UAE200台, 仏300台, 英400台 ...）

***

### weather

> **weather**: `number`

Defined in: scrapers/nk/shutuba/ShutubaIF.ts:101

天候コード（WEATHER_MAP）
