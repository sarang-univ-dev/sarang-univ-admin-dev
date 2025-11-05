import {
  generateScheduleStats,
  groupScheduleColumnsByDay,
} from "../utils/retreat-utils";
import {
  TRetreatRegistrationSchedule,
  UserRetreatRegistrationPaymentStatus,
  IUnivGroupAdminStaffRetreat,
} from "@/types";
import { RetreatScheduleSummaryClient } from "./RetreatScheduleSummaryClient";

interface RetreatScheduleSummaryProps {
  registrations: IUnivGroupAdminStaffRetreat[];
  schedules: TRetreatRegistrationSchedule[];
}

/**
 * 식사 숙박 인원 집계 표 - Server Component
 *
 * @description
 * - Server Component로 모든 계산 수행
 * - RetreatScheduleSummaryClient로 UI 위임
 * - 계산 로직이 서버에서 실행되어 JavaScript 번들 크기 감소
 */

export function RetreatScheduleSummary({
  registrations = [],
  schedules = [],
}: RetreatScheduleSummaryProps) {
  // 스케줄이 없는 경우 조기 리턴
  if (schedules.length === 0) {
    return (
      <div className="space-y-3 md:space-y-4">
        <div>
          <h2 className="text-base md:text-xl font-semibold tracking-tight">
            식사 숙박 인원 집계 표
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1">
            수양회 식사 및 숙박 인원 현황
          </p>
        </div>
        <div className="p-6 md:p-8 text-center text-gray-500 text-sm">
          스케줄 데이터가 없습니다.
        </div>
      </div>
    );
  }

  // 부서 수 계산
  const uniqueDepartments = new Set(registrations.map(reg => reg.univGroupNumber)).size;

  // 요일별로 그룹화된 스케줄 컬럼
  const dayGroups = groupScheduleColumnsByDay(schedules);

  // 모든 스케줄 컬럼 (평면화)
  const allScheduleColumns = dayGroups.flatMap(group => group.schedules);

  // 부서별 스케줄 통계 생성
  const allRows = generateScheduleStats(registrations, schedules);

  // 부서가 1개인 경우 전체 행 제외
  const rows = uniqueDepartments <= 1
    ? allRows.filter(row => row.id !== "total")
    : allRows;

  // 전참/부분참 계산
  const paidRegistrations = registrations.filter(
    reg => reg.paymentStatus === UserRetreatRegistrationPaymentStatus.PAID
  );

  const participationStats: Record<string, { full: number; partial: number }> = {};

  // 부서별 초기화
  const departments = [...new Set(paidRegistrations.map(reg => reg.univGroupNumber))];
  departments.forEach(dept => {
    participationStats[dept] = { full: 0, partial: 0 };
  });

  // 전체 스케줄 수
  const totalSchedules = schedules.length;

  paidRegistrations.forEach(reg => {
    const userScheduleCount = reg.userRetreatRegistrationScheduleIds?.length || 0;

    if (userScheduleCount === totalSchedules) {
      participationStats[reg.univGroupNumber].full++;
    } else if (userScheduleCount > 0) {
      participationStats[reg.univGroupNumber].partial++;
    }
  });

  // 부서별 총 인원수 계산 (입금완료 기준)
  const departmentCounts: Record<string, number> = {};

  departments.forEach(dept => {
    departmentCounts[dept] = 0;
  });

  // 부서별 총 인원 계산 (입금완료된 모든 인원)
  paidRegistrations.forEach(reg => {
    departmentCounts[reg.univGroupNumber]++;
  });

  // 각 행을 변환하여 셀 생성
  const formattedRows = rows.map(row => {
    // 부서별 총 인원수 계산
    let totalParticipants = 0;

    if (row.id === "total") {
      // 합계 행의 경우 모든 부서의 총 인원 합
      totalParticipants = Object.values(departmentCounts).reduce(
        (sum: number, count: number) => sum + count,
        0
      );
    } else {
      // 개별 부서의 경우
      const deptNumber = parseInt(row.id);
      totalParticipants = departmentCounts[deptNumber] || 0;
    }

      // 스케줄별 셀 생성
      const scheduleCells: Record<string, JSX.Element> = {};
      allScheduleColumns.forEach(column => {
        const count = row.cells[column.key] || 0;
        scheduleCells[column.key] = (
          <div className="text-center">
            {row.id === "total" ? (
              <span className="font-semibold">{count}명</span>
            ) : (
              <span>{count}명</span>
            )}
          </div>
        );
      });

    // 전참/부분참 계산
    let fullParticipation = 0;
    let partialParticipation = 0;

    if (row.id === "total") {
      // 합계 행의 경우 모든 부서의 합
      Object.values(participationStats).forEach(stats => {
        fullParticipation += stats.full;
        partialParticipation += stats.partial;
      });
    } else {
      // 개별 부서의 경우
      const deptNumber = parseInt(row.id);
      const stats = participationStats[deptNumber];
      if (stats) {
        fullParticipation = stats.full;
        partialParticipation = stats.partial;
      }
    }

    return {
      ...row,
      cells: scheduleCells,
      fullParticipation: (
        <div className="text-center">
          {row.id === "total" ? (
            <span className="font-semibold">{fullParticipation}명</span>
          ) : (
            <span>{fullParticipation}명</span>
          )}
        </div>
      ),
      partialParticipation: (
        <div className="text-center">
          {row.id === "total" ? (
            <span className="font-semibold">{partialParticipation}명</span>
          ) : (
            <span>{partialParticipation}명</span>
          )}
        </div>
      ),
      total: (
        <div className="text-center">
          {row.id === "total" ? (
            <span className="font-bold">{totalParticipants}명</span>
          ) : (
            <span className="font-semibold">{totalParticipants}명</span>
          )}
        </div>
      ),
      // 실제 숫자 값 추가 (모바일용)
      fullParticipationCount: fullParticipation,
      partialParticipationCount: partialParticipation,
      totalCount: totalParticipants,
    };
  });

  // Client Component로 UI 위임
  return <RetreatScheduleSummaryClient formattedRows={formattedRows} dayGroups={dayGroups} />;
}
