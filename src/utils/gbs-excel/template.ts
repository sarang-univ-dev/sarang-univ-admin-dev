/**
 * GBS 엑셀 가져오기 — 현재 라인업을 「(꼬리표) 수양회GBS」 포맷 템플릿으로 생성.
 *
 * 운영자가 이 템플릿을 받아 조번호/리더만 편집한 뒤 다시 업로드한다.
 * 헤더/스케줄 컬럼 순서는 parse(detectLayout)가 기대하는 것과 동일하게 맞춘다.
 * 가독성을 위해 xlsx-js-style 로 셀 서식(헤더 회색, 일정 컬럼 날짜별 색,
 * 리더 행 하늘색, 테두리, 가운데 정렬)을 적용한다.
 */
import * as XLSX from "xlsx-js-style";

import { IUserRetreatGBSLineup } from "@/hooks/gbs-line-up/use-retreat-gbs-lineup-data";
import { TRetreatRegistrationSchedule } from "@/types";
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

export function buildTemplateWorkbook(
  lineups: IUserRetreatGBSLineup[],
  schedules: TRetreatRegistrationSchedule[]
): XLSX.WorkBook {
  const ordered = orderSchedules(schedules);
  const scheduleLabels = ordered.map((s) => getScheduleLabel(s.time, s.type));
  const scheduleIds = ordered.map((s) => s.id);

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

  // GBS 번호 오름차순(미배정 마지막) → 리더 먼저 → 학년 내림차순 → 이름
  const rows = [...lineups].sort((a, b) => {
    const ga = a.gbsNumber ?? Number.POSITIVE_INFINITY;
    const gb = b.gbsNumber ?? Number.POSITIVE_INFINITY;
    if (ga !== gb) return ga - gb;
    if (a.isLeader !== b.isLeader) return a.isLeader ? -1 : 1;
    if (a.gradeNumber !== b.gradeNumber) return b.gradeNumber - a.gradeNumber;
    return a.name.localeCompare(b.name, "ko");
  });

  const aoa: Cell[][] = [];
  aoa.push([]);
  aoa.push([null, ...header]);
  for (const lu of rows) {
    const sched = new Set(lu.userRetreatRegistrationScheduleIds);
    aoa.push([
      null,
      lu.isLeader ? "1" : "0",
      lu.phoneNumber,
      lu.gbsNumber == null ? "" : String(lu.gbsNumber),
      String(lu.univGroupNumber),
      String(lu.gradeNumber),
      lu.gender === "FEMALE" ? "여" : "남",
      lu.name,
      lu.phoneNumber,
      lu.isFullAttendance ? "전참" : "부분참",
      lu.currentLeader ?? "",
      "",
      ...scheduleIds.map((id) => (sched.has(id) ? "1" : "0")),
    ]);
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const lastCol = COL_OFFSET + header.length - 1;
  const lastRow = HEADER_ROW + rows.length;

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
  for (let i = 0; i < rows.length; i++) {
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
  lineups: IUserRetreatGBSLineup[],
  schedules: TRetreatRegistrationSchedule[]
): void {
  const wb = buildTemplateWorkbook(lineups, schedules);
  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `GBS_라인업_템플릿_${stamp}.xlsx`);
}
