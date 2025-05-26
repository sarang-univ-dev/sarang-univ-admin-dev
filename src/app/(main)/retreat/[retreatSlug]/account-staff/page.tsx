"use client";

import { useEffect, useState } from "react";
import { useUserRetreatRegistration } from "@/hooks/use-account-staff";
import { AccountStaffTable } from "@/components/AccountStaffTable";
import { useParams } from "next/navigation";
import { TRetreatRegistrationSchedule, TRetreatUnivGroup } from "@/types";
import { webAxios } from "@/lib/api/axios";
import { PaymentSummary } from "@/components/PaymentSummary";
import { RetreatScheduleSummary } from "@/components/RetreatScheduleSummary";
import { AccountStatus } from "@/components/account-status";

export default function AccountStaffPage() {
  const [schedules, setSchedules] = useState<TRetreatRegistrationSchedule[]>(
    []
  );

  const [retreatUnivGroup, setRetreatUnivGroup] = useState<TRetreatUnivGroup[]>(
    []
  );

  const params = useParams();
  const retreatSlug = params.retreatSlug as string;

  const { data, isLoading, error } = useUserRetreatRegistration(retreatSlug);

  useEffect(() => {
    const fetchSchedules = async () => {
      const response = await webAxios.get(
        `/api/v1/retreat/${retreatSlug}/info`
      );

      setSchedules(response.data.retreatInfo.schedule);
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
      <h1 className="text-3xl font-bold">재정 간사 페이지</h1>

      <PaymentSummary registrations={data || []} />

      <RetreatScheduleSummary
        registrations={data || []}
        schedules={schedules}
      />

      <AccountStatus registrations={data || []} />

      <AccountStaffTable
        registrations={data || []}
        schedules={schedules}
        retreatSlug={retreatSlug}
      />
    </div>
  );
}
