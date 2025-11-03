import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldAlert, Home, ArrowLeft, Mail } from "lucide-react"

/**
 * 403 Unauthorized Page
 * 권한이 없는 페이지에 접근했을 때 표시되는 페이지
 */
export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
            <ShieldAlert className="h-10 w-10 text-destructive" />
          </div>
          <CardTitle className="text-2xl">403 - 접근 권한이 없습니다</CardTitle>
          <CardDescription className="text-base">
            이 페이지에 접근할 수 있는 권한이 없습니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>다음과 같은 이유로 접근이 거부되었을 수 있습니다:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>현재 로그인한 계정에 권한이 없습니다</li>
              <li>해당 수련회에 대한 관리 권한이 없습니다</li>
              <li>이 기능은 특정 역할의 사용자만 사용할 수 있습니다</li>
            </ul>
          </div>

          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm font-medium mb-2">권한이 필요하신가요?</p>
            <p className="text-xs text-muted-foreground">
              관리자에게 문의하여 필요한 권한을 요청하세요.
              수련회별로 권한이 다르게 설정될 수 있습니다.
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-4">
            <Button asChild className="w-full">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                홈으로 이동
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="javascript:history.back()">
                <ArrowLeft className="mr-2 h-4 w-4" />
                이전 페이지로
              </Link>
            </Button>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-center text-muted-foreground">
              권한 문제가 지속되면 시스템 관리자에게 문의해주세요
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
