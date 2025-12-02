import { webAxios } from "./axios";
import { IUserScheduleChangeRetreat } from "@/types";

/**
 * Schedule Change Request API
 * 일정 변경 요청 관련 API 함수들
 */
export const ScheduleChangeRequestAPI = {
  /**
   * 일정 변경 요청 목록 조회
   * @param retreatSlug - 수양회 slug
   * @returns 일정 변경 요청 배열
   */
  getScheduleChangeRequests: async (
    retreatSlug: string
  ): Promise<IUserScheduleChangeRetreat[]> => {
    const response = await webAxios.get(
      `/api/v1/retreat/${retreatSlug}/account/schedule-change-request`
    );
    return response.data.scheduleChangeRequests;
  },

  /**
   * 일정 변경 승인 (처리)
   * @param retreatSlug - 수양회 slug
   * @param userRetreatRegistrationId - 신청 ID
   * @param afterScheduleIds - 변경 후 일정 ID 배열
   */
  approveScheduleChange: async (
    retreatSlug: string,
    userRetreatRegistrationId: string,
    afterScheduleIds: number[]
  ): Promise<void> => {
    await webAxios.post(
      `/api/v1/retreat/${retreatSlug}/account/schedule-history`,
      {
        userRetreatRegistrationId,
        afterScheduleIds,
      }
    );
  },

  /**
   * 일정 변경 처리 완료
   * @param retreatSlug - 수양회 slug
   * @param userRetreatRegistrationHistoryMemoId - 메모 ID
   */
  resolveScheduleChange: async (
    retreatSlug: string,
    userRetreatRegistrationHistoryMemoId: number
  ): Promise<void> => {
    await webAxios.post(
      `/api/v1/retreat/${retreatSlug}/account/schedule-history/resolve-memo`,
      {
        userRetreatRegistrationHistoryMemoId,
      }
    );
  },
};
