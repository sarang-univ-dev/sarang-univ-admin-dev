"use client";

import type React from "react";
import { UserRetreatRegistrationPaymentStatus } from "@/types";
import {
  Shield,
  CheckCheck,
  Clock,
  RotateCcw,
  RefreshCcw,
  UserPlus,
} from "lucide-react";
import { extractNumber } from "@/lib/utils/extract-number";

interface SummaryTableColumn {
  id: string;
  header: React.ReactNode;
}

interface SummaryTableRow {
  id: string;
  label: string;
  cells: Record<string, React.ReactNode>;
}

interface SummaryTableMobileCardProps {
  columns: SummaryTableColumn[];
  rows: SummaryTableRow[];
}

/**
 * 상태별 배지 렌더링 (인원수 포함)
 */
const renderStatusBadgeWithCount = (
  status: string,
  count: number
): JSX.Element | null => {
  switch (status) {
    case UserRetreatRegistrationPaymentStatus.PENDING:
      return (
        <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-yellow-50 border border-yellow-200">
          <Clock className="h-3.5 w-3.5 text-yellow-500 mr-1.5 flex-shrink-0" aria-hidden="true" />
          <span className="text-xs font-medium text-yellow-700 whitespace-nowrap">
            입금 확인 대기 <span className="font-bold">{count}</span>명
          </span>
        </div>
      );
    case UserRetreatRegistrationPaymentStatus.PAID:
      return (
        <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-green-50 border border-green-200">
          <CheckCheck className="h-3.5 w-3.5 text-green-500 mr-1.5 flex-shrink-0" aria-hidden="true" />
          <span className="text-xs font-medium text-green-700 whitespace-nowrap">
            입금 확인 완료 <span className="font-bold">{count}</span>명
          </span>
        </div>
      );
    case UserRetreatRegistrationPaymentStatus.REFUND_REQUEST:
      return (
        <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200">
          <RefreshCcw className="h-3.5 w-3.5 text-blue-500 mr-1.5 flex-shrink-0" aria-hidden="true" />
          <span className="text-xs font-medium text-blue-700 whitespace-nowrap">
            환불 처리 대기 <span className="font-bold">{count}</span>명
          </span>
        </div>
      );
    case UserRetreatRegistrationPaymentStatus.REFUNDED:
      return (
        <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200">
          <RotateCcw className="h-3.5 w-3.5 text-purple-500 mr-1.5 flex-shrink-0" aria-hidden="true" />
          <span className="text-xs font-medium text-purple-700 whitespace-nowrap">
            환불 처리 완료 <span className="font-bold">{count}</span>명
          </span>
        </div>
      );
    case UserRetreatRegistrationPaymentStatus.NEW_COMER_REQUEST:
      return (
        <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-pink-50 border border-pink-200">
          <UserPlus className="h-3.5 w-3.5 text-pink-500 mr-1.5 flex-shrink-0" aria-hidden="true" />
          <span className="text-xs font-medium text-pink-700 whitespace-nowrap">
            새가족 신청 요청 <span className="font-bold">{count}</span>명
          </span>
        </div>
      );
    case UserRetreatRegistrationPaymentStatus.SOLDIER_REQUEST:
      return (
        <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200">
          <Shield className="h-3.5 w-3.5 text-indigo-500 mr-1.5 flex-shrink-0" aria-hidden="true" />
          <span className="text-xs font-medium text-indigo-700 whitespace-nowrap">
            군지체 신청 요청 <span className="font-bold">{count}</span>명
          </span>
        </div>
      );
    case "total":
      return (
        <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200 shrink-0">
          <span className="text-xs font-medium text-gray-700 whitespace-nowrap">
            전체 인원 <span className="font-bold">{count}</span>명
          </span>
        </div>
      );
    default:
      return null;
  }
};

/**
 * 모바일용 카드 레이아웃 - 수평 스크롤 제거
 * 각 행을 카드로 표시하고, 각 컬럼을 가로로 배치
 */
export function SummaryTableMobileCard({
  columns,
  rows,
}: SummaryTableMobileCardProps) {
  // 각 row별 전체 인원 계산 (공통 유틸 함수 사용)
  const getRowTotal = (row: SummaryTableRow) => {
    const cellValues = Object.values(row.cells);
    return cellValues.reduce<number>((sum, cell) => {
      return sum + extractNumber(cell);
    }, 0);
  };

  return (
    <div className="space-y-3">
      {rows.map((row) => {
        return (
          <div key={row.id}>
            {/* 컬럼별 데이터를 상태 배지로 표시 */}
            <div className="grid grid-cols-2 gap-2">
              {columns.map((column) => {
                const cellValue = row.cells[column.id];
                const count = extractNumber(cellValue);
                const badge = renderStatusBadgeWithCount(column.id, count);

                return (
                  <div key={`${row.id}-${column.id}`} className="flex justify-center">
                    {badge}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
