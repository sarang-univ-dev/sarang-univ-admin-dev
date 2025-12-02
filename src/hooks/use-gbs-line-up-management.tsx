import useSWR from "swr";
import { webAxios } from "@/lib/api/axios";
import { Gender } from "@/types";
import { UserRetreatRegistrationType } from "@/types";
import { UserRetreatRegistrationPaymentStatus } from "@/types";

export interface IUserRetreatGBSLineupList {
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

const fetcher = async (url: string) => {
  const response = await webAxios.get(url);
  // API 응답 구조 변경 반영
  return response.data.gbsList;
};

export function useUserLineupLists(retreatSlug?: string) {
  const endpoint = retreatSlug
    ? `/api/v1/retreat/${retreatSlug}/line-up/gbslist`
    : null;

  return useSWR<IUserRetreatGBSLineupList[], Error>(endpoint, fetcher);
}
