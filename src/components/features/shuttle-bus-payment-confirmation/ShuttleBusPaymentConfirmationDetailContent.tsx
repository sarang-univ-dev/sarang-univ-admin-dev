import { InfoSection, InfoItem } from "@/components/common/detail-sidebar";
import { IShuttleBusPaymentConfirmationRegistration } from "@/types/shuttle-bus-payment-confirmation";
import { TRetreatShuttleBus } from "@/types";
import { GenderBadge, StatusBadge } from "@/components/Badge-bus";
import { formatDate } from "@/utils/formatDate";
import { useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";

interface ShuttleBusPaymentConfirmationDetailContentProps {
  data: IShuttleBusPaymentConfirmationRegistration;
  schedules: TRetreatShuttleBus[];
  retreatSlug: string;
}

/**
 * 셔틀버스 재정 팀원 - 입금 확인 상세 정보 컴포넌트
 * - Sheet에서 표시되는 상세 정보
 * - 시각 정보 포함 (테이블에는 제거)
 */
export function ShuttleBusPaymentConfirmationDetailContent({
  data,
  schedules,
  retreatSlug,
}: ShuttleBusPaymentConfirmationDetailContentProps) {
  // 선택된 스케줄 정보 추출
  const selectedSchedules = useMemo(() => {
    return schedules.filter((schedule) =>
      data.userRetreatShuttleBusRegistrationScheduleIds?.includes(schedule.id)
    );
  }, [schedules, data.userRetreatShuttleBusRegistrationScheduleIds]);

  return (
    <>
      {/* 기본 정보 */}
      <InfoSection title="📋 기본 정보">
        <InfoItem label="이름" value={data.name} />
        <InfoItem label="부서" value={`${data.univGroupNumber}부`} />
        <InfoItem label="학년" value={`${data.gradeNumber}학년`} />
        <InfoItem label="성별" value={<GenderBadge gender={data.gender} />} />
        <InfoItem
          label="전화번호"
          value={
            data.userPhoneNumber ? (
              <a
                href={`tel:${data.userPhoneNumber}`}
                className="text-blue-600 hover:underline"
              >
                {data.userPhoneNumber}
              </a>
            ) : (
              "-"
            )
          }
        />
        <InfoItem
          label="관리자 연락처"
          value={data.isAdminContact ? "예" : "아니오"}
        />
      </InfoSection>

      {/* 버스 신청 정보 */}
      <InfoSection title="🚌 버스 신청 정보">
        <InfoItem label="금액" value={`${data.price.toLocaleString()}원`} />
        <InfoItem
          label="입금 현황"
          value={<StatusBadge status={data.shuttleBusPaymentStatus} />}
        />
        {/* ✅ TIMESTAMP INFO HERE */}
        <InfoItem
          label="신청 시각"
          value={formatDate(data.createdAt)}
        />
        <InfoItem
          label="처리자명"
          value={data.paymentConfirmUserName || "-"}
        />
        <InfoItem
          label="처리 시각"
          value={data.paymentConfirmedAt ? formatDate(data.paymentConfirmedAt) : "-"}
        />
      </InfoSection>

      {/* 선택한 버스 스케줄 */}
      <InfoSection title="🕐 선택한 버스 스케줄">
        {selectedSchedules.length === 0 ? (
          <p className="text-sm text-gray-500">선택한 스케줄이 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {selectedSchedules.map((schedule) => (
              <div
                key={schedule.id}
                className="flex items-center gap-2 p-2 bg-gray-50 rounded-md"
              >
                <Checkbox checked disabled />
                <div className="flex-1">
                  <p className="text-sm font-medium">{schedule.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatDate(schedule.departureTime)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </InfoSection>
    </>
  );
}
