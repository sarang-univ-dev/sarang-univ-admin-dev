import {
  ILeaderAttendance,
  ILeaderReport,
  ILeaderReportSubmissionStatus,
  ILeaderScheduleChangeRequest,
  ILeaderTodayInfo,
  LeaderScheduleChangeRequestStatus,
} from "@/types/leader-report";

import { webAxios } from "./axios";

export type LeaderAdminView = "all" | "department";
type LeaderScheduleChangeRequestMemoResponse = {
  id: number;
  memo: string;
} | null;

/**
 * Leader Admin API
 * 리더 리포트 / 일정 변경 요청 관련 운영자(admin) API 함수들
 *
 * 서버 base: /api/v1/retreat/{retreatSlug}/leader/admin
 * - 쿠키(accessToken)로 인증 (webAxios withCredentials)
 */
export const LeaderAdminAPI = {
  /* ----------------------------- DORMITORY ----------------------------- */

  /**
   * 리더 일정 변경 요청 목록 조회
   */
  getScheduleChangeRequests: async (
    retreatSlug: string,
    status: LeaderScheduleChangeRequestStatus = "PENDING"
  ): Promise<ILeaderScheduleChangeRequest[]> => {
    const response = await webAxios.get(
      `/api/v1/retreat/${retreatSlug}/leader/admin/schedule-change-requests`,
      { params: { status } }
    );
    return response.data.requests;
  },

  /**
   * 부서 인원관리 팀원용 리더 일정 변경 요청 목록 조회
   */
  getDepartmentScheduleChangeRequests: async (
    retreatSlug: string,
    status: LeaderScheduleChangeRequestStatus = "PENDING"
  ): Promise<ILeaderScheduleChangeRequest[]> => {
    const response = await webAxios.get(
      `/api/v1/retreat/${retreatSlug}/leader/department-admin/schedule-change-requests`,
      { params: { status } }
    );
    return response.data.requests;
  },

  /**
   * 리더 일정 변경 요청 승인
   */
  approveScheduleChangeRequest: async (
    retreatSlug: string,
    requestId: number,
    memo: string
  ): Promise<ILeaderScheduleChangeRequest> => {
    const response = await webAxios.post(
      `/api/v1/retreat/${retreatSlug}/leader/admin/schedule-change-requests/${requestId}/approve`,
      { memo }
    );
    return response.data.request;
  },

  /**
   * 리더 일정 변경 요청 거절
   */
  rejectScheduleChangeRequest: async (
    retreatSlug: string,
    requestId: number
  ): Promise<ILeaderScheduleChangeRequest> => {
    const response = await webAxios.post(
      `/api/v1/retreat/${retreatSlug}/leader/admin/schedule-change-requests/${requestId}/reject`
    );
    return response.data.request;
  },

  /**
   * 리더 일정변경 요청 공용 메모 생성 (인원관리 간사 전체 조회 화면)
   */
  createScheduleChangeRequestMemo: async (
    retreatSlug: string,
    requestId: number,
    memo: string
  ): Promise<LeaderScheduleChangeRequestMemoResponse> => {
    const response = await webAxios.post(
      `/api/v1/retreat/${retreatSlug}/leader/admin/schedule-change-requests/${requestId}/memo`,
      { memo }
    );
    return response.data.memo;
  },

  /**
   * 리더 일정변경 요청 공용 메모 수정 (인원관리 간사 전체 조회 화면)
   */
  updateScheduleChangeRequestMemo: async (
    retreatSlug: string,
    memoId: number,
    memo: string
  ): Promise<LeaderScheduleChangeRequestMemoResponse> => {
    const response = await webAxios.put(
      `/api/v1/retreat/${retreatSlug}/leader/admin/schedule-change-request-memos/${memoId}`,
      { memo }
    );
    return response.data.memo;
  },

  /**
   * 리더 일정변경 요청 공용 메모 삭제 (인원관리 간사 전체 조회 화면)
   */
  deleteScheduleChangeRequestMemo: async (
    retreatSlug: string,
    memoId: number
  ): Promise<LeaderScheduleChangeRequestMemoResponse> => {
    const response = await webAxios.delete(
      `/api/v1/retreat/${retreatSlug}/leader/admin/schedule-change-request-memos/${memoId}`
    );
    return response.data.memo;
  },

  /**
   * 리더 일정변경 요청 공용 메모 생성 (부서 인원관리 팀원 화면)
   */
  createDepartmentScheduleChangeRequestMemo: async (
    retreatSlug: string,
    requestId: number,
    memo: string
  ): Promise<LeaderScheduleChangeRequestMemoResponse> => {
    const response = await webAxios.post(
      `/api/v1/retreat/${retreatSlug}/leader/department-admin/schedule-change-requests/${requestId}/memo`,
      { memo }
    );
    return response.data.memo;
  },

  /**
   * 리더 일정변경 요청 공용 메모 수정 (부서 인원관리 팀원 화면)
   */
  updateDepartmentScheduleChangeRequestMemo: async (
    retreatSlug: string,
    memoId: number,
    memo: string
  ): Promise<LeaderScheduleChangeRequestMemoResponse> => {
    const response = await webAxios.put(
      `/api/v1/retreat/${retreatSlug}/leader/department-admin/schedule-change-request-memos/${memoId}`,
      { memo }
    );
    return response.data.memo;
  },

  /**
   * 리더 일정변경 요청 공용 메모 삭제 (부서 인원관리 팀원 화면)
   */
  deleteDepartmentScheduleChangeRequestMemo: async (
    retreatSlug: string,
    memoId: number
  ): Promise<LeaderScheduleChangeRequestMemoResponse> => {
    const response = await webAxios.delete(
      `/api/v1/retreat/${retreatSlug}/leader/department-admin/schedule-change-request-memos/${memoId}`
    );
    return response.data.memo;
  },

  /* -------------------------- LEADER_STAFF -------------------------- */

  /**
   * 리더 리포트(은혜나눔/기도제목) 목록 조회
   */
  getReports: async (
    retreatSlug: string,
    date?: string
  ): Promise<ILeaderReport[]> => {
    const response = await webAxios.get(
      `/api/v1/retreat/${retreatSlug}/leader/admin/reports`,
      { params: date ? { date } : undefined }
    );
    return response.data.reports;
  },

  /**
   * 부서 리더 리포트(은혜나눔/기도제목) 목록 조회
   */
  getDepartmentReports: async (
    retreatSlug: string,
    date?: string
  ): Promise<ILeaderReport[]> => {
    const response = await webAxios.get(
      `/api/v1/retreat/${retreatSlug}/leader/department-admin/reports`,
      { params: date ? { date } : undefined }
    );
    return response.data.reports;
  },

  /**
   * 리더 리포트 제출 현황 조회
   */
  getReportSubmissionStatus: async (
    retreatSlug: string,
    date?: string
  ): Promise<{
    submissionStatus: ILeaderReportSubmissionStatus[];
    date: string;
  }> => {
    const response = await webAxios.get(
      `/api/v1/retreat/${retreatSlug}/leader/admin/report-submission-status`,
      { params: date ? { date } : undefined }
    );
    return response.data;
  },

  /**
   * 부서 리더 리포트 제출 현황 조회
   */
  getDepartmentReportSubmissionStatus: async (
    retreatSlug: string,
    date?: string
  ): Promise<{
    submissionStatus: ILeaderReportSubmissionStatus[];
    date: string;
  }> => {
    const response = await webAxios.get(
      `/api/v1/retreat/${retreatSlug}/leader/department-admin/report-submission-status`,
      { params: date ? { date } : undefined }
    );
    return response.data;
  },

  /**
   * 리더 출석 현황 조회
   */
  getAttendance: async (
    retreatSlug: string,
    date?: string
  ): Promise<{ attendance: ILeaderAttendance[]; date: string }> => {
    const response = await webAxios.get(
      `/api/v1/retreat/${retreatSlug}/leader/admin/attendance`,
      { params: date ? { date } : undefined }
    );
    return response.data;
  },

  /**
   * 부서 리더 출석 현황 조회
   */
  getDepartmentAttendance: async (
    retreatSlug: string,
    date?: string
  ): Promise<{ attendance: ILeaderAttendance[]; date: string }> => {
    const response = await webAxios.get(
      `/api/v1/retreat/${retreatSlug}/leader/department-admin/attendance`,
      { params: date ? { date } : undefined }
    );
    return response.data;
  },

  /**
   * 오늘(일자) 정보 조회
   */
  getToday: async (retreatSlug: string): Promise<ILeaderTodayInfo> => {
    const response = await webAxios.get(
      `/api/v1/retreat/${retreatSlug}/leader/admin/today`
    );
    return response.data;
  },

  /**
   * 오늘(일자) 변경
   */
  updateToday: async (
    retreatSlug: string,
    date: string
  ): Promise<{ today: string }> => {
    const response = await webAxios.put(
      `/api/v1/retreat/${retreatSlug}/leader/admin/today`,
      { date }
    );
    return response.data;
  },
};
