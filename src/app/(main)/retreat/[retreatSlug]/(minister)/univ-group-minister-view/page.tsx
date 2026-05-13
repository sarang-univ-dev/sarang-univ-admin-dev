import { Suspense } from "react";
import {
  fetchUnivGroupAdminStaffData,
  fetchRetreatSchedules,
} from "@/lib/api/server-actions";
import { PaymentSummary } from "@/components/features/retreat-payment-confirmation";
import {
  MinisterViewTable,
  RegistrationStatisticsPanel,
} from "@/components/features/minister";
import { Skeleton } from "@/components/ui/skeleton";

interface PageProps {
  params: Promise<{
    retreatSlug: string;
  }>;
}

/**
 * 부서별 교역자 - 부서 신청 현황 조회 페이지 (Server Component)
 *
 * Features:
 * - 부서별 교역자 전용 페이지 (UNIV_GROUP_MINISTER 권한)
 * - 본인 부서의 신청 명단 조회 (조회 전용)
 * - 표시 정보: 이름, 학년, 성별, 전화번호, 인도자, 신청일정, 입금상태
 * - 금액 정보 미표시
 * - Server Component로 초기 데이터 페칭
 * - 병렬 데이터 로딩 (Promise.all)
 */
export default async function UnivGroupMinisterViewPage({ params }: PageProps) {
  const { retreatSlug } = await params;

  // 서버에서 병렬 데이터 페칭 (Promise.all)
  const [registrations, schedules] = await Promise.all([
    fetchUnivGroupAdminStaffData(retreatSlug),
    fetchRetreatSchedules(retreatSlug),
  ]);

  return (
    <div className="space-y-4 md:space-y-8">
      {/* 입금 현황 요약 */}
      <PaymentSummary registrations={registrations} />

      {/* 신청 현황 통계 그래프 */}
      <RegistrationStatisticsPanel
        registrations={registrations}
        showDepartmentFilter={false}
        title="부서 신청 현황 통계"
      />

      {/* 조회 전용 테이블 */}
      <Suspense fallback={<TableSkeleton />}>
        <MinisterViewTable
          initialData={registrations}
          schedules={schedules}
          showAmount={false}
          showUnivGroup={false}
          title="부서 신청 현황 조회"
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
