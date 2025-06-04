"use client";

import { useEffect, useState } from "react";
import { useUserScheduleChangeShuttleBusHistory } from "@/hooks/user-schedule-change-bus-history";
import { ShuttleBusScheduleChangeHistoryTable } from "@/components/ShuttleBusScheduleChangeHistoryTable";
import { useParams } from "next/navigation";
import { TRetreatShuttleBus, TRetreatUnivGroup } from "@/types";
import { webAxios } from "@/lib/api/axios";

export default function ScheduleChangeHistoryPage() {
  const [schedules, setSchedules] = useState<TRetreatShuttleBus[]>([]);

  const [retreatUnivGroup, setRetreatUnivGroup] = useState<TRetreatUnivGroup[]>(
    []
  );

  const params = useParams();
  const retreatSlug = params.retreatSlug as string;

  const { data, isLoading, error } =
    useUserScheduleChangeShuttleBusHistory(retreatSlug);

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const response = await webAxios.get(
          `/api/v1/retreat/${retreatSlug}/shuttle-bus/info` // 셔틀버스용 엔드포인트 필요시 수정
        );
        setSchedules(response.data.shuttleBusInfo.shuttleBuses);
      } catch (error) {
        console.error("일정 데이터 로드 중 오류:", error);
      }
    };

    const fetchRetreatUnivGroup = async () => {
      try {
        const response = await webAxios.get(
          `/api/v1/retreat/${retreatSlug}/univ-group-info`
        );
        setRetreatUnivGroup(response.data.retreatUnivGroup);
      } catch (error) {
        console.error("부서 정보 로드 중 오류:", error);
      }
    };

    if (retreatSlug) {
      fetchSchedules();
      fetchRetreatUnivGroup();
    }
  }, [retreatSlug]);

  if (error) {
    return (
      <div>
        에러가 발생했습니다: {error.message || "알 수 없는 오류가 발생했습니다"}
      </div>
    );
  }

  if (isLoading) {
    return <div>데이터를 불러오는 중...</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">일정 변경 이력</h1>

      <ShuttleBusScheduleChangeHistoryTable
        scheduleChangeHistories={data || []}
        schedules={schedules}
        retreatSlug={retreatSlug}
      />
    </div>
  );
}
