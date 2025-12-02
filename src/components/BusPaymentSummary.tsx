"use client";

import { SummaryTable } from "./SummaryTable";
import { generateDepartmentStats } from "../utils/bus-utils";
import { StatusBadge } from "./Badge-bus";
import { UserRetreatShuttleBusPaymentStatus } from "@/types";
import { useMemo } from "react";
import { IUserBusRegistration } from "@/hooks/use-user-bus-registration";

export function PaymentSummary({
  registrations = [],
}: {
  registrations: IUserBusRegistration[];
}) {
  // 부서 수 계산
  const uniqueDepartments = useMemo(() => {
    return new Set(registrations.map(reg => reg.univGroupNumber)).size;
  }, [registrations]);

  // StatusBadge 컴포넌트를 활용한 동적 컬럼 생성
  const columns = [
    {
      id: UserRetreatShuttleBusPaymentStatus.PENDING,
      header: (
        <div className="flex justify-center">
          <StatusBadge status={UserRetreatShuttleBusPaymentStatus.PENDING} />
        </div>
      ),
    },
    {
      id: UserRetreatShuttleBusPaymentStatus.PAID,
      header: (
        <div className="flex justify-center">
          <StatusBadge status={UserRetreatShuttleBusPaymentStatus.PAID} />
        </div>
      ),
    },
    {
      id: UserRetreatShuttleBusPaymentStatus.REFUND_REQUEST,
      header: (
        <div className="flex justify-center">
          <StatusBadge
            status={UserRetreatShuttleBusPaymentStatus.REFUND_REQUEST}
          />
        </div>
      ),
    },
    {
      id: UserRetreatShuttleBusPaymentStatus.REFUNDED,
      header: (
        <div className="flex justify-center">
          <StatusBadge status={UserRetreatShuttleBusPaymentStatus.REFUNDED} />
        </div>
      ),
    },
    {
      id: "total",
      header: (
        <div className="flex justify-center">
          <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200 shrink-0">
            <span className="text-xs font-medium text-gray-700 whitespace-nowrap">전체 인원</span>
          </div>
        </div>
      ),
    },
  ];

  // 동적으로 부서별 통계 생성 - 자동으로 부서 순서대로 정렬됨
  const allRows = generateDepartmentStats(registrations);

  // 부서가 1개인 경우 전체 행 제외
  const rows = useMemo(() => {
    if (uniqueDepartments <= 1) {
      return allRows.filter(row => row.id !== "total");
    }
    return allRows;
  }, [allRows, uniqueDepartments]);

  // 각 행을 변환하여 셀 생성
  const formattedRows = rows.map(row => {
    // 각 행의 전체 인원 계산
    const totalCount = Object.values(row.cells).reduce(
      (sum: number, value: number) => sum + value,
      0
    );

    // 합계 행은 특별 처리
    if (row.id === "total") {
      return {
        ...row,
        cells: {
          [UserRetreatShuttleBusPaymentStatus.PENDING]: (
            <div className="text-center">
              <span className="font-semibold">{row.cells.waiting}명</span>
            </div>
          ),
          [UserRetreatShuttleBusPaymentStatus.PAID]: (
            <div className="text-center">
              <span className="font-semibold">{row.cells.confirmed}명</span>
            </div>
          ),
          [UserRetreatShuttleBusPaymentStatus.REFUND_REQUEST]: (
            <div className="text-center">
              <span className="font-semibold">
                {row.cells.refund_requested}명
              </span>
            </div>
          ),
          [UserRetreatShuttleBusPaymentStatus.REFUNDED]: (
            <div className="text-center">
              <span className="font-semibold">
                {row.cells.refund_completed}명
              </span>
            </div>
          ),
          total: (
            <div className="text-center">
              <span className="font-semibold">{totalCount}명</span>
            </div>
          ),
        },
      };
    }

    // 일반 행은 숫자에 '명' 추가
    return {
      ...row,
      cells: {
        [UserRetreatShuttleBusPaymentStatus.PENDING]: (
          <div className="text-center">{row.cells.waiting}명</div>
        ),
        [UserRetreatShuttleBusPaymentStatus.PAID]: (
          <div className="text-center">{row.cells.confirmed}명</div>
        ),
        [UserRetreatShuttleBusPaymentStatus.REFUND_REQUEST]: (
          <div className="text-center">{row.cells.refund_requested}명</div>
        ),
        [UserRetreatShuttleBusPaymentStatus.REFUNDED]: (
          <div className="text-center">{row.cells.refund_completed}명</div>
        ),
        total: <div className="text-center">{totalCount}명</div>,
      },
    };
  });

  return (
    <SummaryTable
      title="입금완료 집계 표"
      description="부서별 입금 및 환불 현황"
      columns={columns}
      rows={formattedRows}
    />
  );
}
