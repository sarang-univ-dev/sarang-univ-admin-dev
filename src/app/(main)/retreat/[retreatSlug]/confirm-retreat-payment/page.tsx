"use client";

import { useEffect, useState } from "react";
import { useUserRetreatRegistration } from "@/hooks/use-user-retreat-registration";
import { RegistrationTable } from "@/components/registration-table";
import { PaymentSummary } from "@/components/PaymentSummary";
import { AccountStatus } from "@/components/features/account-staff/AccountStatus";
import { useParams } from "next/navigation";
import { TRetreatRegistrationSchedule, TRetreatUnivGroup } from "@/types";
import { webAxios } from "@/lib/api/axios";

export default function ConfirmPaymentPage() {
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
      <h1 className="text-3xl font-bold">입금 조회</h1>

      <PaymentSummary registrations={data || []} />

      <RegistrationTable
        registrations={data || []}
        schedules={schedules}
        retreatSlug={retreatSlug}
      />

      <AccountStatus registrations={data || []} />
    </div>
  );
}
