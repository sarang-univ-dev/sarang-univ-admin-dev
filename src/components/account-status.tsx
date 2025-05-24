import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard } from "lucide-react";
import {
  TUserRetreatRegistration,
  UserRetreatRegistrationPaymentStatus,
} from "@/types";
import { IUserRetreatRegistration } from "@/hooks/use-user-retreat-registration";
import { useMemo } from "react";
import { StatusBadge } from "./Badge";

interface AccountStatusProps {
  registrations?: IUserRetreatRegistration[];
}

export function AccountStatus({ registrations = [] }: AccountStatusProps) {
  // 부서별 데이터 계산
  const departmentStats = useMemo(() => {
    // 부서 ID를 모아서 유니크 배열로 만들기
    const departments = [
      ...new Set(registrations.map(reg => reg.univGroupNumber)),
    ].sort((a, b) => a - b); // 부서 번호 순으로 정렬

    // 각 부서별 통계 계산
    const stats = departments.map(deptId => {
      const deptRegistrations = registrations.filter(
        reg => reg.univGroupNumber === deptId
      );

      // 예상 입금 금액: 입금 대기중(PENDING)인 항목의 금액 합계
      const expectedIncome = deptRegistrations
        .filter(
          reg =>
            reg.paymentStatus === UserRetreatRegistrationPaymentStatus.PENDING
        )
        .reduce((sum, reg) => sum + (reg.price || 0), 0);

      // 실제 입금 금액: 입금 완료(PAID)인 항목의 금액 합계
      const actualIncome = deptRegistrations
        .filter(
          reg => reg.paymentStatus === UserRetreatRegistrationPaymentStatus.PAID
        )
        .reduce((sum, reg) => sum + (reg.price || 0), 0);

      // 예상 출금 금액: 환불 요청(REFUND_REQUEST)인 항목의 금액 합계
      const expectedRefund = deptRegistrations
        .filter(
          reg =>
            reg.paymentStatus ===
            UserRetreatRegistrationPaymentStatus.REFUND_REQUEST
        )
        .reduce((sum, reg) => sum + (reg.price || 0), 0);

      // 실제 출금 금액: 환불 완료(REFUNDED)인 항목의 금액 합계
      const actualRefund = deptRegistrations
        .filter(
          reg =>
            reg.paymentStatus === UserRetreatRegistrationPaymentStatus.REFUNDED
        )
        .reduce((sum, reg) => sum + (reg.price || 0), 0);

      // 현재 계좌 현황: 실제 입금액 - 실제 출금액
      const currentBalance = actualIncome - actualRefund;

      // 예상 계좌 현황: 입금 대기 + 입금 완료 - 환불 대기 - 환불 완료
      const expectedFutureBalance =
        expectedIncome + actualIncome - expectedRefund - actualRefund;

      // 부서명 가져오기
      const departmentName = `${deptId}부`;

      return {
        id: deptId,
        name: departmentName,
        expectedIncome,
        actualIncome,
        expectedRefund,
        actualRefund,
        currentBalance,
        expectedFutureBalance,
      };
    });

    // 전체 통계 계산 (모든 부서의 합계)
    if (departments.length >= 2) {
      const totalStats = {
        id: "all",
        name: "전체",
        expectedIncome: stats.reduce(
          (sum, dept) => sum + dept.expectedIncome,
          0
        ),
        actualIncome: stats.reduce((sum, dept) => sum + dept.actualIncome, 0),
        expectedRefund: stats.reduce(
          (sum, dept) => sum + dept.expectedRefund,
          0
        ),
        actualRefund: stats.reduce((sum, dept) => sum + dept.actualRefund, 0),
        currentBalance: stats.reduce(
          (sum, dept) => sum + dept.currentBalance,
          0
        ),
        expectedFutureBalance: stats.reduce(
          (sum, dept) => sum + dept.expectedFutureBalance,
          0
        ),
      };

      stats.push(totalStats as any);
    }

    return stats;
  }, [registrations]);

  // 부서가 없는 경우 빈 UI 반환
  if (departmentStats.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>계좌 현황</CardTitle>
          <CardDescription>입출금 요약 표</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10 text-gray-500">
            표시할 데이터가 없습니다.
          </div>
        </CardContent>
      </Card>
    );
  }

  // 단일 부서인 경우 테이블 직접 표시
  if (departmentStats.length === 1) {
    const dept = departmentStats[0];
    return (
      <Card>
        <CardHeader>
          <CardTitle>계좌 현황 - {dept.name}</CardTitle>
          <CardDescription>입출금 요약 표</CardDescription>
        </CardHeader>
        <CardContent>
          {/* TODO: 부서별 계좌 정보 동적으로 부여주기 */}
          {/* <div className="flex items-center gap-4 mb-6">
            <CreditCard className="h-6 w-6" />
            <div>
              <div className="text-lg font-bold">
                7777-77-1357924 기업은행
              </div>
              <div className="text-sm text-muted-foreground">박서연</div>
            </div>
          </div> */}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-2/3">항목</TableHead>
                <TableHead className="text-right">금액</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="flex items-center">
                  <StatusBadge
                    status={UserRetreatRegistrationPaymentStatus.PENDING}
                  />
                </TableCell>
                <TableCell className="text-right font-medium">
                  {dept.expectedIncome.toLocaleString()}원
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="flex items-center">
                  <StatusBadge
                    status={UserRetreatRegistrationPaymentStatus.PAID}
                  />
                </TableCell>
                <TableCell className="text-right font-medium">
                  {dept.actualIncome.toLocaleString()}원
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="flex items-center">
                  <StatusBadge
                    status={UserRetreatRegistrationPaymentStatus.REFUND_REQUEST}
                  />
                </TableCell>
                <TableCell className="text-right font-medium">
                  {dept.expectedRefund.toLocaleString()}원
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="flex items-center">
                  <StatusBadge
                    status={UserRetreatRegistrationPaymentStatus.REFUNDED}
                  />
                </TableCell>
                <TableCell className="text-right font-medium">
                  {dept.actualRefund.toLocaleString()}원
                </TableCell>
              </TableRow>
              <TableRow className="bg-gray-50">
                <TableCell className="font-bold">
                  현재 계좌 현황 (입금 완료 - 환불 완료)
                </TableCell>
                <TableCell className="text-right font-bold">
                  {dept.currentBalance.toLocaleString()}원
                </TableCell>
              </TableRow>
              <TableRow className="bg-gray-50">
                <TableCell className="font-bold">
                  예상 계좌 현황 (입금 대기 + 입금 완료 - 환불 대기 - 환불 완료)
                </TableCell>
                <TableCell className="text-right font-bold">
                  {dept.expectedFutureBalance.toLocaleString()}원
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }

  // 부서가 여러 개인 경우 탭으로 표시
  return (
    <Card>
      <CardHeader>
        <CardTitle>계좌 현황</CardTitle>
        <CardDescription>입출금 요약 표</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={departmentStats[0].id.toString()}>
          <TabsList
            className="grid w-full mb-6"
            style={{
              gridTemplateColumns: `repeat(${departmentStats.length}, 1fr)`,
            }}
          >
            {departmentStats.map(dept => (
              <TabsTrigger key={dept.id} value={dept.id.toString()}>
                {dept.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {departmentStats.map(dept => (
            <TabsContent key={dept.id} value={dept.id.toString()}>
              {/* TODO: 부서별 계좌 정보 동적으로 부여주기 */}
              {/* <div className="flex items-center gap-4 mb-6">
                <CreditCard className="h-6 w-6" />
                <div>
                  <div className="text-lg font-bold">
                    7777-77-1357924 기업은행
                  </div>
                  <div className="text-sm text-muted-foreground">박서연</div>
                </div>
              </div> */}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-2/3">항목</TableHead>
                    <TableHead className="text-right">금액</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="flex items-center">
                      <StatusBadge
                        status={UserRetreatRegistrationPaymentStatus.PENDING}
                      />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {dept.expectedIncome.toLocaleString()}원
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="flex items-center">
                      <StatusBadge
                        status={UserRetreatRegistrationPaymentStatus.PAID}
                      />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {dept.actualIncome.toLocaleString()}원
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="flex items-center">
                      <StatusBadge
                        status={
                          UserRetreatRegistrationPaymentStatus.REFUND_REQUEST
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {dept.expectedRefund.toLocaleString()}원
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="flex items-center">
                      <StatusBadge
                        status={UserRetreatRegistrationPaymentStatus.REFUNDED}
                      />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {dept.actualRefund.toLocaleString()}원
                    </TableCell>
                  </TableRow>
                  <TableRow className="bg-gray-50">
                    <TableCell className="font-bold">
                      현재 계좌 금액 (입금 완료 - 환불 완료)
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {dept.currentBalance.toLocaleString()}원
                    </TableCell>
                  </TableRow>
                  <TableRow className="bg-gray-50">
                    <TableCell className="font-bold">
                      목표 계좌 금액 (입금 대기 + 입금 완료 - 환불 대기 - 환불
                      완료)
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {dept.expectedFutureBalance.toLocaleString()}원
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
