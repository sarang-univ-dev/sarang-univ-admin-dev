import {
  Shield,
  User,
  CheckCheck,
  Clock,
  RotateCcw,
  RefreshCcw,
  UserPlus,
  XCircle,
} from "lucide-react";
import { PAYMENT_STATUS_LABELS } from "@/lib/constant/labels";
import { normalizeRetreatPaymentStatus } from "@/lib/utils/retreat-payment-status";

import {
  UserRetreatRegistrationPaymentStatus,
  UserRetreatRegistrationType,
} from "@/types";

/**
 * 입금 상태에 따른 배지 컴포넌트
 * @description 수양회 신청자의 입금 상태를 시각적으로 표시합니다
 */
export const StatusBadge = ({
  status,
}: {
  status: UserRetreatRegistrationPaymentStatus;
}) => {
  const normalizedStatus = normalizeRetreatPaymentStatus(status);
  const label = PAYMENT_STATUS_LABELS[normalizedStatus];

  switch (normalizedStatus) {
    case UserRetreatRegistrationPaymentStatus.PENDING:
      return (
        <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-yellow-50 border border-yellow-200">
          <Clock className="h-3.5 w-3.5 text-yellow-500 mr-1.5 flex-shrink-0" />
          <span className="text-xs font-medium text-yellow-700 whitespace-nowrap">
            {label}
          </span>
        </div>
      );
    case UserRetreatRegistrationPaymentStatus.PAID:
      return (
        <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-green-50 border border-green-200">
          <CheckCheck className="h-3.5 w-3.5 text-green-500 mr-1.5 flex-shrink-0" />
          <span className="text-xs font-medium text-green-700 whitespace-nowrap">
            {label}
          </span>
        </div>
      );
    case UserRetreatRegistrationPaymentStatus.REFUND_ONGOING:
      return (
        <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200">
          <RefreshCcw className="h-3.5 w-3.5 text-blue-500 mr-1.5 flex-shrink-0" />
          <span className="text-xs font-medium text-blue-700 whitespace-nowrap">
            {label}
          </span>
        </div>
      );
    case UserRetreatRegistrationPaymentStatus.CANCEL_ONGOING:
      return (
        <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-orange-50 border border-orange-200">
          <Clock className="h-3.5 w-3.5 text-orange-500 mr-1.5 flex-shrink-0" />
          <span className="text-xs font-medium text-orange-700 whitespace-nowrap">
            {label}
          </span>
        </div>
      );
    case UserRetreatRegistrationPaymentStatus.CANCELED:
      return (
        <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200">
          <XCircle className="h-3.5 w-3.5 text-gray-500 mr-1.5 flex-shrink-0" />
          <span className="text-xs font-medium text-gray-700 whitespace-nowrap">
            {label}
          </span>
        </div>
      );
    case UserRetreatRegistrationPaymentStatus.REFUNDED:
      return (
        <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200">
          <RotateCcw className="h-3.5 w-3.5 text-purple-500 mr-1.5 flex-shrink-0" />
          <span className="text-xs font-medium text-purple-700 whitespace-nowrap">
            {label}
          </span>
        </div>
      );
    case UserRetreatRegistrationPaymentStatus.NEW_COMER_REQUEST:
      return (
        <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-pink-50 border border-pink-200">
          <UserPlus className="h-3.5 w-3.5 text-pink-500 mr-1.5 flex-shrink-0" />
          <span className="text-xs font-medium text-pink-700 whitespace-nowrap">
            {label}
          </span>
        </div>
      );
    case UserRetreatRegistrationPaymentStatus.SOLDIER_REQUEST:
      return (
        <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200">
          <Shield className="h-3.5 w-3.5 text-indigo-500 mr-1.5 flex-shrink-0" />
          <span className="text-xs font-medium text-indigo-700 whitespace-nowrap">
            {label}
          </span>
        </div>
      );
    default:
      return null;
  }
};

/**
 * 사용자 타입에 따른 배지 컴포넌트
 * @description 수양회 신청자의 타입(새가족, 군지체, 간사)을 시각적으로 표시합니다
 */
