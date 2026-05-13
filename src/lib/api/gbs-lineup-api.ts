/**
 * GBS 라인업 관련 API 클라이언트
 */
import { webAxios } from "@/lib/api/axios";
import {
  GbsLineupRow,
  GbsLeaderCandidate,
  GbsCreatePayload,
  AssignLeadersPayload,
  GbsMemoPayload,
} from "@/types/gbs-lineup";

export const GbsLineupAPI = {
  /**
   * GBS 목록 조회
   */
  getGbsList: async (retreatSlug: string): Promise<GbsLineupRow[]> => {
    const response = await webAxios.get(
      `/api/v1/retreat/${retreatSlug}/line-up/gbslist`
    );
    return response.data.gbsList ?? [];
  },

  /**
   * 리더 후보 조회 (모든 참가자 중 리더가 아닌 사람)
   */
  getLeaderCandidates: async (
    retreatSlug: string
  ): Promise<GbsLeaderCandidate[]> => {
    const response = await webAxios.get(
      `/api/v1/retreat/${retreatSlug}/line-up/user-lineups`
    );
    return response.data.userRetreatGbsLineups ?? [];
  },

  /**
   * GBS 그룹 생성 (단일 또는 다수)
   */
  createGbsGroups: async (
    retreatSlug: string,
    payload: GbsCreatePayload
  ): Promise<void> => {
    await webAxios.post(
      `/api/v1/retreat/${retreatSlug}/line-up/create-gbs`,
      payload
    );
  },

  /**
   * GBS 그룹 삭제
   * 서버에서 자동으로 해당 GBS에 배정된 retreat_registration의 gbs_id를 NULL로 설정
   */
  deleteGbsGroup: async (
    retreatSlug: string,
    gbsNumber: number
  ): Promise<void> => {
    await webAxios.delete(
      `/api/v1/retreat/${retreatSlug}/line-up/delete-gbs`,
      { data: { gbsNumber } }
    );
  },

  /**
   * 리더 배정
   */
  assignLeaders: async (
    retreatSlug: string,
    payload: AssignLeadersPayload
  ): Promise<void> => {
    await webAxios.post(
      `/api/v1/retreat/${retreatSlug}/line-up/assign-gbs-leaders`,
      payload
    );
  },

  /**
   * 리더 배정 해제
   */
  unassignLeaders: async (
    retreatSlug: string,
    gbsId: number
  ): Promise<void> => {
    await webAxios.delete(
      `/api/v1/retreat/${retreatSlug}/line-up/${gbsId}/unassign-gbs-leaders`
    );
  },

  /**
   * GBS 메모 저장/업데이트
   */
  saveGbsMemo: async (
    retreatSlug: string,
    payload: GbsMemoPayload
  ): Promise<void> => {
    await webAxios.put(
      `/api/v1/retreat/${retreatSlug}/line-up/lineup-gbs-memo`,
      payload
    );
  },

  /**
   * GBS 메모 삭제
   */
  deleteGbsMemo: async (
    retreatSlug: string,
    gbsNumber: number
  ): Promise<void> => {
    await webAxios.delete(
      `/api/v1/retreat/${retreatSlug}/line-up/lineup-gbs-memo`,
      { data: { gbsNumber } }
    );
  },
};
