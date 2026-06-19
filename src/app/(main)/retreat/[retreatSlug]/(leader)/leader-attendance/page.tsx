import { Suspense } from "react";

import { TableSkeleton } from "@/components/common/table/TableSkeleton";
import { LeaderOperationsDashboard } from "@/components/features/leader-report";
import {
  fetchLeaderAttendance,
  fetchLeaderReportSubmissionStatus,
  fetchLeaderScheduleChangeRequests,
  fetchLeaderToday,
  fetchRetreatSchedules,
} from "@/lib/api/server-actions";

interface PageProps {
  params: Promise<{ retreatSlug: string }>;
}

/**
 * 인원관리 간사 조회 페이지
 *
 * - 전체 / 출석 현황 / 보고서 제출현황 / 일정변경 이력 탭
 * - 오늘 일자 선택과 테이블 조회 기준일자를 분리
 */
export default async function LeaderAttendancePage({ params }: PageProps) {
  const { retreatSlug } = await params;

  const today = await fetchLeaderToday(retreatSlug);
  const initialDate = today.today ?? today.days[0] ?? undefined;

  const [
    attendanceResult,
    submissionStatusResult,
    scheduleChangeRequests,
    schedules,
  ] = await Promise.all([
    fetchLeaderAttendance(retreatSlug, initialDate),
    fetchLeaderReportSubmissionStatus(retreatSlug, initialDate),
    fetchLeaderScheduleChangeRequests(retreatSlug, "PENDING"),
    fetchRetreatSchedules(retreatSlug),
  ]);

  return (
    <div className="space-y-4 p-6">
      <Suspense fallback={<TableSkeleton />}>
        <LeaderOperationsDashboard
          initialAttendance={attendanceResult.attendance}
          initialAttendanceDate={attendanceResult.date ?? initialDate ?? null}
          initialSubmissionStatus={submissionStatusResult.submissionStatus}
          initialSubmissionDate={
            submissionStatusResult.date ?? initialDate ?? null
          }
          initialScheduleChangeRequests={scheduleChangeRequests}
          initialToday={today}
          schedules={schedules}
          retreatSlug={retreatSlug}
        />
      </Suspense>
    </div>
  );
}
