"use client";

import { useParams } from "next/navigation";
import { DormitoryManagementTable } from "@/components/features/dormitory-management/DormitoryManagementTable";

export default function DormitoryManagementPage() {
  const params = useParams();
  const retreatSlug = params.retreatSlug as string;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">숙소 관리</h1>
        <p className="text-sm text-muted-foreground mt-1">
          숙소 정원/메모 수정, 비활성화(방배정 제외), 삭제 및 숙소 엑셀
          가져오기/내보내기
        </p>
      </div>
      <DormitoryManagementTable retreatSlug={retreatSlug} />
    </div>
  );
}
