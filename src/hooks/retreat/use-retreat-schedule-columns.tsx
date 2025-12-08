import { useMemo } from "react";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { TRetreatRegistrationSchedule } from "@/types";
import { Checkbox } from "@/components/ui/custom-checkbox";
import { generateScheduleColumns } from "@/utils/retreat-utils";

/**
 * 일정 컬럼 정보 타입
 */
export interface ScheduleColumnInfo {
  key: string;
  id: number;
  label: string;
  color: string;
  simpleColorClass: string;
  bgColorClass: string;
  time: Date;
  type: string;
}

/**
 * 일정 데이터를 포함하는 행의 기본 타입
 */
export interface ScheduleRow {
  schedules: Record<string, boolean>;
}

/**
 * 수양회 일정 컬럼을 생성하는 공통 훅
 *
 * @description
 * - 여러 테이블에서 재사용 가능한 일정 컬럼 생성
 * - generateScheduleColumns를 useMemo로 감싸서 메모이제이션
 * - 날짜별 색상 자동 적용
 *
 * @param schedules - 수양회 스케줄 목록
 * @returns 일정 컬럼 정보 배열
 *
 * @example
 * ```tsx
 * const scheduleColumnsInfo = useRetreatScheduleColumns(schedules);
 *
 * const scheduleColumns = scheduleColumnsInfo.map(info =>
 *   columnHelper.accessor(
 *     (row) => row.schedules[`schedule_${info.id}`],
 *     {
 *       id: `schedule_${info.id}`,
 *       header: () => <div>{info.label}</div>,
 *       cell: (props) => (
 *         <Checkbox
 *           checked={props.getValue()}
 *           disabled
 *           checkedColor={info.simpleColorClass}
 *         />
 *       ),
 *     }
 *   )
 * );
 * ```
 */
export function useRetreatScheduleColumns(
  schedules: TRetreatRegistrationSchedule[]
): ScheduleColumnInfo[] {
  const scheduleColumnsInfo = useMemo(
    () => generateScheduleColumns(schedules),
    [schedules]
  );

  return scheduleColumnsInfo;
}

/**
 * 일정 체크박스 셀을 생성하는 헬퍼 함수
 *
 * @description
 * - TanStack Table 컬럼 정의에서 사용
 * - 일정별 색상 자동 적용
 * - 체크 상태 표시
 *
 * @param scheduleInfo - 일정 컬럼 정보
 * @returns ColumnDef cell render function
 *
 * @example
 * ```tsx
 * const columns = scheduleColumnsInfo.map(info =>
 *   columnHelper.accessor(
 *     (row) => row.schedules[`schedule_${info.id}`],
 *     {
 *       id: `schedule_${info.id}`,
 *       header: () => <div>{info.label}</div>,
 *       cell: createScheduleCheckboxCell(info),
 *     }
 *   )
 * );
 * ```
 */
export function createScheduleCheckboxCell(scheduleInfo: ScheduleColumnInfo) {
  return (info: { getValue: () => unknown }) => {
    const isChecked = Boolean(info.getValue());
    return (
      <div className="flex justify-center">
        <Checkbox
          checked={isChecked}
          disabled
          checkedColor={scheduleInfo.simpleColorClass}
          uncheckedColor="bg-gray-300"
        />
      </div>
    );
  };
}

/**
 * 일정 컬럼 헤더를 생성하는 헬퍼 함수
 *
 * @param scheduleInfo - 일정 컬럼 정보
 * @returns ColumnDef header render function
 */
export function createScheduleHeaderCell(scheduleInfo: ScheduleColumnInfo) {
  return () => (
    <div className="text-center text-xs whitespace-normal px-1 shrink-0">
      {scheduleInfo.label}
    </div>
  );
}

/**
 * 일정 컬럼을 한 번에 생성하는 유틸리티 함수
 *
 * @description
 * - 제네릭 타입을 지원하여 다양한 테이블 타입에 사용 가능
 * - 일정 컬럼 헤더, 셀, 설정을 자동으로 생성
 *
 * @param schedules - 수양회 스케줄 목록
 * @param columnHelper - TanStack Table columnHelper
 * @returns TanStack Table ColumnDef 배열
 *
 * @example
 * ```tsx
 * const columnHelper = createColumnHelper<MyRowType>();
 * const scheduleColumns = createRetreatScheduleColumns(
 *   schedules,
 *   columnHelper
 * );
 *
 * const allColumns = [...staticColumns, ...scheduleColumns, ...actionColumns];
 * ```
 */
export function createRetreatScheduleColumns<T extends ScheduleRow>(
  schedules: TRetreatRegistrationSchedule[],
  columnHelper: ReturnType<typeof createColumnHelper<T>>
) {
  const scheduleColumnsInfo = generateScheduleColumns(schedules);

  return scheduleColumnsInfo.map((scheduleInfo) => {
    return columnHelper.accessor(
      (row) => row.schedules[`schedule_${scheduleInfo.id}`],
      {
        id: `schedule_${scheduleInfo.id}`,
        header: createScheduleHeaderCell(scheduleInfo),
        cell: createScheduleCheckboxCell(scheduleInfo),
        enableSorting: false,
        meta: {
          label: scheduleInfo.label,
        },
      }
    );
  });
}
