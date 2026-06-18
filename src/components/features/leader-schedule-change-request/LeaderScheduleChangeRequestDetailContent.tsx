import {
  Calendar,
  FileText,
  UserCircle,
} from "lucide-react";

import { GenderBadge } from "@/components/Badge";
import { InfoItem, InfoSection } from "@/components/common/detail-sidebar";
import { LeaderScheduleChangeStatusBadge } from "@/components/common/retreat";
import { ILeaderScheduleChangeRequest } from "@/types/leader-report";
import { TRetreatRegistrationSchedule } from "@/types";
import { formatDate } from "@/utils/formatDate";

import { ScheduleChangeCheckboxRows } from "./schedule-slot-utils";

interface LeaderScheduleChangeRequestDetailContentProps {
  data: ILeaderScheduleChangeRequest;
  schedules: TRetreatRegistrationSchedule[];
}

/**
 * 리더 일정 변경 요청 - 상세 정보 사이드바 컨텐츠
 *
 * - 신청자 기본 정보 (부서, 학년, 성별, 이름, GBS)
 * - 변경 전 → 변경 후 일정 슬롯
 * - 요청 정보 (요청자, 사유, 상태, 검토자, 시각)
 */
export function LeaderScheduleChangeRequestDetailContent({
  data,
  schedules,
}: LeaderScheduleChangeRequestDetailContentProps) {
  return (
    <>
      <InfoSection title="기본 정보" icon={UserCircle} columns={2}>
        <InfoItem label="부서" value={`${data.univGroupNumber}부`} />
        <InfoItem label="학년" value={`${data.gradeNumber}학년`} />
        <InfoItem label="이름" value={data.memberName} />
        <InfoItem label="성별" value={<GenderBadge gender={data.gender} />} />
        <InfoItem label="GBS" value={`${data.gbsNumber}`} />
        <InfoItem label="요청자" value={data.requesterName} />
      </InfoSection>

      <InfoSection title="일정 변경 내역" icon={Calendar}>
        <ScheduleChangeCheckboxRows
          beforeScheduleIds={data.beforeScheduleIds}
          afterScheduleIds={data.afterScheduleIds}
          schedules={schedules}
        />
      </InfoSection>

      <InfoSection title="요청 정보" icon={FileText}>
        <InfoItem
          label="상태"
          value={<LeaderScheduleChangeStatusBadge status={data.status} />}
        />
        <InfoItem
          label="사유"
          value={
            <div className="whitespace-pre-wrap break-words">{data.reason}</div>
          }
        />
        <InfoItem
          label="요청 시각"
          value={data.createdAt ? formatDate(data.createdAt) : "-"}
        />
        {data.reviewerName && (
          <InfoItem label="검토자" value={data.reviewerName} />
        )}
        {data.reviewedAt && (
          <InfoItem label="검토 시각" value={formatDate(data.reviewedAt)} />
        )}
        {data.memo && (
          <InfoItem
            label="메모"
            value={<div className="whitespace-pre-wrap break-words">{data.memo}</div>}
          />
        )}
      </InfoSection>
    </>
  );
}
