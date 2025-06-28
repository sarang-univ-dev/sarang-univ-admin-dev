import useSWR, { mutate } from "swr";
import { webAxios } from "@/lib/api/axios";
import { useState } from "react";
import Cookies from "js-cookie";
import { Gender } from "@/types";

export type TRetreatDormitory = {
  id: number;
  retreatId: number;
  name: string;
  memo?: string;
  gender: Gender;
  optimalCapacity: number;
  maxCapacity?: number;
  createdAt: Date;
};

const fetcher = async (url: string) => {
  const accessToken = Cookies.get("accessToken");
  const response = await webAxios.get(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.data.availableDormitories;
};

export const useAvailableDormitories = (retreatSlug: string, gender: Gender) => {
  const endpoint = retreatSlug
    ? `/api/v1/retreat/${retreatSlug}/dormitory/available-dormitories-by-gender?gender=${gender}`
    : null;

  return useSWR<TRetreatDormitory[], Error>(endpoint, fetcher);
};

export const useAllDormitories = (retreatSlug: string, gender: Gender) => {
  const endpoint = retreatSlug
    ? `/api/v1/retreat/${retreatSlug}/dormitory/all-dormitories-by-gender?gender=${gender}`
    : null;

  const allDormitoriesFetcher = async (url: string) => {
    const accessToken = Cookies.get("accessToken");
    const response = await webAxios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data.allDormitories;
  };

  return useSWR<TRetreatDormitory[], Error>(endpoint, allDormitoriesFetcher);
};

export const useAssignDormitory = (retreatSlug: string) => {
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = async ({
    userRetreatRegistrationId,
    dormitoryId,
  }: {
    userRetreatRegistrationId: number;
    dormitoryId: number | null;
  }) => {
    setIsPending(true);
    try {
      const accessToken = Cookies.get("accessToken");
      const response = await webAxios.post(
        `/api/v1/retreat/${retreatSlug}/dormitory/${userRetreatRegistrationId}/assign-dormitory`,
        { dormitoryId: dormitoryId },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      // 관련 데이터들을 다시 fetch
      mutate(key => typeof key === 'string' && key.includes('available-dormitories'));
      mutate(key => typeof key === 'string' && key.includes('user-dormitory-list'));
      mutate(key => typeof key === 'string' && key.includes('user-lineups'));
      mutate(key => typeof key === 'string' && key.includes('staff-registrations'));

      return response.data;
    } finally {
      setIsPending(false);
    }
  };

  return { mutateAsync, isPending };
}; 