import { DbService } from "../base/DbService";
import { RaceResultWithRefund } from "../../scrapers/nk/raceResult/raceResultDBIF";

/**
 * RaceResultDbService
 *
 * スクレイピングしたレース結果を KeibakunServer の `POST /api/result` へ送信して
 * DB に格納するサービスクラス。
 */
export class RaceResultDbService extends DbService {
    /**
     * レース結果を KeibakunServer へ POST して DB に格納します。
     *
     * @param raceId - 12 桁のレースID
     * @param data   - スクレイピング済みのレース結果データ
     */
    async store(raceId: string, data: RaceResultWithRefund): Promise<void> {
        await this.post("/result", { raceId, data });
    }
}
