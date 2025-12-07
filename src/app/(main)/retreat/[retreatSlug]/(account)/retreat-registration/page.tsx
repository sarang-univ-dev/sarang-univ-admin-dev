import { Suspense } from "react";
import {
  fetchAccountStaffRegistrations,
  fetchRetreatSchedules,
} from "@/lib/api/server-actions";
import {
  AccountStaffRegistrationTable,
  PaymentSummary,
  RetreatScheduleSummary,
  AccountStatus,
} from "@/components/features/account";
import { Skeleton } from "@/components/ui/skeleton";

interface PageProps {
  params: Promise<{
    retreatSlug: string;
  }>;
}

/**
 * 재정 간사 - 수양회 전체 신청 관리 페이지 (Server Component)
 *
 * Features:
 * - 전체 신청자 목록 조회 및 관리
 * - 입금 확인, 간사 배정, 환불 처리
 * - 재정간사 메모 작성 및 관리
 * - 부서별 계좌 현황 및 입금 집계
 * - Server Component로 초기 데이터 페칭
 * - 병렬 데이터 로딩 (Promise.all)
 * - TanStack Table 기반 테이블
 * - SWR로 실시간 데이터 동기화
 */
export default async function RetreatRegistrationsPage({ params }: PageProps) {
  const { retreatSlug } = await params;

  // ✅ 서버에서 병렬 데이터 페칭 (Promise.all)
  const [registrations, schedules] = await Promise.all([
    fetchAccountStaffRegistrations(retreatSlug),
    fetchRetreatSchedules(retreatSlug),
  ]);

  return (
    <div className="space-y-8 p-6">
      {/* ✅ Server Component (정적 집계) */}
      <PaymentSummary registrations={registrations} />

      <RetreatScheduleSummary
        registrations={registrations}
        schedules={schedules}
      />

      <AccountStatus registrations={registrations} />

      {/* ✅ Client Component (인터랙션 필요 - TanStack Table) */}
      <Suspense fallback={<TableSkeleton />}>
        <AccountStaffRegistrationTable
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
