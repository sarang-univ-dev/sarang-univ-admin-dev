"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Save, X, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MemoEditorProps<T extends { id: string }> {
  row: T;
  memoValue: string | null | undefined;
  onSave: (id: string, memo: string) => Promise<void>;
  onUpdate: (id: string, memo: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  placeholder?: string;
  /** 메모가 이미 존재하는지 여부 판단 함수 */
  hasExistingMemo?: (row: T) => boolean;
  /** 최대 글자 수 (선택사항) */
  maxLength?: number;
}

/**
 * 재사용 가능한 인라인 메모 에디터 (2025 Best Practices)
 *
 * ✅ Features:
 * - WCAG 2.2 접근성 준수 (aria-label, 포커스 관리)
 * - 자동 포커스 & 자동 높이 조절
 * - 변경사항 감지 (변경 없으면 저장 버튼 비활성화)
 * - 삭제 확인 다이얼로그
 * - 발견성 개선 (hover시 편집 아이콘 표시)
 * - 글자 수 제한 & 카운터 (선택사항)
 * - 버튼 레이아웃 개선 (아이콘 + 텍스트)
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
 *   maxLength={500}
 * />
 * ```
 */
export function MemoEditor<T extends { id: string }>({
  row,
  memoValue,
  onSave,
  onUpdate,
  onDelete,
  placeholder = "메모를 입력하세요...",
  hasExistingMemo,
  maxLength,
}: MemoEditorProps<T>) {
  const [isEditing, setIsEditing] = useState(false);
  const [localMemoValue, setLocalMemoValue] = useState(memoValue || "");
  const [isLoading, setIsLoading] = useState(false); // ✅ 자체 로딩 상태 관리
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ✅ memoValue prop 변경 시 localMemoValue 동기화 (SWR 캐시 업데이트 반영)
  useEffect(() => {
    if (!isEditing) {
      setLocalMemoValue(memoValue || "");
    }
  }, [memoValue, isEditing]);

  // ✅ 편집 모드 진입 시 자동 포커스 & 커서를 끝으로
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length
      );
    }
  }, [isEditing]);

  // ✅ 변경사항이 있는지 감지
  const hasChanges = localMemoValue.trim() !== (memoValue || "").trim();
  const hasExisting = hasExistingMemo ? hasExistingMemo(row) : !!memoValue;

  const handleSave = async () => {
    if (!localMemoValue.trim() || !hasChanges) {
      return;
    }

    setIsLoading(true);
    try {
      if (hasExisting) {
        await onUpdate(row.id, localMemoValue.trim());
      } else {
        await onSave(row.id, localMemoValue.trim());
      }
      setIsEditing(false);
    } catch (error) {
      console.error("메모 저장 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setLocalMemoValue(memoValue || "");
    setIsEditing(false);
  };

  // ✅ 삭제 처리 (확인 다이얼로그는 훅에서 처리)
  const handleDelete = async () => {
    setIsEditing(false);
    await onDelete(row.id);
  };

  // ✅ 편집 모드 UI
  if (isEditing) {
    return (
      <div
        className="flex flex-col gap-1 p-2 min-w-[200px] max-w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={localMemoValue}
            onChange={(e) => setLocalMemoValue(e.target.value)}
            placeholder={placeholder}
            disabled={isLoading}
            maxLength={maxLength}
            className={cn(
              "text-sm resize-none w-full transition-all",
              "focus:ring-2 focus:ring-primary",
              maxLength && localMemoValue.length > maxLength * 0.9 && "border-yellow-500"
            )}
            rows={Math.max(3, Math.min(8, localMemoValue.split("\n").length + 1))}
            aria-label="메모 입력"
          />
          {/* ✅ 글자 수 카운터 (선택사항) */}
          {maxLength && (
            <div
              className={cn(
                "absolute bottom-2 right-2 text-xs",
                localMemoValue.length > maxLength * 0.9
                  ? "text-yellow-600 font-medium"
                  : "text-gray-400"
              )}
            >
              {localMemoValue.length}/{maxLength}
            </div>
          )}
        </div>

        {/* ✅ 액션 버튼 그룹 (한 줄로 배치) */}
        <div className="flex gap-1.5 justify-between items-center">
          {/* 삭제 버튼 (기존 메모가 있을 때만 표시) */}
          {hasExisting && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDelete}
              disabled={isLoading}
              className="h-8 px-3 text-red-500 hover:text-red-700 hover:bg-red-50"
              aria-label="메모 삭제"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="ml-1.5 hidden sm:inline">삭제</span>
            </Button>
          )}

          <div className="flex gap-1.5 ml-auto">
            {/* 저장 버튼 */}
            <Button
              size="sm"
              variant="default"
              onClick={handleSave}
              disabled={isLoading || !localMemoValue.trim() || !hasChanges}
              className="h-8 px-3"
              aria-label="메모 저장"
            >
              {isLoading ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  <span className="ml-1.5 hidden sm:inline">저장</span>
                </>
              )}
            </Button>

            {/* 취소 버튼 */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
              className="h-8 px-3"
              aria-label="편집 취소"
            >
              <X className="h-3.5 w-3.5" />
              <span className="ml-1.5 hidden sm:inline">취소</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ✅ 읽기 모드 UI (편집 모드와 동일한 레이아웃 구조)
  return (
    <div
      className="flex flex-col gap-1 p-2 min-w-[200px] max-w-full"
      onClick={(e) => e.stopPropagation()}
    >
      {/* 메모 내용 또는 플레이스홀더 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsEditing(true);
          setLocalMemoValue(memoValue || "");
        }}
        className={cn(
          "w-full text-left text-sm p-2 rounded min-h-[32px]",
          "whitespace-pre-wrap break-words transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-primary",
          memoValue
            ? "text-gray-700 hover:bg-blue-50 border border-transparent hover:border-blue-200"
            : "text-gray-400 italic hover:bg-gray-100 border border-dashed border-gray-300 hover:border-gray-400"
        )}
        aria-label={memoValue ? "메모 수정하기" : "메모 추가하기"}
      >
        {memoValue || "메모를 추가하려면 클릭하세요"}
      </button>
    </div>
  );
}
