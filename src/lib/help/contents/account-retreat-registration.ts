import { PageHelpContent } from "../types";

/**
 * 재정간사 수양회 신청 조회 페이지 헬프 콘텐츠
 */
export const accountRetreatRegistrationHelp: PageHelpContent = {
  pageId: "account-retreat-registration",
  title: "재정간사 신청 조회 도움말",
  description:
    "재정간사가 수양회 신청자의 입금, 간사 배정, 취소, 환불 처리 상태를 확인하는 페이지입니다.",

  sections: [],

  columns: [
    {
      columnId: "type",
      title: "타입",
      description:
        "신청자의 참가 구분입니다. 새가족/군지체는 행정간사 승인 후 할인 금액과 입금 안내가 확정됩니다.",
    },
    {
      columnId: "amount",
      title: "금액",
      description:
        "신청 일정과 참가 타입을 기준으로 계산된 납부 금액입니다. 일정 변동이 생기면 전체 금액을 다시 받는 것이 아니라 차액분만 처리합니다.",
    },
    {
      columnId: "status",
      title: "입금 현황",
      description:
        "입금, 간사 배정, 취소, 환불 처리 상태입니다. 취소 처리 중 또는 환불 처리 중 상태는 라인업/인원관리 간사 확인이 필요할 수 있습니다.",
    },
    {
      columnId: "accountMemo",
      title: "재정간사 메모",
      description:
        "입금자명 불일치, 환불 계좌, 차액 처리, 라인업/인원관리 확인 필요 여부 등 재정 처리 메모를 기록합니다.",
    },
  ],

  badges: {
    paymentStatus: [
      {
        status: "NEW_COMER_REQUEST",
        title: "새가족 신청 요청",
        description:
          "새가족 할인 적용 요청 상태입니다. 행정간사 승인 후 할인 금액과 입금 안내가 확정됩니다.",
        action: "행정간사 승인 상태 확인",
      },
      {
        status: "SOLDIER_REQUEST",
        title: "군지체 신청 요청",
        description:
          "군지체 할인 적용 요청 상태입니다. 행정간사 승인 후 할인 금액과 입금 안내가 확정됩니다.",
        action: "행정간사 승인 상태 확인",
      },
      {
        status: "PENDING",
        title: "입금 확인 대기",
        description:
          "신청은 완료되었지만 아직 입금 확인이 되지 않은 상태입니다.",
        action: "입금 확인 완료 또는 간사 배정",
      },
      {
        status: "PAID",
        title: "입금 확인 완료",
        description:
          "입금이 확인되어 수양회 참석이 확정된 상태입니다. 일정 변동이 있으면 차액 처리 여부를 확인합니다.",
        action: "추가 재정 처리 필요 여부 확인",
      },
      {
        status: "CANCEL_ONGOING",
        title: "취소 처리 중",
        description:
          "신청 취소가 접수되어 처리 중인 상태입니다. 재정, 라인업, 인원관리 확인이 필요할 수 있습니다.",
        action: "관련 간사 처리 상태 확인",
      },
      {
        status: "CANCELED",
        title: "취소 완료",
        description:
          "신청 취소가 완료된 상태입니다. 더 이상 입금 처리 대상이 아닙니다.",
        action: "추가 처리 불필요",
      },
      {
        status: "REFUND_REQUEST",
        title: "환불 처리 대기",
        description: "신청자가 환불을 요청해 재정 처리가 필요한 상태입니다.",
        action: "실제 환불 후 환불 처리 완료",
      },
      {
        status: "REFUND_ONGOING",
        title: "환불 처리 중",
        description:
          "환불이 필요한 취소/변동 건이 처리 중인 상태입니다. 라인업/인원관리 확인이 필요할 수 있습니다.",
        action: "중복 환불 없이 처리 상태 확인",
      },
      {
        status: "REFUNDED",
        title: "환불 처리 완료",
        description:
          "환불이 완료되어 더 이상 입금 처리 대상이 아닌 상태입니다.",
        action: "추가 처리 불필요",
      },
    ],
  },
};