export const TypeBadge = ({ type }: { type: UserRetreatRegistrationType }) => {
  if (!type) return <span>-</span>;

  switch (type) {
    case UserRetreatRegistrationType.NEW_COMER:
      return (
        <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-pink-50 border border-pink-200">
          <UserPlus className="h-3.5 w-3.5 text-pink-500 mr-1.5 flex-shrink-0" />
          <span className="text-xs font-medium text-pink-700 whitespace-nowrap">
            새가족
          </span>
        </div>
      );
    case UserRetreatRegistrationType.SOLDIER:
      return (
        <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200">
          <Shield className="h-3.5 w-3.5 text-indigo-500 mr-1.5 flex-shrink-0" />
          <span className="text-xs font-medium text-indigo-700 whitespace-nowrap">
            군지체
          </span>
        </div>
      );
    case UserRetreatRegistrationType.STAFF:
      return (
        <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200">
          <User className="h-3.5 w-3.5 text-gray-500 mr-1.5 flex-shrink-0" />
          <span className="text-xs font-medium text-gray-700 whitespace-nowrap">
            간사
          </span>
        </div>
      );
    default:
      return <span>{type}</span>;
  }
};

/**
 * 리더 일정 변경 요청 상태 배지 컴포넌트
 * @description PENDING(대기), APPROVED(승인), REJECTED(거절) 상태를 시각적으로 표시합니다
 */
export const LeaderScheduleChangeStatusBadge = ({
  status,
}: {
  status: "PENDING" | "APPROVED" | "REJECTED";
}) => {
  switch (status) {
    case "PENDING":
      return (
        <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-yellow-50 border border-yellow-200">
          <Clock className="h-3.5 w-3.5 text-yellow-500 mr-1.5 flex-shrink-0" />
          <span className="text-xs font-medium text-yellow-700 whitespace-nowrap">
            대기
          </span>
        </div>
      );
    case "APPROVED":
      return (
        <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-green-50 border border-green-200">
          <CheckCheck className="h-3.5 w-3.5 text-green-500 mr-1.5 flex-shrink-0" />
          <span className="text-xs font-medium text-green-700 whitespace-nowrap">
            승인
          </span>
        </div>
      );
    case "REJECTED":
      return (
        <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200">
          <XCircle className="h-3.5 w-3.5 text-gray-500 mr-1.5 flex-shrink-0" />
          <span className="text-xs font-medium text-gray-700 whitespace-nowrap">
            거절
          </span>
        </div>
      );
    default:
      return null;
  }
};

/**
 * 리더 리포트 제출 여부 배지 컴포넌트
 * @description 제출 완료(green) / 미제출(gray) 상태를 시각적으로 표시합니다
 */
export const LeaderReportSubmittedBadge = ({
  submitted,
}: {
  submitted: boolean;
}) => {
  if (submitted) {
    return (
      <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-green-50 border border-green-200">
        <CheckCheck className="h-3.5 w-3.5 text-green-500 mr-1.5 flex-shrink-0" />
        <span className="text-xs font-medium text-green-700 whitespace-nowrap">
          제출 완료
        </span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200">
      <XCircle className="h-3.5 w-3.5 text-gray-500 mr-1.5 flex-shrink-0" />
      <span className="text-xs font-medium text-gray-700 whitespace-nowrap">
        미제출
      </span>
    </div>
  );
};

/**
 * 리더 출석 현황 배지 컴포넌트
 * @description 출석(green) / 결석(gray) / 미체크(yellow) 상태를 시각적으로 표시합니다
 */
export const LeaderAttendanceBadge = ({
  status,
}: {
  status: "PRESENT" | "ABSENT" | null;
}) => {
  switch (status) {
    case "PRESENT":
      return (
        <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-green-50 border border-green-200">
          <CheckCheck className="h-3.5 w-3.5 text-green-500 mr-1.5 flex-shrink-0" />
          <span className="text-xs font-medium text-green-700 whitespace-nowrap">
            출석
          </span>
        </div>
      );
    case "ABSENT":
      return (
        <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200">
          <XCircle className="h-3.5 w-3.5 text-gray-500 mr-1.5 flex-shrink-0" />
          <span className="text-xs font-medium text-gray-700 whitespace-nowrap">
            결석
          </span>
        </div>
      );
    default:
      return (
        <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-yellow-50 border border-yellow-200">
          <Clock className="h-3.5 w-3.5 text-yellow-500 mr-1.5 flex-shrink-0" />
          <span className="text-xs font-medium text-yellow-700 whitespace-nowrap">
            미체크
          </span>
        </div>
      );
  }
};
