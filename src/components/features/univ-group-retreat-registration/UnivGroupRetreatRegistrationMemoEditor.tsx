"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Save, X, Trash2 } from "lucide-react";
import { useUnivGroupRetreatRegistration } from "@/hooks/univ-group-retreat-registration/use-univ-group-retreat-registration";
import { UnivGroupAdminStaffData } from "@/types/univ-group-admin-staff";

interface UnivGroupRetreatRegistrationMemoEditorProps {
  row: UnivGroupAdminStaffData;
  retreatSlug: string;
}

/**
 * 행정간사 메모 인라인 편집기
 * - 메모 추가/수정/삭제
 * - 인라인 편집 UI
 */
export function UnivGroupRetreatRegistrationMemoEditor({
  row,
  retreatSlug,
}: UnivGroupRetreatRegistrationMemoEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [memoValue, setMemoValue] = useState(row.staffMemo || "");

  const {
    isMutating,
    saveAdminMemo,
    updateAdminMemo,
    deleteAdminMemo,
  } = useUnivGroupRetreatRegistration(retreatSlug);

  const handleSave = async () => {
    if (!memoValue.trim()) {
      return;
    }

    const hasExistingMemo = row.staffMemo && row.staffMemo.trim();
    const memoId = row.adminMemoId;

    if (hasExistingMemo && memoId) {
      // 수정
      await updateAdminMemo(memoId, memoValue.trim());
    } else {
      // 신규
      await saveAdminMemo(row.id, memoValue.trim());
    }

    setIsEditing(false);
  };

  const handleCancel = () => {
    setMemoValue(row.staffMemo || "");
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (row.adminMemoId) {
      deleteAdminMemo(row.adminMemoId);
    }
  };

  if (isEditing) {
    return (
      <div className="flex flex-col gap-2 p-2 min-w-[200px]">
        <Textarea
          value={memoValue}
          onChange={(e) => setMemoValue(e.target.value)}
          placeholder="메모를 입력하세요..."
          className="text-sm resize-none overflow-hidden w-full"
          style={{
            height:
              Math.max(60, Math.min(200, memoValue.split("\n").length * 20 + 20)) +
              "px",
          }}
          disabled={isMutating}
          rows={Math.max(3, Math.min(10, memoValue.split("\n").length + 1))}
        />
        <div className="flex gap-1 justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={handleSave}
            disabled={isMutating || !memoValue.trim()}
            className="h-7 px-2"
          >
            {isMutating ? (
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Save className="h-3 w-3" />
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancel}
            disabled={isMutating}
            className="h-7 px-2"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 p-2 min-w-[200px]">
      <div
        className="flex-1 text-sm text-gray-600 cursor-pointer hover:bg-gray-100 p-2 rounded min-h-[24px] whitespace-pre-wrap break-words"
        onClick={() => {
          setIsEditing(true);
          setMemoValue(row.staffMemo || "");
        }}
      >
        {row.staffMemo || "메모를 추가하려면 클릭하세요"}
      </div>
      {row.staffMemo && (
        <Button
          size="sm"
          variant="ghost"
          onClick={handleDelete}
          disabled={isMutating}
          className="h-6 w-6 p-0 text-red-500 hover:text-red-700 flex-shrink-0 mt-1"
        >
          {isMutating ? (
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <Trash2 className="h-3 w-3" />
          )}
        </Button>
      )}
    </div>
  );
}
