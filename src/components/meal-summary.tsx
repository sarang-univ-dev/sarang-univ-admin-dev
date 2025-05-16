import { SummaryTable } from "./SummaryTable";

export function MealSummary() {
  // 동적 데이터를 위한 예시 데이터
  const columns = [
    { id: "breakfast", header: "수점" },
    { id: "lunch", header: "수저" },
    { id: "dinner", header: "수숙" },
    { id: "thursday_morning", header: "목아" },
    { id: "thursday_lunch", header: "목점" },
    { id: "thursday_dinner", header: "목저" },
    { id: "friday_morning", header: "금아" },
    { id: "friday_lunch", header: "금점" },
    { id: "friday_dinner", header: "금저" },
    { id: "saturday_morning", header: "토아" },
    { id: "saturday_lunch", header: "토점" },
  ];

  const rows = [
    {
      id: "1",
      label: "1부",
      cells: {
        breakfast: "45명",
        lunch: "52명",
        dinner: "50명",
        thursday_morning: "48명",
        thursday_lunch: "47명",
        thursday_dinner: "46명",
        friday_morning: "44명",
        friday_lunch: "48명",
        friday_dinner: "47명",
        saturday_morning: "42명",
        saturday_lunch: "40명",
      },
    },
    {
      id: "2",
      label: "2부",
      cells: {
        breakfast: "38명",
        lunch: "42명",
        dinner: "40명",
        thursday_morning: "39명",
        thursday_lunch: "41명",
        thursday_dinner: "38명",
        friday_morning: "37명",
        friday_lunch: "40명",
        friday_dinner: "39명",
        saturday_morning: "35명",
        saturday_lunch: "33명",
      },
    },
    {
      id: "3",
      label: "3부",
      cells: {
        breakfast: "42명",
        lunch: "45명",
        dinner: "44명",
        thursday_morning: "43명",
        thursday_lunch: "42명",
        thursday_dinner: "41명",
        friday_morning: "40명",
        friday_lunch: "43명",
        friday_dinner: "42명",
        saturday_morning: "38명",
        saturday_lunch: "36명",
      },
    },
    {
      id: "4",
      label: "4부",
      cells: {
        breakfast: "35명",
        lunch: "38명",
        dinner: "37명",
        thursday_morning: "36명",
        thursday_lunch: "35명",
        thursday_dinner: "34명",
        friday_morning: "33명",
        friday_lunch: "36명",
        friday_dinner: "35명",
        saturday_morning: "31명",
        saturday_lunch: "29명",
      },
    },
    {
      id: "5",
      label: "5부",
      cells: {
        breakfast: "37명",
        lunch: "40명",
        dinner: "39명",
        thursday_morning: "38명",
        thursday_lunch: "37명",
        thursday_dinner: "36명",
        friday_morning: "35명",
        friday_lunch: "38명",
        friday_dinner: "37명",
        saturday_morning: "33명",
        saturday_lunch: "31명",
      },
    },
    {
      id: "6",
      label: "6부",
      cells: {
        breakfast: "30명",
        lunch: "33명",
        dinner: "32명",
        thursday_morning: "31명",
        thursday_lunch: "30명",
        thursday_dinner: "29명",
        friday_morning: "28명",
        friday_lunch: "31명",
        friday_dinner: "30명",
        saturday_morning: "26명",
        saturday_lunch: "24명",
      },
    },
    {
      id: "7",
      label: "7부",
      cells: {
        breakfast: "36명",
        lunch: "39명",
        dinner: "38명",
        thursday_morning: "37명",
        thursday_lunch: "36명",
        thursday_dinner: "35명",
        friday_morning: "34명",
        friday_lunch: "37명",
        friday_dinner: "36명",
        saturday_morning: "32명",
        saturday_lunch: "30명",
      },
    },
    {
      id: "8",
      label: "8부",
      cells: {
        breakfast: "25명",
        lunch: "28명",
        dinner: "27명",
        thursday_morning: "26명",
        thursday_lunch: "25명",
        thursday_dinner: "24명",
        friday_morning: "23명",
        friday_lunch: "26명",
        friday_dinner: "25명",
        saturday_morning: "21명",
        saturday_lunch: "19명",
      },
    },
    {
      id: "total",
      label: "합계",
      cells: {
        breakfast: <span className="font-semibold">288명</span>,
        lunch: <span className="font-semibold">317명</span>,
        dinner: <span className="font-semibold">307명</span>,
        thursday_morning: <span className="font-semibold">298명</span>,
        thursday_lunch: <span className="font-semibold">293명</span>,
        thursday_dinner: <span className="font-semibold">283명</span>,
        friday_morning: <span className="font-semibold">274명</span>,
        friday_lunch: <span className="font-semibold">299명</span>,
        friday_dinner: <span className="font-semibold">291명</span>,
        saturday_morning: <span className="font-semibold">258명</span>,
        saturday_lunch: <span className="font-semibold">242명</span>,
      },
    },
  ];

  return (
    <SummaryTable
      title="식수 인원 집계 표"
      description="부서별 식수 인원 현황"
      columns={columns}
      rows={rows}
    />
  );
}
