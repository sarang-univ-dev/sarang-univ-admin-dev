/**
 * GBS 라인업 관련 타입 정의
 */
import { Gender } from "@/types";

// API에서 받아오는 GBS 데이터
export interface GbsLineupRow {
  id: number;
  retreatId: number;
  number: number;
  memo: string | null;
  location: string | null;
  leaders: {
    id: number;
    name: string;
  }[];
  createdAt: string;
}

// 테이블에서 사용하는 변환된 데이터
export interface GbsLineupTableData extends GbsLineupRow {
  leaderNames: string;
  hasLeaders: boolean;
}

// 리더 후보 데이터
export interface GbsLeaderCandidate {
  id: number;
  userId: number;
  name: string;
  phoneNumber: string;
  univGroupNumber: number;
  gradeNumber: number;
  gender: Gender;
  isLeader: boolean;
  gbsNumber: number | null;
}

// GBS 생성 요청
export interface GbsCreatePayload {
  gbsNumbers: string[];
}

// 리더 배정 요청
export interface AssignLeadersPayload {
  gbsNumber: number;
  leaderUserIds: number[];
}

// GBS 메모 업데이트 요청
export interface GbsMemoPayload {
  gbsNumber: number;
  memo: string;
}
