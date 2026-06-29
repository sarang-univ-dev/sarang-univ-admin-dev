import * as XLSX from "xlsx-js-style";

import { RetreatShuttleBusDirection, type TRetreatShuttleBus } from "@/types";

import { getShuttleBusImportColumnLabel } from "./labels";

const SHEET_NAME = "셔틀버스 신청";
const FIXED_HEADERS = ["부서", "성별", "학년", "이름", "전화번호"];
const HEADER_FILL = "D1D5DB";
const BUS_HEADER_FILL = "BFDBFE";
const SAMPLE_FILL = "F8FAFC";
const THIN = { style: "thin", color: { rgb: "B0B0B0" } } as const;
const BORDER = { top: THIN, bottom: THIN, left: THIN, right: THIN };
const CENTER = { horizontal: "center", vertical: "center" } as const;

function sortByDepartureTime(a: TRetreatShuttleBus, b: TRetreatShuttleBus) {
  return (
    new Date(a.departureTime ?? 0).getTime() -
    new Date(b.departureTime ?? 0).getTime()
  );
}

export function buildShuttleBusRegistrationTemplateWorkbook(
  schedules: TRetreatShuttleBus[]
): XLSX.WorkBook {
  const orderedSchedules = [
    ...schedules.filter(
      bus => bus.direction === RetreatShuttleBusDirection.FROM_CHURCH_TO_RETREAT
    ).sort(sortByDepartureTime),
    ...schedules.filter(
      bus => bus.direction === RetreatShuttleBusDirection.FROM_RETREAT_TO_CHURCH
    ).sort(sortByDepartureTime),
  ];
  const busHeaders = orderedSchedules.map(getShuttleBusImportColumnLabel);
  const header = [...FIXED_HEADERS, ...busHeaders];
  const sample = [
    "2부",
    "남",
    "1",
    "김바울",
    "010-0000-0001",
    ...orderedSchedules.map((_, index) => (index === 0 ? "1" : "")),
  ];

  const ws = XLSX.utils.aoa_to_sheet([header, sample]);

  const setStyle = (r: number, c: number, style: object) => {
    const addr = XLSX.utils.encode_cell({ r, c });
    if (!ws[addr]) ws[addr] = { t: "s", v: "" };
    ws[addr].s = style;
  };

  for (let c = 0; c < header.length; c++) {
    setStyle(0, c, {
      fill: {
        fgColor: {
          rgb: c < FIXED_HEADERS.length ? HEADER_FILL : BUS_HEADER_FILL,
        },
      },
      font: { bold: true },
      alignment: CENTER,
      border: BORDER,
    });
    setStyle(1, c, {
      fill: { fgColor: { rgb: SAMPLE_FILL } },
      alignment: CENTER,
      border: BORDER,
    });
  }

  ws["!cols"] = [
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 10 },
    { wch: 15 },
    ...busHeaders.map(() => ({ wch: 24 })),
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, SHEET_NAME);
  return wb;
}

export function downloadShuttleBusRegistrationTemplate(
  schedules: TRetreatShuttleBus[]
) {
  const wb = buildShuttleBusRegistrationTemplateWorkbook(schedules);
  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `셔틀버스_신청_템플릿_${stamp}.xlsx`);
}
