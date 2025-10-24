import { useTableActions } from "../use-table-actions";
import { useConfirmDialogStore } from "@/store/confirm-dialog-store";
import { webAxios } from "@/lib/api/axios";

/**
 * 부서 행정 간사 테이블 액션 훅
 * - 환불 처리
 * - 새가족 신청 승인/거절
 * - 군지체 신청 승인/거절
 * - 메시지 전송
 * - 메모 관리
 */
export function useUnivGroupAdminStaffActions(retreatSlug: string) {
  const confirmDialog = useConfirmDialogStore();
  const endpoint = `/api/v1/retreat/${retreatSlug}/registration/univ-group-registrations`;
  const { loading, executeAction } = useTableActions({ endpoint });

  /**
   * 환불 처리 완료
   */
  const handleRefund = (id: string) => {
    confirmDialog.show({
      title: "환불 처리",
      description: "정말로 환불 처리를 완료하시겠습니까?",
      onConfirm: () =>
        executeAction(
          () =>
            webAxios.post(
              `/api/v1/retreat/${retreatSlug}/account/refund-complete`,
              { userRetreatRegistrationId: id }
            ),
          { successMessage: "환불이 성공적으로 처리되었습니다." }
        ),
    });
  };

  /**
   * 새가족 신청 승인/거절
   */
  const handleNewFamilyRequest = (id: string, approve: boolean) => {
    confirmDialog.show({
      title: approve ? "새가족 신청 승인" : "새가족 신청 거절",
      description: approve
        ? "정말로 새가족 신청을 승인하시겠습니까? 새가족으로 입금 안내 문자가 전송됩니다."
        : "정말로 새가족 신청을 거절하시겠습니까? 일반 지체로 입금 안내 문자가 전송됩니다.",
      onConfirm: () =>
        executeAction(
          () =>
            webAxios.post(
              `/api/v1/retreat/${retreatSlug}/registration/${id}/assign-user-type`,
              { userType: approve ? "NEW_COMER" : null }
            ),
          {
            successMessage: `새가족 신청이 성공적으로 ${
              approve ? "승인" : "거절"
            }되었습니다.`,
          }
        ),
    });
  };

  /**
   * 군지체 신청 승인/거절
   */
  const handleMilitaryRequest = (id: string, approve: boolean) => {
    confirmDialog.show({
      title: approve ? "군지체 신청 승인" : "군지체 신청 거절",
      description: approve
        ? "정말로 군지체 신청을 승인하시겠습니까? 군지체로 입금 안내 문자가 전송됩니다."
        : "정말로 군지체 신청을 거절하시겠습니까? 일반 지체로 입금 안내 문자가 전송됩니다.",
      onConfirm: () =>
        executeAction(
          () =>
            webAxios.post(
              `/api/v1/retreat/${retreatSlug}/registration/${id}/assign-user-type`,
              { userType: approve ? "SOLDIER" : null }
            ),
          {
            successMessage: `군지체 신청이 성공적으로 ${
              approve ? "승인" : "거절"
            }되었습니다.`,
          }
        ),
    });
  };

  /**
   * 입금 요청 메시지 전송
   */
  const handleSendPaymentRequest = (id: string) => {
    return executeAction(
      () =>
        webAxios.post(
          `/api/v1/retreat/${retreatSlug}/account/request-payment`,
          { userRetreatRegistrationId: id }
        ),
      { successMessage: "입금 요청 메시지가 성공적으로 전송되었습니다." }
    );
  };

  /**
   * 일정 변경 요청 메모 저장
   */
  const handleSaveScheduleMemo = (id: string, memo: string) => {
    return executeAction(
      () =>
        webAxios.post(
          `/api/v1/retreat/${retreatSlug}/registration/${id}/schedule-change-request-memo`,
          { memo }
        ),
      { successMessage: "메모가 성공적으로 저장되었습니다." }
    );
  };

  /**
   * 행정간사 메모 저장 (신규)
   */
  const handleSaveAdminMemo = (id: string, memo: string) => {
    return executeAction(
      () =>
        webAxios.post(
          `/api/v1/retreat/${retreatSlug}/registration/${id}/memo`,
          { memo }
        ),
      { successMessage: "메모가 성공적으로 저장되었습니다." }
    );
  };

  /**
   * 행정간사 메모 수정
   */
  const handleUpdateAdminMemo = (memoId: number, memo: string) => {
    return executeAction(
      () =>
        webAxios.put(
          `/api/v1/retreat/${retreatSlug}/registration/${memoId}/memo`,
          { memo }
        ),
      { successMessage: "메모가 성공적으로 수정되었습니다." }
    );
  };

  /**
   * 행정간사 메모 삭제
   */
  const handleDeleteAdminMemo = (memoId: number) => {
    confirmDialog.show({
      title: "메모 삭제",
      description: "정말로 메모를 삭제하시겠습니까?",
      onConfirm: () =>
        executeAction(
          () =>
            webAxios.delete(
              `/api/v1/retreat/${retreatSlug}/registration/${memoId}/memo`
            ),
          { successMessage: "메모가 성공적으로 삭제되었습니다." }
        ),
    });
  };

  return {
    loading,
    handleRefund,
    handleNewFamilyRequest,
    handleMilitaryRequest,
    handleSendPaymentRequest,
    handleSaveScheduleMemo,
    handleSaveAdminMemo,
    handleUpdateAdminMemo,
    handleDeleteAdminMemo,
  };
}
