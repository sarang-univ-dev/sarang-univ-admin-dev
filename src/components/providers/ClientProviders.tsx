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
 * Toast, ConfirmModal 등 클라이언트 상태 관리가 필요한 컴포넌트들을 래핑
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
