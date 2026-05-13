"use client";

import { InfoSection, InfoItem } from "@/components/common/detail-sidebar";
import { TRetreatRegistrationSchedule } from "@/types";
import { GenderBadge, StatusBadge, TypeBadge } from "@/components/Badge";
import { RetreatScheduleTable } from "@/components/common/retreat/RetreatScheduleTable";
import { formatDate } from "@/utils/formatDate";
import { useMemo } from "react";
import {
  UserCircle,
  CreditCard,
  Calendar,
  Clock,
} from "lucide-react";

// 공통 신청 정보 타입
interface RegistrationData {
  name: string;
  univGroupNumber: number;
  gradeNumber: number;
  gender: string;
  phoneNumber?: string;
  currentLeaderName?: string;
  userType?: string | null;
  price?: number;
  paymentStatus: string;
  createdAt?: string;
  paymentConfirmUserName?: string;
  paymentConfirmedAt?: string;
  userRetreatRegistrationScheduleIds?: number[];
}

interface MinisterViewDetailContentProps {
  data: RegistrationData;
  schedules: TRetreatRegistrationSchedule[];
  showAmount?: boolean; // 금액 표시 여부 (기본값: false)
}

/**
 * 교역자용 조회 전용 - 상세 정보 사이드바 컨텐츠
 *
 * @description
 * - 신청자 기본 정보 (이름, 부서, 학년, 성별, 전화번호, 인도자)
 * - 신청 정보 (신청 시각, 타입, 입금 현황)
 * - 금액 정보 (showAmount가 true일 때만 표시 - 행정 총괄 교역자용)
 * - 처리 정보 (처리자명, 처리 시각)
 * - 신청 스케줄
 */
export function MinisterViewDetailContent({
  data,
  schedules,
  showAmount = false,
}: MinisterViewDetailContentProps) {
  // 선택된 스케줄 ID 추출
  const selectedScheduleIds = useMemo(() => {
    return data.userRetreatRegistrationScheduleIds || [];
  }, [data.userRetreatRegistrationScheduleIds]);

  return (
    <>
      {/* 기본 정보 - 2컬럼 그리드 */}
      <InfoSection title="기본 정보" icon={UserCircle} columns={2}>
        <InfoItem label="이름" value={data.name} />
        <InfoItem label="부서" value={`${data.univGroupNumber}부`} />
        <InfoItem label="학년" value={`${data.gradeNumber}학년`} />
        <InfoItem label="성별" value={<GenderBadge gender={data.gender as any} />} />
        <InfoItem
          label="전화번호"
          value={
            data.phoneNumber ? (
              <a
                href={`tel:${data.phoneNumber}`}
                className="text-blue-600 hover:underline"
              >
                {data.phoneNumber}
              </a>
            ) : (
              "-"
            )
          }
        />
        {data.currentLeaderName && (
          <InfoItem label="인도자" value={data.currentLeaderName} />
        )}
      </InfoSection>

      {/* 신청 정보 */}
      <InfoSection title="신청 정보" icon={CreditCard}>
        <InfoItem
          label="신청 시각"
          value={data.createdAt ? formatDate(data.createdAt) : "-"}
        />
        <InfoItem
          label="타입"
          value={data.userType ? <TypeBadge type={data.userType as any} /> : "-"}
        />
        {showAmount && (
          <InfoItem
            label="금액"
            value={`${data.price?.toLocaleString() || 0}원`}
          />
        )}
        <InfoItem
          label="입금 현황"
          value={<StatusBadge status={data.paymentStatus as any} />}
        />
      </InfoSection>

      {/* 처리 정보 */}
      {(data.paymentConfirmUserName || data.paymentConfirmedAt) && (
        <InfoSection title="처리 정보" icon={Clock}>
          {data.paymentConfirmUserName && (
            <InfoItem label="처리자명" value={data.paymentConfirmUserName} />
          )}
          {data.paymentConfirmedAt && (
            <InfoItem
              label="처리 시각"
              value={formatDate(data.paymentConfirmedAt)}
            />
          )}
        </InfoSection>
      )}

      {/* 신청 스케줄 */}
      {schedules.length > 0 && (
        <InfoSection title="신청 스케줄" icon={Calendar}>
          <RetreatScheduleTable
            schedules={schedules}
            selectedScheduleIds={selectedScheduleIds}
            readonly
          />
        </InfoSection>
      )}
    </>
  );
}
