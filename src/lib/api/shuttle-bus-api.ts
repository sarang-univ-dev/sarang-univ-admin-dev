import { webAxios } from "@/lib/api/axios";
import {
  IBoardingStaffAssignmentBus,
  IBoardingStaffBus,
  IBoardingStaffCandidate,
  IBoardingStaffPassengerResponse,
} from "@/types/shuttle-bus-boarding";

export const ShuttleBusAPI = {
  /**
   * 부서 셔틀버스 신청 현황 엑셀 다운로드
   *
   * @param retreatSlug - 수양회 슬러그
   * @returns Blob 데이터
   */
  downloadUnivGroupExcel: async (
    retreatSlug: string,
    rowIds?: number[]
  ): Promise<Blob> => {
    const url = `/api/v1/retreat/${retreatSlug}/shuttle-bus/download-univ-group-shuttle-bus-registration-excel`;
    const response = rowIds
      ? await webAxios.post(url, { rowIds }, { responseType: "blob" })
      : await webAxios.get(url, { responseType: "blob" });
    return response.data;
  },

  /**
   * 전체 부서별 셔틀버스 탑승자 엑셀 다운로드 (버스 간사 전용)
   *
   * @param retreatSlug - 수양회 슬러그
   * @returns Blob 데이터
   */
  downloadAllUnivGroupPassengersExcel: async (
    retreatSlug: string,
    rowIds?: number[]
  ): Promise<Blob> => {
    const url = `/api/v1/retreat/${retreatSlug}/shuttle-bus/download-all-univ-group-shuttle-bus-passengers-excel`;
    const response = rowIds
      ? await webAxios.post(url, { rowIds }, { responseType: "blob" })
      : await webAxios.get(url, { responseType: "blob" });
    return response.data;
  },

  getBoardingStaffAssignmentBuses: async (
    retreatSlug: string
  ): Promise<IBoardingStaffAssignmentBus[]> => {
    const response = await webAxios.get(
      `/api/v1/retreat/${retreatSlug}/shuttle-bus/boarding-staff-assignments`
    );
    return response.data.shuttleBuses;
  },

  getBoardingStaffCandidates: async (
    retreatSlug: string
  ): Promise<IBoardingStaffCandidate[]> => {
    const response = await webAxios.get(
      `/api/v1/retreat/${retreatSlug}/shuttle-bus/boarding-staff-candidates`
    );
    return response.data.candidates;
  },

  replaceBoardingStaffAssignment: async (
    retreatSlug: string,
    shuttleBusId: number,
    adminUserIds: number[]
  ): Promise<IBoardingStaffAssignmentBus> => {
    const response = await webAxios.put(
      `/api/v1/retreat/${retreatSlug}/shuttle-bus/shuttle-buses/${shuttleBusId}/boarding-staff-assignments`,
      { adminUserIds }
    );
    return response.data.shuttleBus;
  },

  getBoardingStaffBuses: async (
    retreatSlug: string
  ): Promise<IBoardingStaffBus[]> => {
    const response = await webAxios.get(
      `/api/v1/retreat/${retreatSlug}/shuttle-bus/boarding-staff/buses`
    );
    return response.data.shuttleBuses;
  },

  getBoardingStaffPassengers: async (
    retreatSlug: string,
    shuttleBusId: number
  ): Promise<IBoardingStaffPassengerResponse> => {
    const response = await webAxios.get(
      `/api/v1/retreat/${retreatSlug}/shuttle-bus/boarding-staff/buses/${shuttleBusId}/passengers`
    );
    return response.data;
  },

  confirmBoardingStaffPassenger: async (
    retreatSlug: string,
    shuttleBusId: number,
    userRetreatShuttleBusRegistrationId: number
  ) => {
    const response = await webAxios.post(
      `/api/v1/retreat/${retreatSlug}/shuttle-bus/boarding-staff/buses/${shuttleBusId}/passengers/${userRetreatShuttleBusRegistrationId}/confirm`
    );
    return response.data.result;
  },

  cancelBoardingStaffPassenger: async (
    retreatSlug: string,
    shuttleBusId: number,
    userRetreatShuttleBusRegistrationId: number
  ) => {
    const response = await webAxios.post(
      `/api/v1/retreat/${retreatSlug}/shuttle-bus/boarding-staff/buses/${shuttleBusId}/passengers/${userRetreatShuttleBusRegistrationId}/cancel`
    );
    return response.data.result;
  },

  saveBoardingStaffScheduleChangeMemo: async (
    retreatSlug: string,
    shuttleBusId: number,
    userRetreatShuttleBusRegistrationId: number,
    memo: string
  ) => {
    const response = await webAxios.post(
      `/api/v1/retreat/${retreatSlug}/shuttle-bus/boarding-staff/buses/${shuttleBusId}/passengers/${userRetreatShuttleBusRegistrationId}/schedule-change-memo`,
      { memo }
    );
    return response.data.memo;
  },

  deleteBoardingStaffScheduleChangeMemo: async (
    retreatSlug: string,
    shuttleBusId: number,
    userRetreatShuttleBusRegistrationId: number
  ) => {
    await webAxios.delete(
      `/api/v1/retreat/${retreatSlug}/shuttle-bus/boarding-staff/buses/${shuttleBusId}/passengers/${userRetreatShuttleBusRegistrationId}/schedule-change-memo`
    );
  },
};
