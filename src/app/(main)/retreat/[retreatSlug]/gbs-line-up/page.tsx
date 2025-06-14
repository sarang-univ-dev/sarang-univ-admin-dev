"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { webAxios } from "@/lib/api/axios";
import { GBSLineupTable } from "@/components/GBSLineupTable";
import {TRetreatRegistrationSchedule} from "@/types";
import {useUserLineups} from "@/hooks/use-gbs-line-up";

export default function GbsLineupPage() {

  const [schedules, setSchedules] = useState<TRetreatRegistrationSchedule[]>(
      []
  );

  const params = useParams();
  const retreatSlug = params.retreatSlug as string;
  const { data, isLoading, error } = useUserLineups(retreatSlug);

  useEffect(() => {
    const fetchSchedules = async () => {
      const response = await webAxios.get(
          `/api/v1/retreat/${retreatSlug}/info`
      );

      setSchedules(response.data.retreatInfo.schedule);
    };

    fetchSchedules();
  }, [retreatSlug]);

  if (error) {
    return <div>에러가 발생했습니다: {error.message}</div>;
  }

  if (isLoading) {
    return <div>데이터를 불러오는 중...</div>;
  }

  return (
      <div className="space-y-8">
        <h1 className="text-2xl font-bold">GBS 라인업 페이지</h1>
        <GBSLineupTable
            registrations={data || []}
            schedules={schedules}
            retreatSlug={retreatSlug}
        />
      </div>
  );
}
