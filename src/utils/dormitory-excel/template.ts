import * as XLSX from "xlsx-js-style";

import { Gender } from "@/types";

const SHEET_NAME = "숙소";
const HEADERS = ["성별", "숙소명", "정원", "최대 인원", "메모"];

const THIN = { style: "thin", color: { rgb: "B0B0B0" } } as const;
const BORDER = { top: THIN, bottom: THIN, left: THIN, right: THIN };
const CENTER = { horizontal: "center", vertical: "center" } as const;

const SAMPLE_ROWS = [
  ["형제", "A동 101", 6, 8, ""],
  ["자매", "B동 201", 6, 8, ""],
];

export type DormitoryTemplateRow = {
  gender: Gender;
  name: string;
  optimalCapacity: number;
  maxCapacity?: number | null;
  memo?: string | null;
};

const genderLabel = (gender: Gender) => (gender === Gender.MALE ? "형제" : "자매");

function writeDormitoryWorkbook(
  dataRows: (string | number | null)[][],
  fileName: string
): void {
  const rows = [HEADERS, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(rows);

  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < HEADERS.length; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      if (!ws[addr]) ws[addr] = { t: "s", v: "" };
      ws[addr].s = {
        border: BORDER,
        alignment: CENTER,
        ...(r === 0
          ? { fill: { fgColor: { rgb: "D1D5DB" } }, font: { bold: true } }
          : {}),
      };
    }
  }

  ws["!cols"] = [
    { wch: 10 },
    { wch: 24 },
    { wch: 10 },
    { wch: 12 },
    { wch: 32 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, SHEET_NAME);
  XLSX.writeFile(wb, fileName);
}

export function downloadDormitoryTemplate(): void {
  const stamp = new Date().toISOString().slice(0, 10);
  writeDormitoryWorkbook(SAMPLE_ROWS, `숙소_템플릿_${stamp}.xlsx`);
}

export function downloadDormitoriesAsTemplate(
  dormitories: DormitoryTemplateRow[]
): void {
  const rows = dormitories
    .slice()
    .sort((a, b) => {
      if (a.gender !== b.gender) return a.gender.localeCompare(b.gender);
      return a.name.localeCompare(b.name, "ko", { numeric: true });
    })
    .map((dormitory) => [
      genderLabel(dormitory.gender),
      dormitory.name,
      dormitory.optimalCapacity,
      dormitory.maxCapacity ?? "",
      dormitory.memo ?? "",
    ]);
  const stamp = new Date().toISOString().slice(0, 10);
  writeDormitoryWorkbook(rows, `숙소_내보내기_${stamp}.xlsx`);
}
