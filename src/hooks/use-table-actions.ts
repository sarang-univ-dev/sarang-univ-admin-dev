import { useState } from "react";
import { mutate } from "swr";
import { useToastStore } from "@/store/toast-store";
import { AxiosError } from "axios";

interface UseTableActionsOptions {
  endpoint: string;
  successMessage?: string;
  errorMessage?: string;
}

/**
 * 테이블 액션을 위한 공통 훅
 * API 호출, 에러 처리, 토스트 알림, SWR mutate를 자동으로 처리
 */
export function useTableActions({
  endpoint,
  successMessage = "작업이 완료되었습니다.",
  errorMessage = "오류가 발생했습니다.",
}: UseTableActionsOptions) {
  const [loading, setLoading] = useState(false);
  const addToast = useToastStore((state) => state.add);

  const executeAction = async <T = void>(
    action: () => Promise<T>,
    options?: {
      successMessage?: string;
      errorMessage?: string;
      revalidate?: boolean;
    }
  ): Promise<T | null> => {
    setLoading(true);
    try {
      const result = await action();

      if (options?.revalidate !== false) {
        await mutate(endpoint);
      }

      addToast({
        title: "성공",
        description: options?.successMessage || successMessage,
        variant: "success",
      });

      return result;
    } catch (error) {
      const message =
        error instanceof AxiosError
          ? error.response?.data?.message || errorMessage
          : errorMessage;

      addToast({
        title: "오류 발생",
        description: options?.errorMessage || message,
        variant: "destructive",
      });

      return null;
    } finally {
      setLoading(false);
    }
  };

  return { loading, executeAction };
}
