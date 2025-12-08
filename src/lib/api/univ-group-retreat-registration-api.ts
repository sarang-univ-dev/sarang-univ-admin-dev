import { webAxios } from "@/lib/api/axios";
import { IUnivGroupAdminStaffRetreat } from "@/types/univ-group-admin-staff";

/**
 * 일정 변경 요청 메모 응답 타입
 */
export interface IScheduleHistoryMemoResponse {
  id: number;
  userRetreatRegistrationId: number;
  memo: string;
  issuerAdminUserId: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * 부서 수양회 신청 API 클라이언트
 *
 * @description
 * - 재사용 가능한 독립적인 API 함수들
 * - Object namespace로 API 함수 그룹화
 * - 타입 안전성 보장 (모든 함수가 Promise<T> 반환)
 */
export const UnivGroupRetreatRegistrationAPI = {
  /**
   * 부서 행정 간사 수양회 신청 목록 조회
   *
   * @param retreatSlug - 수양회 슬러그
   * @returns 수양회 신청 목록
   */
  getRegistrations: async (
    retreatSlug: string
  ): Promise<IUnivGroupAdminStaffRetreat[]> => {
    const response = await webAxios.get(
      `/api/v1/retreat/${retreatSlug}/registration/univ-group-registrations`
    );
    return response.data.userRetreatRegistrations;
  },

  /**
   * 환불 처리
   *
   * @param retreatSlug - 수양회 슬러그
   * @param registrationId - 신청 ID
   * @returns 업데이트된 신청 정보
   */
  refundComplete: async (
    retreatSlug: string,
    registrationId: string
  ): Promise<IUnivGroupAdminStaffRetreat> => {
    const response = await webAxios.post(
      `/api/v1/retreat/${retreatSlug}/account/refund-complete`,
      { userRetreatRegistrationId: registrationId }
    );
    return response.data.userRetreatRegistration;
  },

  /**
   * 새가족/군지체 타입 할당
   *
   * @param retreatSlug - 수양회 슬러그
   * @param registrationId - 신청 ID
   * @param userType - 사용자 타입 (NEW_COMER | SOLDIER | null)
   * @returns 업데이트된 신청 정보
   */
  assignUserType: async (
    retreatSlug: string,
    registrationId: string,
    userType: "NEW_COMER" | "SOLDIER" | null
  ): Promise<IUnivGroupAdminStaffRetreat> => {
    const response = await webAxios.post(
      `/api/v1/retreat/${retreatSlug}/registration/${registrationId}/assign-user-type`,
      { userType }
    );
    return response.data.userRetreatRegistration;
  },

  /**
   * 입금 요청 메시지 전송
   *
   * @param retreatSlug - 수양회 슬러그
   * @param registrationId - 신청 ID
   */
  requestPayment: async (
    retreatSlug: string,
    registrationId: string
  ): Promise<void> => {
    await webAxios.post(
      `/api/v1/retreat/${retreatSlug}/account/request-payment`,
      { userRetreatRegistrationId: registrationId }
    );
  },

  /**
   * 일정 변경 요청 메모 저장
   *
   * @param retreatSlug - 수양회 슬러그
   * @param registrationId - 신청 ID
   * @param memo - 메모 내용
   * @returns 생성된 메모 데이터 (id 포함)
   */
  saveScheduleMemo: async (
    retreatSlug: string,
    registrationId: string,
    memo: string
  ): Promise<IScheduleHistoryMemoResponse> => {
    const response = await webAxios.post(
      `/api/v1/retreat/${retreatSlug}/registration/${registrationId}/schedule-change-request-memo`,
      { memo }
    );
    return response.data.userRetreatRegistrationHistoryMemo;
  },

  /**
   * 일정 변경 요청 메모 수정
   *
   * @param retreatSlug - 수양회 슬러그
   * @param historyMemoId - history 메모 ID
   * @param memo - 수정할 메모 내용
   * @returns 수정된 메모 데이터
   */
  updateScheduleMemo: async (
    retreatSlug: string,
    historyMemoId: number,
    memo: string
  ): Promise<IScheduleHistoryMemoResponse> => {
    const response = await webAxios.put(
      `/api/v1/retreat/${retreatSlug}/registration/schedule-change-request-memo/${historyMemoId}`,
      { memo }
    );
    return response.data.userRetreatRegistrationHistoryMemo;
  },

  /**
   * 일정 변경 요청 메모 삭제
   *
   * @param retreatSlug - 수양회 슬러그
   * @param historyMemoId - history 메모 ID
   */
  deleteScheduleMemo: async (
    retreatSlug: string,
    historyMemoId: number
  ): Promise<void> => {
    await webAxios.delete(
      `/api/v1/retreat/${retreatSlug}/registration/schedule-change-request-memo/${historyMemoId}`
    );
  },

  /**
   * 행정간사 메모 저장
   *
   * @param retreatSlug - 수양회 슬러그
   * @param registrationId - 신청 ID
   * @param memo - 메모 내용
   * @returns 생성된 메모 정보 (id, memo)
   */
  saveAdminMemo: async (
    retreatSlug: string,
    registrationId: string,
    memo: string
  ): Promise<{ id: number; memo: string }> => {
    const response = await webAxios.post(
      `/api/v1/retreat/${retreatSlug}/registration/${registrationId}/memo`,
      { memo }
    );
    return response.data.userRetreatRegistrationMemo;
  },

  /**
   * 행정간사 메모 수정
   *
   * @param retreatSlug - 수양회 슬러그
   * @param memoId - 메모 ID
   * @param memo - 수정할 메모 내용
   * @returns 수정된 메모 정보 (id, memo)
   */
  updateAdminMemo: async (
    retreatSlug: string,
    memoId: number,
    memo: string
  ): Promise<{ id: number; memo: string }> => {
    const response = await webAxios.put(
      `/api/v1/retreat/${retreatSlug}/registration/${memoId}/memo`,
      { memo }
    );
    return response.data.userRetreatRegistrationMemo;
  },

  /**
   * 행정간사 메모 삭제
   *
   * @param retreatSlug - 수양회 슬러그
   * @param memoId - 메모 ID
   */
  deleteAdminMemo: async (
    retreatSlug: string,
    memoId: number
  ): Promise<void> => {
    await webAxios.delete(
      `/api/v1/retreat/${retreatSlug}/registration/${memoId}/memo`
    );
  },
};
