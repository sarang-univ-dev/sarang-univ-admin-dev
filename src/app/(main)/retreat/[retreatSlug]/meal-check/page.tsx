"use client";

import { useParams } from "next/navigation";
import { MealCheckTable } from "@/components/MealCheckTable";

export default function MealCheckPage() {
  const params = useParams();
  const retreatSlug = params.retreatSlug as string;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">식사 체크</h1>
      </div>
      
      <MealCheckTable 
        retreatSlug={retreatSlug}
      />
    </div>
  );
} 