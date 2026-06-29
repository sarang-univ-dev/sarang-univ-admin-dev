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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TRetreatDormitory } from "@/hooks/use-available-dormitories";
import { useConfirm } from "@/hooks/use-confirm";
import { IDormitoryStaffRegistration } from "@/hooks/use-dormitory-staff";
import { webAxios } from "@/lib/api/axios";
import { useToastStore } from "@/store/toast-store";
import { Gender } from "@/types";
import { parseAssignmentSheet } from "@/utils/dormitory-assignment-excel/parse";
import { downloadDormitoryAssignmentTemplate } from "@/utils/dormitory-assignment-excel/template";
import type {
  AssignmentChange,
  AssignmentPersonRef,
  AssignmentValidationResult,
  CapacityViolation,
  ImportStep,
  UnknownDormitoryRef,
} from "@/utils/dormitory-assignment-excel/types";
import { runAssignmentValidation } from "@/utils/dormitory-assignment-excel/validate";

type SheetMatrix = (string | number | boolean | null)[][];
type ScheduleColumn = { id: number; label: string };

const genderLabel = (gender: Gender) =>
  gender === Gender.MALE ? "형제" : "자매";

const CATEGORY_TITLES: Record<number, string> = {
  1: "파일 형식 오류 (컬럼)",
  2: "시트 내 중복 레코드",
  3: "시트에 있으나 명단(DB)에 없는 인원",
  4: "없는 숙소명",
  5: "정원 초과",
  6: "명단(DB)에 있으나 시트에 없는 인원",
};

const safeFileName = (name: string) => name.replace(/[\\/:*?"<>|]/g, "_");

function downloadRowsReport(
  rows: Record<string, string | number>[],
  title: string
) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "검증결과");
  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `${safeFileName(title)}_${stamp}.xlsx`);
}

function downloadPersonListReport(
  people: AssignmentPersonRef[],
  title: string
) {
  downloadRowsReport(
    people.map(person => ({
      행: person.excelRow ?? "",
      부서: `${person.univGroupNumber}부`,
      학년: `${person.gradeNumber}학년`,
      이름: person.name,
      연락처: person.phone,
    })),
    title
  );
}

