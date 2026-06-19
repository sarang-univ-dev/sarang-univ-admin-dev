import { Suspense } from "react";

import { TableSkeleton } from "@/components/common/table/TableSkeleton";
import { LeaderReportSubmissionStatusTable } from "@/components/features/leader-report";
import {
  fetchDepartmentLeaderReportSubmissionStatus,
  fetchLeaderToday,
} from "@/lib/api/server-actions";

interface PageProps {
  params: Promise<{ retreatSlug: string }>;
}

/**
 * 부서 보고서 제출현황 페이지 (리더보고서 간사 / LEADER_STAFF)
 *
 * - 리더별 제출 여부 / 제출 시각
 * - 조회 기준일자를 오늘 일자 선택과 분리
 */
export default async function LeaderReportSubmissionStatusPage({
  params,
}: PageProps) {
  const { retreatSlug } = await params;

  const today = await fetchLeaderToday(retreatSlug);
  const initialDate = today.today ?? today.days[0] ?? undefined;
  const { submissionStatus, date } =
    await fetchDepartmentLeaderReportSubmissionStatus(retreatSlug, initialDate);

  return (
    <div className="space-y-4 p-6">
      <Suspense fallback={<TableSkeleton />}>
        <LeaderReportSubmissionStatusTable
          initialData={submissionStatus}
          initialDate={date ?? initialDate ?? null}
          initialToday={today}
          retreatSlug={retreatSlug}
        />
      </Suspense>
    </div>
  );
}
