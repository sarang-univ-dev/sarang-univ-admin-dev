import { Heart, MessageSquare, UserCircle } from "lucide-react";

import { InfoItem, InfoSection } from "@/components/common/detail-sidebar";
import { ILeaderReport } from "@/types/leader-report";
import { formatDate } from "@/utils/formatDate";

interface LeaderReportDetailContentProps {
  data: ILeaderReport;
}

/**
 * 리더 리포트 상세 사이드바 컨텐츠
 *
 * - 기본 정보 (날짜, GBS, 작성자, 수정 시각)
 * - 은혜나눔 / 기도제목 전문 (whitespace-pre-wrap)
 */
export function LeaderReportDetailContent({
  data,
}: LeaderReportDetailContentProps) {
  return (
    <>
      <InfoSection title="기본 정보" icon={UserCircle} columns={2}>
        <InfoItem label="날짜" value={data.reportDate} />
        <InfoItem label="GBS" value={`${data.gbsNumber}`} />
        <InfoItem label="작성자" value={data.authorName} />
        <InfoItem
          label="수정 시각"
          value={data.updatedAt ? formatDate(data.updatedAt) : "-"}
        />
      </InfoSection>

      <InfoSection title="은혜나눔" icon={Heart}>
        <div className="whitespace-pre-wrap break-words text-sm text-gray-900">
          {data.graceSharing || "-"}
        </div>
      </InfoSection>

      <InfoSection title="기도제목" icon={MessageSquare}>
        <div className="whitespace-pre-wrap break-words text-sm text-gray-900">
          {data.prayerRequests || "-"}
        </div>
      </InfoSection>
    </>
  );
}
