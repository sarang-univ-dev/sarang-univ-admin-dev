"use client";

import { InfoSection, InfoItem } from "@/components/common/detail-sidebar";
import { IUnivGroupBusRegistration } from "@/types/bus-registration";
import { TRetreatShuttleBus, UserRetreatShuttleBusPaymentStatus, Gender } from "@/types";
import { GenderBadge } from "@/components/Badge-bus";
import { StatusBadge } from "@/components/Badge-bus";
import { formatDate } from "@/utils/formatDate";
import { useMemo, useState } from "react";
import { MemoEditor } from "@/components/common/table/MemoEditor";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  UserCircle,
  Bus,
  Calendar,
  FileText,
  Trash2,
  Pencil,
} from "lucide-react";
import { RegistrationEditModal } from "@/components/features/common/RegistrationEditModal";

interface ScheduleWithColor {
  id: number;
  label: string;
  color: string;
  bgColorClass: string;
}

interface Grade {
  gradeId: number;
  gradeName: string;
  gradeNumber: number;
}

interface UnivGroupBusRegistrationDetailContentProps {
  data: IUnivGroupBusRegistration;
  schedules: TRetreatShuttleBus[];
  scheduleColumnsWithColor: ScheduleWithColor[];
  grades: Grade[];
  onSaveMemo: (id: string, memo: string) => Promise<void>;
  onUpdateMemo: (id: string, memo: string) => Promise<void>;
  onDeleteMemo: (id: string) => Promise<void>;
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
  onSaveOrUpdateAdminMemo: (id: string, memo: string) => Promise<void>;
  onDeleteAdminMemo: (memoId: number) => Promise<void>;
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
  scheduleColumnsWithColor,
  grades,
  onSaveMemo,
  onUpdateMemo,
  onDeleteMemo,
  onDeleteRegistration,
  onUpdateRegistrationInfo,
  onSaveOrUpdateAdminMemo,
  onDeleteAdminMemo,
  isMutating,
}: UnivGroupBusRegistrationDetailContentProps) {
  // 수정 모달 상태
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // 삭제 가능한 상태인지 확인 (PENDING만)
  const isDeletable =
    data.shuttleBusPaymentStatus === UserRetreatShuttleBusPaymentStatus.PENDING;
  // 색상 매핑 헬퍼 함수
  const getScheduleColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      rose: "bg-rose-50 border-rose-200",
      amber: "bg-amber-50 border-amber-200",
      teal: "bg-teal-50 border-teal-200",
      indigo: "bg-indigo-50 border-indigo-200",
    };
    return colorMap[color] || "bg-gray-50 border-gray-200";
  };

  const getCheckboxColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      rose: "data-[state=checked]:bg-rose-500 data-[state=checked]:border-rose-500",
      amber: "data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500",
      teal: "data-[state=checked]:bg-teal-500 data-[state=checked]:border-teal-500",
      indigo: "data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500",
    };
    return colorMap[color] || "";
  };

  // 선택된 스케줄 정보 추출 (색상 정보 포함)
  const selectedSchedules = useMemo(() => {
    return schedules
      .filter((schedule) =>
        data.userRetreatShuttleBusRegistrationScheduleIds?.includes(schedule.id)
      )
      .map((schedule) => {
        const colorInfo = scheduleColumnsWithColor.find(
          (s) => s.id === schedule.id
        );
        return {
          ...schedule,
          color: colorInfo?.color || "gray",
        };
      });
  }, [schedules, scheduleColumnsWithColor, data.userRetreatShuttleBusRegistrationScheduleIds]);

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
      </InfoSection>

      {/* 버스 신청 정보 (처리 정보 포함) */}
      <InfoSection title="버스 신청 정보" icon={Bus}>
        <InfoItem
          label="신청시각"
          value={formatDate(data.createdAt)}
        />
        <InfoItem label="금액" value={`${data.price.toLocaleString()}원`} />
        <InfoItem
          label="입금 현황"
          value={<StatusBadge status={data.shuttleBusPaymentStatus} />}
        />
        {/* 입금 확인 정보 */}
        {data.paymentConfirmUserName && (
          <InfoItem label="입금 확인자" value={data.paymentConfirmUserName} />
        )}
        {data.paymentConfirmedAt && (
          <InfoItem
            label="입금 확인 시각"
            value={formatDate(data.paymentConfirmedAt)}
          />
        )}
      </InfoSection>

      {/* 선택한 버스 스케줄 */}
      <InfoSection title="선택한 버스 스케줄" icon={Calendar}>
        {selectedSchedules.length === 0 ? (
          <p className="text-sm text-gray-500">선택한 스케줄이 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {selectedSchedules.map((schedule) => (
              <div
                key={schedule.id}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-md border",
                  getScheduleColorClass(schedule.color)
                )}
              >
                <Checkbox
                  checked
                  disabled
                  className={cn(getCheckboxColorClass(schedule.color))}
                />
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

      {/* 일정 변동 요청 메모 */}
      <InfoSection title="일정 변동 요청 메모" icon={FileText}>
        <div className="space-y-2">
          <p className="text-xs text-gray-500">
            * 재정 간사가 처리하면 메모가 사라집니다
          </p>
          <MemoEditor
            row={{ id: data.id.toString() }}
            memoValue={data.univGroupStaffShuttleBusHistoryMemo}
            onSave={async (id, memo) => {
              await onSaveMemo(id, memo);
            }}
            onUpdate={async (id, memo) => {
              await onUpdateMemo(id, memo);
            }}
            onDelete={async (id) => {
              await onDeleteMemo(id);
            }}
            hasExistingMemo={(row) => !!data.univGroupStaffShuttleBusHistoryMemo}
            placeholder="일정 변경 요청 메모를 입력하세요... (예: 수 정발 -> 수 부분참 7시)"
          />
        </div>
      </InfoSection>

      {/* 행정간사 메모 */}
      <InfoSection title="행정간사 메모" icon={FileText}>
        <div className="space-y-2">
          <p className="text-xs text-gray-500">
            * 본인이 작성한 메모만 수정/삭제 가능합니다
          </p>
          <MemoEditor
            row={{ id: data.id.toString() }}
            memoValue={data.adminMemo}
            onSave={async (id, memo) => {
              await onSaveOrUpdateAdminMemo(id, memo);
            }}
            onUpdate={async (id, memo) => {
              await onSaveOrUpdateAdminMemo(id, memo);
            }}
            onDelete={async () => {
              if (data.adminMemoId) {
                await onDeleteAdminMemo(data.adminMemoId);
              }
            }}
            hasExistingMemo={() => !!data.adminMemo}
            placeholder="관리자 메모를 입력하세요"
          />
        </div>
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

      {/* 수정 모달 - 셔틀버스는 currentLeaderName 필드가 없음 */}
      {onUpdateRegistrationInfo && (
        <RegistrationEditModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          onSave={async (editData) => {
            await onUpdateRegistrationInfo(data.id.toString(), editData);
          }}
          initialData={{
            name: data.name,
            phoneNumber: data.userPhoneNumber,
            gender: data.gender,
            gradeNumber: data.gradeNumber,
            currentLeaderName: "", // 셔틀버스에는 없음
          }}
          grades={grades}
          isLoading={isMutating}
          showCurrentLeaderName={false}
        />
      )}
    </>
  );
}
