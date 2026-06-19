import useSWR from "swr";

import { webAxios } from "@/lib/api/axios";
import { Gender } from "@/types";

export interface LineupUnivGroupAdminStaffMemo {
  userRetreatRegistrationId: number;
  name: string;
  phoneNumber: string;
  gender: Gender;
  univGroupNumber: number;
  gradeNumber: number;
  currentLeaderName: string;
  gbsNumber: number | null;
  memo: string;
  createdAt: string;
  updatedAt: string;
  createdAdminUserName: string | null;
}

export function useLineupUnivGroupAdminStaffMemos(retreatSlug?: string) {
  const endpoint = retreatSlug
    ? `/api/v1/retreat/${retreatSlug}/line-up/univ-group-admin-staff-memos`
    : null;

  return useSWR<LineupUnivGroupAdminStaffMemo[], Error>(
    endpoint,
    async (url) => {
      const response = await webAxios.get(url);
      return response.data.univGroupAdminStaffMemos;
    },
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  );
}
