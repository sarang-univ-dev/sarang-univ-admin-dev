import { webAxios } from "@/lib/api/axios";
import { IRetreatRegistration } from "@/types/account";

/**
 * 재정 간사 수양회 신청 API 클라이언트
 *
 * @description
 * - 재사용 가능한 독립적인 API 함수들
 * - Object namespace로 API 함수 그룹화
 * - 타입 안전성 보장 (모든 함수가 Promise<T> 반환)
 */
export const AccountStaffAPI = {
  /**
   * 재정 간사 수양회 신청 목록 조회
   *
   * @param retreatSlug - 수양회 슬러그
   * @returns 수양회 신청 목록
   */
  getRegistrations: async (
    retreatSlug: string
  ): Promise<IRetreatRegistration[]> => {
    const response = await webAxios.get(
      `/api/v1/retreat/${retreatSlug}/account/retreat-registrations`
    );
    return response.data.retreatRegistrations;
  },

  /**
   * 간사 배정
   *
   * @param retreatSlug - 수양회 슬러그
   * @param registrationId - 신청 ID
   */
  assignStaff: async (
    retreatSlug: string,
    registrationId: string
  ): Promise<void> => {
    await webAxios.post(
      `/api/v1/retreat/${retreatSlug}/account/assign-staff`,
      { userRetreatRegistrationId: registrationId }
    );
  },

  /**
   * 입금 확인 완료
   *
   * @param retreatSlug - 수양회 슬러그
   * @param registrationId - 신청 ID
   */
  confirmPayment: async (
    retreatSlug: string,
    registrationId: string
  ): Promise<void> => {
    await webAxios.post(
      `/api/v1/retreat/${retreatSlug}/account/confirm-payment`,
      { userRetreatRegistrationId: registrationId }
    );
  },

  /**
   * 환불 처리 완료
   *
   * @param retreatSlug - 수양회 슬러그
   * @param registrationId - 신청 ID
   */
  refundComplete: async (
    retreatSlug: string,
    registrationId: string
  ): Promise<void> => {
    await webAxios.post(
      `/api/v1/retreat/${retreatSlug}/account/refund-complete`,
      { userRetreatRegistrationId: registrationId }
    );
  },

  /**
   * 회계 메모 저장 (신규 생성)
   *
   * @param retreatSlug - 수양회 슬러그
   * @param registrationId - 신청 ID
   * @param memo - 메모 내용
   */
  saveAccountMemo: async (
    retreatSlug: string,
    registrationId: string,
    memo: string
  ): Promise<void> => {
    await webAxios.post(
      `/api/v1/retreat/${retreatSlug}/account/${registrationId}/account-memo`,
      { memo }
    );
  },

  /**
   * 회계 메모 수정
   *
   * @param retreatSlug - 수양회 슬러그
   * @param memoId - 메모 ID
   * @param memo - 수정할 메모 내용
   */
  updateAccountMemo: async (
    retreatSlug: string,
    memoId: number,
    memo: string
  ): Promise<void> => {
    await webAxios.put(
      `/api/v1/retreat/${retreatSlug}/account/${memoId}/account-memo`,
      { memo }
    );
  },

  /**
   * 회계 메모 삭제
   *
   * @param retreatSlug - 수양회 슬러그
   * @param memoId - 메모 ID
   */
  deleteAccountMemo: async (
    retreatSlug: string,
    memoId: number
  ): Promise<void> => {
    await webAxios.delete(
      `/api/v1/retreat/${retreatSlug}/account/${memoId}/account-memo`
    );
  },

  /**
   * 수양회 신청 현황 엑셀 다운로드
   *
   * @param retreatSlug - 수양회 슬러그
   * @returns Blob 데이터
   */
  downloadExcel: async (retreatSlug: string): Promise<Blob> => {
    const response = await webAxios.get(
      `/api/v1/retreat/${retreatSlug}/account/download-retreat-registration-excel`,
      { responseType: "blob" }
    );
    return response.data;
  },
};
