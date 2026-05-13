import { User } from "lucide-react";

import { Gender } from "@/types";

/**
 * @deprecated StatusBadge와 TypeBadge는 @/components/common/retreat/badges로 이동되었습니다
 * 하위 호환성을 위해 re-export합니다
 */
export { StatusBadge, TypeBadge } from "@/components/common/retreat/badges";

/**
 * 성별에 따른 배지 컴포넌트
 */
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
