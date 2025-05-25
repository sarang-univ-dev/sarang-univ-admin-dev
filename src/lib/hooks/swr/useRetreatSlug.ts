// src/lib/hooks/swr/useRetreatSlug.ts
"use client";

import UserAPI from "@/lib/api/user";
import useSWR from "swr";

export const useRetreatSlug = () => {
  const { data: retreatSlug, error, mutate, isLoading } = useSWR(
    "/user/slug",                   
    () => UserAPI.getUserRetreatSlug(), 
    {
      revalidateOnFocus: false,        
      dedupingInterval: 5 * 60 * 1000, 
    }
  );

  return {
    retreatSlug,
    isLoading,
    isError: !!error,
    mutate,  
  };
};
