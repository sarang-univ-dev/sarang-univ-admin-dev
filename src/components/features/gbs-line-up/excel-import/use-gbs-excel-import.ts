"use client";

import { AxiosError } from "axios";
import { useCallback, useMemo, useState } from "react";
import * as XLSX from "xlsx";

import { IUserRetreatGBSLineup } from "@/hooks/gbs-line-up/use-retreat-gbs-lineup-data";
import { useConfirm } from "@/hooks/use-confirm";
import { GbsLineupAPI } from "@/lib/api/gbs-lineup-api";
import { useToastStore } from "@/store/toast-store";
import { TRetreatRegistrationSchedule } from "@/types";
import {
  detectLayout,
  parseSheetRows,
  SheetMatrix,
} from "@/utils/gbs-excel/parse";
import { ImportStep, ValidationResult } from "@/utils/gbs-excel/types";
import { runValidation } from "@/utils/gbs-excel/validate";

export const DEFAULT_SHEET_NAME = "(꼬리표) 수양회GBS";

interface UseGbsExcelImportArgs {
  retreatSlug: string;
  lineups: IUserRetreatGBSLineup[];
  schedules: TRetreatRegistrationSchedule[];
  onImported: () => void;
  onClose: () => void;
}

export function useGbsExcelImport({
  retreatSlug,
  lineups,
  schedules,
  onImported,
  onClose,
}: UseGbsExcelImportArgs) {
  const addToast = useToastStore((state) => state.add);
  const confirmDialog = useConfirm();

  const [step, setStep] = useState<ImportStep>("pick");
  const [fileName, setFileName] = useState<string>("");
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>("");
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  // 경고(시트 누락/조번호 빈칸) 확인 체크
  const [acknowledgedWarnings, setAcknowledgedWarnings] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStep("pick");
    setFileName("");
    setWorkbook(null);
    setSheetNames([]);
    setSelectedSheet("");
    setValidation(null);
    setAcknowledgedWarnings(false);
    setSubmitting(false);
    setError(null);
  }, []);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setValidation(null);
    setAcknowledgedWarnings(false);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const names = wb.SheetNames;
      setWorkbook(wb);
      setSheetNames(names);
      setFileName(file.name);
      setSelectedSheet(
        names.includes(DEFAULT_SHEET_NAME) ? DEFAULT_SHEET_NAME : names[0] ?? ""
      );
      setStep("selectSheet");
    } catch (e) {
      setError("엑셀 파일을 읽지 못했습니다. .xlsx 파일인지 확인하세요.");
    }
  }, []);

  const runValidate = useCallback(() => {
    if (!workbook || !selectedSheet) return;
    setStep("validate");
    setAcknowledgedWarnings(false);
    try {
      const ws = workbook.Sheets[selectedSheet];
      const matrix = XLSX.utils.sheet_to_json(ws, {
        header: 1,
        defval: null,
        raw: false,
        blankrows: true,
      }) as SheetMatrix;

      const { layout, errors } = detectLayout(matrix, schedules);
      const parsedRows =
        layout != null ? parseSheetRows(matrix, layout, schedules) : [];

      const result = runValidation({
        parsedRows,
        fileFormatErrors: errors,
        lineups,
        schedules,
      });
      setValidation(result);
      setStep("result");
    } catch (e) {
      setError("시트를 분석하는 중 오류가 발생했습니다.");
      setStep("selectSheet");
    }
  }, [workbook, selectedSheet, schedules, lineups]);

  const canSubmit = useMemo(() => {
    if (!validation) return false;
    if (validation.blockingCategory != null) return false; // 차단 오류 있음
    if (validation.hasWarnings) return acknowledgedWarnings; // 경고는 확인 체크 필요
    return true;
  }, [validation, acknowledgedWarnings]);

  const doSubmit = useCallback(async () => {
    if (!validation || !canSubmit) return;
    setSubmitting(true);
    setStep("submitting");
    try {
      const result = await GbsLineupAPI.bulkAssignGbs(retreatSlug, {
        assignments: validation.assignments,
      });
      onImported();
      addToast({
        title: "GBS 라인업 적용 완료",
        description: `${result.updatedCount}명 적용${
          result.createdGbsNumbers.length
            ? `, GBS ${result.createdGbsNumbers.join(", ")} 신규 생성`
            : ""
        }`,
        variant: "success",
      });
      setStep("done");
      onClose();
    } catch (e) {
      const message =
        e instanceof AxiosError
          ? e.response?.data?.message || "적용 중 오류가 발생했습니다."
          : "적용 중 오류가 발생했습니다.";
      addToast({
        title: "적용 실패",
        description: message,
        variant: "destructive",
      });
      setStep("result");
    } finally {
      setSubmitting(false);
    }
  }, [validation, canSubmit, retreatSlug, onImported, addToast, onClose]);

  const submit = useCallback(() => {
    if (!validation || !canSubmit) return;
    const count = validation.assignments.length;
    void confirmDialog.open({
      title: "GBS 라인업 일괄 적용",
      description: `${count}명의 GBS 배정·리더 정보를 덮어씁니다. 일정/개인정보/메모는 변경되지 않습니다. 계속할까요?`,
      onConfirm: doSubmit,
    });
  }, [validation, canSubmit, confirmDialog, doSubmit]);

  return {
    step,
    fileName,
    sheetNames,
    selectedSheet,
    setSelectedSheet,
    validation,
    acknowledgedWarnings,
    setAcknowledgedWarnings,
    submitting,
    error,
    handleFile,
    runValidate,
    canSubmit,
    submit,
    reset,
  };
}
