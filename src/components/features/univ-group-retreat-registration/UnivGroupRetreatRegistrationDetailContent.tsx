import { InfoSection, InfoItem } from "@/components/common/detail-sidebar";
import { UnivGroupAdminStaffData } from "@/types/univ-group-admin-staff";
import { TRetreatRegistrationSchedule } from "@/types";
import { GenderBadge, StatusBadge, TypeBadge } from "@/components/Badge";
import { ShuttleBusStatusBadge } from "./ShuttleBusStatusBadge";
import { RetreatScheduleTable } from "@/components/common/retreat/RetreatScheduleTable";
import { formatDate } from "@/utils/formatDate";
import { useMemo } from "react";

interface UnivGroupRetreatRegistrationDetailContentProps {
  data: UnivGroupAdminStaffData;
  retreatSlug: string;
  schedules: TRetreatRegistrationSchedule[];
}

export function UnivGroupRetreatRegistrationDetailContent({
  data,
  retreatSlug,
  schedules,
}: UnivGroupRetreatRegistrationDetailContentProps) {
  // 선택된 스케줄 ID 추출
  const selectedScheduleIds = useMemo(() => {
    return schedules
      .filter((schedule) => data.schedules[`schedule_${schedule.id}`])
      .map((schedule) => schedule.id);
  }, [schedules, data.schedules]);

  return (
    <>
      {/* 기본 정보 */}
      <InfoSection title="📋 기본 정보">
        <InfoItem label="이름" value={data.name} />
        <InfoItem label="부서" value={data.department} />
        <InfoItem label="학년" value={data.grade} />
        <InfoItem label="성별" value={<GenderBadge gender={data.gender} />} />
        <InfoItem
          label="전화번호"
          value={
            <a
              href={`tel:${data.phone}`}
              className="text-blue-600 hover:underline"
            >
              {data.phone || "-"}
            </a>
          }
        />
        <InfoItem label="부서 리더명" value={data.currentLeaderName || "-"} />
      </InfoSection>

      {/* 신청 정보 */}
      <InfoSection title="💰 신청 정보">
        <InfoItem
          label="신청시각"
          value={formatDate(data.createdAt)}
        />
        <InfoItem
          label="타입"
          value={data.type ? <TypeBadge type={data.type} /> : "-"}
        />
        <InfoItem
          label="금액"
          value={
            <span className="font-bold text-lg">
              {data.amount?.toLocaleString()}원
            </span>
          }
        />
        <InfoItem
          label="입금 현황"
          value={<StatusBadge status={data.status} />}
        />
      </InfoSection>

      {/* 신청 스케줄 */}
      {schedules.length > 0 && (
        <InfoSection title="📅 신청 스케줄">
          <RetreatScheduleTable
            schedules={schedules}
            selectedScheduleIds={selectedScheduleIds}
            readonly
          />
        </InfoSection>
      )}

      {/* 기타 정보 */}
      <InfoSection title="🚌 기타 정보">
        <InfoItem
          label="셔틀버스"
          value={<ShuttleBusStatusBadge hasRegistered={data.hadRegisteredShuttleBus} />}
        />
      </InfoSection>

      {/* 처리 정보 */}
      {(data.confirmedBy || data.paymentConfirmedAt) && (
        <InfoSection title="ℹ️ 처리 정보">
          {data.confirmedBy && (
            <InfoItem label="처리자명" value={data.confirmedBy} />
          )}
          {data.paymentConfirmedAt && (
            <InfoItem
              label="처리시각"
              value={formatDate(data.paymentConfirmedAt)}
            />
          )}
        </InfoSection>
      )}

      {/* 일정 변동 요청 메모 */}
      {data.memo && (
        <InfoSection title="📝 일정 변동 요청 메모">
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm whitespace-pre-wrap">{data.memo}</p>
          </div>
        </InfoSection>
      )}

      {/* 행정간사 메모 */}
      {data.staffMemo && (
        <InfoSection title="✏️ 행정간사 메모">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm whitespace-pre-wrap">{data.staffMemo}</p>
          </div>
        </InfoSection>
      )}

      {/* QR 코드 */}
      {data.qrUrl && (
        <InfoSection title="QR 코드">
          <div className="flex justify-center p-4">
            <img
              src={data.qrUrl}
              alt="QR Code"
              className="w-64 h-64 border rounded-lg"
            />
          </div>
        </InfoSection>
      )}
    </>
  );
}
