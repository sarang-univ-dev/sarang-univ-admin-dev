import * as XLSX from "xlsx-js-style";

import { IDormitoryStaffRegistration } from "@/hooks/use-dormitory-staff";
import { Gender } from "@/types";

const SHEET_NAME = "방배정";
const FIXED_HEADERS = [
  "ID",
  "부서",
  "학년",
  "성별",
  "이름",
  "연락처",
  "GBS",
  "숙소명",
];
const TRAILING_HEADER = "비고";

const THIN = { style: "thin", color: { rgb: "B0B0B0" } } as const;
const BORDER = { top: THIN, bottom: THIN, left: THIN, right: THIN };
const CENTER = { horizontal: "center", vertical: "center" } as const;

const genderLabel = (gender: Gender) => (gender === Gender.MALE ? "형제" : "자매");

type AssignmentTemplateSchedule = { id: number; label: string };

// 배정 대상 전원을 현재 배정 숙소가 채워진 상태로 내보낸다 (편집 템플릿 겸용).
// 'ID' 가 가져오기 매칭키, '숙소명' 이 편집 칸. 나머지 컬럼은 참고용.
export function downloadDormitoryAssignmentTemplate(
  people: IDormitoryStaffRegistration[],
  scheduleColumns: AssignmentTemplateSchedule[]
): void {
  const headers = [
    ...FIXED_HEADERS,
    ...scheduleColumns.map((schedule) => schedule.label),
    TRAILING_HEADER,
  ];

  const sortedPeople = [...people].sort((a, b) => {
    if (a.gender !== b.gender) return a.gender === Gender.MALE ? -1 : 1;
    const aLocation = a.dormitoryLocation?.trim() ?? "";
    const bLocation = b.dormitoryLocation?.trim() ?? "";
    if (aLocation !== bLocation) {
      if (!aLocation) return 1;
      if (!bLocation) return -1;
      return aLocation.localeCompare(bLocation, "ko", { numeric: true });
    }
    const aGbs = a.gbsNumber ?? Number.MAX_SAFE_INTEGER;
    const bGbs = b.gbsNumber ?? Number.MAX_SAFE_INTEGER;
    if (aGbs !== bGbs) return aGbs - bGbs;
    if (a.gradeNumber !== b.gradeNumber) return b.gradeNumber - a.gradeNumber;
    return a.name.localeCompare(b.name, "ko");
  });

  const dataRows = sortedPeople.map((person) => [
    person.id,
    `${person.univGroupNumber}부`,
    `${person.gradeNumber}학년`,
    genderLabel(person.gender),
    person.name,
    person.phoneNumber ?? "",
    person.gbsNumber ?? "",
    person.dormitoryLocation?.trim() ?? "",
    ...scheduleColumns.map((schedule) =>
      (person.userRetreatRegistrationScheduleIds ?? []).includes(schedule.id)
        ? "O"
        : ""
    ),
    person.dormitoryStaffMemo?.trim() ?? "",
  ]);

  const rows = [headers, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(rows);

  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < headers.length; c++) {
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
    { wch: 8 }, // ID
    { wch: 8 }, // 부서
    { wch: 8 }, // 학년
    { wch: 8 }, // 성별
    { wch: 12 }, // 이름
    { wch: 16 }, // 연락처
    { wch: 8 }, // GBS
    { wch: 24 }, // 숙소명
    ...scheduleColumns.map(() => ({ wch: 6 })),
    { wch: 24 }, // 비고
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, SHEET_NAME);
  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `방배정_내보내기_${stamp}.xlsx`);
}
