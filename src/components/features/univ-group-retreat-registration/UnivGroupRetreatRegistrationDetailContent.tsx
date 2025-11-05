import { InfoSection, InfoItem } from "@/components/common/detail-sidebar";
import { UnivGroupAdminStaffData } from "@/types/univ-group-admin-staff";
import { TRetreatRegistrationSchedule } from "@/types";
import { GenderBadge, StatusBadge, TypeBadge } from "@/components/Badge";
import { ShuttleBusStatusBadge } from "./ShuttleBusStatusBadge";
import { RetreatScheduleTable } from "@/components/common/retreat/RetreatScheduleTable";
import { formatDate } from "@/utils/formatDate";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { webAxios } from "@/lib/api/axios";
import { MemoEditor } from "@/components/common/table/MemoEditor";

interface UnivGroupRetreatRegistrationDetailContentProps {
  data: UnivGroupAdminStaffData;
  retreatSlug: string;
  schedules: TRetreatRegistrationSchedule[];
  onSaveScheduleMemo: (id: string, memo: string) => Promise<void>;
  onUpdateScheduleMemo: (historyMemoId: number, memo: string) => Promise<void>;
  onDeleteScheduleMemo: (historyMemoId: number) => Promise<void>;
  isMutating: boolean;
}

export function UnivGroupRetreatRegistrationDetailContent({
  data,
  retreatSlug,
  schedules,
  onSaveScheduleMemo,
  onUpdateScheduleMemo,
  onDeleteScheduleMemo,
  isMutating,
}: UnivGroupRetreatRegistrationDetailContentProps) {
  // 선택된 스케줄 ID 추출
  const selectedScheduleIds = useMemo(() => {
    return schedules
      .filter((schedule) => data.schedules[`schedule_${schedule.id}`])
      .map((schedule) => schedule.id);
  }, [schedules, data.schedules]);

  // QR 다운로드 핸들러
  const handleDownloadQR = async () => {
    try {
      const response = await webAxios.get(
        `/api/v1/retreat/${retreatSlug}/qr/${data.id}/download`,
        { responseType: 'blob' }
      );

      // Blob에서 파일명 추출 (Content-Disposition 헤더에서)
      const contentDisposition = response.headers['content-disposition'];
      const fileName = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : `QR_${data.name}.png`;

      // Blob을 다운로드
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('QR 다운로드 실패:', error);
    }
  };

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
          value={`${data.amount?.toLocaleString()}원`}
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
        <InfoItem
          label="QR 코드"
          value={
            data.qrUrl ? (
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownloadQR}
              >
                <Download className="h-4 w-4 mr-2" />
                QR 다운로드
              </Button>
            ) : (
              <span className="text-sm text-gray-500">미생성</span>
            )
          }
        />
      </InfoSection>

      {/* 일정 변동 요청 메모 */}
      <InfoSection title="📝 일정 변동 요청 메모">
        <div className="space-y-2">
          <p className="text-xs text-gray-500">
            * 재정 간사가 처리하면 메모가 사라집니다
          </p>
          <MemoEditor
            row={data}
            memoValue={data.memo}
            onSave={async (id, memo) => {
              await onSaveScheduleMemo(id, memo);
            }}
            onUpdate={async (id, memo) => {
              if (data.historyMemoId) {
                await onUpdateScheduleMemo(data.historyMemoId, memo);
              }
            }}
            onDelete={async () => {
              if (data.historyMemoId) {
                await onDeleteScheduleMemo(data.historyMemoId);
              }
            }}
            loading={isMutating}
            hasExistingMemo={(r) => !!r.memo && !!r.historyMemoId}
          />
        </div>
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

      {/* 행정간사 메모 */}
      {data.staffMemo && (
        <InfoSection title="✏️ 행정간사 메모">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm whitespace-pre-wrap">{data.staffMemo}</p>
          </div>
        </InfoSection>
      )}
    </>
  );
}
