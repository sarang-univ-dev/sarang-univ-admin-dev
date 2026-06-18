import { Checkbox } from "@/components/ui/checkbox";
import {
  generateScheduleColumns,
  getScheduleLabel,
} from "@/utils/retreat-utils";
import {
  RetreatRegistrationScheduleType,
  TRetreatRegistrationSchedule,
} from "@/types";

/**
 * scheduleIds 를 라벨 문자열 배열로 변환 (시간순 정렬)
 *
 * @example ["금저", "금숙", "토아"]
 */
export function scheduleIdsToLabels(
  scheduleIds: number[],
  schedules: TRetreatRegistrationSchedule[]
): string[] {
  if (!scheduleIds || scheduleIds.length === 0) return [];

  const byId = new Map(schedules.map(s => [s.id, s]));

  return scheduleIds
    .map(id => byId.get(id))
    .filter((s): s is TRetreatRegistrationSchedule => Boolean(s))
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
    .map(s =>
      getScheduleLabel(
        s.time,
        s.type as RetreatRegistrationScheduleType
      )
    );
}

interface ScheduleSlotChipsProps {
  scheduleIds: number[];
  schedules: TRetreatRegistrationSchedule[];
  /** 칩 색상 톤 (변경 전: gray, 변경 후: blue) */
  tone?: "gray" | "blue";
  emptyLabel?: string;
}

/**
 * 일정 슬롯을 작은 칩으로 렌더링 (before/after 요약용)
 */
export function ScheduleSlotChips({
  scheduleIds,
  schedules,
  tone = "gray",
  emptyLabel = "없음",
}: ScheduleSlotChipsProps) {
  const labels = scheduleIdsToLabels(scheduleIds, schedules);

  if (labels.length === 0) {
    return <span className="text-xs text-gray-400">{emptyLabel}</span>;
  }

  const toneClass =
    tone === "blue"
      ? "bg-blue-50 border-blue-200 text-blue-700"
      : "bg-gray-50 border-gray-200 text-gray-700";

  return (
    <div className="flex flex-wrap justify-center gap-1">
      {labels.map((label, idx) => (
        <span
          key={`${label}-${idx}`}
          className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium whitespace-nowrap ${toneClass}`}
        >
          {label}
        </span>
      ))}
    </div>
  );
}

interface ScheduleChangeCheckboxRowsProps {
  beforeScheduleIds: number[];
  afterScheduleIds: number[];
  schedules: TRetreatRegistrationSchedule[];
}

function hasSchedule(scheduleIds: number[], scheduleId: number) {
  return scheduleIds.some(id => Number(id) === scheduleId);
}

/**
 * 일정 변경 전/후를 기존 일정 변경 이력 테이블과 같은 checkbox 행 형태로 렌더링
 */
export function ScheduleChangeCheckboxRows({
  beforeScheduleIds,
  afterScheduleIds,
  schedules,
}: ScheduleChangeCheckboxRowsProps) {
  const scheduleColumns = generateScheduleColumns(schedules);

  if (scheduleColumns.length === 0) {
    return <span className="text-xs text-gray-400">표시할 일정 없음</span>;
  }

  const rows = [
    { label: "변경 전", scheduleIds: beforeScheduleIds },
    { label: "변경 후", scheduleIds: afterScheduleIds },
  ];

  return (
    <div className="max-w-full overflow-x-auto rounded-md border bg-white">
      <table className="min-w-max whitespace-nowrap text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th
              className="sticky left-0 z-10 bg-gray-100 px-3 py-2 text-center text-xs font-medium text-gray-700"
              rowSpan={2}
            >
              구분
            </th>
            <th
              className="px-3 py-2 text-center text-xs font-medium text-gray-700"
              colSpan={scheduleColumns.length}
            >
              수양회 일정
            </th>
          </tr>
          <tr>
            {scheduleColumns.map(col => (
              <th
                key={col.key}
                className="px-2 py-2 text-center text-xs font-medium text-gray-600"
              >
                <span className="block min-w-9 whitespace-normal leading-tight">
                  {col.label}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.label} className="border-t hover:bg-gray-50">
              <th className="sticky left-0 z-10 bg-white px-3 py-2.5 text-center text-xs font-medium text-gray-700">
                {row.label}
              </th>
              {scheduleColumns.map(col => {
                const checked = hasSchedule(row.scheduleIds, col.id);

                return (
                  <td
                    key={`${row.label}-${col.key}`}
                    className="px-2 py-2 text-center"
                  >
                    <Checkbox
                      checked={checked}
                      disabled
                      className={checked ? col.bgColorClass : ""}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
