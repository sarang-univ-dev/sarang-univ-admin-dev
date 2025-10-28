"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Save, X, Trash2 } from "lucide-react";

interface MemoEditorProps<T extends { id: string }> {
  row: T;
  memoValue: string | null | undefined;
  onSave: (id: string, memo: string) => Promise<void>;
  onUpdate: (id: string, memo: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  loading?: boolean;
  placeholder?: string;
  /** 메모가 이미 존재하는지 여부 판단 함수 */
  hasExistingMemo?: (row: T) => boolean;
}

/**
 * 재사용 가능한 인라인 메모 에디터
 *
 * @example
 * ```tsx
 * <MemoEditor
 *   row={row}
 *   memoValue={row.staffMemo}
 *   onSave={(id, memo) => api.saveAdminMemo(retreatSlug, id, memo)}
 *   onUpdate={(id, memo) => api.updateAdminMemo(retreatSlug, id, memo)}
 *   onDelete={(id) => api.deleteAdminMemo(retreatSlug, id)}
 *   hasExistingMemo={(row) => !!row.staffMemo}
 * />
 * ```
 */
export function MemoEditor<T extends { id: string }>({
  row,
  memoValue,
  onSave,
  onUpdate,
  onDelete,
  loading = false,
  placeholder = "메모를 입력하세요...",
  hasExistingMemo,
}: MemoEditorProps<T>) {
  const [isEditing, setIsEditing] = useState(false);
  const [localMemoValue, setLocalMemoValue] = useState(memoValue || "");

  const handleSave = async () => {
    if (!localMemoValue.trim()) {
      return;
    }

    const hasExisting = hasExistingMemo ? hasExistingMemo(row) : !!memoValue;

    if (hasExisting) {
      await onUpdate(row.id, localMemoValue.trim());
    } else {
      await onSave(row.id, localMemoValue.trim());
    }

    setIsEditing(false);
  };

  const handleCancel = () => {
    setLocalMemoValue(memoValue || "");
    setIsEditing(false);
  };

  const handleDeleteClick = async () => {
    await onDelete(row.id);
  };

  if (isEditing) {
    return (
      <div className="flex flex-col gap-2 p-2 min-w-[200px]">
        <Textarea
          value={localMemoValue}
          onChange={(e) => setLocalMemoValue(e.target.value)}
          placeholder={placeholder}
          className="text-sm resize-none overflow-hidden w-full"
          style={{
            height:
              Math.max(60, Math.min(200, localMemoValue.split("\n").length * 20 + 20)) +
              "px",
          }}
          disabled={loading}
          rows={Math.max(3, Math.min(10, localMemoValue.split("\n").length + 1))}
        />
        <div className="flex gap-1 justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={handleSave}
            disabled={loading || !localMemoValue.trim()}
            className="h-7 px-2"
          >
            {loading ? (
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Save className="h-3 w-3" />
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancel}
            disabled={loading}
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
          setLocalMemoValue(memoValue || "");
        }}
      >
        {memoValue || "메모를 추가하려면 클릭하세요"}
      </div>
      {memoValue && (
        <Button
          size="sm"
          variant="ghost"
          onClick={handleDeleteClick}
          disabled={loading}
          className="h-6 w-6 p-0 text-red-500 hover:text-red-700 flex-shrink-0 mt-1"
        >
          {loading ? (
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <Trash2 className="h-3 w-3" />
          )}
        </Button>
      )}
    </div>
  );
}
