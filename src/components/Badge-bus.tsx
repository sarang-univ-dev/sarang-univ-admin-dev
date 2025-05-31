import {
  Gender,
  UserRetreatShuttleBusPaymentStatus,
  UserRetreatRegistrationType,
} from "@/types";
import {
  Shield,
  User,
  CheckCheck,
  Clock,
  RotateCcw,
  RefreshCcw,
} from "lucide-react";

import { UserPlus } from "lucide-react";

export const StatusBadge = ({
  status,
}: {
  status: UserRetreatShuttleBusPaymentStatus;
}) => {
  switch (status) {
    case UserRetreatShuttleBusPaymentStatus.PENDING:
      return (
        <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-yellow-50 border border-yellow-200">
          <Clock className="h-3.5 w-3.5 text-yellow-500 mr-1.5" />
          <span className="text-xs font-medium text-yellow-700">
            입금 확인 대기
          </span>
        </div>
      );
    case UserRetreatShuttleBusPaymentStatus.PAID:
      return (
        <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-green-50 border border-green-200">
          <CheckCheck className="h-3.5 w-3.5 text-green-500 mr-1.5" />
          <span className="text-xs font-medium text-green-700">
            입금 확인 완료
          </span>
        </div>
      );
    case UserRetreatShuttleBusPaymentStatus.REFUND_REQUEST:
      return (
        <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200">
          <RefreshCcw className="h-3.5 w-3.5 text-blue-500 mr-1.5" />
          <span className="text-xs font-medium text-blue-700">
            환불 처리 대기
          </span>
        </div>
      );
    case UserRetreatShuttleBusPaymentStatus.REFUNDED:
      return (
        <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200">
          <RotateCcw className="h-3.5 w-3.5 text-purple-500 mr-1.5" />
          <span className="text-xs font-medium text-purple-700">
            환불 처리 완료
          </span>
        </div>
      );
    default:
      return null;
  }
};

// 타입에 따른 배지 컴포넌트
// export const TypeBadge = ({ type }: { type: UserRetreatRegistrationType }) => {
//   if (!type) return <span>-</span>;

//   switch (type) {
//     case UserRetreatRegistrationType.NEW_COMER:
//       return (
//         <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-pink-50 border border-pink-200">
//           <UserPlus className="h-3.5 w-3.5 text-pink-500 mr-1.5" />
//           <span className="text-xs font-medium text-pink-700">새가족</span>
//         </div>
//       );
//     case UserRetreatRegistrationType.SOLDIER:
//       return (
//         <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200">
//           <Shield className="h-3.5 w-3.5 text-indigo-500 mr-1.5" />
//           <span className="text-xs font-medium text-indigo-700">군지체</span>
//         </div>
//       );
//     case UserRetreatRegistrationType.STAFF:
//       return (
//         <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200">
//           <User className="h-3.5 w-3.5 text-gray-500 mr-1.5" />
//           <span className="text-xs font-medium text-gray-700">간사</span>
//         </div>
//       );
//     default:
//       return <span>{type}</span>;
//   }
// };

// 성별에 따른 배지 컴포넌트
export const GenderBadge = ({ gender }: { gender: Gender }) => {
  switch (gender) {
    case Gender.MALE:
      return (
        <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200">
          <User className="h-3.5 w-3.5 text-blue-500 mr-1.5" />
          <span className="text-xs font-medium text-blue-700">남</span>
        </div>
      );
    case Gender.FEMALE:
      return (
        <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-pink-50 border border-pink-200">
          <User className="h-3.5 w-3.5 text-pink-500 mr-1.5" />
          <span className="text-xs font-medium text-pink-700">여</span>
        </div>
      );
    default:
      return <span>{gender}</span>;
  }
};
