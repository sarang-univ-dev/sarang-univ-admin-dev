import {
  UserRetreatRegistrationPaymentStatus,
} from "@/types";
import {
  Shield,
  CheckCheck,
  Clock,
  RotateCcw,
  RefreshCcw,
  UserPlus,
} from "lucide-react";

/**
 * 모바일 전용 축약형 입금 상태 배지
 * @description 짧은 텍스트로 모바일 테이블에 최적화
 */
export const MobileStatusBadge = ({
  status,
}: {
  status: UserRetreatRegistrationPaymentStatus;
}) => {
  switch (status) {
    case UserRetreatRegistrationPaymentStatus.PENDING:
      return (
        <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-yellow-50 border border-yellow-200">
          <Clock className="h-3 w-3 text-yellow-500 mr-1 flex-shrink-0" />
          <span className="text-xs font-medium text-yellow-700 whitespace-nowrap">
            입금 대기
          </span>
        </div>
      );
    case UserRetreatRegistrationPaymentStatus.PAID:
      return (
        <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-50 border border-green-200">
          <CheckCheck className="h-3 w-3 text-green-500 mr-1 flex-shrink-0" />
          <span className="text-xs font-medium text-green-700 whitespace-nowrap">
            입금 완료
          </span>
        </div>
      );
    case UserRetreatRegistrationPaymentStatus.REFUND_REQUEST:
      return (
        <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200">
          <RefreshCcw className="h-3 w-3 text-blue-500 mr-1 flex-shrink-0" />
          <span className="text-xs font-medium text-blue-700 whitespace-nowrap">
            환불 대기
          </span>
        </div>
      );
    case UserRetreatRegistrationPaymentStatus.REFUNDED:
      return (
        <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-purple-50 border border-purple-200">
          <RotateCcw className="h-3 w-3 text-purple-500 mr-1 flex-shrink-0" />
          <span className="text-xs font-medium text-purple-700 whitespace-nowrap">
            환불 완료
          </span>
        </div>
      );
    case UserRetreatRegistrationPaymentStatus.NEW_COMER_REQUEST:
      return (
        <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-pink-50 border border-pink-200">
          <UserPlus className="h-3 w-3 text-pink-500 mr-1 flex-shrink-0" />
          <span className="text-xs font-medium text-pink-700 whitespace-nowrap">
            새가족
          </span>
        </div>
      );
    case UserRetreatRegistrationPaymentStatus.SOLDIER_REQUEST:
      return (
        <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200">
          <Shield className="h-3 w-3 text-indigo-500 mr-1 flex-shrink-0" />
          <span className="text-xs font-medium text-indigo-700 whitespace-nowrap">
            군지체
          </span>
        </div>
      );
    default:
      return null;
  }
};
