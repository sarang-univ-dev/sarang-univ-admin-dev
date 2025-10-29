import useSWR from "swr";
import { webAxios } from "@/lib/api/axios";
import { Gender } from "@/types";

// 인원관리 간사 전용 인터페이스 - 필요한 필드만 정의
export interface IDormitoryStaffRegistration {
  id: number;
  univGroupNumber: number;
  gradeNumber: number;
  gender: Gender;
  name: string;
  phoneNumber: string;
  userRetreatRegistrationScheduleIds: number[];
  gbsNumber?: number | null;
  dormitoryLocation?: string;
  dormitoryStaffMemo?: string; // 인원관리 간사 메모
  dormitoryStaffMemoId?: string; // 인원관리 간사 메모 ID
  isLeader: boolean;
  // GBS 그룹화를 위한 최소 정보만 유지
  maleCount?: number;
  femaleCount?: number;
  fullAttendanceCount?: number;
  partialAttendanceCount?: number;
}

const fetcher = async (url: string) => {
  const response = await webAxios.get(url);

  // 새로운 dormitory 엔드포인트 응답 구조 사용
  return response.data.dormitoryStaffRegistrations;
};

export function useDormitoryStaff(retreatSlug?: string) {
  const endpoint = retreatSlug
    ? `/api/v1/retreat/${retreatSlug}/dormitory/staff-registrations`
    : null;

  return useSWR<IDormitoryStaffRegistration[], Error>(endpoint, fetcher, {});
}
