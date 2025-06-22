"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { webAxios } from "@/lib/api/axios";
import { DormitoryTeamMemberTable } from "@/components/DormitoryTeamMemberTable";
import {TRetreatRegistrationSchedule} from "@/types";

export default function DormitoryPage() {

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
        <h1 className="text-2xl font-bold">기숙사 팀원 관리 페이지</h1>
        <DormitoryTeamMemberTable
            schedules={schedules}
            retreatSlug={retreatSlug}
        />
      </div>
  );
} 