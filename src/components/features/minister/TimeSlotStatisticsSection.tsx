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
  id: keyof DaySlotCounts;
  header: string;
}

interface MiniRow {
  label: string;
  cells: Record<string, number | null>;
}

/**
 * 시간대별 인원 통계 - Server Component
 *
 * 행정 총괄 / 부서 교역자 페이지 상단에 식사·숙박·집회 인원을 시간대(요일)별로
 * 보여주는 3개의 컴팩트 표를 한 row 에 배치한다. (입금 완료 기준 집계)
 */
export function TimeSlotStatisticsSection({
  registrations = [],
  schedules = [],
}: TimeSlotStatisticsSectionProps) {
  const { days, has } = computeTimeSlotStats(registrations, schedules);

  // 식사 표: 아 / 점 / 저
  const mealColumns: MiniColumn[] = [
    has.breakfast && { id: "breakfast", header: "아" },
    has.lunch && { id: "lunch", header: "점" },
    has.dinner && { id: "dinner", header: "저" },
  ].filter(Boolean) as MiniColumn[];
  const mealRows = buildRows(
    days.filter(
      d => d.breakfast != null || d.lunch != null || d.dinner != null
    ),
    mealColumns
  );

  // 숙박 표: 숙
  const lodgingColumns: MiniColumn[] = [
    has.sleep && { id: "sleep", header: "숙박" },
  ].filter(Boolean) as MiniColumn[];
  const lodgingRows = buildRows(
    days.filter(d => d.sleep != null),
    lodgingColumns
  );

  // 집회 표: 오전 / 7-8시 / 8-10시 / 10시~
  // TODO: 수양회 날짜나 집회 시간대(저녁집회 7-8시 / 8-10시 / 10시~)가 달라졌을 때를 위한
  //       확장성 고민 필요. 현재 저녁집회 시간 구분이 코드에 고정되어 있어,
  //       일정/집회 시간이 바뀌면 로직 수정이 필요하다.
  //       확장성 검토 전까지 집회 인원 표는 임시 비활성화.
  // const assemblyColumns: MiniColumn[] = [
  //   has.breakfast && { id: "morning", header: "오전" },
  //   has.dinner && { id: "evening78", header: "7-8시" },
  //   (has.dinner || has.sleep) && { id: "evening810", header: "8-10시" },
  //   has.sleep && { id: "evening10", header: "10시~" },
  // ].filter(Boolean) as MiniColumn[];
  // const assemblyRows = buildRows(
  //   days.filter(
  //     d =>
  //       d.morning != null ||
  //       d.evening78 != null ||
  //       d.evening810 != null ||
  //       d.evening10 != null
  //   ),
  //   assemblyColumns
  // );

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
        // 집회 인원 표 임시 비활성화로 2열 (재활성화 시 md:grid-cols-3 으로 복구)
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <StatMiniTable title="식사 인원" columns={mealColumns} rows={mealRows} />
          <StatMiniTable
            title="숙박 인원"
            columns={lodgingColumns}
            rows={lodgingRows}
          />
          {/* TODO: 수양회 날짜·집회 시간대 변경 시 확장성 고민 필요 (위 assembly 계산부 참고).
              확장성 검토 전까지 집회 인원 표는 임시 비활성화. */}
          {/* <StatMiniTable
            title="집회 인원"
            columns={assemblyColumns}
            rows={assemblyRows}
          /> */}
        </div>
      )}
    </section>
  );
}

/** 날짜 행들을 컬럼 정의에 맞춰 표 행 데이터로 변환 */
function buildRows(days: DaySlotCounts[], columns: MiniColumn[]): MiniRow[] {
  return days.map(day => {
    const cells: Record<string, number | null> = {};
    for (const col of columns) {
      cells[col.id] = day[col.id] as number | null;
    }
    return { label: day.dayLabel, cells };
  });
}

function StatMiniTable({
  title,
  columns,
  rows,
}: {
  title: string;
  columns: MiniColumn[];
  rows: MiniRow[];
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-base font-semibold tracking-tight">{title}</h3>
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
                  요일
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
