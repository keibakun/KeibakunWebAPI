import { DbService } from "./DbService";
import { JraNewsIF } from "../JRAScraper/News/JraNewsIF";

/**
 * JraNewsDbService
 *
 * スクレイピングした JRA_News を KeibakunServer の `POST /jra-news` へ送信して
 * DB に格納するサービスクラス。
 */
export class JraNewsDbService extends DbService {
    /**
     * JRA_News を KeibakunServer へ POST して DB に格納します。
     *
     * @param yyyymm - 取得対象年月（YYYYMM）
     * @param data - スクレイピング済みのニュース配列
     */
    async store(yyyymm: string, data: JraNewsIF): Promise<void> {
        await this.post("/jra-news", { yyyymm, data });
    }
}
