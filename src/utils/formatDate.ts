import {
  getKSTFullYear,
  getKSTMonth,
  getKSTDate,
  getKSTDay,
  getKSTHours,
  getKSTMinutes,
} from "@/lib/utils/date-utils";

export const formatDate = (dateInput: string | Date | null) => {
  if (!dateInput) return "";
  const days = ["주일", "월", "화", "수", "목", "금", "토"];
  // KST 기준으로 날짜/시간 포맷
  return `${getKSTFullYear(dateInput)}년 ${
    getKSTMonth(dateInput) + 1
  }월 ${getKSTDate(dateInput)}일 (${
    days[getKSTDay(dateInput)]
  }) ${getKSTHours(dateInput)}시 ${getKSTMinutes(dateInput)}분`;
};

export const formatSimpleDate = (dateString: string | null) => {
  if (!dateString) return "";
  const days = ["주", "월", "화", "수", "목", "금", "토"];
  // KST 기준으로 날짜 포맷
  return `${getKSTMonth(dateString) + 1}/${getKSTDate(dateString)}(${days[getKSTDay(dateString)]})`;
};
