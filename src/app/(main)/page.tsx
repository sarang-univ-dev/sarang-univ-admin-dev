import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getRetreatsWithMenusServer } from "@/lib/api/server-admin-api"
import { getIconComponent } from "@/lib/utils/icon-map"
import { Calendar } from "lucide-react"

/**
 * Admin Home Page - Server Component
 * 수련회 목록과 주요 기능들을 대시보드 형태로 표시
 */
export default async function HomePage() {
  const retreats = await getRetreatsWithMenusServer()

  return (
    <div className="space-y-6">
      {/* 헤더 섹션 */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          사랑의교회 대학부 관리자
        </h1>
        <p className="text-muted-foreground">
          수련회 관리 시스템에 오신 것을 환영합니다
        </p>
      </div>

      {/* 수양회 목록 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">
            수양회 목록
          </h2>
        </div>

        {retreats.length === 0 ? (
          <Card>
            <CardContent className="flex min-h-[200px] items-center justify-center">
              <div className="text-center space-y-2">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">
                  등록된 수양회가 없습니다
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {retreats.map((retreat) => (
              <Card key={retreat.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {retreat.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {retreat.menuItems && retreat.menuItems.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground mb-3">
                        사용 가능한 메뉴
                      </p>
                      <div className="grid gap-2">
                        {retreat.menuItems.slice(0, 4).map((menu) => {
                          const Icon = getIconComponent(menu.icon)
                          return (
                            <Link
                              key={menu.path}
                              href={`/retreat/${retreat.slug}${menu.path}`}
                              className="flex items-center gap-2 rounded-lg border p-2 text-sm hover:bg-accent transition-colors"
                            >
                              {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                              <span className="truncate">{menu.label}</span>
                            </Link>
                          )
                        })}
                        {retreat.menuItems.length > 4 && (
                          <p className="text-xs text-muted-foreground text-center pt-1">
                            +{retreat.menuItems.length - 4}개 더 보기
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      사용 가능한 메뉴가 없습니다
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 도움말 섹션 */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-lg">시작하기</CardTitle>
          <CardDescription>
            왼쪽 사이드바에서 수양회를 선택하고 관리 메뉴를 탐색하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• 각 수양회 카드를 클릭하여 상세 메뉴로 이동할 수 있습니다</p>
          <p>• 사이드바의 메뉴를 통해 등록, 결제, 일정 관리 등을 수행할 수 있습니다</p>
          <p>• 문제가 발생하면 관리자(박희서 간사 010-5478-1099)에게 문의해주세요</p>
        </CardContent>
      </Card>
    </div>
  )
}
