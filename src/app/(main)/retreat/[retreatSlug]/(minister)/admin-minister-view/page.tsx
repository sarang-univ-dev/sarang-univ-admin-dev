import { Suspense } from "react";
import {
  fetchAccountStaffRegistrations,
  fetchRetreatSchedules,
} from "@/lib/api/server-actions";
import {
  PaymentSummary,
  AccountStatus,
} from "@/components/features/retreat-payment-confirmation";
import { MinisterViewTable } from "@/components/features/minister";
import { Skeleton } from "@/components/ui/skeleton";

interface PageProps {
  params: Promise<{
    retreatSlug: string;
  }>;
}

/**
 * 행정 총괄 교역자 - 전체 신청 현황 조회 페이지 (Server Component)
 *
 * Features:
 * - 행정 총괄 교역자 전용 페이지 (ADMIN_MINISTER 권한)
 * - 전체 부서의 신청 명단 조회 (조회 전용)
 * - 표시 정보: 부서, 이름, 학년, 성별, 전화번호, 인도자, 신청일정, 금액, 입금상태
 * - 계좌 현황(AccountStatus) 포함
 * - Server Component로 초기 데이터 페칭
 * - 병렬 데이터 로딩 (Promise.all)
 */
export default async function AdminMinisterViewPage({ params }: PageProps) {
  const { retreatSlug } = await params;

  // 서버에서 병렬 데이터 페칭 (Promise.all)
  const [registrations, schedules] = await Promise.all([
    fetchAccountStaffRegistrations(retreatSlug),
    fetchRetreatSchedules(retreatSlug),
  ]);

  return (
    <div className="space-y-4 md:space-y-8">
      {/* 입금 현황 요약 */}
      <PaymentSummary registrations={registrations} />

      {/* 계좌 현황 (행정 총괄 교역자에게만 표시) */}
      <AccountStatus registrations={registrations} />

      {/* 조회 전용 테이블 */}
      <Suspense fallback={<TableSkeleton />}>
        <MinisterViewTable
          initialData={registrations}
          schedules={schedules}
          showAmount={true}
          showUnivGroup={true}
          title="전체 신청 현황 조회"
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
        </div>
      </div>
      <div className="rounded-md border">
        <Skeleton className="h-[600px] w-full" />
      </div>
    </div>
  );
}
