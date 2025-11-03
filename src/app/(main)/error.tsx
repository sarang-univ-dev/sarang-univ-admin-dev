"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Home, RotateCcw } from "lucide-react"
import Link from "next/link"

/**
 * Error Page - Client Component
 * 런타임 에러가 발생했을 때 표시되는 페이지
 */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 에러를 로깅 서비스에 전송할 수 있습니다
    console.error("Error occurred:", error)
  }, [error])

  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>
          <CardTitle className="text-2xl">문제가 발생했습니다</CardTitle>
          <CardDescription className="text-base">
            예상치 못한 오류가 발생했습니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 개발 환경에서만 에러 메시지 표시 */}
          {process.env.NODE_ENV === "development" && (
            <div className="rounded-lg bg-destructive/10 p-4 border border-destructive/20">
              <p className="text-xs font-mono text-destructive break-all">
                {error.message || "알 수 없는 오류"}
              </p>
              {error.digest && (
                <p className="text-xs text-muted-foreground mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>다음과 같은 방법을 시도해보세요:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>페이지를 새로고침합니다</li>
              <li>잠시 후 다시 시도합니다</li>
              <li>다른 브라우저를 사용해봅니다</li>
              <li>인터넷 연결 상태를 확인합니다</li>
            </ul>
          </div>

          <div className="flex flex-col gap-2 pt-4">
            <Button
              onClick={reset}
              className="w-full"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              다시 시도
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                홈으로 이동
              </Link>
            </Button>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-center text-muted-foreground">
              문제가 계속되면 관리자에게 문의해주세요
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
