"use client";

import { useEffect, useState } from "react";
import { useUnivGroupStaffBus } from "@/hooks/use-univ-group-staff-bus";
import { RegistrationTable } from "@/components/bus-registration-table";
import { PaymentSummary } from "@/components/BusPaymentSummary";
import { AccountStatus } from "@/components/bus-account-status";
import { useParams } from "next/navigation";
import { TRetreatShuttleBus, TRetreatUnivGroup } from "@/types";
import { webAxios } from "@/lib/api/axios";

import { UnivGroupStaffBusTable } from "@/components/UnivGroupStaffBusTable";
import { BusScheduleSummary } from "@/components/BusScheduleSummary";

export default function UnivGroupStaffBusPage() {
  const [schedules, setSchedules] = useState<TRetreatShuttleBus[]>([]);

  const [retreatUnivGroup, setRetreatUnivGroup] = useState<TRetreatUnivGroup[]>(
    []
  );

  const params = useParams();
  const retreatSlug = params.retreatSlug as string;

  const { data, isLoading, error } = useUnivGroupStaffBus(retreatSlug);

  useEffect(() => {
    const fetchSchedules = async () => {
      const response = await webAxios.get(
        `/api/v1/retreat/${retreatSlug}/shuttle-bus/info`
      );

      setSchedules(response.data.shuttleBusInfo.shuttleBuses);
    };

      // const fetchRetreatUnivGroup = async () => {
      //   const response = await webAxios.get(
      //     `/api/v1/retreat/${retreatSlug}/univ-group-info`
      //   );

      //   setRetreatUnivGroup(response.data.retreatUnivGroup);
      // };

      fetchSchedules();
      //fetchRetreatUnivGroup();
  }, [retreatSlug]);

  if (error) {
    return <div>에러가 발생했습니다: {error.message}</div>;
  }

  if (isLoading) {
    return <div>데이터를 불러오는 중...</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">부서 셔틀버스 정보 조회</h1>

      <PaymentSummary registrations={data || []} />

      <BusScheduleSummary registrations={data || []} schedules={schedules} />

      <UnivGroupStaffBusTable
        registrations={data || []}
        schedules={schedules}
        retreatSlug={retreatSlug}
      />
    </div>
  );
}
