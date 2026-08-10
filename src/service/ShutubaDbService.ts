import { DbService } from "./DbService";
import { RaceIF } from "../NKScraper/shutuba/syutubaIF";

/**
 * ShutubaDbService
 *
 * スクレイピングした出馬表を KeibakunServer の `POST /shutuba` へ送信して
 * DB に格納するサービスクラス。
 */
export class ShutubaDbService extends DbService {
    /**
     * 出馬表を KeibakunServer へ POST して DB に格納します。
     *
     * @param raceId - 12 桁のレースID
     * @param data - スクレイピング済みの出馬表データ
     */
    async store(raceId: string, data: RaceIF): Promise<void> {
        await this.post("/shutuba", { raceId, data });
    }
}
