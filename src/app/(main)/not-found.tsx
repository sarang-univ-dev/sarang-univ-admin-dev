import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileQuestion, Home, ArrowLeft } from "lucide-react"

/**
 * 404 Not Found Page
 * 페이지를 찾을 수 없을 때 표시되는 페이지
 */
export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <FileQuestion className="h-10 w-10 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">404 - 페이지를 찾을 수 없습니다</CardTitle>
          <CardDescription className="text-base">
            요청하신 페이지가 존재하지 않거나 이동되었습니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>다음과 같은 이유로 페이지를 찾을 수 없습니다:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>URL이 잘못 입력되었습니다</li>
              <li>페이지가 삭제되었거나 이동되었습니다</li>
              <li>접근 권한이 없는 페이지입니다</li>
            </ul>
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
              문제가 지속되면 관리자에게 문의해주세요
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
