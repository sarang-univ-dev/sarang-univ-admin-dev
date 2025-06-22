import useSWR from "swr";
import { webAxios } from "@/lib/api/axios";
import { Gender } from "@/types";
import { useState } from "react";
import { useToastStore } from "@/store/toast-store";

export interface IDormitoryTeamMemberRegistration {
  id: number;
  univGroupNumber: number;
  gradeNumber: number;
  gender: Gender;
  name: string;
  userRetreatRegistrationScheduleIds: number[];
  gbsNumber?: number;
  dormitoryLocation?: string;
  dormitoryTeamMemberMemo?: string;
}

const fetcher = async (url: string) => {
  try {
    const response = await webAxios.get(url);
    return response.data.userRetreatRegistrations;
  } catch (error) {
    console.error("Failed to fetch dormitory team member registrations:", error);
    throw error;
  }
};

export function useDormitoryTeamMemberRegistrations(retreatSlug?: string) {
  const { data, error, isLoading, mutate } = useSWR(
    retreatSlug ? `/api/v1/retreat/${retreatSlug}/dormitory/user-retreat-dormitory-team-member` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false,
    }
  );

  return {
    data: data as IDormitoryTeamMemberRegistration[] | undefined,
    isLoading,
    error,
    mutate,
  };
}

export function useScheduleChangeRequestMemo(retreatSlug?: string) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const addToast = useToastStore(state => state.add);

  const submitScheduleChangeRequestMemo = async (
    userRetreatRegistrationId: number,
    memo: string
  ) => {
    if (!retreatSlug) return;

    setIsSubmitting(true);
    try {
      await webAxios.post(
        `/api/v1/retreat/${retreatSlug}/dormitory/${userRetreatRegistrationId}/schedule-change-request-memo-by-team-member`,
        { memo }
      );
      addToast({
        title: "성공",
        description: "일정변동 요청 메모가 성공적으로 제출되었습니다.",
      });
    } catch (error: any) {
      console.error("Failed to submit schedule change request memo:", error);
      const errorMessage = error.response?.data?.message || "일정변동 요청 메모 제출에 실패했습니다.";
      addToast({
        title: "오류",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitScheduleChangeRequestMemo,
    isSubmitting,
  };
} 