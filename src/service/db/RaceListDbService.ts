import { DbService } from "../base/DbService";
import { RaceData } from "../../scrapers/nk/raceList/raceListIF";

interface RaceListItem {
    raceId: string;
}

/**
 * RaceListDbService
 *
 * スクレイピングした RaceList を KeibakunServer の `POST /race-list` へ送信して
 * DB に格納するサービスクラス。
 */
export class RaceListDbService extends DbService {
    /**
     * 指定開催日の raceId 一覧を KeibakunServer から取得します。
     */
    async findRaceIds(date: string): Promise<string[]> {
        const rows = await this.get<RaceListItem[]>(
            `/races?date=${encodeURIComponent(date)}`
        );
        return rows
            .map((row) => row.raceId)
            .filter((raceId) => /^\d{12}$/.test(raceId));
    }

    /**
     * RaceList を KeibakunServer へ POST して DB に格納します。
     *
     * @param date - 開催日（YYYYMMDD）
     * @param data - スクレイピング済みの RaceList データ
     */
    async store(date: string, data: RaceData[]): Promise<void> {
        await this.post("/race-list", { date, data });
    }
}
