"use client";

import { useState } from "react";
import { UnivGroupRetreatRegistrationTable } from "./UnivGroupRetreatRegistrationTable";
import { UnivGroupRetreatRegistrationHeader } from "./UnivGroupRetreatRegistrationHeader";
import { IUnivGroupAdminStaffRetreat } from "@/types/univ-group-admin-staff";
import { TRetreatRegistrationSchedule } from "@/types";

interface UnivGroupRetreatRegistrationSectionProps {
  initialData: IUnivGroupAdminStaffRetreat[];
  schedules: TRetreatRegistrationSchedule[];
  retreatSlug: string;
}

/**
 * 부서 수양회 신청 섹션 (Client Component)
 *
 * @description
 * - Header와 Table을 포함하는 클라이언트 래퍼 컴포넌트
 * - filteredCount 상태를 관리하여 Header에 전달
 */
export function UnivGroupRetreatRegistrationSection({
  initialData,
  schedules,
  retreatSlug,
}: UnivGroupRetreatRegistrationSectionProps) {
  const [filteredCount, setFilteredCount] = useState<number | undefined>(undefined);

  return (
    <div className="space-y-4">
      <UnivGroupRetreatRegistrationHeader filteredCount={filteredCount} />
      <UnivGroupRetreatRegistrationTable
        initialData={initialData}
        schedules={schedules}
        retreatSlug={retreatSlug}
        onFilteredCountChange={setFilteredCount}
      />
    </div>
  );
}
