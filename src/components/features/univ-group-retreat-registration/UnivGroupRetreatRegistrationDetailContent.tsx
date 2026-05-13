"use client";

import { InfoSection, InfoItem } from "@/components/common/detail-sidebar";
import { UnivGroupAdminStaffData } from "@/types/univ-group-admin-staff";
import { TRetreatRegistrationSchedule, Gender } from "@/types";
import { GenderBadge, StatusBadge, TypeBadge } from "@/components/Badge";
import { ShuttleBusStatusBadge } from "./ShuttleBusStatusBadge";
import { QrDownloadButton } from "./QrDownloadButton";
import { RetreatScheduleTable } from "@/components/common/retreat/RetreatScheduleTable";
import { formatDate } from "@/utils/formatDate";
import { useMemo, useState } from "react";
import { UserCircle, CreditCard, Calendar, Info, FileText, Trash2, Pencil } from "lucide-react";
import { MemoEditor } from "@/components/common/table/MemoEditor";
import { Button } from "@/components/ui/button";
import { UserRetreatRegistrationPaymentStatus } from "@/types";
import { RegistrationEditModal } from "@/components/features/common/RegistrationEditModal";

interface Grade {
  gradeId: number;
  gradeName: string;
  gradeNumber: number;
}

interface UnivGroupRetreatRegistrationDetailContentProps {
  data: UnivGroupAdminStaffData;
  retreatSlug: string;
  schedules: TRetreatRegistrationSchedule[];
  grades: Grade[];
  onSaveScheduleMemo: (id: string, memo: string) => Promise<void>;
  onUpdateScheduleMemo: (historyMemoId: number, memo: string) => Promise<void>;
  onDeleteScheduleMemo: (historyMemoId: number) => Promise<void>;
  onSaveAdminMemo: (id: string, memo: string) => Promise<unknown>;
  onUpdateAdminMemo: (memoId: number, memo: string) => Promise<unknown>;
  onDeleteAdminMemo: (memoId: number) => Promise<unknown>;
  onDeleteRegistration?: (id: string) => Promise<void>;
  onUpdateRegistrationInfo?: (
    id: string,
    data: {
      name: string;
      phoneNumber: string;
      gender: Gender;
      gradeId: number;
      currentLeaderName: string;
    }
  ) => Promise<void>;
  isMutating: boolean;
}

// 삭제 가능한 상태
const DELETABLE_STATUSES = [
  UserRetreatRegistrationPaymentStatus.PENDING,
  UserRetreatRegistrationPaymentStatus.NEW_COMER_REQUEST,
  UserRetreatRegistrationPaymentStatus.SOLDIER_REQUEST,
];

export function UnivGroupRetreatRegistrationDetailContent({
  data,
  retreatSlug,
  schedules,
  grades,
  onSaveScheduleMemo,
  onUpdateScheduleMemo,
  onDeleteScheduleMemo,
  onSaveAdminMemo,
  onUpdateAdminMemo,
  onDeleteAdminMemo,
  onDeleteRegistration,
  onUpdateRegistrationInfo,
  isMutating,
}: UnivGroupRetreatRegistrationDetailContentProps) {
  // 수정 모달 상태
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // 삭제 가능한 상태인지 확인
  const isDeletable = DELETABLE_STATUSES.includes(data.status);
  // 선택된 스케줄 ID 추출
  const selectedScheduleIds = useMemo(() => {
    return schedules
      .filter((schedule) => data.schedules[`schedule_${schedule.id}`])
      .map((schedule) => schedule.id);
  }, [schedules, data.schedules]);

  // data.grade에서 gradeNumber 추출 (예: "1학년" -> 1)
  const gradeNumber = useMemo(() => {
    const match = data.grade.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 1;
  }, [data.grade]);

  return (
    <>
      {/* 기본 정보 - 2컬럼 그리드 */}
      <InfoSection
        title="기본 정보"
        icon={UserCircle}
        columns={2}
        action={
          onUpdateRegistrationInfo && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditModalOpen(true)}
              disabled={isMutating}
              className="h-7 px-2"
            >
              <Pencil className="h-3.5 w-3.5 mr-1" />
              수정
            </Button>
          )
        }
      >
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

      {/* 신청 정보 (처리 정보 포함) */}
      <InfoSection title="신청 정보" icon={CreditCard}>
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
        {/* 입금 확인 정보 */}
        {data.confirmedBy && (
          <InfoItem label="입금 확인자" value={data.confirmedBy} />
        )}
        {data.paymentConfirmedAt && (
          <InfoItem
            label="입금 확인 시각"
            value={formatDate(data.paymentConfirmedAt)}
          />
        )}
      </InfoSection>

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

      {/* 일정 변동 요청 메모 */}
      <InfoSection title="일정 변동 요청 메모" icon={FileText}>
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
            hasExistingMemo={(r) => !!r.memo && !!r.historyMemoId}
          />
        </div>
      </InfoSection>

      {/* 행정간사 메모 */}
      <InfoSection title="행정간사 메모" icon={FileText}>
        <MemoEditor
          row={data}
          memoValue={data.staffMemo}
          onSave={async (id, memo) => {
            await onSaveAdminMemo(id, memo);
          }}
          onUpdate={async (id, memo) => {
            if (data.adminMemoId) {
              await onUpdateAdminMemo(data.adminMemoId, memo);
            }
          }}
          onDelete={async () => {
            if (data.adminMemoId) {
              await onDeleteAdminMemo(data.adminMemoId);
            }
          }}
          hasExistingMemo={(r) => !!r.staffMemo && !!r.adminMemoId}
          placeholder="행정간사 메모를 입력하세요..."
        />
      </InfoSection>

      {/* 기타 정보 */}
      <InfoSection title="기타 정보" icon={Info}>
        <InfoItem
          label="셔틀버스"
          value={<ShuttleBusStatusBadge hasRegistered={data.hadRegisteredShuttleBus} />}
        />
        <InfoItem
          label="QR 코드"
          value={
            data.qrUrl ? (
              <QrDownloadButton
                retreatSlug={retreatSlug}
                registrationId={data.id}
                userName={data.name}
              />
            ) : (
              <span className="text-sm text-gray-500">미생성</span>
            )
          }
        />
      </InfoSection>

      {/* 신청 삭제 버튼 - 삭제 가능한 상태에서만 표시 */}
      {isDeletable && onDeleteRegistration && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDeleteRegistration(String(data.id))}
            disabled={isMutating}
            className="w-full flex items-center justify-center gap-2"
          >
            {isMutating ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            <span>신청 삭제</span>
          </Button>
          <p className="text-xs text-gray-500 mt-2 text-center">
            삭제된 신청은 복구할 수 없습니다.
          </p>
        </div>
      )}

      {/* 수정 모달 */}
      {onUpdateRegistrationInfo && (
        <RegistrationEditModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          onSave={async (editData) => {
            await onUpdateRegistrationInfo(data.id, editData);
          }}
          initialData={{
            name: data.name,
            phoneNumber: data.phone,
            gender: data.gender,
            gradeNumber,
            currentLeaderName: data.currentLeaderName || "",
          }}
          grades={grades}
          isLoading={isMutating}
          showCurrentLeaderName={true}
        />
      )}
    </>
  );
}
