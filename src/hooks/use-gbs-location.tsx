"use client";

import useSWR from "swr";
import { webAxios } from "@/lib/api/axios";
import Cookies from "js-cookie";

export interface IGbsLocationItem {
  id: number;
  retreatId: number;
  number: number;
  memo?: string | null;
  location?: string | null;
  leaders: {
    id: number;
    name: string;
  }[];
  createdAt: Date;
}

const fetcher = async (url: string) => {
  const accessToken = Cookies.get("accessToken");
  const response = await webAxios.get(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.data;
};

export function useGbsList(retreatSlug?: string) {
  const endpoint = retreatSlug
    ? `/api/v1/retreat/${retreatSlug}/line-up/gbslist`
    : null;

  const { data, error, isLoading, mutate } = useSWR<{gbsList: IGbsLocationItem[]}, Error>(endpoint, fetcher);

  return {
    data: data?.gbsList || [],
    error,
    isLoading,
    mutate,
  };
}

export function useAvailableLocations(retreatSlug?: string) {
  const endpoint = retreatSlug
    ? `/api/v1/retreat/${retreatSlug}/dormitory/available-locations`
    : null;

  const { data, error, isLoading, mutate } = useSWR<{availableLocations: string[]}, Error>(endpoint, fetcher);

  return {
    data: data?.availableLocations || [],
    error,
    isLoading,
    mutate,
  };
}

export function useCurrentGbsLocations(retreatSlug?: string) {
  const endpoint = retreatSlug
    ? `/api/v1/retreat/${retreatSlug}/dormitory/current-locations`
    : null;

  const { data, error, isLoading, mutate } = useSWR<{currentGbsLocations: string[]}, Error>(endpoint, fetcher);

  return {
    data: data?.currentGbsLocations || [],
    error,
    isLoading,
    mutate,
  };
}

export function useAssignGbsLocation(retreatSlug?: string) {
  const assignLocation = async (gbsId: number, location: string) => {
    const accessToken = Cookies.get("accessToken");
    const response = await webAxios.post(
      `/api/v1/retreat/${retreatSlug}/dormitory/${gbsId}/assign-gbs-location`,
      { location },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  };

  return { assignLocation };
} 