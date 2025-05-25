import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function DepartmentPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">부서 신청 내역</h1>

      <Card>
        <CardHeader>
          <CardTitle>부서 신청 내역 관리</CardTitle>
          <CardDescription>수양회 부서별 신청 내역을 관리합니다.</CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
          준비 중입니다.
        </CardContent>
      </Card>
    </div>
  )
}
