"use client";

import { useParams } from "next/navigation";
import { ShuttleCheckTable } from "@/components/ShuttleCheckTable";

export default function ShuttleCheckPage() {
  const params = useParams();
  const retreatSlug = params.retreatSlug as string;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">셔틀버스 체크</h1>
      </div>
      
      <ShuttleCheckTable 
        retreatSlug={retreatSlug}
      />
    </div>
  );
} 