import { Suspense } from "react";
import {
  fetchGbsLineUpData,
  fetchRetreatSchedules,
} from "@/lib/api/server-actions";
import { GbsLineUpTable } from "@/components/features/gbs-line-up/GbsLineUpTableNew";
import { Skeleton } from "@/components/ui/skeleton";

interface PageProps {
  params: Promise<{
    retreatSlug: string;
  }>;
}

/**
 * GBS Line-Up 관리 페이지 (Server Component)
 *
 * Features:
 * - GBS 라인업 조회 및 배정 관리
 * - GBS 번호 할당 및 수정
 * - 메모 작성 및 색상 표시
 * - 일정별 참석 현황 조회
 * - 부서별/수양회별 GBS 꼬리표 다운로드
 * - 전체 라인업 엑셀 내보내기
 * - Server Component로 초기 데이터 페칭
 * - 병렬 데이터 로딩 (Promise.all)
 * - 실시간 협업을 위한 2초 polling (Client Component)
 */
export default async function GbsLineUpPage({ params }: PageProps) {
  const { retreatSlug } = await params;

  // ✅ 서버에서 병렬 데이터 페칭 (Promise.all)
  const [lineups, schedules] = await Promise.all([
    fetchGbsLineUpData(retreatSlug),
    fetchRetreatSchedules(retreatSlug),
  ]);

  return (
    <div className="space-y-4 md:space-y-8">
      {/* ✅ Client Component (인터랙션 필요 - TanStack Table + SWR Polling) */}
      <Suspense fallback={<TableSkeleton />}>
        <GbsLineUpTable
          initialData={lineups}
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
          <Skeleton className="h-10 w-[200px]" />
          <Skeleton className="h-10 w-[200px]" />
          <Skeleton className="h-10 w-[200px]" />
        </div>
      </div>
      <div className="rounded-md border">
        <Skeleton className="h-[600px] w-full" />
      </div>
    </div>
  );
}
