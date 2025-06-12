"use client";

import { useEffect, useState } from "react";
import { useUserScheduleChangeRetreat } from "@/hooks/user-schedule-change-retreat-request";
import { RetreatScheduleChangeRequestTable } from "@/components/RetreatScheduleChangeRequestTable";
import { PaymentSummary } from "@/components/PaymentSummary";
import { AccountStatus } from "@/components/account-status";
import { useParams } from "next/navigation";
import {
  TRetreatRegistrationSchedule,
  TRetreatUnivGroup,
  TRetreatPaymentSchedule
} from "@/types";
import { webAxios } from "@/lib/api/axios";

export default function ScheduleChangeRequestPage() {
  const [schedules, setSchedules] = useState<TRetreatRegistrationSchedule[]>(
    []
  );

  const [payments, setPayments] = useState<TRetreatPaymentSchedule[]>([]);

  const [retreatUnivGroup, setRetreatUnivGroup] = useState<TRetreatUnivGroup[]>(
    []
  );

  const params = useParams();
  const retreatSlug = params.retreatSlug as string;

  const { data, isLoading, error } = useUserScheduleChangeRetreat(retreatSlug);

  useEffect(() => {
    const fetchSchedules = async () => {
      const response = await webAxios.get(
        `/api/v1/retreat/${retreatSlug}/info`
      );

      setSchedules(response.data.retreatInfo.schedule);
      setPayments(response.data.retreatInfo.payment);
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
      <h1 className="text-3xl font-bold">일정 변경 요청</h1>

      <RetreatScheduleChangeRequestTable
        registrations={data || []}
        schedules={schedules}
        retreatSlug={retreatSlug}
        payments={payments}
      />
    </div>
  );
}
