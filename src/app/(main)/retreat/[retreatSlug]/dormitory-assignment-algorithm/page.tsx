"use client";

import { useParams } from "next/navigation";

import { DormitoryAssignmentManager } from "@/components/features/dormitory/DormitoryAssignmentManager";

export default function DormitoryAssignmentAlgorithmPage() {
  const params = useParams();
  const retreatSlug = params.retreatSlug as string;

  return (
    <div className="space-y-8">
      <DormitoryAssignmentManager retreatSlug={retreatSlug} />
    </div>
  );
}
