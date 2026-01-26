import { PageHelpContent } from "../types";

/**
 * 부서 수양회 신청 조회 페이지 헬프 콘텐츠
 */
export const univGroupRetreatRegistrationHelp: PageHelpContent = {
  pageId: "univ-group-retreat-registration",
  title: "부서 수양회 신청 조회 도움말",
  description: "부서 수양회 신청 현황을 조회하고 관리하는 페이지입니다.",

  sections: [
    {
      id: "overview",
      title: "페이지 개요",
      description:
        "부서원들의 수양회 신청 현황, 입금 상태, 셔틀버스 신청 여부 등을 한눈에 확인하고 관리할 수 있습니다.",
      items: [
        {
          label: "입금 현황 요약",
          description: "페이지 상단에서 전체 입금 현황을 한눈에 확인할 수 있습니다.",
        },
        {
          label: "스케줄별 참석 현황",
          description: "각 일정별 참석 인원을 확인할 수 있습니다.",
        },
        {
          label: "신청자 목록 테이블",
          description: "신청자별 상세 정보를 테이블 형태로 조회합니다.",
        },
      ],
    },
    {
      id: "features",
      title: "주요 기능",
      description: "테이블에서 사용할 수 있는 주요 기능들입니다.",
      items: [
        {
          label: "정렬",
          description:
            "컬럼 헤더를 클릭하여 오름차순/내림차순 정렬이 가능합니다. 여러 컬럼을 동시에 정렬할 수 있습니다.",
        },
        {
          label: "필터",
          description:
            "각 컬럼의 필터 아이콘을 클릭하여 원하는 값만 필터링할 수 있습니다.",
        },
        {
          label: "통합 검색",
          description:
            "검색창에서 이름, 학년, 전화번호, 리더명 등으로 검색할 수 있습니다.",
        },
        {
          label: "엑셀 다운로드",
          description: "현재 필터링된 데이터를 엑셀 파일로 다운로드할 수 있습니다.",
        },
        {
          label: "컬럼 표시/숨기기",
          description: "컬럼 설정에서 표시할 컬럼을 선택할 수 있습니다.",
        },
      ],
    },
    {
      id: "payment-workflow",
      title: "입금 처리 워크플로우",
      description: "신청자의 입금 상태에 따른 처리 방법입니다.",
      items: [
        {
          label: "입금 대기 -> 입금 완료",
          description:
            "신청자가 입금했다면 '입금 완료' 버튼을 클릭하여 상태를 변경합니다.",
        },
        {
          label: "새가족/군지체 요청 처리",
          description:
            "새가족이나 군지체 요청이 있다면 승인 또는 거절 처리할 수 있습니다.",
        },
        {
          label: "환불 요청 처리",
          description:
            "환불 요청이 있다면 실제 환불 후 '환불 완료' 버튼을 클릭합니다.",
        },
      ],
    },
  ],

  columns: [
    {
      columnId: "gender",
      title: "성별",
      description: "신청자의 성별입니다.",
      tips: ["필터링으로 남성/여성만 조회할 수 있습니다."],
    },
    {
      columnId: "grade",
      title: "학년",
      description: "신청자의 학년입니다.",
      tips: ["숫자 순서로 정렬됩니다 (1학년, 2학년, ...)"],
    },
    {
      columnId: "attendance",
      title: "참석 현황",
      description: "수양회 일정 전체 참석 여부를 나타냅니다.",
      tips: [
        "전참: 모든 일정에 참석",
        "부분참: 일부 일정에만 참석",
        "상세보기에서 구체적인 참석 일정을 확인할 수 있습니다.",
      ],
    },
    {
      columnId: "status",
      title: "입금 현황",
      description: "신청자의 결제 상태를 나타냅니다.",
      tips: [
        "각 상태에 따라 처리 버튼이 다르게 표시됩니다.",
        "버튼 클릭으로 상태를 변경할 수 있습니다.",
      ],
    },
    {
      columnId: "shuttleBus",
      title: "셔틀버스 신청 여부",
      description: "셔틀버스 탑승 신청 여부입니다.",
      tips: ["셔틀버스 관리 페이지에서 상세 탑승 정보를 확인할 수 있습니다."],
    },
    {
      columnId: "adminMemo",
      title: "행정간사 메모",
      description: "행정간사가 작성한 메모입니다.",
      tips: [
        "메모 버튼을 클릭하여 메모를 추가/수정/삭제할 수 있습니다.",
        "부서 리더는 이 메모를 볼 수 없습니다.",
      ],
    },
  ],

  badges: {
    paymentStatus: [
      {
        status: "NEW_COMER_REQUEST",
        title: "새가족 요청",
        description: "새가족 등록 요청 상태입니다. 승인하면 새가족 가격이 적용됩니다.",
        action: "승인/거절 버튼으로 처리",
      },
      {
        status: "SOLDIER_REQUEST",
        title: "군지체 요청",
        description: "군지체 등록 요청 상태입니다. 승인하면 군지체 가격이 적용됩니다.",
        action: "승인/거절 버튼으로 처리",
      },
      {
        status: "PENDING",
        title: "입금 대기",
        description: "신청은 완료되었으나 아직 입금되지 않은 상태입니다.",
        action: "입금 확인 후 '입금 완료' 처리",
      },
      {
        status: "PAID",
        title: "입금 완료",
        description: "입금이 확인되어 수양회 참석이 확정된 상태입니다.",
        action: "환불 요청 시 '환불 요청' 처리",
      },
      {
        status: "REFUND_REQUEST",
        title: "환불 요청",
        description: "신청자가 환불을 요청한 상태입니다.",
        action: "실제 환불 후 '환불 완료' 처리",
      },
      {
        status: "REFUNDED",
        title: "환불 완료",
        description: "환불이 완료된 상태입니다. 수양회에 참석하지 않습니다.",
      },
    ],
    attendance: [
      {
        status: "full",
        title: "전참",
        description: "모든 수양회 일정에 참석합니다.",
      },
      {
        status: "partial",
        title: "부분참",
        description: "일부 수양회 일정에만 참석합니다. 상세보기에서 구체적인 일정을 확인하세요.",
      },
    ],
    shuttleBus: [
      {
        status: "registered",
        title: "신청함",
        description: "셔틀버스 탑승을 신청했습니다.",
      },
      {
        status: "notRegistered",
        title: "신청 안함",
        description: "셔틀버스를 이용하지 않습니다. (자차 이용 등)",
      },
    ],
  },

  faqs: [
    {
      question: "여러 컬럼으로 동시에 정렬하려면 어떻게 하나요?",
      answer:
        "컬럼 헤더를 순서대로 클릭하면 됩니다. 예를 들어, 성별로 먼저 정렬한 뒤 학년을 클릭하면 성별 내에서 학년순으로 정렬됩니다. 정렬 해제하려면 같은 컬럼을 세 번 클릭하세요.",
    },
    {
      question: "필터를 해제하려면 어떻게 하나요?",
      answer:
        "필터 드롭다운에서 '전체 선택'을 클릭하거나, 툴바의 '필터 초기화' 버튼을 클릭하면 됩니다.",
    },
    {
      question: "데이터가 실시간으로 업데이트 되나요?",
      answer:
        "네, 다른 사용자가 변경한 내용도 자동으로 반영됩니다. 수동으로 새로고침할 필요가 없습니다.",
    },
    {
      question: "엑셀에는 어떤 데이터가 포함되나요?",
      answer:
        "현재 필터링/정렬된 상태의 데이터가 그대로 엑셀로 저장됩니다. 모든 데이터를 받으려면 필터를 해제하세요.",
    },
  ],
};
