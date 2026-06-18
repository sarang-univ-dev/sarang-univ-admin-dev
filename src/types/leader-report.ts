import { Gender } from "@/types";

/**
 * 리더 리포트 기능 관련 타입 정의
 *
 * 서버 API base: /api/v1/retreat/{retreatSlug}/leader
 */

export type LeaderScheduleChangeRequestStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

/**
 * 인원관리(DORMITORY) - 리더 일정 변경 요청
 */
export interface ILeaderScheduleChangeRequest {
  id: number;
  userRetreatRegistrationId: number;
  gbsId: number;
  gbsNumber: number;
  memberName: string;
  gradeNumber: number;
  univGroupNumber: number;
  gender: Gender;
  beforeScheduleIds: number[];
  afterScheduleIds: number[];
  reason: string;
  status: LeaderScheduleChangeRequestStatus;
  requesterName: string;
  reviewerName: string | null;
  memoId: number | null;
  memo: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

/**
 * 교육 간사(EDUCATION_STAFF) - 리더 리포트 (은혜나눔/기도제목)
 */
export interface ILeaderReport {
  id: number;
  gbsId: number;
  gbsNumber: number;
  leaderUserId: number;
  univGroupNumber: number;
  reportDate: string;
  graceSharing: string;
  prayerTopics: string;
  authorName: string;
  updatedAt: string;
}

/**
 * 교육 간사(EDUCATION_STAFF) - 리포트 제출 현황
 */
export interface ILeaderReportSubmissionStatus {
  gbsId: number;
  gbsNumber: number;
  leaderUserId: number;
  leaderName: string;
  univGroupNumber: number;
  submitted: boolean;
  submittedAt: string | null;
}

export type LeaderAttendanceStatus = "PRESENT" | "ABSENT" | null;

/**
 * 교육 간사(EDUCATION_STAFF) - 출석 현황
 */
export interface ILeaderAttendance {
  userRetreatRegistrationId: number;
  gbsId: number | null;
  gbsNumber: number | null;
  name: string;
  gender: Gender;
  gradeNumber: number;
  univGroupNumber: number;
  attendanceStatus: LeaderAttendanceStatus;
}

/**
 * 교육 간사(EDUCATION_STAFF) - 오늘(일자) 정보
 */
export interface ILeaderTodayInfo {
  today: string | null;
  days: string[];
  lastDay: string | null;
  isLastDay: boolean;
}
