"use client";

import { useParams } from "next/navigation";

import { LineupUnivGroupAdminStaffMemoTable } from "@/components/features/gbs-line-up/LineupUnivGroupAdminStaffMemoTable";
import { useLineupUnivGroupAdminStaffMemos } from "@/hooks/gbs-line-up/use-lineup-univ-group-admin-staff-memos";

export default function LineupUnivGroupAdminStaffMemosPage() {
  const params = useParams();
  const retreatSlug = params.retreatSlug as string;
  const { data, isLoading, error } =
    useLineupUnivGroupAdminStaffMemos(retreatSlug);

  if (error) {
    return <div>에러가 발생했습니다: {error.message}</div>;
  }

  if (isLoading) {
    return <div>데이터를 불러오는 중...</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">행정간사 메모</h1>
      <LineupUnivGroupAdminStaffMemoTable memos={data || []} />
    </div>
  );
}
