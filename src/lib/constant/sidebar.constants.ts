// TODO: 삭제 예정 - 동적 메뉴로 대체됨
// 새로운 시스템에서는 서버가 사용자의 역할에 따라 메뉴를 동적으로 생성합니다.
// 정적 메뉴 대신 GET /api/admin/retreats 엔드포인트에서 메뉴를 가져옵니다.
export const STATIC_SIDEBAR_ITEMS = [
  { label: "payment", text: "신청 조회", path: "confirm-payment" },
  { label: "staff", text: "부서 정보 조회", path: "univ-group-staff-retreat" },
  {
    label: "schedule-change-request",
    text: "일정 변동 요청",
    path: "schedule-change-request",
  },
  {
    label: "schedule-change-history",
    text: "일정 변동 이력",
    path: "schedule-change-history",
  },
];
