import { SummaryTable } from "./summary-table"

export function PaymentSummary() {
  // 동적 데이터를 위한 예시 데이터
  const columns = [
    { id: "waiting", header: "입금 대기" },
    { id: "confirmed", header: "입금 완료" },
    { id: "new_family_request", header: "새가족 신청 요청" },
    { id: "military_request", header: "군지체 신청 요청" },
    { id: "refund_requested", header: "환불 요청" },
    { id: "refund_completed", header: "환불 완료" },
  ]

  const rows = [
    {
      id: "1",
      label: "1부",
      cells: {
        waiting: "13명",
        confirmed: "98명",
        new_family_request: "3명",
        military_request: "1명",
        refund_requested: "2명",
        refund_completed: "4명",
      },
    },
    {
      id: "2",
      label: "2부",
      cells: {
        waiting: "8명",
        confirmed: "75명",
        new_family_request: "2명",
        military_request: "0명",
        refund_requested: "1명",
        refund_completed: "2명",
      },
    },
    {
      id: "3",
      label: "3부",
      cells: {
        waiting: "10명",
        confirmed: "82명",
        new_family_request: "4명",
        military_request: "2명",
        refund_requested: "3명",
        refund_completed: "1명",
      },
    },
    {
      id: "4",
      label: "4부",
      cells: {
        waiting: "7명",
        confirmed: "65명",
        new_family_request: "2명",
        military_request: "1명",
        refund_requested: "1명",
        refund_completed: "0명",
      },
    },
    {
      id: "5",
      label: "5부",
      cells: {
        waiting: "9명",
        confirmed: "70명",
        new_family_request: "3명",
        military_request: "0명",
        refund_requested: "2명",
        refund_completed: "1명",
      },
    },
    {
      id: "6",
      label: "6부",
      cells: {
        waiting: "6명",
        confirmed: "58명",
        new_family_request: "1명",
        military_request: "0명",
        refund_requested: "0명",
        refund_completed: "1명",
      },
    },
    {
      id: "7",
      label: "7부",
      cells: {
        waiting: "11명",
        confirmed: "72명",
        new_family_request: "2명",
        military_request: "1명",
        refund_requested: "2명",
        refund_completed: "0명",
      },
    },
    {
      id: "8",
      label: "8부",
      cells: {
        waiting: "5명",
        confirmed: "45명",
        new_family_request: "1명",
        military_request: "0명",
        refund_requested: "1명",
        refund_completed: "0명",
      },
    },
    {
      id: "total",
      label: "합계",
      cells: {
        waiting: <span className="font-semibold">69명</span>,
        confirmed: <span className="font-semibold">565명</span>,
        new_family_request: <span className="font-semibold">18명</span>,
        military_request: <span className="font-semibold">5명</span>,
        refund_requested: <span className="font-semibold">12명</span>,
        refund_completed: <span className="font-semibold">9명</span>,
      },
    },
  ]

  return <SummaryTable title="입금완료 집계 표" description="부서별 입금 및 환불 현황" columns={columns} rows={rows} />
}
