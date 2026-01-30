import { InfoSection, InfoItem } from "@/components/common/detail-sidebar";
import { GBSLineupRow } from "@/hooks/gbs-line-up/use-gbs-lineup";
import { TRetreatRegistrationSchedule, Gender } from "@/types";
import { GenderBadge, TypeBadge } from "@/components/Badge";
import { RetreatScheduleTable } from "@/components/common/retreat/RetreatScheduleTable";
import { useMemo, useState } from "react";
import {
  UserCircle,
  Calendar,
  FileText,
  MessageSquare,
  Info,
  Pencil,
} from "lucide-react";
import { MemoEditor } from "@/components/common/table/MemoEditor";
import { Button } from "@/components/ui/button";
import { RegistrationEditModal } from "@/components/features/common/RegistrationEditModal";

interface Grade {
  gradeId: number;
  gradeName: string;
  gradeNumber: number;
}

interface GbsLineUpDetailContentProps {
  data: GBSLineupRow;
  retreatSlug: string;
  schedules: TRetreatRegistrationSchedule[];
  grades: Grade[];
  onSaveScheduleMemo: (id: string, memo: string) => Promise<void>;
  onUpdateScheduleMemo: (id: string, memo: string) => Promise<void>;
  onDeleteScheduleMemo: (id: string) => Promise<void>;
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

export function GbsLineUpDetailContent({
  data,
  retreatSlug,
  schedules,
  grades,
  onSaveScheduleMemo,
  onUpdateScheduleMemo,
  onDeleteScheduleMemo,
  onUpdateRegistrationInfo,
  isMutating,
}: GbsLineUpDetailContentProps) {
  // 수정 모달 상태
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // 선택된 스케줄 ID 추출
  const selectedScheduleIds = useMemo(() => {
    return schedules
      .filter((schedule) => data.schedule[`schedule_${schedule.id}`])
      .map((schedule) => schedule.id);
  }, [schedules, data.schedule]);

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
              href={`tel:${data.phoneNumber}`}
              className="text-blue-600 hover:underline"
            >
              {data.phoneNumber || "-"}
            </a>
          }
        />
        <InfoItem label="부서 리더명" value={data.currentLeader || "-"} />
      </InfoSection>

      {/* GBS 정보 */}
      <InfoSection title="GBS 정보" icon={Info}>
        <InfoItem
          label="GBS 번호"
          value={data.gbsNumber ? `${data.gbsNumber}번` : "미배정"}
        />
        <InfoItem label="리더 여부" value={data.isLeader ? "리더" : "일반"} />
        {data.gbsMemo && <InfoItem label="GBS 메모" value={data.gbsMemo} />}
        <InfoItem
          label="타입"
          value={data.type ? <TypeBadge type={data.type} /> : "-"}
        />
      </InfoSection>

      {/* 신청 스케줄 */}
      {schedules.length > 0 && (
        <InfoSection title="신청 스케줄" icon={Calendar}>
          <div className="space-y-2">
            <InfoItem
              label="참석 현황"
              value={data.isFullAttendance ? "전체 참석" : "일부 불참"}
            />
            <RetreatScheduleTable
              schedules={schedules}
              selectedScheduleIds={selectedScheduleIds}
              readonly
            />
          </div>
        </InfoSection>
      )}

      {/* 라인업 메모 */}
      <InfoSection title="라인업 메모" icon={MessageSquare}>
        <div className="space-y-2">
          {data.lineupMemo ? (
            <div
              className="p-3 rounded-md border"
              style={{ backgroundColor: data.lineupMemocolor || "transparent" }}
            >
              <p className="text-sm whitespace-pre-wrap">{data.lineupMemo}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">메모가 없습니다.</p>
          )}
        </div>
      </InfoSection>

      {/* 일정 변동 요청 메모 */}
      <InfoSection title="일정 변동 요청 메모" icon={FileText}>
        <div className="space-y-2">
          <p className="text-xs text-gray-500">
            * 재정 간사가 처리하면 메모가 사라집니다
          </p>
          <MemoEditor
            row={data}
            memoValue={data.unresolvedLineupHistoryMemo}
            onSave={async (id, memo) => {
              await onSaveScheduleMemo(id, memo);
            }}
            onUpdate={async (id, memo) => {
              await onUpdateScheduleMemo(id, memo);
            }}
            onDelete={async (id) => {
              await onDeleteScheduleMemo(id);
            }}
            hasExistingMemo={(r) => !!r.unresolvedLineupHistoryMemo}
          />
        </div>
      </InfoSection>

      {/* 행정간사 메모 */}
      {data.adminMemo && (
        <InfoSection title="행정간사 메모" icon={Info}>
          <div className="p-3 rounded-md border bg-gray-50">
            <p className="text-sm whitespace-pre-wrap">{data.adminMemo}</p>
          </div>
        </InfoSection>
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
            phoneNumber: data.phoneNumber,
            gender: data.gender,
            gradeNumber,
            currentLeaderName: data.currentLeader || "",
          }}
          grades={grades}
          isLoading={isMutating}
          showCurrentLeaderName={true}
        />
      )}
    </>
  );
}
