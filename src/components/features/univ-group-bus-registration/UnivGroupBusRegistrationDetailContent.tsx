import { InfoSection, InfoItem } from "@/components/common/detail-sidebar";
import { IUnivGroupBusRegistration } from "@/types/bus-registration";
import { TRetreatShuttleBus } from "@/types";
import { GenderBadge } from "@/components/Badge-bus";
import { StatusBadge } from "@/components/Badge-bus";
import { formatDate } from "@/utils/formatDate";
import { useMemo } from "react";
import { MemoEditor } from "@/components/common/table/MemoEditor";
import { Checkbox } from "@/components/ui/checkbox";

interface UnivGroupBusRegistrationDetailContentProps {
  data: IUnivGroupBusRegistration;
  schedules: TRetreatShuttleBus[];
  onSaveMemo: (id: string, memo: string) => Promise<void>;
  isMutating: boolean;
}

/**
 * 부서 셔틀버스 등록 상세 정보 컴포넌트
 * - Sheet에서 표시되는 상세 정보
 * - 시각 정보 포함 (테이블에는 제거)
 */
export function UnivGroupBusRegistrationDetailContent({
  data,
  schedules,
  onSaveMemo,
  isMutating,
}: UnivGroupBusRegistrationDetailContentProps) {
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
            <a
              href={`tel:${data.userPhoneNumber}`}
              className="text-blue-600 hover:underline"
            >
              {data.userPhoneNumber || "-"}
            </a>
          }
        />
        <InfoItem label="부서 리더명" value={data.currentLeaderName || "-"} />
      </InfoSection>

      {/* 버스 신청 정보 */}
      <InfoSection title="🚌 버스 신청 정보">
        <InfoItem label="금액" value={`${data.price.toLocaleString()}원`} />
        <InfoItem
          label="입금 현황"
          value={<StatusBadge status={data.shuttleBusPaymentStatus} />}
        />
        <InfoItem
          label="신청시각"
          value={formatDate(data.createdAt)}
        />
        <InfoItem
          label="처리자명"
          value={data.paymentConfirmUserName || "-"}
        />
        <InfoItem
          label="처리시각"
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
                    {schedule.date} {schedule.time}
                  </p>
                  <p className="text-xs text-gray-500">{schedule.location}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </InfoSection>

      {/* 일정 변동 요청 메모 */}
      <InfoSection title="📝 일정 변동 요청 메모">
        <MemoEditor
          id={data.id.toString()}
          memo={data.univGroupStaffShuttleBusHistoryMemo || ""}
          onSave={onSaveMemo}
          isLoading={isMutating}
          placeholder="일정 변경 요청 메모를 입력하세요... (예: 수 정발 -> 수 부분참 7시)"
        />
      </InfoSection>
    </>
  );
}
