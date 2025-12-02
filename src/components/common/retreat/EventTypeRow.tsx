import { TableCell, TableRow } from "@/components/ui/table";
import {
  EventTypeConfig,
  DateScheduleMap,
  FormattedRow,
} from "@/types/retreat-schedule";

interface EventTypeRowProps {
  eventType: string;
  config: EventTypeConfig;
  dates: string[];
  row: FormattedRow;
  dateScheduleMap: DateScheduleMap;
}

/**
 * 이벤트 타입별 행 (아침, 점심, 저녁, 숙박)
 */
export function EventTypeRow({
  eventType,
  config,
  dates,
  row,
  dateScheduleMap,
}: EventTypeRowProps) {
  const Icon = config.icon;

  return (
    <TableRow key={eventType}>
      <TableCell className="flex items-center justify-center whitespace-nowrap px-2 sm:px-4">
        <Icon className="mr-2 h-4 w-4" />
        {config.label}
      </TableCell>
      {dates.map((date) => {
        // 해당 날짜의 해당 이벤트 타입 스케줄 찾기
        const schedule = dateScheduleMap.get(date)?.get(eventType);

        // schedule이 없으면 일정이 아예 없는 것 → "-" 표시
        if (!schedule) {
          return (
            <TableCell
              key={`${eventType}-${date}`}
              className="text-center px-2 sm:px-4 py-2"
            >
              <span className="text-gray-300">-</span>
            </TableCell>
          );
        }

        // schedule이 있으면 schedule.key로 셀 값 가져오기
        const cellValue = row.cells[schedule.key];

        return (
          <TableCell
            key={`${eventType}-${date}`}
            className="text-center px-2 sm:px-4 py-2"
          >
            {cellValue || <span className="text-gray-900">0명</span>}
          </TableCell>
        );
      })}
    </TableRow>
  );
}
