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
import { Checkbox } from "@/components/ui/checkbox";
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
import { TRetreatDormitory } from "@/hooks/use-available-dormitories";
import { IDormitoryStaffRegistration } from "@/hooks/use-dormitory-staff";
import { useConfirm } from "@/hooks/use-confirm";
import { webAxios } from "@/lib/api/axios";
import { useToastStore } from "@/store/toast-store";
import { Gender } from "@/types";
import { parseAssignmentSheet } from "@/utils/dormitory-assignment-excel/parse";
import { downloadDormitoryAssignmentTemplate } from "@/utils/dormitory-assignment-excel/template";
import type { AssignmentValidationResult } from "@/utils/dormitory-assignment-excel/types";
import { runAssignmentValidation } from "@/utils/dormitory-assignment-excel/validate";

const genderLabel = (gender: Gender) => (gender === Gender.MALE ? "형제" : "자매");

type ScheduleColumn = { id: number; label: string };

interface DormitoryAssignmentExcelImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  retreatSlug: string;
  people: IDormitoryStaffRegistration[];
  dormitories: TRetreatDormitory[];
  scheduleColumns: ScheduleColumn[];
  onImported: () => void | Promise<void>;
}

export function DormitoryAssignmentExcelImportModal({
  open,
  onOpenChange,
  retreatSlug,
  people,
  dormitories,
  scheduleColumns,
  onImported,
}: DormitoryAssignmentExcelImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addToast = useToastStore((state) => state.add);
  const confirmDialog = useConfirm();

  const [fileName, setFileName] = useState("");
  const [validation, setValidation] =
    useState<AssignmentValidationResult | null>(null);
  const [readError, setReadError] = useState<string | null>(null);
  const [acknowledgedWarnings, setAcknowledgedWarnings] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    if (!validation) return false;
    if (validation.blockingCategory != null) return false;
    if (validation.assignments.length === 0) return false;
    if (validation.hasWarnings) return acknowledgedWarnings;
    return true;
  }, [validation, acknowledgedWarnings]);

  const blockingMessages = useMemo(() => {
    if (!validation || validation.blockingCategory == null) return [];
    switch (validation.blockingCategory) {
      case 1:
        return validation.fileFormatErrors;
      case 2:
        return validation.sheetDuplicateIds.map(
          (ref) =>
            `${ref.excelRow}행: ID ${ref.id} (${ref.name})가 파일 안에 중복됩니다.`
        );
      case 3:
        return validation.unmatchedSheetIds.map(
          (ref) => `${ref.excelRow}행: 명단에 없는 ID ${ref.id} 입니다.`
        );
      case 4:
        return validation.unknownDormitories.map(
          (ref) =>
            `${ref.excelRow}행: ${ref.name}(${genderLabel(ref.gender)})의 숙소 '${ref.dormitoryName}'을(를) 찾을 수 없습니다.`
        );
      case 5:
        return validation.capacityViolations.map(
          (violation) =>
            `${genderLabel(violation.gender)} '${violation.dormitoryName}' ${violation.scheduleLabel}: ${violation.count}명 / 정원 ${violation.capacity}명 (초과)`
        );
      default:
        return [];
    }
  }, [validation]);

  const reset = () => {
    setFileName("");
    setValidation(null);
    setReadError(null);
    setAcknowledgedWarnings(false);
    setSubmitting(false);
  };

  const handleFile = async (file: File) => {
    setReadError(null);
    setValidation(null);
    setAcknowledgedWarnings(false);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheetName = wb.SheetNames.includes("방배정")
        ? "방배정"
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

      const { rows, fileFormatErrors } = parseAssignmentSheet(matrix);
      setFileName(file.name);
      setValidation(
        runAssignmentValidation({
          rows,
          fileFormatErrors,
          people,
          dormitories,
          scheduleColumns,
        })
      );
    } catch {
      setReadError("엑셀 파일을 읽지 못했습니다. .xlsx 파일인지 확인하세요.");
    }
  };

  const submit = () => {
    if (!canSubmit || !validation || submitting) return;

    const assignments = validation.assignments;
    void confirmDialog.open({
      title: "방배정 엑셀 가져오기",
      description: `${assignments.length}명의 숙소 배정을 변경합니다. 엑셀에 없는 인원은 현재 배정이 유지됩니다. 계속할까요?`,
      confirmText: "반영",
      cancelText: "취소",
      onConfirm: async () => {
        setSubmitting(true);
        try {
          const response = await webAxios.post(
            `/api/v1/retreat/${retreatSlug}/dormitory/bulk-assign-dormitory`,
            { assignments }
          );

          await onImported();
          addToast({
            title: "방배정 엑셀 가져오기 완료",
            description: `${response.data?.updatedRegistrations?.length ?? assignments.length}명의 배정을 변경했습니다.`,
            variant: "success",
          });
          reset();
          onOpenChange(false);
        } catch (error) {
          const description =
            error instanceof AxiosError
              ? error.response?.data?.message || "방배정 반영에 실패했습니다."
              : "방배정 반영에 실패했습니다.";
          addToast({
            title: "방배정 엑셀 가져오기 실패",
            description,
            variant: "destructive",
          });
          setSubmitting(false);
        }
      },
    });
  };

  const isBlocked = validation != null && validation.blockingCategory != null;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (submitting && !nextOpen) return;
        onOpenChange(nextOpen);
        if (!nextOpen) reset();
      }}
    >
      <DialogContent className="flex h-[90vh] flex-col overflow-hidden sm:max-w-3xl">
        <DialogHeader className="shrink-0">
          <DialogTitle>방배정 엑셀 가져오기</DialogTitle>
          <DialogDescription>
            내보내기로 받은 엑셀의 '숙소명' 칸을 수정해 업로드합니다. 'ID' 칸은 매칭에
            사용되므로 수정하지 마세요. 숙소명을 비우면 해당 인원의 배정이 해제됩니다.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden pr-1">
          <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/40 p-2.5">
            <span className="text-xs text-muted-foreground">
              엑셀에 없는 인원은 현재 배정이 유지되고, 현재와 달라진 인원만 변경됩니다.
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                downloadDormitoryAssignmentTemplate(people, scheduleColumns)
              }
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              현재 방배정 내보내기
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

          {isBlocked && (
            <div className="space-y-2">
              <p className="flex items-center gap-1.5 text-sm font-medium text-destructive">
                <AlertTriangle className="h-4 w-4" />
                적용할 수 없습니다 ({blockingMessages.length}건)
              </p>
              <ScrollArea className="max-h-60 rounded-md border bg-destructive/5 p-3">
                <ul className="list-disc space-y-1 pl-5 text-sm text-destructive">
                  {blockingMessages.map((message, index) => (
                    <li key={`${message}-${index}`}>{message}</li>
                  ))}
                </ul>
              </ScrollArea>
            </div>
          )}

          {validation && !isBlocked && (
            <div className="flex min-h-0 flex-1 flex-col gap-3">
              {validation.assignments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  변경할 배정이 없습니다.
                </p>
              ) : (
                <p className="flex items-center gap-1.5 text-sm font-medium text-green-700">
                  <CheckCircle2 className="h-4 w-4" />
                  {validation.assignments.length}명 배정 변경 예정
                </p>
              )}

              {validation.hasWarnings && (
                <label className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                  <Checkbox
                    checked={acknowledgedWarnings}
                    onCheckedChange={(checked) =>
                      setAcknowledgedWarnings(!!checked)
                    }
                    className="mt-0.5"
                  />
                  <span>
                    엑셀에 없는 인원{" "}
                    <span className="font-medium">
                      {validation.missingDbPeople.length}
                    </span>
                    명은 현재 배정이 그대로 유지됩니다. 확인했습니다.
                  </span>
                </label>
              )}

              {validation.changes.length > 0 && (
                <div className="min-h-0 flex-1 overflow-y-auto rounded-md border">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 z-10 bg-muted">
                      <tr>
                        <th className="px-2 py-1.5 text-center font-medium">
                          부서
                        </th>
                        <th className="px-2 py-1.5 text-center font-medium">
                          학년
                        </th>
                        <th className="px-2 py-1.5 text-center font-medium">
                          이름
                        </th>
                        <th className="px-2 py-1.5 text-center font-medium">
                          현재
                        </th>
                        <th className="px-2 py-1.5 text-center font-medium">
                          변경
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {validation.changes.map((change) => (
                        <tr key={change.id}>
                          <td className="px-2 py-1.5 text-center">
                            {change.department}
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            {change.grade}
                          </td>
                          <td className="px-2 py-1.5 text-center font-medium">
                            {change.name}
                          </td>
                          <td className="px-2 py-1.5 text-center text-muted-foreground">
                            {change.from}
                          </td>
                          <td className="px-2 py-1.5 text-center font-medium">
                            {change.to}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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
          <Button
            type="button"
            onClick={submit}
            disabled={!canSubmit || submitting}
          >
            {submitting ? "반영 중..." : "반영"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
