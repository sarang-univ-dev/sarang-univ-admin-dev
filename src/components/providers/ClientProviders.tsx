"use client"

import React from "react"
import { SWRConfig } from "swr"
import Toast from "@/components/common/layout/Toast"
import ConfirmModal from "@/components/common/layout/ConfirmModal"

interface ClientProvidersProps {
  children: React.ReactNode
}

/**
 * 클라이언트 전용 Provider 및 컴포넌트들
 *
 * - SWRConfig: SWR 전역 설정
 * - Toast, ConfirmModal: UI 컴포넌트
 *
 * 인증은 Express 서버의 httpOnly 쿠키로 관리됩니다.
 */
export default function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <SWRConfig
      value={{
        revalidateIfStale: true,
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
      }}
    >
      {children}
      <Toast />
      <ConfirmModal />
    </SWRConfig>
  )
}
