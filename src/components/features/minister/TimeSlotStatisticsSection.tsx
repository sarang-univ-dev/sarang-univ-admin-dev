import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TRetreatRegistrationSchedule } from "@/types";
import {
  computeTimeSlotStats,
  type DaySlotCounts,
} from "@/utils/time-slot-stats";

interface TimeSlotStatisticsSectionProps {
  // 행정/부서 교역자 페이지의 registration 배열 (둘 다 paymentStatus +
  // userRetreatRegistrationScheduleIds 를 포함하므로 동일 util 사용 가능).
  registrations: any[];
  schedules: TRetreatRegistrationSchedule[];
}

interface MiniColumn {
  /** 컬럼 식별자 (요일 dateKey) */
  id: string;
  header: string;
}

interface MiniRow {
  label: string;
  cells: Record<string, number | null>;
}

/**
 * 시간대별 인원 통계 - Server Component
 *
 * 행정 총괄 / 부서 교역자 페이지 상단에 식사·집회·숙박 인원을 한 표로 보여준다.
 * 피버팅 형태로 **열 = 요일(수/목/금...), 행 = 아침/점심/저녁/집회/숙박**.
 * (입금 완료 기준 집계)
 */
export function TimeSlotStatisticsSection({
  registrations = [],
  schedules = [],
}: TimeSlotStatisticsSectionProps) {
  const { days, has } = computeTimeSlotStats(registrations, schedules);

  // 피버팅: 열 = 요일(수/목/금...), 행 = 아침 / 점심 / 저녁 / 집회 / 숙박
  // "집회" 행 = 저녁 ∪ 숙박 (dinnerOrSleep). 저녁·숙박을 둘 다 신청한 사람은 저녁·숙박
  //        행 양쪽에 집계되고, 집회 행만 그 둘을 중복 제외한 union 인원이다.
  const tableColumns = dayColumns(days);
  const tableRows: MiniRow[] = (
    [
      has.breakfast && { key: "breakfast", label: "아침" },
      has.lunch && { key: "lunch", label: "점심" },
      has.dinner && { key: "dinner", label: "저녁" },
      (has.dinner || has.sleep) && { key: "dinnerOrSleep", label: "집회" },
      has.sleep && { key: "sleep", label: "숙박" },
    ].filter(Boolean) as { key: keyof DaySlotCounts; label: string }[]
  ).map(t => pivotRow(t.label, days, t.key));

  return (
    <section className="space-y-3 md:space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">
          시간대별 인원 통계
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          입금 완료(PAID) 기준 집계
        </p>
      </div>

      {days.length === 0 ? (
        <div className="p-6 md:p-8 text-center text-gray-500 text-sm rounded-md border">
          스케줄 데이터가 없습니다.
        </div>
      ) : (
        <StatMiniTable columns={tableColumns} rows={tableRows} />
      )}
    </section>
  );
}

/** 날짜 목록을 표의 컬럼(요일 헤더)으로 변환 */
function dayColumns(days: DaySlotCounts[]): MiniColumn[] {
  return days.map(d => ({ id: d.dateKey, header: d.dayLabel }));
}

/** 한 시간대 타입을 날짜별 셀로 펼친 행으로 변환 */
function pivotRow(
  label: string,
  days: DaySlotCounts[],
  key: keyof DaySlotCounts
): MiniRow {
  const cells: Record<string, number | null> = {};
  for (const d of days) cells[d.dateKey] = d[key] as number | null;
  return { label, cells };
}

function StatMiniTable({
  title,
  columns,
  rows,
}: {
  title?: string;
  columns: MiniColumn[];
  rows: MiniRow[];
}) {
  return (
    <div className="space-y-2">
      {title && (
        <h3 className="text-base font-semibold tracking-tight">{title}</h3>
      )}
      {columns.length === 0 || rows.length === 0 ? (
        <div className="p-4 text-center text-gray-400 text-xs rounded-md border">
          해당 일정이 없습니다.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-gray-100 z-10 text-center font-semibold text-gray-800 text-xs md:text-sm px-2 md:px-3 whitespace-nowrap">
                  구분
                </TableHead>
                {columns.map(col => (
                  <TableHead
                    key={col.id}
                    className="bg-gray-100 text-center font-semibold text-gray-800 text-xs md:text-sm px-2 md:px-3 whitespace-nowrap"
                  >
                    {col.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(row => (
                <TableRow key={row.label}>
                  <TableCell className="sticky left-0 bg-gray-50 z-10 border-r text-center px-2 md:px-3 py-1.5 md:py-2">
                    <span className="inline-flex px-1.5 md:px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-medium text-xs md:text-sm whitespace-nowrap">
                      {row.label}
                    </span>
                  </TableCell>
                  {columns.map(col => {
                    const value = row.cells[col.id];
                    return (
                      <TableCell
                        key={col.id}
                        className="text-center text-xs md:text-sm px-2 md:px-3 py-1.5 md:py-2 whitespace-nowrap tabular-nums"
                      >
                        {value == null ? (
                          <span className="text-gray-300">-</span>
                        ) : (
                          value
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
