"use client";

import { useEffect, useMemo, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";

import { MemoEditor } from "@/components/common/table/MemoEditor";
import { DormitoryStatusBadge } from "@/components/common/retreat/badges";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToastStore } from "@/store/toast-store";
import { TDormitoryManagementRow } from "@/types";
import { DormitoryUpdateFields } from "@/hooks/dormitory/use-dormitory-management";

const columnHelper = createColumnHelper<TDormitoryManagementRow>();

/**
 * 정원/최대 인원 인라인 편집 셀.
 * blur/Enter 저장, Escape 복귀, 1 이상 정수 + max≥optimal client 검증.
 * 최대 인원은 비우면 null(미설정), 정원은 비우면 복귀.
 */
function DormitoryCapacityCell({
  dormitoryId,
  field,
  value,
  optimalCapacity,
  maxCapacity,
  onSave,
}: {
  dormitoryId: number;
  field: "optimalCapacity" | "maxCapacity";
  value: number | null | undefined;
  optimalCapacity: number;
  maxCapacity: number | null | undefined;
  onSave: (id: number, fields: DormitoryUpdateFields) => Promise<void>;
}) {
  const toText = (v: number | null | undefined) => (v == null ? "" : String(v));
  const [draft, setDraft] = useState(toText(value));
  const [isPending, setIsPending] = useState(false);
  const addToast = useToastStore(state => state.add);

  useEffect(() => {
    setDraft(toText(value));
  }, [value]);

  const revert = () => setDraft(toText(value));

  const commit = async () => {
    const trimmed = draft.trim();

    let nextValue: number | null;
    if (trimmed === "") {
      if (field === "optimalCapacity") {
        revert();
        return;
      }
      nextValue = null;
    } else {
      const parsed = Number(trimmed);
      if (!Number.isInteger(parsed) || parsed < 1) {
        addToast({
          title: "입력 오류",
          description: "1 이상의 정수를 입력해주세요.",
          variant: "destructive",
        });
        revert();
        return;
      }
      nextValue = parsed;
    }

    if ((value ?? null) === nextValue) return;

    const nextOptimal =
      field === "optimalCapacity" ? (nextValue as number) : optimalCapacity;
    const nextMax = field === "maxCapacity" ? nextValue : maxCapacity ?? null;
    if (nextMax != null && nextMax < nextOptimal) {
      addToast({
        title: "입력 오류",
        description: "최대 인원은 정원보다 작을 수 없습니다.",
        variant: "destructive",
      });
      revert();
      return;
    }

    setIsPending(true);
    try {
      await onSave(dormitoryId, { [field]: nextValue } as DormitoryUpdateFields);
    } catch {
      revert();
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex justify-center px-1">
      <Input
        type="number"
        min={1}
        value={draft}
        disabled={isPending}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === "Enter") {
            e.currentTarget.blur();
          } else if (e.key === "Escape") {
            revert();
            e.currentTarget.blur();
          }
        }}
        className="h-9 w-20 text-center"
        placeholder={field === "maxCapacity" ? "-" : ""}
      />
    </div>
  );
}

function DormitoryDisabledToggleCell({
  row,
  toggleDisabled,
}: {
  row: TDormitoryManagementRow;
  toggleDisabled: (id: number, isDisabled: boolean) => Promise<void>;
}) {
  const [pending, setPending] = useState(false);

  return (
    <div className="flex items-center justify-center px-1">
      <Switch
        checked={!row.isDisabled}
        disabled={pending}
        aria-label="숙소 활성 여부"
        onCheckedChange={async checked => {
          setPending(true);
          try {
            await toggleDisabled(row.id, !checked);
          } finally {
            setPending(false);
          }
        }}
      />
    </div>
  );
}

