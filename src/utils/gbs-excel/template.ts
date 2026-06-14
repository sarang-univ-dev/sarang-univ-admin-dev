/**
 * GBS 엑셀 가져오기 — 빈 「(꼬리표) 수양회GBS」 포맷 템플릿 생성.
 *
 * 운영자가 이 템플릿을 받아 조번호/리더만 편집한 뒤 다시 업로드한다.
 * 행 데이터는 **하드코딩된 예시**(실제 명단이 아님) — 최초 임포트 전에는
 * GBS 번호·리더가 아직 존재하지 않으므로 라이브 데이터를 채울 수 없다.
 * 운영자는 예시 행을 지우고 본인 명단으로 채운다.
 * 일정(스케줄) 컬럼만 해당 retreat 의 실제 스케줄에서 가져와 정확히 맞춘다.
 * 헤더/스케줄 컬럼 순서는 parse(detectLayout)가 기대하는 것과 동일.
 * 가독성을 위해 xlsx-js-style 로 셀 서식(헤더 회색, 일정 컬럼 날짜별 색,
 * 리더 행 하늘색, 테두리, 가운데 정렬)을 적용한다.
 */
import * as XLSX from "xlsx-js-style";

import {
  RetreatRegistrationScheduleType,
  TRetreatRegistrationSchedule,
} from "@/types";
import { getKSTDateString } from "@/lib/utils/date-utils";
import { getScheduleLabel } from "@/utils/retreat-utils";

import { orderSchedules } from "./parse";

const SHEET_NAME = "(꼬리표) 수양회GBS";
const FIXED_HEADERS = [
  "리더",
  "ID",
  "조번호",
  "부서",
  "학년",
  "성별",
  "이름",
  "연락처",
  "전참여부",
  "현리더",
  "새돌/군인/새가족",
];
const COL_OFFSET = 1; // A열 비움 → B열부터
const LEADER_FLAG_COL = COL_OFFSET; // B열 = 리더 플래그
const HEADER_ROW = 1; // row0 빈 행, row1 헤더

// 서버 export 와 동일한 색 스킴
const HEADER_FILL = "D1D5DB"; // 헤더 회색
const LEADER_FILL = "D6EAF8"; // 리더 행 하늘색
const DATE_COLORS = ["FF99CC", "FFCB99", "FEFF99", "CCFFCC"]; // 날짜별 일정 색

type Cell = string | null;

const THIN = { style: "thin", color: { rgb: "B0B0B0" } } as const;
const BORDER = { top: THIN, bottom: THIN, left: THIN, right: THIN };
const CENTER = { horizontal: "center", vertical: "center" } as const;

/** 예시 행 — 실제 명단이 아니라 작성 형식을 보여주는 더미 데이터 */
interface SampleRow {
  isLeader: boolean;
  gbsNumber: number;
  univGroupNumber: number;
  gradeNumber: number;
  gender: "남" | "여";
  name: string;
  phone: string;
  /** true = 전참(모든 일정), false = 부분참(숙박 제외) */
  fullAttendance: boolean;
  currentLeader: string;
}

// 누가 봐도 예시임이 분명한 더미 명단(성경 인물 이름 + 성). 운영자가 지우고 본인 명단으로 채운다.
const SAMPLE_ROWS: SampleRow[] = [
  { isLeader: true, gbsNumber: 101, univGroupNumber: 2, gradeNumber: 4, gender: "남", name: "김바울", phone: "010-0000-0001", fullAttendance: true, currentLeader: "김바울" },
  { isLeader: false, gbsNumber: 101, univGroupNumber: 2, gradeNumber: 1, gender: "남", name: "이디모데", phone: "010-0000-0002", fullAttendance: true, currentLeader: "김바울" },
  { isLeader: false, gbsNumber: 101, univGroupNumber: 2, gradeNumber: 2, gender: "여", name: "박마리아", phone: "010-0000-0003", fullAttendance: true, currentLeader: "김바울" },
  { isLeader: false, gbsNumber: 101, univGroupNumber: 5, gradeNumber: 3, gender: "남", name: "최누가", phone: "010-0000-0004", fullAttendance: false, currentLeader: "김바울" },
  { isLeader: true, gbsNumber: 102, univGroupNumber: 2, gradeNumber: 4, gender: "여", name: "정에스더", phone: "010-0000-0005", fullAttendance: true, currentLeader: "정에스더" },
  { isLeader: false, gbsNumber: 102, univGroupNumber: 2, gradeNumber: 1, gender: "여", name: "강사라", phone: "010-0000-0006", fullAttendance: true, currentLeader: "정에스더" },
  { isLeader: false, gbsNumber: 102, univGroupNumber: 5, gradeNumber: 2, gender: "남", name: "조요한", phone: "010-0000-0007", fullAttendance: true, currentLeader: "정에스더" },
  { isLeader: false, gbsNumber: 102, univGroupNumber: 6, gradeNumber: 3, gender: "남", name: "윤다윗", phone: "010-0000-0008", fullAttendance: false, currentLeader: "정에스더" },
];

