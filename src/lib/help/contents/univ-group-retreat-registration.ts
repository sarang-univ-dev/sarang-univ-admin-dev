import { PageHelpContent } from "../types";

/**
 * 부서 수양회 신청 조회 페이지 헬프 콘텐츠
 *
 * @description
 * 행정간사가 부서 수양회 신청 현황을 조회하고 관리하는 페이지입니다.
 *
 * 주요 기능:
 * - 부서원 수양회 신청 목록 조회
 * - 새가족/군지체 신청 승인/거절
 * - 입금 요청 메시지 전송
 * - 일정 변동 요청 메모 관리
 * - 행정간사 메모 관리
 * - 신청자 정보 수정
 * - 신청 삭제 (입금 전 상태만)
 * - 엑셀 다운로드
 */
export const univGroupRetreatRegistrationHelp: PageHelpContent = {
  pageId: "univ-group-retreat-registration",
  title: "부서 수양회 신청 조회 도움말",
  description:
    "부서 수양회 신청 현황을 조회하고 관리하는 페이지입니다. 행정간사는 신청 목록 확인, 새가족/군지체 승인, 정보 수정, 메모 관리 등을 수행할 수 있습니다.",

  sections: [
    {
      id: "overview",
      title: "페이지 개요",
      description:
        "부서원들의 수양회 신청 현황, 입금 상태, 셔틀버스 신청 여부 등을 한눈에 확인하고 관리할 수 있습니다.",
      items: [
        {
          label: "입금 현황 요약",
          description:
            "페이지 상단에서 전체 입금 현황을 한눈에 확인할 수 있습니다.",
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
          description:
            "현재 필터링된 데이터를 엑셀 파일로 다운로드할 수 있습니다. 파일명은 '수양회신청_[부서명]_[날짜].xlsx' 형식입니다.",
        },
        {
          label: "컬럼 표시/숨기기",
          description: "컬럼 설정에서 표시할 컬럼을 선택할 수 있습니다.",
        },
        {
          label: "신청자 정보 수정",
          description:
            "상세 패널에서 신청자의 기본 정보(이름, 전화번호, 성별, 학년, 리더명)를 수정할 수 있습니다.",
        },
        {
          label: "신청 삭제",
          description:
            "입금 전 상태(입금 대기, 새가족 요청, 군지체 요청)의 신청만 삭제할 수 있습니다.",
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
            "새가족이나 군지체 요청이 있다면 승인 또는 거절 처리할 수 있습니다. 승인 시 할인된 금액으로 입금 안내 문자가 전송됩니다.",
        },
        {
          label: "환불 요청 처리",
          description:
            "환불 요청이 있다면 실제 환불 후 '환불 완료' 버튼을 클릭합니다.",
        },
        {
          label: "입금 요청 메시지 전송",
          description:
            "입금 대기 상태의 신청자에게 입금 안내 문자를 다시 전송할 수 있습니다.",
        },
      ],
    },
    {
      id: "schedule-change-memo",
      title: "일정 변동 요청 메모",
      description:
        "입금 완료 후 신청자의 일정 변경이 필요할 때 사용하는 메모 기능입니다.",
      items: [
        {
          label: "메모 작성 조건",
          description:
            "입금 완료(PAID) 상태의 신청에만 일정 변동 요청 메모를 작성할 수 있습니다.",
        },
        {
          label: "처리 대기 중 제한",
          description:
            "처리되지 않은 메모가 있으면 새로운 메모를 추가할 수 없습니다. 기존 메모가 먼저 처리되어야 합니다.",
        },
        {
          label: "순차적 처리",
          description:
            "메모가 생성되면 재정 간사 → 라인업 간사 → 인원관리 간사 순서로 검토됩니다.",
        },
        {
          label: "메모 수정/삭제",
          description:
            "모든 검토자가 처리하기 전에만 메모를 수정하거나 삭제할 수 있습니다.",
        },
        {
          label: "처리 완료 후",
          description: "재정 간사가 처리를 완료하면 메모가 자동으로 사라집니다.",
        },
      ],
    },
    {
      id: "admin-memo",
      title: "행정간사 메모",
      description: "신청자에 대한 행정간사 전용 메모를 관리합니다.",
      items: [
        {
          label: "메모 작성",
          description:
            "신청자별로 행정간사 전용 메모를 작성할 수 있습니다. 부서 리더는 이 메모를 볼 수 없습니다.",
        },
        {
          label: "메모 수정/삭제",
          description: "본인이 작성한 메모만 수정하거나 삭제할 수 있습니다.",
        },
      ],
    },
    {
      id: "registration-management",
      title: "신청 관리",
      description: "신청자 정보 수정 및 삭제 기능입니다.",
      items: [
        {
          label: "정보 수정 가능 항목",
          description:
            "이름, 전화번호, 성별, 학년(같은 부서 내), 현재 리더명을 수정할 수 있습니다. 금액은 변경되지 않습니다.",
        },
        {
          label: "학년 변경 제한",
          description:
            "같은 부서 내의 학년으로만 변경할 수 있습니다. 다른 부서의 학년으로는 변경할 수 없습니다.",
        },
        {
          label: "삭제 가능 상태",
          description:
            "입금 대기, 새가족 요청, 군지체 요청 상태의 신청만 삭제할 수 있습니다.",
        },
        {
          label: "삭제 불가 상태",
          description:
            "입금 완료, 환불 요청, 환불 완료 상태의 신청은 삭제할 수 없습니다. 환불 처리를 먼저 진행해주세요.",
        },
        {
          label: "삭제 시 주의사항",
          description:
            "삭제된 신청은 복구할 수 없습니다. 관련된 모든 데이터(일정, 메모 등)가 함께 삭제됩니다.",
        },
      ],
    },
  ],

  columns: [
    {
      columnId: "name",
      title: "이름",
      description: "신청자의 이름입니다.",
      tips: [
        "통합 검색에서 이름으로 검색할 수 있습니다.",
        "상세 패널에서 이름을 수정할 수 있습니다.",
      ],
    },
    {
      columnId: "gender",
      title: "성별",
      description: "신청자의 성별입니다.",
      tips: [
        "필터링으로 남성/여성만 조회할 수 있습니다.",
        "상세 패널에서 성별을 수정할 수 있습니다.",
      ],
    },
    {
      columnId: "grade",
      title: "학년",
      description: "신청자의 학년입니다.",
      tips: [
        "숫자 순서로 정렬됩니다 (1학년, 2학년, ...)",
        "같은 부서 내에서만 학년을 변경할 수 있습니다.",
      ],
    },
    {
      columnId: "phone",
      title: "전화번호",
      description: "신청자의 전화번호입니다.",
      tips: [
        "클릭하면 전화를 걸 수 있습니다.",
        "통합 검색에서 전화번호로 검색할 수 있습니다.",
        "형식: 010-XXXX-XXXX",
      ],
    },
    {
      columnId: "currentLeaderName",
      title: "부서 리더명",
      description: "신청자의 현재 부서 리더 이름입니다.",
      tips: [
        "통합 검색에서 리더명으로 검색할 수 있습니다.",
        "상세 패널에서 리더명을 수정할 수 있습니다.",
      ],
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
      columnId: "type",
      title: "타입",
      description: "신청자의 수양회 참가 타입입니다.",
      tips: [
        "새가족(NEW_COMER): 할인된 금액 적용",
        "군지체(SOLDIER): 할인된 금액 적용",
        "일반 지체: 기본 금액 적용",
      ],
    },
    {
      columnId: "amount",
      title: "금액",
      description: "수양회 참가비입니다.",
      tips: [
        "일정, 타입(새가족/군지체), 학년에 따라 금액이 결정됩니다.",
        "신청자 정보 수정 시에도 금액은 변경되지 않습니다.",
      ],
    },
    {
      columnId: "status",
      title: "입금 현황",
      description: "신청자의 결제 상태를 나타냅니다.",
      tips: [
        "각 상태에 따라 처리 버튼이 다르게 표시됩니다.",
        "버튼 클릭으로 상태를 변경할 수 있습니다.",
        "입금 전 상태에서만 신청 삭제가 가능합니다.",
      ],
    },
    {
      columnId: "shuttleBus",
      title: "셔틀버스 신청 여부",
      description: "셔틀버스 탑승 신청 여부입니다.",
      tips: ["셔틀버스 관리 페이지에서 상세 탑승 정보를 확인할 수 있습니다."],
    },
    {
      columnId: "scheduleMemo",
      title: "일정 변동 요청 메모",
      description: "일정 변경 요청 시 작성하는 메모입니다.",
      tips: [
        "입금 완료 상태에서만 작성 가능합니다.",
        "처리되지 않은 메모가 있으면 추가 불가합니다.",
        "재정 간사 처리 후 메모가 사라집니다.",
      ],
    },
    {
      columnId: "adminMemo",
      title: "행정간사 메모",
      description: "행정간사가 작성한 메모입니다.",
      tips: [
        "메모 버튼을 클릭하여 메모를 추가/수정/삭제할 수 있습니다.",
        "본인이 작성한 메모만 수정/삭제할 수 있습니다.",
        "부서 리더는 이 메모를 볼 수 없습니다.",
      ],
    },
    {
      columnId: "createdAt",
      title: "신청시각",
      description: "수양회 신청이 등록된 시각입니다.",
      tips: ["최신순/오래된순으로 정렬할 수 있습니다."],
    },
    {
      columnId: "confirmedBy",
      title: "입금 확인자",
      description: "입금을 확인 처리한 담당자입니다.",
      tips: ["입금 완료 상태에서만 표시됩니다."],
    },
    {
      columnId: "paymentConfirmedAt",
      title: "입금 확인 시각",
      description: "입금이 확인 처리된 시각입니다.",
      tips: ["입금 완료 상태에서만 표시됩니다."],
    },
    {
      columnId: "qrCode",
      title: "QR 코드",
      description: "수양회 참석 확인용 QR 코드입니다.",
      tips: [
        "입금 완료 후 생성됩니다.",
        "QR 코드를 다운로드할 수 있습니다.",
      ],
    },
  ],

  badges: {
    paymentStatus: [
      {
        status: "NEW_COMER_REQUEST",
        title: "새가족 요청",
        description:
          "새가족 등록 요청 상태입니다. 승인하면 새가족 가격이 적용됩니다.",
        action: "승인/거절 버튼으로 처리",
        preview: {
          component: "StatusBadge",
          props: { status: "NEW_COMER_REQUEST" },
        },
      },
      {
        status: "SOLDIER_REQUEST",
        title: "군지체 요청",
        description:
          "군지체 등록 요청 상태입니다. 승인하면 군지체 가격이 적용됩니다.",
        action: "승인/거절 버튼으로 처리",
        preview: {
          component: "StatusBadge",
          props: { status: "SOLDIER_REQUEST" },
        },
      },
      {
        status: "PENDING",
        title: "입금 대기",
        description: "신청은 완료되었으나 아직 입금되지 않은 상태입니다.",
        action: "입금 확인 후 '입금 완료' 처리",
        preview: {
          component: "StatusBadge",
          props: { status: "PENDING" },
        },
      },
      {
        status: "PAID",
        title: "입금 완료",
        description: "입금이 확인되어 수양회 참석이 확정된 상태입니다.",
        action: "환불 요청 시 '환불 요청' 처리",
        preview: {
          component: "StatusBadge",
          props: { status: "PAID" },
        },
      },
      {
        status: "REFUND_REQUEST",
        title: "환불 요청",
        description: "신청자가 환불을 요청한 상태입니다.",
        action: "실제 환불 후 '환불 완료' 처리",
        preview: {
          component: "StatusBadge",
          props: { status: "REFUND_REQUEST" },
        },
      },
      {
        status: "REFUNDED",
        title: "환불 완료",
        description: "환불이 완료된 상태입니다. 수양회에 참석하지 않습니다.",
        preview: {
          component: "StatusBadge",
          props: { status: "REFUNDED" },
        },
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
        description:
          "일부 수양회 일정에만 참석합니다. 상세보기에서 구체적인 일정을 확인하세요.",
      },
    ],
    shuttleBus: [
      {
        status: "registered",
        title: "신청함",
        description: "셔틀버스 탑승을 신청했습니다.",
        preview: {
          component: "ShuttleBusStatusBadge",
          props: { hasRegistered: true },
        },
      },
      {
        status: "notRegistered",
        title: "신청 안함",
        description: "셔틀버스를 이용하지 않습니다. (자차 이용 등)",
        preview: {
          component: "ShuttleBusStatusBadge",
          props: { hasRegistered: false },
        },
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
        "부서 전체 신청자 데이터가 엑셀로 저장됩니다. 파일명은 '수양회신청_[부서명]_[날짜].xlsx' 형식입니다.",
    },
    {
      question: "신청을 삭제할 수 있나요?",
      answer:
        "입금 대기, 새가족 요청, 군지체 요청 상태의 신청만 삭제할 수 있습니다. 입금 완료 후에는 삭제가 불가능하며, 환불 처리를 진행해야 합니다.",
    },
    {
      question: "신청자 정보를 수정할 수 있나요?",
      answer:
        "네, 상세 패널에서 이름, 전화번호, 성별, 학년, 리더명을 수정할 수 있습니다. 단, 학년은 같은 부서 내에서만 변경 가능하며, 금액은 변경되지 않습니다.",
    },
    {
      question: "다른 부서의 학년으로 변경할 수 있나요?",
      answer:
        "아니요, 같은 부서 내의 학년으로만 변경할 수 있습니다. 다른 부서로 이동이 필요한 경우 해당 부서의 행정간사에게 문의하세요.",
    },
    {
      question: "일정 변동 요청 메모는 언제 작성할 수 있나요?",
      answer:
        "입금 완료(PAID) 상태의 신청에만 일정 변동 요청 메모를 작성할 수 있습니다. 또한, 처리되지 않은 메모가 있으면 새 메모를 추가할 수 없습니다.",
    },
    {
      question: "일정 변동 요청 메모는 어떻게 처리되나요?",
      answer:
        "메모가 생성되면 재정 간사 → 라인업 간사 → 인원관리 간사 순서로 검토됩니다. 재정 간사가 처리를 완료하면 메모가 자동으로 사라집니다.",
    },
    {
      question: "행정간사 메모는 다른 사람이 볼 수 있나요?",
      answer:
        "행정간사 메모는 행정간사만 볼 수 있으며, 부서 리더는 이 메모를 볼 수 없습니다. 또한, 본인이 작성한 메모만 수정하거나 삭제할 수 있습니다.",
    },
    {
      question: "새가족/군지체 요청을 승인하면 어떻게 되나요?",
      answer:
        "승인 시 해당 타입에 맞는 할인된 금액이 적용되고, 신청자에게 입금 안내 문자가 자동 전송됩니다. 거절 시에는 일반 지체로 처리되며 기본 금액으로 입금 안내 문자가 전송됩니다.",
    },
    {
      question: "입금 요청 메시지를 다시 보낼 수 있나요?",
      answer:
        "네, 입금 대기 상태의 신청자에게 입금 안내 문자를 다시 전송할 수 있습니다.",
    },
  ],
};
