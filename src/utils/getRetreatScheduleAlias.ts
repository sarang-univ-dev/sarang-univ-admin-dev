import { format } from "date-fns"; // date-fns 라이브러리 사용을 가정합니다.

export function getRegisterScheduleAlias(date: string, type: string): string {
  // 요일 축약어 설정 (수: 수요일, 목: 목요일 등)
  const dayAliasMap: { [key: string]: string } = {
    Mon: "월",
    Tue: "화",
    Wed: "수",
    Thu: "목",
    Fri: "금",
    Sat: "토",
    Sun: "일",
  };

  // 식사 및 숙박 타입 축약어 설정
  const typeAliasMap: { [key: string]: string } = {
    BREAKFAST: "아",
    LUNCH: "점",
    DINNER: "저",
    SLEEP: "숙",
  };

  // 날짜를 요일로 변환하여 첫 글자로 사용
  const dayOfWeek = format(new Date(date), "EEE"); // 'EEE' 포맷은 요일을 세 글자로 변환
  const dayAlias = dayAliasMap[dayOfWeek] || "";
  const typeAlias = typeAliasMap[type] || "";

  // 최종적으로 "요일+타입" 형식의 축약 문자열 반환
  return `${dayAlias}${typeAlias}`;
}
