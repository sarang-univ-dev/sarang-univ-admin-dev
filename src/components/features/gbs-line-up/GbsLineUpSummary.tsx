import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { IUserRetreatGBSLineup } from "@/hooks/gbs-line-up/use-retreat-gbs-lineup-data";

interface GbsLineUpSummaryProps {
  lineups: IUserRetreatGBSLineup[];
}

/**
 * GBS Line-Up 통계 요약 (Server Component)
 *
 * @description
 * GBS 라인업의 전체 통계를 카드 형태로 표시합니다.
 * - 전체 인원
 * - GBS 배정 완료
 * - 미배정
 */
export function GbsLineUpSummary({ lineups }: GbsLineUpSummaryProps) {
  const stats = {
    total: lineups.length,
    assigned: lineups.filter((l) => l.gbsNumber != null).length,
    unassigned: lineups.filter((l) => l.gbsNumber == null).length,
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            전체 인원
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}명</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            GBS 배정 완료
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {stats.assigned}명
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            미배정
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {stats.unassigned}명
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
