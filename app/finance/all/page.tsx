// app/admin/users/page.tsx

"use client"; // Ensure this is a client component

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  TRetreatRegisterSchedule,
  TRetreatUserRegistration
} from "@/app/types";
import { AccountTable } from "@/components/AccountTable";
import axios, { AxiosError } from "axios";

export default function CheckDepositPage() {
  const params = useParams<{ slug: string }>();
  const { slug } = params;

  const [data, setData] = useState<{
    retreatUserRegistrations: TRetreatUserRegistration[];
    retreatRegisterSchedules: TRetreatRegisterSchedule[];
  }>({
    retreatUserRegistrations: [],
    retreatRegisterSchedules: []
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      console.log("Slug is undefined");
      setLoading(false); // 로딩 상태 종료
      return;
    }

    const fetchData = async () => {
      try {
        const response = await axios.get(
          `/api/v1/retreats/${slug}/finance/check-deposit`
        );
        console.log("API response data:", response.data);

        // API 응답 데이터 구조 확인
        if (
          response.data.retreatUserRegistrations &&
          response.data.retreatRegisterSchedules
        ) {
          setData({
            retreatUserRegistrations: response.data.retreatUserRegistrations,
            retreatRegisterSchedules: response.data.retreatRegisterSchedules
          });
        } else {
          setError("API 응답 데이터 형식이 올바르지 않습니다.");
        }
      } catch (err) {
        if (err instanceof AxiosError) {
          setError(
            err.response?.data?.error || "데이터를 불러오는데 실패했습니다."
          );
        } else {
          setError("알 수 없는 에러가 발생했습니다.");
        }
      } finally {
        setLoading(false); // 로딩 상태 종료
      }
    };

    fetchData();
  }, [slug]);

  console.log("Fetched Data:", data);

  if (loading) return <p>로딩 중...</p>;
  if (error) return <p>에러: {error}</p>;
  if (
    data.retreatUserRegistrations.length === 0 &&
    data.retreatRegisterSchedules.length === 0
  )
    return <p>입금내역을 찾을 수 없습니다.</p>;

  return (
    <AccountTable
      retreatUserRegistrations={data.retreatUserRegistrations}
      retreatRegisterSchedules={data.retreatRegisterSchedules}
    />
  );
}
