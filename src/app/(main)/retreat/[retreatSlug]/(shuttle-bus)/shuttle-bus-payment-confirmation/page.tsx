import { Suspense } from "react";
import {
  fetchShuttleBusPaymentConfirmationRegistrations,
  fetchShuttleBusSchedules,
} from "@/lib/api/server-actions";
import {
  ShuttleBusPaymentConfirmationTable,
  PaymentSummary,
  BusScheduleSummary,
  AccountStatus,
} from "@/components/features/shuttle-bus-payment-confirmation";
import { Skeleton } from "@/components/ui/skeleton";

interface PageProps {
  params: Promise<{
    retreatSlug: string;
  }>;
}

/**
 * 셔틀버스 재정 팀원 - 입금 확인 페이지 (Server Component)
 *
 * Features:
 * - 셔틀버스 재정 팀원 전용 페이지 (SHUTTLE_BUS_ACCOUNT_MEMBER 권한)
 * - 입금 확인, 입금 요청, 환불 처리
 * - 버스 스케줄별 인원 집계
 * - 부서별 입금 현황 및 계좌 정보
 * - Server Component로 초기 데이터 페칭
 * - 병렬 데이터 로딩 (Promise.all)
 * - TanStack Table 기반 테이블
 * - SWR로 실시간 데이터 동기화
 */
export default async function ShuttleBusPaymentConfirmationPage({ params }: PageProps) {
  const { retreatSlug } = await params;

  // ✅ 서버에서 병렬 데이터 페칭 (Promise.all)
  const [registrations, schedules] = await Promise.all([
    fetchShuttleBusPaymentConfirmationRegistrations(retreatSlug),
    fetchShuttleBusSchedules(retreatSlug),
  ]);

  return (
    <div className="space-y-4 md:space-y-8 p-6">
      <h1 className="text-3xl font-bold">셔틀버스 입금 조회</h1>

      {/* ✅ Server Component (정적 집계) */}
      <PaymentSummary registrations={registrations} />

      <BusScheduleSummary
        registrations={registrations}
        schedules={schedules}
      />

      <AccountStatus registrations={registrations} />

      {/* ✅ Client Component (인터랙션 필요 - TanStack Table) */}
      <Suspense fallback={<TableSkeleton />}>
        <ShuttleBusPaymentConfirmationTable
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
