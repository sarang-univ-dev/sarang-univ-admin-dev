import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  EventTypeMap,
  DateScheduleMap,
  FormattedRow,
} from "@/types/retreat-schedule";
import { EventTypeRow } from "./EventTypeRow";

interface ScheduleTableProps {
  dates: string[];
  eventTypeMap: EventTypeMap;
  row: FormattedRow;
  dateScheduleMap: DateScheduleMap;
  formatDate: (dateStr: string) => string;
}

/**
 * 모바일용 스케줄 테이블 (날짜별 × 이벤트별)
 */
export function ScheduleTable({
  dates,
  eventTypeMap,
  row,
  dateScheduleMap,
  formatDate,
}: ScheduleTableProps) {
  return (
    <div className="w-full overflow-x-auto">
      <Table className="min-w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="text-center whitespace-nowrap px-2 sm:px-4">
              일정
            </TableHead>
            {dates.map((date) => (
              <TableHead
                key={date}
                className="text-center whitespace-nowrap px-2 sm:px-4"
              >
                {formatDate(date)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.entries(eventTypeMap).map(([eventType, config]) => (
            <EventTypeRow
              key={eventType}
              eventType={eventType}
              config={config}
              dates={dates}
              row={row}
              dateScheduleMap={dateScheduleMap}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