function DormitoryDeleteCell({
  row,
  deleteDormitory,
}: {
  row: TDormitoryManagementRow;
  deleteDormitory: (
    id: number,
    name: string,
    assignedCount: number
  ) => Promise<void>;
}) {
  const hasAssignments = row.assignedCount > 0;

  return (
    <div className="flex items-center justify-center px-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600"
        disabled={hasAssignments}
        title={
          hasAssignments
            ? "배정된 인원이 있어 삭제할 수 없습니다"
            : "숙소 삭제"
        }
        onClick={() => deleteDormitory(row.id, row.name, row.assignedCount)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function useDormitoryManagementColumns({
  updateDormitory,
  toggleDisabled,
  deleteDormitory,
}: {
  updateDormitory: (id: number, fields: DormitoryUpdateFields) => Promise<void>;
  toggleDisabled: (id: number, isDisabled: boolean) => Promise<void>;
  deleteDormitory: (
    id: number,
    name: string,
    assignedCount: number
  ) => Promise<void>;
}) {
  return useMemo(
    () => [
      columnHelper.accessor("name", {
        id: "name",
        header: () => <div className="text-center text-sm">숙소명</div>,
        cell: info => (
          <div className="font-medium text-center text-sm whitespace-nowrap px-1">
            {info.getValue()}
          </div>
        ),
        size: 200,
      }),
      columnHelper.accessor("optimalCapacity", {
        id: "optimalCapacity",
        header: () => <div className="text-center text-sm">정원</div>,
        cell: ({ row }) => (
          <DormitoryCapacityCell
            dormitoryId={row.original.id}
            field="optimalCapacity"
            value={row.original.optimalCapacity}
            optimalCapacity={row.original.optimalCapacity}
            maxCapacity={row.original.maxCapacity}
            onSave={updateDormitory}
          />
        ),
        size: 110,
      }),
      columnHelper.accessor("maxCapacity", {
        id: "maxCapacity",
        header: () => <div className="text-center text-sm">최대 인원</div>,
        cell: ({ row }) => (
          <DormitoryCapacityCell
            dormitoryId={row.original.id}
            field="maxCapacity"
            value={row.original.maxCapacity}
            optimalCapacity={row.original.optimalCapacity}
            maxCapacity={row.original.maxCapacity}
            onSave={updateDormitory}
          />
        ),
        size: 110,
      }),
      columnHelper.accessor("assignedCount", {
        id: "assignedCount",
        header: () => <div className="text-center text-sm">배정 인원</div>,
        cell: info => (
          <div className="text-center text-sm whitespace-nowrap px-1">
            {info.getValue()}명
          </div>
        ),
        size: 100,
      }),
      columnHelper.display({
        id: "memo",
        header: () => <div className="text-center text-sm">메모</div>,
        cell: ({ row }) => (
          <MemoEditor
            row={{ id: String(row.original.id) }}
            memoValue={row.original.memo}
            onSave={async (id, memo) => {
              await updateDormitory(Number(id), { memo });
            }}
            onUpdate={async (id, memo) => {
              await updateDormitory(Number(id), { memo });
            }}
            onDelete={async id => {
              await updateDormitory(Number(id), { memo: null });
            }}
            hasExistingMemo={() => !!row.original.memo}
            maxLength={2000}
          />
        ),
        size: 280,
      }),
      columnHelper.display({
        id: "status",
        header: () => <div className="text-center text-sm">상태</div>,
        cell: ({ row }) => (
          <div className="flex justify-center px-1">
            <DormitoryStatusBadge isDisabled={row.original.isDisabled} />
          </div>
        ),
        size: 100,
      }),
      columnHelper.display({
        id: "disabledToggle",
        header: () => <div className="text-center text-sm">활성</div>,
        cell: ({ row }) => (
          <DormitoryDisabledToggleCell
            row={row.original}
            toggleDisabled={toggleDisabled}
          />
        ),
        size: 80,
      }),
      columnHelper.display({
        id: "delete",
        header: () => <div className="text-center text-sm">삭제</div>,
        cell: ({ row }) => (
          <DormitoryDeleteCell
            row={row.original}
            deleteDormitory={deleteDormitory}
          />
        ),
        size: 72,
      }),
    ],
    [updateDormitory, toggleDisabled, deleteDormitory]
  );
}
