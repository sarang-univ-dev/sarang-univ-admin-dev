"use client";

import { useEffect, useState } from "react";
import { useUserScheduleChangeShuttleBus } from "@/hooks/user-schedule-change-bus-request";
import { ShuttleBusScheduleChangeRequestTable } from "@/components/ShuttleBusScheduleChangeRequestTable";
import { useParams } from "next/navigation";
import {
  TRetreatShuttleBus,
  TRetreatUnivGroup,
  TRetreatPaymentSchedule,
} from "@/types";
import { webAxios } from "@/lib/api/axios";

export default function BusScheduleChangeRequestPage() {
  const [schedules, setSchedules] = useState<TRetreatShuttleBus[]>([]);
  const [payments, setPayments] = useState<TRetreatPaymentSchedule[]>([]);
  const [retreatLocation, setRetreatLocation] = useState("");
  const [retreatUnivGroup, setRetreatUnivGroup] = useState<TRetreatUnivGroup[]>(
    []
  );

  const params = useParams();
  const retreatSlug = params.retreatSlug as string;

  // 셔틀버스용 커스텀 훅 사용!
  const { data, isLoading, error } =
    useUserScheduleChangeShuttleBus(retreatSlug);

  useEffect(() => {
    const fetchSchedules = async () => {
      const response = await webAxios.get(
        `/api/v1/retreat/${retreatSlug}/shuttle-bus/info` // 셔틀버스용 엔드포인트 필요시 수정
      );
      setSchedules(response.data.shuttleBusInfo.shuttleBuses);
      setRetreatLocation(response.data.shuttleBusInfo.retreat.location);
    };

    const fetchRetreatUnivGroup = async () => {
      const response = await webAxios.get(
        `/api/v1/retreat/${retreatSlug}/univ-group-info`
      );
      setRetreatUnivGroup(response.data.retreatUnivGroup);
    };

    fetchSchedules();
    fetchRetreatUnivGroup();
  }, [retreatSlug]);

  if (error) {
    return <div>에러가 발생했습니다: {error.message}</div>;
  }

  if (isLoading) {
    return <div>데이터를 불러오는 중...</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">셔틀버스 일정 변경 요청</h1>
      <ShuttleBusScheduleChangeRequestTable
        registrations={data || []}
        schedules={schedules}
        retreatLocation={retreatLocation}
        retreatSlug={retreatSlug}
        payments={payments}
      />
    </div>
    // <div className="flex items-center justify-center min-h-screen">
    //   <h1 className="text-xl font-medium text-gray-600">셔틀버스 일정 변경 요청 페이지는 구현이 필요합니다.</h1>
    // </div>
  );
}
