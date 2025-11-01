import {
  UserRetreatRegistrationPaymentStatus,
  UserRetreatRegistrationType,
} from "@/types";
import {
  Shield,
  User,
  CheckCheck,
  Clock,
  RotateCcw,
  RefreshCcw,
  UserPlus,
} from "lucide-react";

/**
 * 입금 상태에 따른 배지 컴포넌트
 * @description 수양회 신청자의 입금 상태를 시각적으로 표시합니다
 */
export const StatusBadge = ({
  status,
}: {
  status: UserRetreatRegistrationPaymentStatus;
}) => {
  switch (status) {
    case UserRetreatRegistrationPaymentStatus.PENDING:
      return (
        <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-yellow-50 border border-yellow-200">
          <Clock className="h-3.5 w-3.5 text-yellow-500 mr-1.5 flex-shrink-0" />
          <span className="text-xs font-medium text-yellow-700 whitespace-nowrap">
            입금 확인 대기
          </span>
        </div>
      );
    case UserRetreatRegistrationPaymentStatus.PAID:
      return (
        <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-green-50 border border-green-200">
          <CheckCheck className="h-3.5 w-3.5 text-green-500 mr-1.5 flex-shrink-0" />
          <span className="text-xs font-medium text-green-700 whitespace-nowrap">
            입금 확인 완료
          </span>
        </div>
      );
    case UserRetreatRegistrationPaymentStatus.REFUND_REQUEST:
      return (
        <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200">
          <RefreshCcw className="h-3.5 w-3.5 text-blue-500 mr-1.5 flex-shrink-0" />
          <span className="text-xs font-medium text-blue-700 whitespace-nowrap">
            환불 처리 대기
          </span>
        </div>
      );
    case UserRetreatRegistrationPaymentStatus.REFUNDED:
      return (
        <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200">
          <RotateCcw className="h-3.5 w-3.5 text-purple-500 mr-1.5 flex-shrink-0" />
          <span className="text-xs font-medium text-purple-700 whitespace-nowrap">
            환불 처리 완료
          </span>
        </div>
      );
    case UserRetreatRegistrationPaymentStatus.NEW_COMER_REQUEST:
      return (
        <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-pink-50 border border-pink-200">
          <UserPlus className="h-3.5 w-3.5 text-pink-500 mr-1.5 flex-shrink-0" />
          <span className="text-xs font-medium text-pink-700 whitespace-nowrap">
            새가족 신청 요청
          </span>
        </div>
      );
    case UserRetreatRegistrationPaymentStatus.SOLDIER_REQUEST:
      return (
        <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200">
          <Shield className="h-3.5 w-3.5 text-indigo-500 mr-1.5 flex-shrink-0" />
          <span className="text-xs font-medium text-indigo-700 whitespace-nowrap">
            군지체 신청 요청
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
          <span className="text-xs font-medium text-pink-700 whitespace-nowrap">새가족</span>
        </div>
      );
    case UserRetreatRegistrationType.SOLDIER:
      return (
        <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200">
          <Shield className="h-3.5 w-3.5 text-indigo-500 mr-1.5 flex-shrink-0" />
          <span className="text-xs font-medium text-indigo-700 whitespace-nowrap">군지체</span>
        </div>
      );
    case UserRetreatRegistrationType.STAFF:
      return (
        <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200">
          <User className="h-3.5 w-3.5 text-gray-500 mr-1.5 flex-shrink-0" />
          <span className="text-xs font-medium text-gray-700 whitespace-nowrap">간사</span>
        </div>
      );
    default:
      return <span>{type}</span>;
  }
};
