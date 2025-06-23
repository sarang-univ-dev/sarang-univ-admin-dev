"use client";

import { useParams } from "next/navigation";
import { AssignGbsLocationTable } from "@/components/AssignGbsLocationTable";

export default function AssignGbsLocationPage() {
  const params = useParams();
  const retreatSlug = params.retreatSlug as string;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">GBS 장소 배정</h1>
      <AssignGbsLocationTable retreatSlug={retreatSlug} />
    </div>
  );
} 