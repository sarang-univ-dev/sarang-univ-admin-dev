"use client";

import { useState, useRef, useEffect, useMemo } from "react";
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
import { Save, X, Trash2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { debounce } from "lodash";

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
  colors: readonly string[];
}

/**
 * LineUp 메모 에디터 (편집 중 버퍼링 + Debounce + Optimistic Update 지원)
 *
 * ✅ 편집 중에도 외부 변경사항을 버퍼링하여 보존
 * ✅ Debounce 2초로 자동 저장
 * ✅ 충돌 감지 시 사용자에게 알림
 * ✅ Optimistic Update와 완벽 호환
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
  const initialMemoValue = memoValue || "";
  const initialColorValue = memoColor || "";

  const [isEditing, setIsEditing] = useState(false);
  const [localMemoValue, setLocalMemoValue] = useState(initialMemoValue);
  const [localColor, setLocalColor] = useState(initialColorValue);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // ✅ 버퍼: 편집 중 외부에서 들어온 변경사항 저장
  const [pendingExternalUpdate, setPendingExternalUpdate] = useState<{
    memo: string;
    color: string;
  } | null>(null);
  const [showConflictWarning, setShowConflictWarning] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastSavedValueRef = useRef({ memo: initialMemoValue, color: initialColorValue });

  // ✅ 편집 모드 진입 시 자동 포커스
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length
      );
    }
  }, [isEditing]);

  // ✅ 외부 데이터 변경 감지 (편집 중 버퍼링 로직)
  useEffect(() => {
    // 편집 중이면 버퍼에 저장
    if (isEditing) {
      // 외부 변경사항이 내가 저장한 값과 다르면 충돌 가능성
      const isExternalChange =
        (initialMemoValue !== lastSavedValueRef.current.memo ||
        initialColorValue !== lastSavedValueRef.current.color) &&
        (initialMemoValue !== localMemoValue ||
        initialColorValue !== localColor);

      if (isExternalChange) {
        setPendingExternalUpdate({
          memo: initialMemoValue,
          color: initialColorValue,
        });
        setShowConflictWarning(true);
      }
      return;
    }

    // 편집 중이 아니면 즉시 동기화
    setLocalMemoValue(initialMemoValue);
    setLocalColor(initialColorValue);
    lastSavedValueRef.current = { memo: initialMemoValue, color: initialColorValue };
    setPendingExternalUpdate(null);
    setShowConflictWarning(false);
    // 🔴 FIX: localMemoValue, localColor를 의존성에서 제거하여 무한 루프 방지
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMemoValue, initialColorValue, isEditing, row.id]);

  // ✅ Debounce 2초 자동 저장
  const debouncedSave = useMemo(
    () =>
      debounce(async (id: string, memo: string, color: string, isExisting: boolean) => {
        try {
          const processedColor = color === "" ? undefined : color;
          const processedMemo = memo.trim();

          if (isExisting) {
            await onUpdate(id, processedMemo, processedColor);
          } else {
            await onSave(id, processedMemo, processedColor);
          }

          // 저장 성공 시 마지막 저장 값 업데이트
          lastSavedValueRef.current = { memo: processedMemo, color: color };
          setShowConflictWarning(false);
        } catch (error) {
          console.error("메모 자동 저장 실패:", error);
        }
      }, 2000),
    [onSave, onUpdate]
  );

  // Cleanup
  useEffect(() => {
    return () => {
      debouncedSave.cancel();
    };
  }, [debouncedSave]);

  // ✅ 변경사항 감지
  const hasChanges =
    localMemoValue.trim() !== (memoValue || "").trim() ||
    localColor !== (memoColor || "");
  const hasExisting = hasExistingMemo ? hasExistingMemo(row) : !!memoValue;

  // ✅ 값 변경 시 자동 저장 (Debounce)
  const handleValueChange = (memo: string, color: string) => {
    setLocalMemoValue(memo);
    setLocalColor(color);

    // 값이 있을 때만 자동 저장
    if (memo.trim() || color) {
      debouncedSave(row.id, memo, color, hasExisting);
    }
  };

  // ✅ 수동 저장
  const handleSave = async () => {
    if (!hasChanges || (!localMemoValue.trim() && !localColor)) {
      return;
    }

    // Debounce 취소 (즉시 저장)
    debouncedSave.cancel();

    try {
      const processedColor = localColor === "" ? undefined : localColor;
      const processedMemo = localMemoValue.trim();

      if (hasExisting) {
        await onUpdate(row.id, processedMemo, processedColor);
      } else {
        await onSave(row.id, processedMemo, processedColor);
      }

      lastSavedValueRef.current = { memo: processedMemo, color: localColor };
      setIsEditing(false);
      setShowConflictWarning(false);
    } catch (error) {
      console.error("메모 저장 실패:", error);
    }
  };

  // ✅ 취소 (버퍼링된 외부 변경사항 적용)
  const handleCancel = () => {
    if (pendingExternalUpdate) {
      // 버퍼링된 외부 변경사항 적용
      setLocalMemoValue(pendingExternalUpdate.memo);
      setLocalColor(pendingExternalUpdate.color);
      lastSavedValueRef.current = pendingExternalUpdate;
      setPendingExternalUpdate(null);
    } else {
      // 원래 값으로 복원
      setLocalMemoValue(initialMemoValue);
      setLocalColor(initialColorValue);
    }
    setIsEditing(false);
    setShowConflictWarning(false);
  };

  // ✅ 외부 변경사항 수락
  const handleAcceptExternal = () => {
    if (pendingExternalUpdate) {
      setLocalMemoValue(pendingExternalUpdate.memo);
      setLocalColor(pendingExternalUpdate.color);
      lastSavedValueRef.current = pendingExternalUpdate;
      setPendingExternalUpdate(null);
      setShowConflictWarning(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await onDelete(row.id);
      setShowDeleteDialog(false);
      setIsEditing(false);
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
        {/* ⚠️ 충돌 경고 */}
        {showConflictWarning && pendingExternalUpdate && (
          <div className="flex items-start gap-2 p-2 bg-yellow-50 border border-yellow-300 rounded text-sm">
            <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-yellow-800">다른 사용자가 수정했습니다</p>
              <p className="text-xs text-yellow-700 mt-1">
                편집을 계속하거나, 최신 변경사항을 적용할 수 있습니다.
              </p>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleAcceptExternal}
                className="mt-1 h-6 px-2 text-xs text-yellow-800 hover:bg-yellow-100"
              >
                최신 변경사항 적용
              </Button>
            </div>
          </div>
        )}

        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={localMemoValue}
            onChange={(e) => handleValueChange(e.target.value, localColor)}
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
                onClick={() => handleValueChange(localMemoValue, color === "transparent" ? "" : color)}
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
            <Button
              size="sm"
              variant="default"
              onClick={handleSave}
              disabled={loading || !hasChanges || (!localMemoValue.trim() && !localColor)}
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

        {/* ℹ️ 자동 저장 안내 */}
        <p className="text-xs text-gray-500 text-center">
          변경사항은 2초 후 자동 저장됩니다
        </p>
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
        <button
          onClick={(e) => {
            e.stopPropagation();
            setLocalMemoValue(initialMemoValue);
            setLocalColor(initialColorValue);
            setIsEditing(true);
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
