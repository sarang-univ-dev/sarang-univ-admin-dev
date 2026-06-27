import * as XLSX from "xlsx-js-style";

import { TRetreatRegistrationSchedule } from "@/types";
import { generateScheduleColumns } from "@/utils/retreat-utils";

import { ChangeWarning, PersonRef, ScheduleMismatchRow } from "./types";

const SCHEDULE_EXPORT_COLORS: Record<string, string> = {
  rose: "FF99CC",
  amber: "FFCB99",
  teal: "CCFFCC",
  indigo: "CCCCFF",
};

const THIN_BORDER = { style: "thin", color: { rgb: "D1D5DB" } } as const;
const CELL_BORDER = {
  top: THIN_BORDER,
  bottom: THIN_BORDER,
  left: THIN_BORDER,
  right: THIN_BORDER,
};
const CENTER_ALIGN = { horizontal: "center", vertical: "center" } as const;

export function downloadPersonListReport(
  people: PersonRef[],
  fileLabel: string
) {
  const aoa: (string | number)[][] = [
    ["부서", "학년", "이름", "연락처"],
    ...people.map(person => [
      `${person.univGroupNumber}부`,
      `${person.gradeNumber}학년`,
      person.name,
      person.phone,
    ]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const lastCol = 3;

  for (let c = 0; c <= lastCol; c++) {
    const addr = XLSX.utils.encode_cell({ r: 0, c });
    ws[addr].s = {
      fill: { fgColor: { rgb: "E5E7EB" } },
      font: { bold: true },
      alignment: CENTER_ALIGN,
      border: CELL_BORDER,
    };
  }

  for (let r = 1; r <= people.length; r++) {
    for (let c = 0; c <= lastCol; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      ws[addr].s = {
        alignment: CENTER_ALIGN,
        border: CELL_BORDER,
      };
    }
  }

  ws["!cols"] = [{ wch: 7 }, { wch: 8 }, { wch: 12 }, { wch: 16 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "검증 결과");
  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `GBS_라인업_${fileLabel}_${stamp}.xlsx`);
}

export function downloadChangeWarningReport(warnings: ChangeWarning[]) {
  const aoa: (string | number)[][] = [
    ["부서", "학년", "이름", "변경"],
    ...warnings.map(warning => [
      `${warning.univGroupNumber}부`,
      `${warning.gradeNumber}학년`,
      warning.name,
      warning.changes.join(", "),
    ]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const lastCol = 3;

  for (let c = 0; c <= lastCol; c++) {
    const addr = XLSX.utils.encode_cell({ r: 0, c });
    ws[addr].s = {
      fill: { fgColor: { rgb: "E5E7EB" } },
      font: { bold: true },
      alignment: CENTER_ALIGN,
      border: CELL_BORDER,
    };
  }

  for (let r = 1; r <= warnings.length; r++) {
    for (let c = 0; c <= lastCol; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      ws[addr].s = {
        alignment: CENTER_ALIGN,
        border: CELL_BORDER,
      };
    }
  }

  ws["!cols"] = [{ wch: 7 }, { wch: 8 }, { wch: 12 }, { wch: 40 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "변경 내역");
  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `GBS_라인업_변경내역_${stamp}.xlsx`);
}

export function downloadScheduleMismatchReport(
  rows: ScheduleMismatchRow[],
  schedules: TRetreatRegistrationSchedule[]
) {
  const cols = generateScheduleColumns(schedules);
  const aoa: (string | number)[][] = [
    ["부서", "학년", "이름", "구분", ...cols.map(col => col.label)],
  ];

  rows.forEach(row => {
    const sheetSet = new Set(row.sheetScheduleIds);
    const dbSet = new Set(row.dbScheduleIds);
    const base = [
      `${row.univGroupNumber}부`,
      `${row.gradeNumber}학년`,
      row.name,
    ];

    aoa.push([
      ...base,
      "시트",
      ...cols.map(col => (sheetSet.has(col.id) ? "1" : "")),
    ]);
    aoa.push([
      ...base,
      "명단",
      ...cols.map(col => (dbSet.has(col.id) ? "1" : "")),
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const lastCol = 3 + cols.length;

  for (let c = 0; c <= lastCol; c++) {
    const addr = XLSX.utils.encode_cell({ r: 0, c });
    ws[addr].s = {
      fill: { fgColor: { rgb: "E5E7EB" } },
      font: { bold: true },
      alignment: CENTER_ALIGN,
      border: CELL_BORDER,
    };
  }

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const first = rowIndex * 2 + 1;
    const second = first + 1;

    for (let c = 0; c <= 2; c++) {
      ws["!merges"] = [
        ...(ws["!merges"] ?? []),
        { s: { r: first, c }, e: { r: second, c } },
      ];
    }

    for (let r = first; r <= second; r++) {
      for (let c = 0; c <= lastCol; c++) {
        const addr = XLSX.utils.encode_cell({ r, c });
        if (!ws[addr]) ws[addr] = { t: "s", v: "" };
        const scheduleCol = c >= 4 ? cols[c - 4] : null;
        const selected = scheduleCol != null && ws[addr].v === "1";
        const fill =
          selected && scheduleCol
            ? SCHEDULE_EXPORT_COLORS[scheduleCol.color]
            : undefined;

        ws[addr].s = {
          ...(fill ? { fill: { fgColor: { rgb: fill } } } : {}),
          alignment: CENTER_ALIGN,
          border: CELL_BORDER,
        };
      }
    }
  }

  ws["!cols"] = [
    { wch: 7 },
    { wch: 8 },
    { wch: 12 },
    { wch: 8 },
    ...cols.map(() => ({ wch: 6 })),
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "일정 불일치");
  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `GBS_라인업_일정불일치_${stamp}.xlsx`);
}
