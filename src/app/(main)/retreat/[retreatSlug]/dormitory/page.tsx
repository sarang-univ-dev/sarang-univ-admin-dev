"use client";

import { useParams } from "next/navigation";

import { DormitoryAssignmentTable } from "@/components/features/dormitory/DormitoryAssignmentTable";

export default function DormitoryAssignmentPage() {
  const params = useParams();
  const retreatSlug = params.retreatSlug as string;

  return (
    <div className="space-y-8">
      <DormitoryAssignmentTable retreatSlug={retreatSlug} />
    </div>
  );
}
