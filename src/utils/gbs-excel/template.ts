/**
 * GBS 엑셀 가져오기 — 현재 라인업을 「(꼬리표) 수양회GBS」 포맷 템플릿으로 생성.
 *
 * 운영자가 이 템플릿을 받아 조번호/리더만 편집한 뒤 다시 업로드한다.
 * 헤더/스케줄 컬럼 순서는 parse(detectLayout)가 기대하는 것과 동일하게 맞춘다.
 */
import * as XLSX from "xlsx";

import { IUserRetreatGBSLineup } from "@/hooks/gbs-line-up/use-retreat-gbs-lineup-data";
import { TRetreatRegistrationSchedule } from "@/types";
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

type Cell = string | null;

export function buildTemplateWorkbook(
  lineups: IUserRetreatGBSLineup[],
  schedules: TRetreatRegistrationSchedule[]
): XLSX.WorkBook {
  const ordered = orderSchedules(schedules);
  const scheduleLabels = ordered.map((s) => getScheduleLabel(s.time, s.type));
  const scheduleIds = ordered.map((s) => s.id);
  const header = [...FIXED_HEADERS, ...scheduleLabels];

  // GBS 번호 오름차순(미배정 마지막) → 리더 먼저 → 학년 내림차순 → 이름
  const rows = [...lineups].sort((a, b) => {
    const ga = a.gbsNumber ?? Number.POSITIVE_INFINITY;
    const gb = b.gbsNumber ?? Number.POSITIVE_INFINITY;
    if (ga !== gb) return ga - gb;
    if (a.isLeader !== b.isLeader) return a.isLeader ? -1 : 1;
    if (a.gradeNumber !== b.gradeNumber) return b.gradeNumber - a.gradeNumber;
    return a.name.localeCompare(b.name, "ko");
  });

  // row0 빈 행, 헤더 = row1, 데이터 row2~ (A열 비움 → B열부터: 기준 시트와 동일)
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
