import { DbService } from "./DbService";
import { RaceData } from "../scrapers/nk/raceList/raceListIF";

/**
 * RaceListDbService
 *
 * スクレイピングした RaceList を KeibakunServer の `POST /race-list` へ送信して
 * DB に格納するサービスクラス。
 */
export class RaceListDbService extends DbService {
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
