"use client";

import { useParams } from "next/navigation";
import { GbsLineupManagementTable } from "@/components/features/gbs-lineup";

/**
 * GBS 라인업 관리 페이지
 *
 * Features:
 * - GBS 그룹 생성/삭제
 * - 리더 배정/해제
 * - GBS 메모 관리
 * - TanStack Table 기반 테이블
 * - MemoEditor 컴포넌트 사용
 */
export default function GbsLineupManagementPage() {
  const params = useParams();
  const retreatSlug = params.retreatSlug as string;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">GBS 라인업 관리</h1>
      <GbsLineupManagementTable retreatSlug={retreatSlug} />
    </div>
  );
}
