[**keibakun**](../../../../../README.md)

***

[keibakun](../../../../../modules.md) / [scrapers/nk/raceResult/raceResultDBIF](../README.md) / RaceResultRow

# Interface: RaceResultRow

Defined in: [scrapers/nk/raceResult/raceResultDBIF.ts:47](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/scrapers/nk/raceResult/raceResultDBIF.ts#L47)

レース結果テーブルの1行（DB格納用）。

 RaceResultRow

## Properties

### agari

> **agari**: `number`

Defined in: [scrapers/nk/raceResult/raceResultDBIF.ts:105](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/scrapers/nk/raceResult/raceResultDBIF.ts#L105)

上がり3F（秒）

***

### age

> **age**: `number`

Defined in: [scrapers/nk/raceResult/raceResultDBIF.ts:71](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/scrapers/nk/raceResult/raceResultDBIF.ts#L71)

馬齢

***

### bataijuu

> **bataijuu**: `number`

Defined in: [scrapers/nk/raceResult/raceResultDBIF.ts:129](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/scrapers/nk/raceResult/raceResultDBIF.ts#L129)

馬体重（kg）

***

### chakusa

> **chakusa**: `string`

Defined in: [scrapers/nk/raceResult/raceResultDBIF.ts:96](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/scrapers/nk/raceResult/raceResultDBIF.ts#L96)

着差（馬身を表す文字列をそのまま保持）。
例: `""` (1着) / `"ハナ"` / `"クビ"` / `"アタマ"` /
    `"1/2"` / `"3/4"` / `"1.3/4"` / `"大"` / `"同着"`

***

### horseId

> **horseId**: `string`

Defined in: [scrapers/nk/raceResult/raceResultDBIF.ts:62](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/scrapers/nk/raceResult/raceResultDBIF.ts#L62)

馬ID（netkeiba horseId）

***

### horseName

> **horseName**: `string`

Defined in: [scrapers/nk/raceResult/raceResultDBIF.ts:59](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/scrapers/nk/raceResult/raceResultDBIF.ts#L59)

馬名

***

### jockey

> **jockey**: `string`

Defined in: [scrapers/nk/raceResult/raceResultDBIF.ts:80](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/scrapers/nk/raceResult/raceResultDBIF.ts#L80)

騎手名（記号除去済み）

***

### jockeyId

> **jockeyId**: `string`

Defined in: [scrapers/nk/raceResult/raceResultDBIF.ts:83](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/scrapers/nk/raceResult/raceResultDBIF.ts#L83)

騎手ID

***

### jockeyMark

> **jockeyMark**: `number`

Defined in: [scrapers/nk/raceResult/raceResultDBIF.ts:77](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/scrapers/nk/raceResult/raceResultDBIF.ts#L77)

斤量軽減記号コード（JOCKEY_MARK_MAP: 0=なし, 1=☆, 2=▲, 3=△, 4=◇）

***

### kinryou

> **kinryou**: `number`

Defined in: [scrapers/nk/raceResult/raceResultDBIF.ts:74](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/scrapers/nk/raceResult/raceResultDBIF.ts#L74)

斤量（kg）

***

### ninki

> **ninki**: `number`

Defined in: [scrapers/nk/raceResult/raceResultDBIF.ts:99](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/scrapers/nk/raceResult/raceResultDBIF.ts#L99)

人気

***

### odds

> **odds**: `number`

Defined in: [scrapers/nk/raceResult/raceResultDBIF.ts:102](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/scrapers/nk/raceResult/raceResultDBIF.ts#L102)

単勝オッズ

***

### rank

> **rank**: `string`

Defined in: [scrapers/nk/raceResult/raceResultDBIF.ts:53](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/scrapers/nk/raceResult/raceResultDBIF.ts#L53)

着順。
通常は数値文字列 `"1"` 〜 `"18"` だが、
競走中止・取消・除外の場合は `"中止"` / `"取消"` / `"除外"` となる。

***

### sex

> **sex**: `number`

Defined in: [scrapers/nk/raceResult/raceResultDBIF.ts:68](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/scrapers/nk/raceResult/raceResultDBIF.ts#L68)

性別コード。
`1`=牡 / `2`=牝 / `3`=せん / `0`=不明

***

### time

> **time**: `string`

Defined in: [scrapers/nk/raceResult/raceResultDBIF.ts:89](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/scrapers/nk/raceResult/raceResultDBIF.ts#L89)

タイム（元の文字列表記を保持）。
例: `"1:33.8"`

***

### trainer

> **trainer**: `string`

Defined in: [scrapers/nk/raceResult/raceResultDBIF.ts:123](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/scrapers/nk/raceResult/raceResultDBIF.ts#L123)

調教師名

***

### trainerId

> **trainerId**: `string`

Defined in: [scrapers/nk/raceResult/raceResultDBIF.ts:126](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/scrapers/nk/raceResult/raceResultDBIF.ts#L126)

調教師ID

***

### tuuka1c

> **tuuka1c**: `number`

Defined in: [scrapers/nk/raceResult/raceResultDBIF.ts:111](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/scrapers/nk/raceResult/raceResultDBIF.ts#L111)

1コーナー通過順位。
そのコーナーが存在しないコース（例: 1200m 等）は `null`。

***

### tuuka2c

> **tuuka2c**: `number`

Defined in: [scrapers/nk/raceResult/raceResultDBIF.ts:114](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/scrapers/nk/raceResult/raceResultDBIF.ts#L114)

2コーナー通過順位。存在しない場合は `null`。

***

### tuuka3c

> **tuuka3c**: `number`

Defined in: [scrapers/nk/raceResult/raceResultDBIF.ts:117](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/scrapers/nk/raceResult/raceResultDBIF.ts#L117)

3コーナー通過順位。存在しない場合は `null`。

***

### tuuka4c

> **tuuka4c**: `number`

Defined in: [scrapers/nk/raceResult/raceResultDBIF.ts:120](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/scrapers/nk/raceResult/raceResultDBIF.ts#L120)

4コーナー通過順位。存在しない場合は `null`。

***

### umaban

> **umaban**: `number`

Defined in: [scrapers/nk/raceResult/raceResultDBIF.ts:56](https://github.com/keibakun/KeibakunWebAPI/blob/main/src/scrapers/nk/raceResult/raceResultDBIF.ts#L56)

馬番
