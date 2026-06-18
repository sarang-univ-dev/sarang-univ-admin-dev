import { Suspense } from "react";

import { TableSkeleton } from "@/components/common/table/TableSkeleton";
import { LeaderAttendanceTable } from "@/components/features/leader-report";
import { LeaderScheduleChangeRequestTable } from "@/components/features/leader-schedule-change-request";
import {
  fetchDepartmentLeaderAttendance,
  fetchDepartmentLeaderScheduleChangeRequests,
  fetchLeaderToday,
  fetchRetreatSchedules,
} from "@/lib/api/server-actions";

interface PageProps {
  params: Promise<{ retreatSlug: string }>;
}

/**
 * 부서 인원관리 일정변경 이력 페이지 (부서 인원관리 팀원)
 *
 * - 리더가 제출한 부서 일정변경 요청을 조회하고 승인/거절 처리
 * - 같은 기준일자 흐름으로 부서 출석 현황도 함께 표시
 * - Server Component 로 초기 데이터 병렬 페칭 (Promise.all)
 * - Client Component 가 SWR 폴링으로 실시간 동기화
 */
export default async function LeaderScheduleChangeRequestPage({
  params,
}: PageProps) {
  const { retreatSlug } = await params;

  const today = await fetchLeaderToday(retreatSlug);
  const initialDate = today.today ?? today.days[0] ?? undefined;

  const [requests, schedules, attendanceResult] = await Promise.all([
    fetchDepartmentLeaderScheduleChangeRequests(retreatSlug, "PENDING"),
    fetchRetreatSchedules(retreatSlug),
    fetchDepartmentLeaderAttendance(retreatSlug, initialDate),
  ]);

  return (
    <div className="space-y-8 p-6">
      <Suspense fallback={<TableSkeleton />}>
        <LeaderScheduleChangeRequestTable
          initialData={requests}
          schedules={schedules}
          retreatSlug={retreatSlug}
        />
        <LeaderAttendanceTable
          initialAttendance={attendanceResult.attendance}
          initialDate={attendanceResult.date ?? initialDate ?? null}
          initialToday={today}
          retreatSlug={retreatSlug}
          title="부서별 출석 현황"
          showTodayControl={false}
        />
      </Suspense>
    </div>
  );
}
