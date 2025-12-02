import { SummaryTable } from "@/components/SummaryTable";
import { generateDepartmentStats } from "@/utils/retreat-utils";
import { StatusBadge } from "@/components/Badge";
import { UserRetreatRegistrationPaymentStatus } from "@/types";
import { IUserRetreatRegistration } from "@/hooks/use-user-retreat-registration";

interface PaymentSummaryProps {
  registrations: IUserRetreatRegistration[];
}

/**
 * 입금현황 집계 표 (Server Component)
 *
 * @description
 * - Server Component로 서버에서 렌더링
 * - 정적 계산만 수행 (인터랙션 없음)
 * - JavaScript 번들 크기 감소
 */
export function PaymentSummary({
  registrations = [],
}: PaymentSummaryProps) {
  // 부서 수 계산 (서버에서 한 번만 실행)
  const uniqueDepartments = new Set(registrations.map(reg => reg.univGroupNumber)).size;

  // StatusBadge 컴포넌트를 활용한 동적 컬럼 생성
  const columns = [
    {
      id: UserRetreatRegistrationPaymentStatus.PENDING,
      header: (
        <div className="flex justify-center">
          <StatusBadge status={UserRetreatRegistrationPaymentStatus.PENDING} />
        </div>
      ),
    },
    {
      id: UserRetreatRegistrationPaymentStatus.PAID,
      header: (
        <div className="flex justify-center">
          <StatusBadge status={UserRetreatRegistrationPaymentStatus.PAID} />
        </div>
      ),
    },
    {
      id: UserRetreatRegistrationPaymentStatus.NEW_COMER_REQUEST,
      header: (
        <div className="flex justify-center">
          <StatusBadge
            status={UserRetreatRegistrationPaymentStatus.NEW_COMER_REQUEST}
          />
        </div>
      ),
    },
    {
      id: UserRetreatRegistrationPaymentStatus.SOLDIER_REQUEST,
      header: (
        <div className="flex justify-center">
          <StatusBadge
            status={UserRetreatRegistrationPaymentStatus.SOLDIER_REQUEST}
          />
        </div>
      ),
    },
    {
      id: UserRetreatRegistrationPaymentStatus.REFUND_REQUEST,
      header: (
        <div className="flex justify-center">
          <StatusBadge
            status={UserRetreatRegistrationPaymentStatus.REFUND_REQUEST}
          />
        </div>
      ),
    },
    {
      id: UserRetreatRegistrationPaymentStatus.REFUNDED,
      header: (
        <div className="flex justify-center">
          <StatusBadge status={UserRetreatRegistrationPaymentStatus.REFUNDED} />
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
  const rows = uniqueDepartments <= 1
    ? allRows.filter(row => row.id !== "total")
    : allRows;

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
          [UserRetreatRegistrationPaymentStatus.PENDING]: (
            <div className="text-center">
              <span className="font-semibold">{row.cells.waiting}명</span>
            </div>
          ),
          [UserRetreatRegistrationPaymentStatus.PAID]: (
            <div className="text-center">
              <span className="font-semibold">{row.cells.confirmed}명</span>
            </div>
          ),
          [UserRetreatRegistrationPaymentStatus.NEW_COMER_REQUEST]: (
            <div className="text-center">
              <span className="font-semibold">
                {row.cells.new_family_request}명
              </span>
            </div>
          ),
          [UserRetreatRegistrationPaymentStatus.SOLDIER_REQUEST]: (
            <div className="text-center">
              <span className="font-semibold">
                {row.cells.military_request}명
              </span>
            </div>
          ),
          [UserRetreatRegistrationPaymentStatus.REFUND_REQUEST]: (
            <div className="text-center">
              <span className="font-semibold">
                {row.cells.refund_requested}명
              </span>
            </div>
          ),
          [UserRetreatRegistrationPaymentStatus.REFUNDED]: (
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
        [UserRetreatRegistrationPaymentStatus.PENDING]: (
          <div className="text-center">{row.cells.waiting}명</div>
        ),
        [UserRetreatRegistrationPaymentStatus.PAID]: (
          <div className="text-center">{row.cells.confirmed}명</div>
        ),
        [UserRetreatRegistrationPaymentStatus.NEW_COMER_REQUEST]: (
          <div className="text-center">{row.cells.new_family_request}명</div>
        ),
        [UserRetreatRegistrationPaymentStatus.SOLDIER_REQUEST]: (
          <div className="text-center">{row.cells.military_request}명</div>
        ),
        [UserRetreatRegistrationPaymentStatus.REFUND_REQUEST]: (
          <div className="text-center">{row.cells.refund_requested}명</div>
        ),
        [UserRetreatRegistrationPaymentStatus.REFUNDED]: (
          <div className="text-center">{row.cells.refund_completed}명</div>
        ),
        total: <div className="text-center">{totalCount}명</div>,
      },
    };
  });

  return (
    <SummaryTable
      title="입금현황 집계 표"
      description="부서별 입금 및 환불 현황"
      columns={columns}
      rows={formattedRows}
    />
  );
}
