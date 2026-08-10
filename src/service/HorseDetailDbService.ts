import { DbService } from "./DbService";
import { HorseDetail } from "../NKScraper/horseDetail/horseDetailIF";

/**
 * HorseDetailDbService
 *
 * スクレイピングした HorseDetail を KeibakunServer の `POST /horse-detail` へ送信して
 * DB に格納するサービスクラス。
 */
export class HorseDetailDbService extends DbService {
    /**
     * HorseDetail を KeibakunServer へ POST して DB に格納します。
     *
     * @param horseId - 10桁の馬ID
     * @param data - スクレイピング済みの HorseDetail データ
     */
    async store(horseId: string, data: HorseDetail): Promise<void> {
        await this.post("/horse-detail", { horseId, data });
    }
}
