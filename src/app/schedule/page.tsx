import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SchedulePage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">일정 변동</h1>

      <Card>
        <CardHeader>
          <CardTitle>일정 변동 관리</CardTitle>
          <CardDescription>수양회 일정 변동 내역을 관리합니다.</CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
          준비 중입니다.
        </CardContent>
      </Card>
    </div>
  )
}