function PersonList({ people }: { people: AssignmentPersonRef[] }) {
  return (
    <div className="max-h-72 min-w-0 max-w-full overflow-auto rounded-md border">
      <table className="relative w-full caption-bottom text-sm">
        <TableHeader className="sticky top-0 z-10 bg-gray-100">
          <TableRow>
            <TableHead className="bg-gray-100 px-2 py-1.5 text-center">
              부서
            </TableHead>
            <TableHead className="bg-gray-100 px-2 py-1.5 text-center">
              학년
            </TableHead>
            <TableHead className="bg-gray-100 px-2 py-1.5 text-center">
              이름
            </TableHead>
            <TableHead className="bg-gray-100 px-2 py-1.5 text-center">
              연락처
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-gray-200">
          {people.map((person, index) => (
            <TableRow key={`${person.name}-${person.phone}-${index}`}>
              <TableCell className="px-2 py-1.5 text-center">
                {person.univGroupNumber}부
              </TableCell>
              <TableCell className="px-2 py-1.5 text-center">
                {person.gradeNumber}학년
              </TableCell>
              <TableCell className="px-2 py-1.5 text-center font-medium">
                {person.name}
              </TableCell>
              <TableCell className="px-2 py-1.5 text-center">
                {person.phone}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </table>
    </div>
  );
}

function UnknownDormitoryList({ rows }: { rows: UnknownDormitoryRef[] }) {
  return (
    <div className="max-h-72 min-w-0 max-w-full overflow-auto rounded-md border">
      <table className="relative w-full caption-bottom text-sm">
        <TableHeader className="sticky top-0 z-10 bg-gray-100">
          <TableRow>
            <TableHead className="bg-gray-100 px-2 py-1.5 text-center">
              부서
            </TableHead>
            <TableHead className="bg-gray-100 px-2 py-1.5 text-center">
              학년
            </TableHead>
            <TableHead className="bg-gray-100 px-2 py-1.5 text-center">
              이름
            </TableHead>
            <TableHead className="bg-gray-100 px-2 py-1.5 text-center">
              성별
            </TableHead>
            <TableHead className="bg-gray-100 px-2 py-1.5 text-center">
              숙소명
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-gray-200">
          {rows.map((row, index) => (
            <TableRow key={`${row.name}-${row.dormitoryName}-${index}`}>
              <TableCell className="px-2 py-1.5 text-center">
                {row.univGroupNumber}부
              </TableCell>
              <TableCell className="px-2 py-1.5 text-center">
                {row.gradeNumber}학년
              </TableCell>
              <TableCell className="px-2 py-1.5 text-center font-medium">
                {row.name}
              </TableCell>
              <TableCell className="px-2 py-1.5 text-center">
                {genderLabel(row.gender)}
              </TableCell>
              <TableCell className="px-2 py-1.5 text-center text-destructive">
                {row.dormitoryName}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </table>
    </div>
  );
}

function CapacityViolationList({ rows }: { rows: CapacityViolation[] }) {
  return (
    <div className="max-h-72 min-w-0 max-w-full overflow-auto rounded-md border">
      <table className="relative w-full caption-bottom text-sm">
        <TableHeader className="sticky top-0 z-10 bg-gray-100">
          <TableRow>
            <TableHead className="bg-gray-100 px-2 py-1.5 text-center">
              성별
            </TableHead>
            <TableHead className="bg-gray-100 px-2 py-1.5 text-center">
              숙소명
            </TableHead>
            <TableHead className="bg-gray-100 px-2 py-1.5 text-center">
              일정
            </TableHead>
            <TableHead className="bg-gray-100 px-2 py-1.5 text-center">
              인원
            </TableHead>
            <TableHead className="bg-gray-100 px-2 py-1.5 text-center">
              정원
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-gray-200">
          {rows.map((row, index) => (
            <TableRow
              key={`${row.dormitoryName}-${row.scheduleLabel}-${index}`}
            >
              <TableCell className="px-2 py-1.5 text-center">
                {genderLabel(row.gender)}
              </TableCell>
              <TableCell className="px-2 py-1.5 text-center font-medium">
                {row.dormitoryName}
              </TableCell>
              <TableCell className="px-2 py-1.5 text-center">
                {row.scheduleLabel}
              </TableCell>
              <TableCell className="px-2 py-1.5 text-center text-destructive">
                {row.count}명
              </TableCell>
              <TableCell className="px-2 py-1.5 text-center">
                {row.capacity}명
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </table>
    </div>
  );
}

function ChangeList({ changes }: { changes: AssignmentChange[] }) {
  return (
    <div className="max-h-60 min-w-0 max-w-full overflow-auto rounded-md border">
      <table className="relative w-full caption-bottom text-sm">
        <TableHeader className="sticky top-0 z-10 bg-gray-100">
          <TableRow>
            <TableHead className="bg-gray-100 px-2 py-1.5 text-center">
              부서
            </TableHead>
            <TableHead className="bg-gray-100 px-2 py-1.5 text-center">
              학년
            </TableHead>
            <TableHead className="bg-gray-100 px-2 py-1.5 text-center">
              이름
            </TableHead>
            <TableHead className="bg-gray-100 px-2 py-1.5 text-center">
              현재
            </TableHead>
            <TableHead className="bg-gray-100 px-2 py-1.5 text-center">
              변경
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-gray-200">
          {changes.map(change => (
            <TableRow key={change.id}>
              <TableCell className="px-2 py-1.5 text-center">
                {change.department}
              </TableCell>
              <TableCell className="px-2 py-1.5 text-center">
                {change.grade}
              </TableCell>
              <TableCell className="px-2 py-1.5 text-center font-medium">
                {change.name}
              </TableCell>
              <TableCell className="px-2 py-1.5 text-center text-muted-foreground">
                {change.from}
              </TableCell>
              <TableCell className="px-2 py-1.5 text-center font-medium">
                {change.to}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </table>
    </div>
  );
}

function ResultBody({
  validation,
}: {
  validation: AssignmentValidationResult;
}) {
  const cat = validation.blockingCategory;

  if (cat === 1) {
    return (
      <div className="space-y-2">
        <p className="flex items-center gap-1.5 text-sm font-medium text-destructive">
          <AlertTriangle className="h-4 w-4" />
          {CATEGORY_TITLES[1]} ({validation.fileFormatErrors.length}건)
        </p>
        <ul className="list-disc space-y-1 rounded-md border bg-destructive/5 p-3 pl-7 text-sm text-destructive">
          {validation.fileFormatErrors.map((error, index) => (
            <li key={`${error}-${index}`}>{error}</li>
          ))}
        </ul>
      </div>
    );
  }

  if (cat === 2 || cat === 3) {
    const people =
      cat === 2
        ? validation.sheetDuplicatePeople
        : validation.unmatchedSheetPeople;
    return (
      <div className="min-w-0 space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-1.5 text-sm font-medium text-destructive">
            <AlertTriangle className="h-4 w-4" />
            {CATEGORY_TITLES[cat]} ({people.length}명)
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              downloadPersonListReport(people, CATEGORY_TITLES[cat])
            }
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            엑셀 다운로드
          </Button>
        </div>
        <PersonList people={people} />
      </div>
    );
  }

  if (cat === 4) {
    return (
      <div className="min-w-0 space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-1.5 text-sm font-medium text-destructive">
            <AlertTriangle className="h-4 w-4" />
            {CATEGORY_TITLES[4]} ({validation.unknownDormitories.length}건)
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              downloadRowsReport(
                validation.unknownDormitories.map(row => ({
                  행: row.excelRow,
                  부서: `${row.univGroupNumber}부`,
                  학년: `${row.gradeNumber}학년`,
                  이름: row.name,
                  연락처: row.phone,
                  성별: genderLabel(row.gender),
                  숙소명: row.dormitoryName,
                })),
                CATEGORY_TITLES[4]
              )
            }
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            엑셀 다운로드
          </Button>
        </div>
        <UnknownDormitoryList rows={validation.unknownDormitories} />
      </div>
    );
  }

  if (cat === 5) {
    return (
      <div className="min-w-0 space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-1.5 text-sm font-medium text-destructive">
            <AlertTriangle className="h-4 w-4" />
            {CATEGORY_TITLES[5]} ({validation.capacityViolations.length}건)
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              downloadRowsReport(
                validation.capacityViolations.map(row => ({
                  성별: genderLabel(row.gender),
                  숙소명: row.dormitoryName,
                  일정: row.scheduleLabel,
                  인원: row.count,
                  정원: row.capacity,
                })),
                CATEGORY_TITLES[5]
              )
            }
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            엑셀 다운로드
          </Button>
        </div>
        <CapacityViolationList rows={validation.capacityViolations} />
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-3">
      {validation.assignments.length === 0 ? (
        <p className="text-sm text-muted-foreground">변경할 배정이 없습니다.</p>
      ) : (
        <p className="flex items-center gap-1.5 text-sm font-medium text-green-700">
          <CheckCircle2 className="h-4 w-4" />
          {validation.assignments.length}명 배정 변경 예정
        </p>
      )}

      {validation.missingDbPeople.length > 0 && (
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-1.5 text-sm font-medium text-amber-700">
              <AlertTriangle className="h-4 w-4" />
              {CATEGORY_TITLES[6]} ({validation.missingDbPeople.length}명) —
              현재 배정 유지
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                downloadPersonListReport(
                  validation.missingDbPeople,
                  CATEGORY_TITLES[6]
                )
              }
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              엑셀 다운로드
            </Button>
          </div>
          <PersonList people={validation.missingDbPeople} />
        </div>
      )}

      {validation.changes.length > 0 && (
        <div className="min-w-0 space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-yellow-700">
              변경 내역 ({validation.changes.length}건)
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                downloadRowsReport(
                  validation.changes.map(change => ({
                    부서: change.department,
                    학년: change.grade,
                    이름: change.name,
                    연락처: change.phone,
                    현재: change.from,
                    변경: change.to,
                  })),
                  "방배정 변경 내역"
                )
              }
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              엑셀 다운로드
            </Button>
          </div>
          <ChangeList changes={validation.changes} />
        </div>
      )}
    </div>
  );
}

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
  const addToast = useToastStore(state => state.add);
  const confirmDialog = useConfirm();

  const [step, setStep] = useState<ImportStep>("pick");
  const [fileName, setFileName] = useState("");
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState("");
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

  const reset = () => {
    setStep("pick");
    setFileName("");
    setWorkbook(null);
    setSheetNames([]);
    setSelectedSheet("");
    setValidation(null);
    setReadError(null);
    setAcknowledgedWarnings(false);
    setSubmitting(false);
  };

  const handleFile = async (file: File) => {
    setReadError(null);
    setValidation(null);
    setAcknowledgedWarnings(false);
    setWorkbook(null);
    setSheetNames([]);
    setSelectedSheet("");
    setStep("pick");

    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const nextSheetNames = wb.SheetNames;
      const nextSelectedSheet = nextSheetNames.includes("방배정")
        ? "방배정"
        : nextSheetNames[0];

      if (!nextSelectedSheet) {
        setReadError("엑셀 파일에 시트가 없습니다.");
        return;
      }

      setFileName(file.name);
      setWorkbook(wb);
      setSheetNames(nextSheetNames);
      setSelectedSheet(nextSelectedSheet);
      setStep("selectSheet");
    } catch {
      setReadError("엑셀 파일을 읽지 못했습니다. .xlsx 파일인지 확인하세요.");
    }
  };

  const handleSheetChange = (sheetName: string) => {
    setSelectedSheet(sheetName);
    setValidation(null);
    setReadError(null);
    setAcknowledgedWarnings(false);
    setStep("selectSheet");
  };

  const runValidate = () => {
    if (!workbook || !selectedSheet) return;

    const sheet = workbook.Sheets[selectedSheet];
    if (!sheet) {
      setReadError("선택한 시트를 찾을 수 없습니다.");
      setStep("selectSheet");
      return;
    }

    setReadError(null);
    setValidation(null);
    setAcknowledgedWarnings(false);
    setStep("validate");

    try {
      const matrix = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: null,
        raw: false,
        blankrows: true,
      }) as SheetMatrix;

      const { rows, fileFormatErrors } = parseAssignmentSheet(matrix);
      setValidation(
        runAssignmentValidation({
          rows,
          fileFormatErrors,
          people,
          dormitories,
          scheduleColumns,
        })
      );
      setStep("result");
    } catch {
      setReadError("선택한 시트를 검증하지 못했습니다.");
      setStep("selectSheet");
    }
  };

  const submit = async () => {
    if (!canSubmit || !validation || submitting) return;

    const assignments = validation.assignments;
    const confirmed = await confirmDialog.open({
      title: "방배정 엑셀 가져오기",
      description: `${assignments.length}명의 숙소 배정을 변경합니다. 엑셀에 없는 인원은 현재 배정이 유지됩니다. 계속할까요?`,
      confirmText: "제출",
      cancelText: "취소",
    });

    if (!confirmed) return;

    setSubmitting(true);
    setStep("submitting");
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
      setStep("result");
    } finally {
      setSubmitting(false);
    }
  };

  const showAckCheckbox =
    !!validation &&
    validation.blockingCategory == null &&
    validation.hasWarnings;

  return (
    <Dialog
      open={open}
      onOpenChange={nextOpen => {
        if (submitting && !nextOpen) return;
        onOpenChange(nextOpen);
        if (!nextOpen) reset();
      }}
    >
      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col overflow-hidden">
        <DialogHeader className="min-w-0">
          <DialogTitle>방배정 엑셀 가져오기</DialogTitle>
          <DialogDescription>
            템플릿의 숙소명 칸을 수정해 업로드합니다. 숙소명을 비우면 해당
            인원의 배정이 해제되고, 엑셀에 없는 인원은 현재 배정이 유지됩니다.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden py-1">
          <div className="flex min-w-0 shrink-0 items-center justify-between gap-2 rounded-md border bg-muted/40 p-2.5">
            <span className="text-xs text-muted-foreground">
              현재 명단과 방배정이 채워진 템플릿을 받아 숙소명만 수정한 뒤
              업로드하세요. 인적사항으로 매칭합니다.
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                downloadDormitoryAssignmentTemplate(people, scheduleColumns, {
                  fileNamePrefix: "방배정_템플릿",
                })
              }
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              템플릿 다운로드
            </Button>
          </div>

          <div className="shrink-0 space-y-2">
            <Label>1. 파일 선택</Label>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={event => {
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
                <span className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
                  <FileSpreadsheet className="h-4 w-4 shrink-0" />
                  <span className="truncate">{fileName}</span>
                </span>
              )}
            </div>
            {readError && (
              <p className="text-sm text-destructive">{readError}</p>
            )}
          </div>

          {sheetNames.length > 0 && (
            <div className="min-w-0 shrink-0 space-y-2">
              <Label>2. 시트 선택</Label>
              <Select value={selectedSheet} onValueChange={handleSheetChange}>
                <SelectTrigger>
                  <SelectValue placeholder="시트를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {sheetNames.map(name => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {validation && (
            <div className="flex min-h-0 min-w-0 flex-1 flex-col space-y-2 overflow-hidden">
              <Label>3. 검증 결과</Label>
              <div className="min-h-0 min-w-0 overflow-auto pr-1">
                <div className="space-y-3">
                  <ResultBody validation={validation} />
                  {showAckCheckbox && (
                    <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3">
                      <Checkbox
                        id="ack-dormitory-warnings"
                        checked={acknowledgedWarnings}
                        onCheckedChange={checked =>
                          setAcknowledgedWarnings(checked === true)
                        }
                        className="mt-0.5"
                      />
                      <Label
                        htmlFor="ack-dormitory-warnings"
                        className="cursor-pointer text-sm font-normal text-amber-800"
                      >
                        위 경고 인원은 현재 배정이 유지됨을 확인했습니다.
                      </Label>
                    </div>
                  )}
                </div>
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
          {validation ? (
            <Button
              type="button"
              onClick={submit}
              disabled={!canSubmit || submitting}
            >
              {submitting ? "제출 중..." : "제출"}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={runValidate}
              disabled={!selectedSheet || step === "validate"}
            >
              {step === "validate" ? "검증 중..." : "검증"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
