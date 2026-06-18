import { Suspense } from "react";

import { TableSkeleton } from "@/components/common/table/TableSkeleton";
import { LeaderReportsTable } from "@/components/features/leader-report";
import { fetchLeaderReports, fetchLeaderToday } from "@/lib/api/server-actions";

interface PageProps {
  params: Promise<{ retreatSlug: string }>;
}

/**
 * 부서 은혜나눔/기도제목 페이지 (교육 간사 / EDUCATION_STAFF)
 *
 * - 현재 admin의 부서 리더 보고서 조회
 * - Server Component 로 초기 데이터 페칭, Client 가 SWR 폴링
 */
export default async function LeaderReportsPage({ params }: PageProps) {
  const { retreatSlug } = await params;

  const today = await fetchLeaderToday(retreatSlug);
  const initialDate = today.today ?? today.days[0] ?? undefined;
  const reports = await fetchLeaderReports(retreatSlug, initialDate);

  return (
    <div className="space-y-4 p-6">
      <Suspense fallback={<TableSkeleton />}>
        <LeaderReportsTable
          initialData={reports}
          initialDate={initialDate ?? null}
          initialToday={today}
          retreatSlug={retreatSlug}
        />
      </Suspense>
    </div>
  );
}