export function buildTemplateWorkbook(
  schedules: TRetreatRegistrationSchedule[]
): XLSX.WorkBook {
  const ordered = orderSchedules(schedules);
  const scheduleLabels = ordered.map((s) => getScheduleLabel(s.time, s.type));

  // 일정 컬럼별 색 (KST 날짜가 바뀔 때마다 색 순환)
  const scheduleColors: string[] = [];
  let colorIndex = -1;
  let lastDate = "";
  for (const s of ordered) {
    const dateKey = getKSTDateString(s.time);
    if (dateKey !== lastDate) {
      colorIndex = (colorIndex + 1) % DATE_COLORS.length;
      lastDate = dateKey;
    }
    scheduleColors.push(DATE_COLORS[colorIndex]);
  }

  const header = [...FIXED_HEADERS, ...scheduleLabels];
  const scheduleStart = COL_OFFSET + FIXED_HEADERS.length;

  // 전참 = 모든 일정 "1", 부분참 = 숙박만 "0"
  const scheduleCellsFor = (row: SampleRow): string[] =>
    ordered.map((s) =>
      row.fullAttendance
        ? "1"
        : s.type === RetreatRegistrationScheduleType.SLEEP
          ? "0"
          : "1"
    );

  const aoa: Cell[][] = [];
  aoa.push([]);
  aoa.push([null, ...header]);
  for (const row of SAMPLE_ROWS) {
    aoa.push([
      null,
      row.isLeader ? "1" : "0",
      row.phone, // ID 컬럼(미사용) — 연락처로 채움
      String(row.gbsNumber),
      `${row.univGroupNumber}부`,
      String(row.gradeNumber),
      row.gender,
      row.name,
      row.phone,
      row.fullAttendance ? "전참" : "부분참",
      row.currentLeader,
      "",
      ...scheduleCellsFor(row),
    ]);
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const lastCol = COL_OFFSET + header.length - 1;

  const setStyle = (r: number, c: number, s: object) => {
    const addr = XLSX.utils.encode_cell({ r, c });
    if (!ws[addr]) ws[addr] = { t: "s", v: "" };
    ws[addr].s = s;
  };

  // 헤더 행
  for (let c = COL_OFFSET; c <= lastCol; c++) {
    const isSchedule = c >= scheduleStart;
    setStyle(HEADER_ROW, c, {
      fill: {
        fgColor: {
          rgb: isSchedule ? scheduleColors[c - scheduleStart] : HEADER_FILL,
        },
      },
      font: { bold: true },
      alignment: CENTER,
      border: BORDER,
    });
  }

  // 데이터 행
  for (let i = 0; i < SAMPLE_ROWS.length; i++) {
    const r = HEADER_ROW + 1 + i;
    const isLeaderRow =
      (ws[XLSX.utils.encode_cell({ r, c: LEADER_FLAG_COL })]?.v ?? "") === "1";
    for (let c = COL_OFFSET; c <= lastCol; c++) {
      const isSchedule = c >= scheduleStart;
      let fill: string | undefined;
      if (isSchedule) {
        const selected =
          (ws[XLSX.utils.encode_cell({ r, c })]?.v ?? "") === "1";
        fill = selected ? scheduleColors[c - scheduleStart] : undefined;
      } else if (isLeaderRow) {
        fill = LEADER_FILL;
      }
      setStyle(r, c, {
        ...(fill ? { fill: { fgColor: { rgb: fill } } } : {}),
        font: isLeaderRow ? { bold: true } : undefined,
        alignment: CENTER,
        border: BORDER,
      });
    }
  }

  // 컬럼 너비
  ws["!cols"] = [
    { wch: 2 }, // A
    { wch: 5 }, // 리더
    { wch: 15 }, // ID
    { wch: 7 }, // 조번호
    { wch: 6 }, // 부서
    { wch: 6 }, // 학년
    { wch: 6 }, // 성별
    { wch: 10 }, // 이름
    { wch: 15 }, // 연락처
    { wch: 9 }, // 전참여부
    { wch: 10 }, // 현리더
    { wch: 14 }, // 새돌/군인/새가족
    ...scheduleLabels.map(() => ({ wch: 5 })),
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, SHEET_NAME);
  return wb;
}

export function downloadTemplate(
  schedules: TRetreatRegistrationSchedule[]
): void {
  const wb = buildTemplateWorkbook(schedules);
  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `GBS_라인업_템플릿_${stamp}.xlsx`);
}
