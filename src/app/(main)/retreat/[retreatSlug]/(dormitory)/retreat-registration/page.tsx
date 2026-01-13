"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { webAxios } from "@/lib/api/axios";
import { DormitoryRetreatRegistrationTable } from "@/components/features/dormitory/DormitoryRetreatRegistrationTable";
import { TRetreatRegistrationSchedule } from "@/types";

export default function DormitoryRetreatRegistrationPage() {
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
      <h1 className="text-2xl font-bold">숙소팀 수양회 신청 관리</h1>
      <DormitoryRetreatRegistrationTable
        schedules={schedules}
        retreatSlug={retreatSlug}
      />
    </div>
  );
}
