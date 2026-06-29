import type { TRetreatShuttleBus } from "@/types";
import { RetreatShuttleBusDirection } from "@/types";
import {
  getKSTDate,
  getKSTDay,
  getKSTHours,
  getKSTMinutes,
  getKSTMonth,
} from "@/lib/utils/date-utils";

function formatShuttleBusDateTime(dateInput: string | Date) {
  const days = ["주", "월", "화", "수", "목", "금", "토"];
  const hours = getKSTHours(dateInput).toString().padStart(2, "0");
  const minutes = getKSTMinutes(dateInput).toString().padStart(2, "0");

  return `${getKSTMonth(dateInput) + 1}/${getKSTDate(dateInput)}(${days[getKSTDay(dateInput)]}) ${hours}:${minutes}`;
}

export function getShuttleBusImportColumnLabel(bus: TRetreatShuttleBus) {
  const direction =
    bus.direction === RetreatShuttleBusDirection.FROM_CHURCH_TO_RETREAT
      ? "입소"
      : "귀가";
  const date = bus.departureTime ? formatShuttleBusDateTime(bus.departureTime) : "";

  return [date, direction].filter(Boolean).join(" ");
}
