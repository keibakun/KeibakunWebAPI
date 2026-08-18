import { DbService } from "../base/DbService";
import { Schedule } from "../../scrapers/nk/raceSchedule/raceShceduleIF";

/** POST ボディの 1 エントリ（kaisaiDate × venue のフラット形式） */
interface ScheduleEntry {
    kaisaiDate: string;
    venue: number;
    raceName: string;
}

/**
 * RaceScheduleDbService
 *
 * スクレイピングした月次開催日程を KeibakunServer の `POST /api/race-schedule` へ
 * 送信して DB に格納するサービスクラス。
 *
 * ネストした `Schedule[]` を `kaisaiDate × venue` のフラット形式に変換してから送信します。
 * kaisaiDate が空（開催なし）または venue が 0 のエントリは除外します。
 */
export class RaceScheduleDbService extends DbService {
    /**
     * 指定年月の開催日を KeibakunServer から取得します。
     */
    async findKaisaiDates(yyyymm: string): Promise<string[]> {
        const response = await this.get<{ yyyymm: string; kaisaiDates: string[] }>(
            `/race-schedule?yyyymm=${encodeURIComponent(yyyymm)}`
        );
        return response.kaisaiDates;
    }

    /**
     * 月次開催日程を KeibakunServer へ POST して DB に格納します。
     *
     * @param yyyymm    - 対象年月（例: "202601"）
     * @param schedules - スクレイピング済みの月次日程
     */
    async store(yyyymm: string, schedules: Schedule[]): Promise<void> {
        const entries: ScheduleEntry[] = schedules.flatMap((s) => {
            if (!s.kaisaiDate) return [];
            return s.races
                .filter((r) => r.venue !== 0)
                .map((r) => ({
                    kaisaiDate: s.kaisaiDate,
                    venue: r.venue,
                    raceName: r.raceName,
                }));
        });

        await this.post("/race-schedule", { yyyymm, schedules: entries });
    }
}
