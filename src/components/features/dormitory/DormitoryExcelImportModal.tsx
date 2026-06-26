"use client";

import { AxiosError } from "axios";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Upload,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useConfirm } from "@/hooks/use-confirm";
import { webAxios } from "@/lib/api/axios";
import { useToastStore } from "@/store/toast-store";
import { Gender } from "@/types";
import { parseDormitorySheet } from "@/utils/dormitory-excel/parse";
import { downloadDormitoryTemplate } from "@/utils/dormitory-excel/template";
import type { DormitoryImportValidation } from "@/utils/dormitory-excel/types";

const genderLabel = (gender: Gender) => (gender === Gender.MALE ? "형제" : "자매");

interface DormitoryExcelImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  retreatSlug: string;
  onImported: () => void | Promise<void>;
}

export function DormitoryExcelImportModal({
  open,
  onOpenChange,
  retreatSlug,
  onImported,
}: DormitoryExcelImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addToast = useToastStore((state) => state.add);
  const confirmDialog = useConfirm();

  const [fileName, setFileName] = useState("");
  const [validation, setValidation] =
    useState<DormitoryImportValidation | null>(null);
  const [readError, setReadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(
    () => validation != null && validation.errors.length === 0,
    [validation]
  );

  const reset = () => {
    setFileName("");
    setValidation(null);
    setReadError(null);
    setSubmitting(false);
  };

  const handleFile = async (file: File) => {
    setReadError(null);
    setValidation(null);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheetName = wb.SheetNames.includes("숙소")
        ? "숙소"
        : wb.SheetNames[0];
      if (!sheetName) {
        setReadError("엑셀 파일에 시트가 없습니다.");
        return;
      }

      const matrix = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {
        header: 1,
        defval: null,
        raw: false,
        blankrows: true,
      }) as (string | number | boolean | null)[][];

      setFileName(file.name);
      setValidation(parseDormitorySheet(matrix));
    } catch (error) {
      setReadError("엑셀 파일을 읽지 못했습니다. .xlsx 파일인지 확인하세요.");
    }
  };

  const submit = async () => {
    if (!canSubmit || !validation || submitting) return;

    const rows = validation.rows;
    // submitting 을 confirm 전에 켜야 모달 close-guard 가 활성화된다.
    // 중첩 confirm(useConfirm) 클릭이 부모 Dialog 의 dismiss 를 유발해
    // 작업 시작 전에 모달이 닫히는 것을 막는다.
    setSubmitting(true);
    const confirmed = await confirmDialog.open({
      title: "숙소 엑셀 가져오기",
      description: `${rows.length}개 숙소를 반영합니다. 같은 성별/숙소명은 정원과 메모를 업데이트하고, 새 숙소는 추가합니다. 계속할까요?`,
      confirmText: "반영",
      cancelText: "취소",
    });

    if (!confirmed) {
      setSubmitting(false);
      return;
    }

    try {
      const response = await webAxios.post(
        `/api/v1/retreat/${retreatSlug}/dormitory/bulk-upsert-dormitories`,
        {
          dormitories: rows.map(
            ({ gender, name, optimalCapacity, maxCapacity, memo }) => ({
              gender,
              name,
              optimalCapacity,
              maxCapacity,
              memo,
            })
          ),
        }
      );

      await onImported();
      addToast({
        title: "숙소 엑셀 가져오기 완료",
        description: `${response.data.upsertedCount ?? rows.length}개 숙소를 반영했습니다.`,
        variant: "success",
      });
      reset();
      onOpenChange(false);
    } catch (error) {
      const description =
        error instanceof AxiosError
          ? error.response?.data?.message || "숙소 반영에 실패했습니다."
          : "숙소 반영에 실패했습니다.";
      addToast({
        title: "숙소 엑셀 가져오기 실패",
        description,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (submitting && !nextOpen) return;
        onOpenChange(nextOpen);
        if (!nextOpen) reset();
      }}
    >
      <DialogContent className="flex h-[90vh] flex-col overflow-hidden sm:max-w-2xl">
        <DialogHeader className="shrink-0">
          <DialogTitle>숙소 엑셀 가져오기</DialogTitle>
          <DialogDescription>
            템플릿을 받아 성별, 숙소명, 정원, 최대 인원, 메모를 채운 뒤 업로드합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden pr-1">
          <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/40 p-2.5">
            <span className="text-xs text-muted-foreground">
              같은 성별/숙소명은 업데이트되고, 엑셀에 없는 기존 숙소는 유지됩니다.
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={downloadDormitoryTemplate}
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              템플릿 다운로드
            </Button>
          </div>

          <div className="space-y-2">
            <Label>파일 선택</Label>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleFile(file);
                  event.target.value = "";
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                파일 선택
              </Button>
              {fileName && (
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <FileSpreadsheet className="h-4 w-4" />
                  {fileName}
                </span>
              )}
            </div>
            {readError && <p className="text-sm text-destructive">{readError}</p>}
          </div>

          {validation && validation.errors.length > 0 && (
            <div className="space-y-2">
              <p className="flex items-center gap-1.5 text-sm font-medium text-destructive">
                <AlertTriangle className="h-4 w-4" />
                검증 오류 ({validation.errors.length}건)
              </p>
              <ScrollArea className="max-h-52 rounded-md border bg-destructive/5 p-3">
                <ul className="list-disc space-y-1 pl-5 text-sm text-destructive">
                  {validation.errors.map((error, index) => (
                    <li key={`${error}-${index}`}>{error}</li>
                  ))}
                </ul>
              </ScrollArea>
            </div>
          )}

          {validation && validation.errors.length === 0 && (
            <div className="flex min-h-0 flex-1 flex-col gap-2">
              <p className="flex items-center gap-1.5 text-sm font-medium text-green-700">
                <CheckCircle2 className="h-4 w-4" />
                {validation.rows.length}개 숙소 적용 예정
              </p>
              <div className="min-h-0 flex-1 overflow-y-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-muted">
                    <tr>
                      <th className="px-2 py-1.5 text-center font-medium">성별</th>
                      <th className="px-2 py-1.5 text-center font-medium">
                        숙소명
                      </th>
                      <th className="px-2 py-1.5 text-center font-medium">메모</th>
                      <th className="px-2 py-1.5 text-center font-medium">정원</th>
                      <th className="px-2 py-1.5 text-center font-medium">
                        최대
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {validation.rows.map((row) => (
                      <tr key={`${row.gender}-${row.name}`}>
                        <td className="px-2 py-1.5 text-center">
                          {genderLabel(row.gender)}
                        </td>
                        <td className="px-2 py-1.5 text-center font-medium">{row.name}</td>
                        <td className="px-2 py-1.5 text-center">{row.memo || "-"}</td>
                        <td className="px-2 py-1.5 text-center">
                          {row.optimalCapacity}
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          {row.maxCapacity ?? "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            취소
          </Button>
          <Button type="button" onClick={submit} disabled={!canSubmit || submitting}>
            {submitting ? "반영 중..." : "반영"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
