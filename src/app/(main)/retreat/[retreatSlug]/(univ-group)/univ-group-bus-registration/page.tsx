import { Suspense } from "react";
import {
  fetchUnivGroupBusRegistrations,
  fetchShuttleBusSchedules,
} from "@/lib/api/server-actions";
import {
  UnivGroupBusRegistrationTable,
  BusPaymentSummary,
  BusScheduleSummary,
} from "@/components/features/univ-group-bus-registration";
import { Skeleton } from "@/components/ui/skeleton";

interface PageProps {
  params: Promise<{
    retreatSlug: string;
  }>;
}

/**
 * 부서 셔틀버스 등록 관리 페이지 (Server Component)
 *
 * Features:
 * - Server Component로 초기 데이터 페칭
 * - 병렬 데이터 로딩 (Promise.all)
 * - TanStack Table 기반 테이블
 * - SWR로 실시간 데이터 동기화
 */
export default async function UnivGroupBusRegistrationPage({
  params,
}: PageProps) {
  const { retreatSlug } = await params;

  // ✅ 서버에서 병렬 데이터 페칭 (Promise.all)
  const [registrations, schedules] = await Promise.all([
    fetchUnivGroupBusRegistrations(retreatSlug),
    fetchShuttleBusSchedules(retreatSlug),
  ]);

  return (
    <div className="space-y-4 md:space-y-8">
      {/* ✅ Server Component (정적 집계) */}
      <BusPaymentSummary registrations={registrations} />

      <BusScheduleSummary
        registrations={registrations}
        schedules={schedules}
      />

      {/* ✅ Client Component (인터랙션 필요 - TanStack Table) */}
      <Suspense fallback={<TableSkeleton />}>
        <UnivGroupBusRegistrationTable
          initialData={registrations}
          schedules={schedules}
          retreatSlug={retreatSlug}
        />
      </Suspense>
    </div>
  );
}

/**
 * 테이블 로딩 스켈레톤
 */
function TableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-[300px]" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-[100px]" />
          <Skeleton className="h-10 w-[120px]" />
        </div>
      </div>
      <div className="rounded-md border">
        <Skeleton className="h-[600px] w-full" />
      </div>
    </div>
  );
}
