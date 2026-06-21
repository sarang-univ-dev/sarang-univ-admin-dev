import { webAxios } from "@/lib/api/axios";

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
  }
};
