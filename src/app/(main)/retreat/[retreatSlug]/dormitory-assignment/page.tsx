"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { DormitoryStaffTable } from "@/components/DormitoryStaffTable";
import { webAxios } from "@/lib/api/axios";
import { TRetreatRegistrationSchedule } from "@/types";

export default function DormitoryStaffPage() {
  const [schedules, setSchedules] = useState<TRetreatRegistrationSchedule[]>(
    []
  );

  const params = useParams();
  const retreatSlug = params.retreatSlug as string;

  useEffect(() => {
    const fetchSchedules = async () => {
      const response = await webAxios.get(
        `/api/v1/retreat/${retreatSlug}/info`
      );

      setSchedules(response.data.retreatInfo.schedule);
    };

    fetchSchedules();
  }, [retreatSlug]);

  return (
    <div className="space-y-8">
      <DormitoryStaffTable retreatSlug={retreatSlug} schedules={schedules} />
    </div>
  );
}
