"use client";

import { useEffect, useState } from "react";
import { useUserScheduleChangeHistory } from "@/hooks/user-schedule-change-retreat-history";
import { RetreatScheduleChangeHistoryTable } from "@/components/DormStaffRetreatScheduleChangeHistoryTable";
import { useParams } from "next/navigation";
import {
  TRetreatRegistrationSchedule,
  TRetreatUnivGroup,
} from "@/types";
import { webAxios } from "@/lib/api/axios";

export default function ScheduleChangeHistoryForDorm(){
  const [schedules, setSchedules] = useState<TRetreatRegistrationSchedule[]>(
    []
  );

  const params = useParams();
  const retreatSlug = params.retreatSlug as string;

  const { data, isLoading, error } = useUserScheduleChangeHistory(retreatSlug);

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const response = await webAxios.get(
          `/api/v1/retreat/${retreatSlug}/info`
        );
        setSchedules(response.data.retreatInfo.schedule);
      } catch (error) {
        console.error("일정 데이터 로드 중 오류:", error);
      }
    };

    if (retreatSlug) {
      fetchSchedules();
    }
  }, [retreatSlug]);

  if (error) {
    return <div>에러가 발생했습니다: {error.message}</div>;
  }

  if (isLoading) {
    return <div>데이터를 불러오는 중...</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">일정 변경 이력</h1>

      <RetreatScheduleChangeHistoryTable
        scheduleChangeHistories={data || []}
        schedules={schedules}
        retreatSlug={retreatSlug}
      />
    </div>
  );
}