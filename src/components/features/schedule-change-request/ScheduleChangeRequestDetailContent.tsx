import { InfoSection, InfoItem } from "@/components/common/detail-sidebar";
import { ScheduleChangeRequestTableData } from "@/hooks/schedule-change-request/use-schedule-change-request-columns";
import { TRetreatRegistrationSchedule } from "@/types";
import { StatusBadge, TypeBadge } from "@/components/Badge";
import { RetreatScheduleTable } from "@/components/common/retreat/RetreatScheduleTable";
import { formatDate } from "@/utils/formatDate";
import { useMemo } from "react";
import {
  UserCircle,
  CreditCard,
  Calendar,
  FileText,
} from "lucide-react";

interface ScheduleChangeRequestDetailContentProps {
  data: ScheduleChangeRequestTableData;
  schedules: TRetreatRegistrationSchedule[];
}

/**
 * 일정 변경 요청 - 상세 정보 사이드바 컨텐츠
 *
 * @description
 * - 신청자 기본 정보 (부서, 학년, 이름)
 * - 신청 정보 (금액, 타입, 입금 현황, 신청 시각)
 * - 메모 정보 (메모 내용, 작성자명, 작성 시각)
 * - 신청 스케줄
 */
export function ScheduleChangeRequestDetailContent({
  data,
  schedules,
}: ScheduleChangeRequestDetailContentProps) {
  // 선택된 스케줄 ID 추출
  const selectedScheduleIds = useMemo(() => {
    return data.scheduleIds || [];
  }, [data.scheduleIds]);

  return (
    <>
      {/* 기본 정보 - 2컬럼 그리드 */}
      <InfoSection title="기본 정보" icon={UserCircle} columns={2}>
        <InfoItem label="부서" value={data.department} />
        <InfoItem label="학년" value={data.grade} />
        <InfoItem label="이름" value={data.name} />
      </InfoSection>

      {/* 신청 정보 */}
      <InfoSection title="신청 정보" icon={CreditCard}>
        <InfoItem
          label="금액"
          value={`${data.amount?.toLocaleString()}원`}
        />
        <InfoItem
          label="타입"
          value={data.type ? <TypeBadge type={data.type as any} /> : "-"}
        />
        <InfoItem
          label="입금 현황"
          value={<StatusBadge status={data.status as any} />}
        />
        <InfoItem
          label="신청 시각"
          value={data.createdAt ? formatDate(data.createdAt) : "-"}
        />
      </InfoSection>

      {/* 메모 정보 */}
      {(data.memo || data.issuerName || data.memoCreatedAt) && (
        <InfoSection title="메모 정보" icon={FileText}>
          {data.memo && (
            <InfoItem
              label="메모 내용"
              value={
                <div className="whitespace-pre-wrap break-words">
                  {data.memo}
                </div>
              }
            />
          )}
          {data.issuerName && (
            <InfoItem label="작성자명" value={data.issuerName} />
          )}
          {data.memoCreatedAt && (
            <InfoItem
              label="작성 시각"
              value={formatDate(data.memoCreatedAt)}
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
