import { Suspense } from "react";
import {
  fetchScheduleChangeRequests,
  fetchRetreatSchedules,
  fetchRetreatPayments,
} from "@/lib/api/server-actions";
import { ScheduleChangeRequestTable } from "@/components/features/schedule-change-request";
import { TableSkeleton } from "@/components/common/table/TableSkeleton";

interface PageProps {
  params: Promise<{ retreatSlug: string }>;
}

/**
 * 일정 변경 요청 페이지 (Server Component)
 *
 * Features:
 * - 재정 간사가 일정 변경 요청을 조회하고 처리
 * - 일정 변경 승인/거절
 * - 처리 완료 관리
 * - 검색 및 필터링
 * - 실시간 데이터 동기화 (SWR)
 *
 * Architecture:
 * - Server Component로 초기 데이터 페칭
 * - Promise.all로 병렬 로딩 (성능 최적화)
 * - Client Component는 SWR로 실시간 데이터 동기화
 * - TanStack Table로 현대적인 테이블 관리
 */
export default async function ScheduleChangeRequestsPage({
  params,
}: PageProps) {
  const { retreatSlug } = await params;

  // 서버에서 병렬 데이터 페칭 (Promise.all)
  const [scheduleChangeRequests, schedules, payments] = await Promise.all([
    fetchScheduleChangeRequests(retreatSlug),
    fetchRetreatSchedules(retreatSlug),
    fetchRetreatPayments(retreatSlug),
  ]);

  return (
    <div className="space-y-4 p-6">
      <Suspense fallback={<TableSkeleton />}>
        <ScheduleChangeRequestTable
          initialData={scheduleChangeRequests}
          schedules={schedules}
          payments={payments}
          retreatSlug={retreatSlug}
        />
      </Suspense>
    </div>
  );
}
