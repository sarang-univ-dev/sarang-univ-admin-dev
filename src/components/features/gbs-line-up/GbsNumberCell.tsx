"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { debounce } from "lodash";
import { AlertCircle, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GbsNumberCellRow {
  id: string;
  gbsNumber: number | null;
  isLeader: boolean;
}

interface GbsNumberCellProps {
  row: GbsNumberCellRow;
  onSave: (row: GbsNumberCellRow, value: string) => Promise<void>;
  isLoading: boolean;
}

/**
 * GBS 번호 입력 Cell (편집 중 버퍼링 + Debounce + Optimistic Update 지원)
 *
 * @description
 * - Local state로 즉각적인 타이핑 반응
 * - useEffect로 외부 데이터 변경 시 버퍼링 (편집 중에도 데이터 손실 방지)
 * - Debounce 2초로 자동 저장
 * - Enter/ESC 키보드 단축키 지원
 * - 저장 성공 시 초록 테두리 + 체크 표시
 * - 충돌 감지 및 알림
 *
 * @see https://tanstack.com/table/latest/docs/framework/react/examples/editable-data
 */
export const GbsNumberCell: React.FC<GbsNumberCellProps> = ({
  row,
  onSave,
  isLoading,
}) => {
  const initialValue = row.gbsNumber?.toString() || "";
  const [value, setValue] = useState(initialValue);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // ✅ 버퍼: 편집 중 외부에서 들어온 변경사항 저장
  const [pendingExternalUpdate, setPendingExternalUpdate] = useState<string | null>(null);
  const [showConflictWarning, setShowConflictWarning] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const lastSavedValueRef = useRef(initialValue);

  // ✅ 외부 데이터 변경 감지 (편집 중 버퍼링 로직)
  useEffect(() => {
    const isCurrentlyEditing = document.activeElement === inputRef.current;

    // 편집 중이면 버퍼에 저장
    if (isCurrentlyEditing) {
      // 외부 변경사항이 내가 저장한 값과 다르면 충돌 가능성
      const isExternalChange =
        initialValue !== lastSavedValueRef.current && initialValue !== value;

      if (isExternalChange) {
        setPendingExternalUpdate(initialValue);
        setShowConflictWarning(true);
      }
      return;
    }

    // 편집 중이 아니면 즉시 동기화
    setValue(initialValue);
    lastSavedValueRef.current = initialValue;
    setPendingExternalUpdate(null);
    setShowConflictWarning(false);
    setSaveStatus('idle');
  }, [initialValue, value, row.id]);

  // ✅ Debounce 2초 자동 저장
  const debouncedSave = useMemo(
    () =>
      debounce(async (rowData: GbsNumberCellRow, newValue: string) => {
        const trimmedValue = newValue.trim();

        // 변경되지 않았으면 저장 안 함
        if (trimmedValue === lastSavedValueRef.current) {
          return;
        }

        // 리더는 GBS 번호 변경 불가
        if (rowData.isLeader) {
          return;
        }

        // 유효성 검사: 빈 값이 아니면 숫자인지 확인
        if (trimmedValue !== '') {
          const numValue = parseInt(trimmedValue);
          if (isNaN(numValue)) {
            alert("숫자를 입력해주세요.");
            setValue(lastSavedValueRef.current);
            return;
          }
        }

        try {
          await onSave(rowData, trimmedValue);
          lastSavedValueRef.current = trimmedValue;
          setSaveStatus('success');
          setShowConflictWarning(false);

          // 1초 후 성공 표시 제거
          setTimeout(() => {
            setSaveStatus('idle');
          }, 1000);
        } catch (error) {
          console.error("GBS 번호 자동 저장 실패:", error);
          setSaveStatus('error');
          setValue(lastSavedValueRef.current);

          // 2초 후 에러 표시 제거
          setTimeout(() => {
            setSaveStatus('idle');
          }, 2000);
        }
      }, 2000),
    [onSave]
  );

  // Cleanup
  useEffect(() => {
    return () => {
      debouncedSave.cancel();
    };
  }, [debouncedSave]);

  // ✅ 값 변경 시 자동 저장 (Debounce)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    // 값이 있거나, 빈 값이지만 기존에 GBS 번호가 있었으면 자동 저장 (배정 해제)
    if (newValue.trim() || row.gbsNumber !== null) {
      debouncedSave(row, newValue);
    }
  };

  // ✅ Blur 시 즉시 저장
  const handleBlur = async () => {
    // Debounce 취소 (즉시 저장)
    debouncedSave.cancel();

    const trimmedValue = value.trim();

    // 변경되지 않았으면 저장 안 함
    if (trimmedValue === lastSavedValueRef.current) {
      setPendingExternalUpdate(null);
      setShowConflictWarning(false);
      return;
    }

    // 리더는 GBS 번호 변경 불가
    if (row.isLeader) {
      setValue(lastSavedValueRef.current);
      return;
    }

    // 유효성 검사: 빈 값이 아니면 숫자인지 확인
    if (trimmedValue !== '') {
      const numValue = parseInt(trimmedValue);
      if (isNaN(numValue)) {
        alert("숫자를 입력해주세요.");
        setValue(lastSavedValueRef.current);
        return;
      }
    }

    try {
      await onSave(row, trimmedValue);
      lastSavedValueRef.current = trimmedValue;
      setSaveStatus('success');
      setShowConflictWarning(false);

      setTimeout(() => {
        setSaveStatus('idle');
      }, 1000);
    } catch (error) {
      setSaveStatus('error');
      setValue(lastSavedValueRef.current);

      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur(); // Enter 키로 저장 트리거
    }
    if (e.key === 'Escape') {
      // 버퍼링된 외부 변경사항 적용 또는 원래 값으로 복원
      if (pendingExternalUpdate) {
        setValue(pendingExternalUpdate);
        lastSavedValueRef.current = pendingExternalUpdate;
        setPendingExternalUpdate(null);
        setShowConflictWarning(false);
      } else {
        setValue(lastSavedValueRef.current);
      }
      e.currentTarget.blur();
    }
  };

  // ✅ 외부 변경사항 수락
  const handleAcceptExternal = () => {
    if (pendingExternalUpdate) {
      setValue(pendingExternalUpdate);
      lastSavedValueRef.current = pendingExternalUpdate;
      setPendingExternalUpdate(null);
      setShowConflictWarning(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onClick={(e) => e.currentTarget.select()}
        disabled={isLoading || row.isLeader}
        className={cn(
          "rounded px-2 py-1 text-center w-36 transition-all",
          row.gbsNumber
            ? "border border-blue-400 font-bold bg-blue-50"
            : "border border-gray-300 bg-white font-normal text-gray-700",
          isLoading && "opacity-50 cursor-wait",
          row.isLeader && "cursor-not-allowed",
          saveStatus === 'success' && "border-green-500 bg-green-50",
          saveStatus === 'error' && "border-red-500 bg-red-50",
          showConflictWarning && "border-yellow-500 bg-yellow-50"
        )}
        placeholder={row.isLeader ? "리더" : "GBS 번호 입력"}
        title={row.isLeader ? "리더는 GBS 번호를 변경할 수 없습니다" : "Enter로 저장, ESC로 취소"}
      />

      {/* ✅ 저장 상태 아이콘 */}
      {saveStatus === 'success' && (
        <Check className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
      )}
      {saveStatus === 'error' && (
        <AlertCircle className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
      )}

      {/* ⚠️ 충돌 경고 툴팁 */}
      {showConflictWarning && pendingExternalUpdate && (
        <div className="absolute left-0 top-full mt-1 z-50 w-64 p-2 bg-yellow-50 border border-yellow-300 rounded shadow-lg text-xs">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-yellow-800">다른 사용자가 수정했습니다</p>
              <p className="text-yellow-700 mt-1">
                새 값: <span className="font-bold">{pendingExternalUpdate}</span>
              </p>
              <button
                onClick={handleAcceptExternal}
                className="mt-1 px-2 py-1 bg-yellow-100 hover:bg-yellow-200 rounded text-yellow-800 transition-colors"
              >
                최신 변경사항 적용
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
