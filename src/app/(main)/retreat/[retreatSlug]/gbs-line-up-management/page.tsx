"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { webAxios } from "@/lib/api/axios";
import {TRetreatRegistrationSchedule} from "@/types";
import {useUserLineupLists} from "@/hooks/use-gbs-line-up-management";
import {GBSLineupManagementTable} from "@/components/GBSLineupManagementTable";
import {useUserLineups} from "@/hooks/use-gbs-line-up";

export default function GbsLineupPage() {

  const [schedules, setSchedules] = useState<TRetreatRegistrationSchedule[]>(
      []
  );

  const params = useParams();
  const retreatSlug = params.retreatSlug as string;
  const {
    data: registrations,
    isLoading: isRegistrationsLoading,
    error: registrationsError,
  } = useUserLineups(retreatSlug);

  const {
    data: gbsLists,
    isLoading: isGbsListsLoading,
    error: gbsListsError,
  } = useUserLineupLists(retreatSlug);


  useEffect(() => {
    const fetchSchedules = async () => {
      const response = await webAxios.get(
          `/api/v1/retreat/${retreatSlug}/info`
      );

      setSchedules(response.data.retreatInfo.schedule);
    };

    fetchSchedules();
  }, [retreatSlug]);

  if (registrationsError || gbsListsError) {
    return (
        <div>
          에러가 발생했습니다:
          <br />
          {registrationsError?.message}
          <br />
          {gbsListsError?.message}
        </div>
    );
  }

  if (isRegistrationsLoading || isGbsListsLoading) {
    return <div>데이터를 불러오는 중...</div>;
  }

  return (
      <div className="space-y-8">
        <h1 className="text-2xl font-bold">GBS 라인업 페이지</h1>
        <GBSLineupManagementTable
            registrations={registrations || []}
            gbsLists={gbsLists  || []}
            schedules={schedules}
            retreatSlug={retreatSlug}
        />
      </div>
  );
}
