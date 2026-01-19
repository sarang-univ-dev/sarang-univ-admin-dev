import { webAxios } from "@/lib/api/axios";

export const ShuttleBusAPI = {
  /**
   * 부서 셔틀버스 신청 현황 엑셀 다운로드
   *
   * @param retreatSlug - 수양회 슬러그
   * @returns Blob 데이터
   */
  downloadUnivGroupExcel: async (retreatSlug: string): Promise<Blob> => {
    const response = await webAxios.get(
      `/api/v1/retreat/${retreatSlug}/shuttle-bus/download-univ-group-shuttle-bus-registration-excel`,
      { responseType: "blob" }
    );
    return response.data;
  },
};
