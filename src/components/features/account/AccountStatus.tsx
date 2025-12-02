"use client";

import { useMemo } from "react";
import { SummaryTable } from "@/components/SummaryTable";
import {
  UserRetreatRegistrationPaymentStatus,
} from "@/types";
import { IRetreatRegistration } from "@/types/account";
import { StatusBadge } from "@/components/Badge";

interface AccountStatusProps {
  registrations?: IRetreatRegistration[];
}

interface DepartmentStat {
  univGroupNumber: number | "all";
  name: string;
  expectedIncome: number;
  actualIncome: number;
  expectedRefund: number;
  actualRefund: number;
  currentBalance: number;
  expectedFutureBalance: number;
}

/**
 * 계좌 현황 컴포넌트 (SummaryTable 형식)
 *
 * @description
 * - SummaryTable을 사용하여 일관된 디자인 적용
 * - 부서별 입출금 현황 표시
 * - Card wrap 제거
 */
export function AccountStatus({ registrations = [] }: AccountStatusProps) {
  // 부서별 데이터 계산
  const departmentStats = useMemo<DepartmentStat[]>(() => {
    // 부서 ID를 모아서 유니크 배열로 만들기
    const departments = [
      ...new Set(registrations.map((reg) => reg.univGroupNumber)),
    ].sort((a, b) => a - b); // 부서 번호 순으로 정렬

    // 각 부서별 통계 계산
    const stats: DepartmentStat[] = departments.map((deptId) => {
      const deptRegistrations = registrations.filter(
        (reg) => reg.univGroupNumber === deptId
      );

      // 예상 입금 금액: 입금 대기중(PENDING)인 항목의 금액 합계
      const expectedIncome = deptRegistrations
        .filter(
          (reg) =>
            reg.paymentStatus === UserRetreatRegistrationPaymentStatus.PENDING
        )
        .reduce((sum, reg) => sum + (reg.price || 0), 0);

      // 실제 입금 금액: 입금 완료(PAID)인 항목의 금액 합계
      const actualIncome = deptRegistrations
        .filter(
          (reg) => reg.paymentStatus === UserRetreatRegistrationPaymentStatus.PAID
        )
        .reduce((sum, reg) => sum + (reg.price || 0), 0);

      // 예상 출금 금액: 환불 요청(REFUND_REQUEST)인 항목의 금액 합계
      const expectedRefund = deptRegistrations
        .filter(
          (reg) =>
            reg.paymentStatus ===
            UserRetreatRegistrationPaymentStatus.REFUND_REQUEST
        )
        .reduce((sum, reg) => sum + (reg.price || 0), 0);

      // 실제 출금 금액: 환불 완료(REFUNDED)인 항목의 금액 합계
      const actualRefund = deptRegistrations
        .filter(
          (reg) =>
            reg.paymentStatus === UserRetreatRegistrationPaymentStatus.REFUNDED
        )
        .reduce((sum, reg) => sum + (reg.price || 0), 0);

      // 현재 계좌 현황: 실제 입금액 - 실제 출금액
      const currentBalance = actualIncome - actualRefund;

      // 예상 계좌 현황: 입금 대기 + 입금 완료 - 환불 대기 - 환불 완료
      const expectedFutureBalance =
        expectedIncome + actualIncome - expectedRefund - actualRefund;

      return {
        univGroupNumber: deptId,
        name: `${deptId}부`,
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
      const totalStats: DepartmentStat = {
        univGroupNumber: "all",
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

      stats.push(totalStats);
    }

    return stats;
  }, [registrations]);

  // 부서가 없는 경우 빈 메시지
  if (departmentStats.length === 0) {
    return (
      <div className="space-y-3 md:space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            계좌 현황
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            입출금 요약 표
          </p>
        </div>
        <div className="p-6 md:p-8 text-center text-gray-500 text-sm">
          표시할 데이터가 없습니다.
        </div>
      </div>
    );
  }

  // SummaryTable 컬럼 정의
  const columns = [
    {
      id: "expectedIncome",
      header: (
        <div className="flex justify-center">
          <StatusBadge status={UserRetreatRegistrationPaymentStatus.PENDING} />
        </div>
      ),
    },
    {
      id: "actualIncome",
      header: (
        <div className="flex justify-center">
          <StatusBadge status={UserRetreatRegistrationPaymentStatus.PAID} />
        </div>
      ),
    },
    {
      id: "expectedRefund",
      header: (
        <div className="flex justify-center">
          <StatusBadge status={UserRetreatRegistrationPaymentStatus.REFUND_REQUEST} />
        </div>
      ),
    },
    {
      id: "actualRefund",
      header: (
        <div className="flex justify-center">
          <StatusBadge status={UserRetreatRegistrationPaymentStatus.REFUNDED} />
        </div>
      ),
    },
    {
      id: "currentBalance",
      header: (
        <div className="flex flex-col items-center gap-1">
          <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 shrink-0">
            <span className="text-xs font-medium text-blue-700 whitespace-nowrap">현재 계좌</span>
          </div>
          <span className="text-[10px] text-gray-500 text-center whitespace-nowrap">(입금완료 - 환불완료)</span>
        </div>
      ),
    },
    {
      id: "expectedFutureBalance",
      header: (
        <div className="flex flex-col items-center gap-1">
          <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200 shrink-0">
            <span className="text-xs font-medium text-purple-700 whitespace-nowrap">예상 계좌</span>
          </div>
          <span className="text-[10px] text-gray-500 text-center whitespace-nowrap">(입금대기 + 입금완료 - 환불대기 - 환불완료)</span>
        </div>
      ),
    },
  ];

  // SummaryTable rows 생성
  const rows = departmentStats.map((dept) => ({
    id: dept.univGroupNumber.toString(),
    label: dept.name,
    cells: {
      expectedIncome: (
        <div className="text-center">
          {dept.univGroupNumber === "all" ? (
            <span className="font-semibold">{dept.expectedIncome.toLocaleString()}원</span>
          ) : (
            <span>{dept.expectedIncome.toLocaleString()}원</span>
          )}
        </div>
      ),
      actualIncome: (
        <div className="text-center">
          {dept.univGroupNumber === "all" ? (
            <span className="font-semibold">{dept.actualIncome.toLocaleString()}원</span>
          ) : (
            <span>{dept.actualIncome.toLocaleString()}원</span>
          )}
        </div>
      ),
      expectedRefund: (
        <div className="text-center">
          {dept.univGroupNumber === "all" ? (
            <span className="font-semibold">{dept.expectedRefund.toLocaleString()}원</span>
          ) : (
            <span>{dept.expectedRefund.toLocaleString()}원</span>
          )}
        </div>
      ),
      actualRefund: (
        <div className="text-center">
          {dept.univGroupNumber === "all" ? (
            <span className="font-semibold">{dept.actualRefund.toLocaleString()}원</span>
          ) : (
            <span>{dept.actualRefund.toLocaleString()}원</span>
          )}
        </div>
      ),
      currentBalance: (
        <div className="text-center">
          {dept.univGroupNumber === "all" ? (
            <span className="font-bold text-blue-700">{dept.currentBalance.toLocaleString()}원</span>
          ) : (
            <span className="font-semibold text-blue-600">{dept.currentBalance.toLocaleString()}원</span>
          )}
        </div>
      ),
      expectedFutureBalance: (
        <div className="text-center">
          {dept.univGroupNumber === "all" ? (
            <span className="font-bold text-purple-700">{dept.expectedFutureBalance.toLocaleString()}원</span>
          ) : (
            <span className="font-semibold text-purple-600">{dept.expectedFutureBalance.toLocaleString()}원</span>
          )}
        </div>
      ),
    },
  }));

  return (
    <SummaryTable
      title="계좌 현황"
      description="부서별 입출금 요약 표"
      columns={columns}
      rows={rows}
    />
  );
}
