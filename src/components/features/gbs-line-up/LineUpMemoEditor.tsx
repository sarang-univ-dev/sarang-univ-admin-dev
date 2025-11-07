"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Save, X, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LineUpMemoEditorProps<T extends { id: string }> {
  row: T;
  memoValue: string | null | undefined;
  memoColor?: string | null | undefined;
  onSave: (id: string, memo: string, color?: string) => Promise<void>;
  onUpdate: (id: string, memo: string, color?: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  loading?: boolean;
  placeholder?: string;
  hasExistingMemo?: (row: T) => boolean;
  maxLength?: number;
  /** 🎨 색상 팔레트 옵션 */
  colors: readonly string[];
}

/**
 * LineUp 전용 메모 에디터 (색상 선택 기능 포함)
 *
 * ✅ MemoEditor 기반 확장 컴포넌트
 * ✅ 8가지 배경색 선택 가능
 * ✅ GBS Line-Up 페이지에서만 사용
 *
 * @example
 * ```tsx
 * <LineUpMemoEditor
 *   row={row}
 *   memoValue={row.lineupMemo}
 *   memoColor={row.lineupMemocolor}
 *   onSave={(id, memo, color) => api.saveLineupMemo(id, memo, color)}
 *   onUpdate={(id, memo, color) => api.updateLineupMemo(id, memo, color)}
 *   onDelete={(id) => api.deleteLineupMemo(id)}
 *   colors={MEMO_COLORS}
 * />
 * ```
 */
export function LineUpMemoEditor<T extends { id: string }>({
  row,
  memoValue,
  memoColor,
  onSave,
  onUpdate,
  onDelete,
  loading = false,
  placeholder = "메모를 입력하세요...",
  hasExistingMemo,
  maxLength,
  colors,
}: LineUpMemoEditorProps<T>) {
  const [isEditing, setIsEditing] = useState(false);
  const [localMemoValue, setLocalMemoValue] = useState(memoValue || "");
  const [localColor, setLocalColor] = useState(memoColor || "");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
  const hasChanges =
    localMemoValue.trim() !== (memoValue || "").trim() ||
    localColor !== (memoColor || "");
  const hasExisting = hasExistingMemo ? hasExistingMemo(row) : !!memoValue;

  const handleSave = async () => {
    if (!localMemoValue.trim() || !hasChanges) {
      return;
    }

    try {
      const processedColor = localColor === "" ? undefined : localColor;
      if (hasExisting) {
        await onUpdate(row.id, localMemoValue.trim(), processedColor);
      } else {
        await onSave(row.id, localMemoValue.trim(), processedColor);
      }
      setIsEditing(false);
    } catch (error) {
      console.error("메모 저장 실패:", error);
    }
  };

  const handleCancel = () => {
    setLocalMemoValue(memoValue || "");
    setLocalColor(memoColor || "");
    setIsEditing(false);
  };

  const handleDeleteConfirm = async () => {
    try {
      await onDelete(row.id);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("메모 삭제 실패:", error);
    }
  };

  // ✅ 편집 모드 UI
  if (isEditing) {
    return (
      <div
        className="relative z-50 flex flex-col gap-2 p-2 min-w-[200px] max-w-full bg-white border border-gray-300 rounded-md shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={localMemoValue}
            onChange={(e) => setLocalMemoValue(e.target.value)}
            placeholder={placeholder}
            disabled={loading}
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

        {/* 🎨 색상 선택 팔레트 */}
        <div className="flex flex-wrap gap-1.5">
          {colors.map((color) => {
            const isTransparentSelected = color === "transparent" && (localColor === "" || !localColor);
            const isColorSelected = color !== "transparent" && localColor === color;
            const isSelected = isTransparentSelected || isColorSelected;

            return (
              <button
                key={color}
                type="button"
                style={{
                  backgroundColor: color === "transparent" ? "white" : color,
                  border: isSelected ? "2px solid black" : "1px solid #ccc",
                }}
                className={cn(
                  "w-6 h-6 rounded-full transition-transform hover:scale-110",
                  color === "transparent" && "relative"
                )}
                onClick={() => setLocalColor(color === "transparent" ? "" : color)}
                aria-label={`배경색: ${color}`}
              >
                {color === "transparent" && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-3 h-0.5 bg-red-500 rotate-45 absolute"></div>
                    <div className="w-3 h-0.5 bg-red-500 -rotate-45 absolute"></div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* ✅ 액션 버튼 그룹 */}
        <div className="flex gap-1.5 justify-between items-center">
          {/* 삭제 버튼 (기존 메모가 있을 때만 표시) */}
          {hasExisting && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowDeleteDialog(true)}
              disabled={loading}
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
              disabled={loading || !localMemoValue.trim() || !hasChanges}
              className="h-8 px-3"
              aria-label="메모 저장"
            >
              {loading ? (
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
              disabled={loading}
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

  // ✅ 읽기 모드 UI
  return (
    <>
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
            setLocalColor(memoColor || "");
          }}
          style={{ backgroundColor: memoColor || "transparent" }}
          className={cn(
            "w-full text-left text-sm p-2 rounded min-h-[32px]",
            "whitespace-pre-wrap break-words transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-primary",
            memoValue
              ? "text-gray-700 hover:bg-opacity-80 border border-transparent hover:border-gray-300"
              : "text-gray-400 italic hover:bg-gray-100 border border-dashed border-gray-300 hover:border-gray-400"
          )}
          aria-label={memoValue ? "메모 수정하기" : "메모 추가하기"}
        >
          {memoValue || "메모를 추가하려면 클릭하세요"}
        </button>
      </div>

      {/* ✅ 삭제 확인 다이얼로그 */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>메모를 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 되돌릴 수 없습니다. 메모가 영구적으로 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
