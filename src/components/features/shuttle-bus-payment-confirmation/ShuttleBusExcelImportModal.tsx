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

import { Badge } from "@/components/ui/badge";
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
import { useConfirm } from "@/hooks/use-confirm";
import { webAxios } from "@/lib/api/axios";
import { cn } from "@/lib/utils";
import { useToastStore } from "@/store/toast-store";
import type { TRetreatShuttleBus } from "@/types";
import type { IShuttleBusPaymentConfirmationRegistration } from "@/types/shuttle-bus-payment-confirmation";
import { generateShuttleBusScheduleColumns } from "@/utils/bus-utils";
import { parseShuttleBusRegistrationSheet } from "@/utils/shuttle-bus-excel/parse";
import { downloadShuttleBusRegistrationTemplate } from "@/utils/shuttle-bus-excel/template";
import type {
  ShuttleBusExcelUnivGroup,
  ShuttleBusImportValidation,
} from "@/utils/shuttle-bus-excel/types";

interface ShuttleBusExcelImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  retreatSlug: string;
  schedules: TRetreatShuttleBus[];
  univGroupAndGrade: ShuttleBusExcelUnivGroup[];
  existingRegistrations: IShuttleBusPaymentConfirmationRegistration[];
  onSuccess: () => void;
}

type ImportStep = "pick" | "selectSheet" | "validate" | "result" | "submitting";

const getChipColorClass = (color: string) => {
  const colorMap: Record<string, string> = {
    rose: "border-rose-500 bg-rose-50 text-rose-700",
    amber: "border-amber-500 bg-amber-50 text-amber-700",
    teal: "border-teal-500 bg-teal-50 text-teal-700",
    indigo: "border-indigo-500 bg-indigo-50 text-indigo-700",
  };
  return colorMap[color] || "border-gray-500 bg-gray-50 text-gray-700";
};

export function ShuttleBusExcelImportModal({
  open,
  onOpenChange,
  retreatSlug,
  schedules,
  univGroupAndGrade,
  existingRegistrations,
  onSuccess,
}: ShuttleBusExcelImportModalProps) {
  const addToast = useToastStore(state => state.add);
  const confirmDialog = useConfirm();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<ImportStep>("pick");
  const [fileName, setFileName] = useState("");
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [validation, setValidation] =
    useState<ShuttleBusImportValidation | null>(null);
  const [readError, setReadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scheduleColumnsWithColor = useMemo(
    () => generateShuttleBusScheduleColumns(schedules),
    [schedules]
  );

  const renderBusChips = (shuttleBusIds: number[]) => {
    const selectedSchedules = scheduleColumnsWithColor.filter(schedule =>
      shuttleBusIds.includes(schedule.id)
    );

    if (selectedSchedules.length === 0) {
      return <span className="text-sm text-muted-foreground">-</span>;
    }

    return (
      <div className="flex min-w-0 justify-center py-1">
        <div className="flex min-w-0 max-w-full flex-wrap justify-center gap-1">
          {selectedSchedules.map(schedule => (
            <Badge
              key={schedule.id}
              variant="outline"
              className={cn(
                "h-auto min-h-5 max-w-full justify-center whitespace-normal break-words px-2 py-0.5 text-center text-xs leading-tight",
                getChipColorClass(schedule.color)
              )}
            >
              {schedule.label}
            </Badge>
          ))}
        </div>
      </div>
    );
  };

  const reset = () => {
    setStep("pick");
    setFileName("");
    setWorkbook(null);
    setSheetNames([]);
    setSelectedSheet("");
    setValidation(null);
    setReadError(null);
    setIsSubmitting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && isSubmitting) return;
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  };

  const handleFile = async (file: File) => {
    setFileName(file.name);
    setWorkbook(null);
    setSheetNames([]);
    setSelectedSheet("");
    setValidation(null);
    setReadError(null);

    try {
      const buffer = await file.arrayBuffer();
      const nextWorkbook = XLSX.read(buffer, { type: "array" });
      const nextSheetNames = nextWorkbook.SheetNames;
      const firstSheetName = nextSheetNames[0];
      if (!firstSheetName) {
        setReadError("엑셀 시트를 찾을 수 없습니다.");
        return;
      }

      setWorkbook(nextWorkbook);
      setSheetNames(nextSheetNames);
      setSelectedSheet(firstSheetName);
      setStep("selectSheet");
    } catch {
      setReadError("엑셀 파일을 읽지 못했습니다. .xlsx 파일인지 확인하세요.");
      setStep("pick");
    }
  };

  const fetchLatestExistingRegistrations = async () => {
    const response = await webAxios.get(
      `/api/v1/retreat/${retreatSlug}/shuttle-bus/registrations`
    );
    const latestRegistrations = response.data.retreatShuttleBusRegistrations;
    return Array.isArray(latestRegistrations)
      ? (latestRegistrations as IShuttleBusPaymentConfirmationRegistration[])
      : existingRegistrations;
  };

  const runValidate = async () => {
    if (!workbook || !selectedSheet) return;

    setStep("validate");
    setValidation(null);
    setReadError(null);

    try {
      const worksheet = workbook.Sheets[selectedSheet];
      if (!worksheet) {
        setReadError("선택한 시트를 찾을 수 없습니다.");
        setStep("selectSheet");
        return;
      }

      const matrix = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: null,
        raw: false,
        blankrows: true,
      }) as (string | number | boolean | null)[][];
      const latestExistingRegistrations =
        await fetchLatestExistingRegistrations();

      setValidation(
        parseShuttleBusRegistrationSheet({
          matrix,
          schedules,
          univGroupAndGrade,
          existingRegistrations: latestExistingRegistrations,
        })
      );
      setStep("result");
    } catch {
      setReadError(
        "시트를 분석하거나 기존 셔틀버스 신청 목록을 불러오는 중 오류가 발생했습니다."
      );
      setStep("selectSheet");
    }
  };

  const submitRows = async () => {
    if (!validation || validation.errors.length > 0) return;

    setIsSubmitting(true);
    setStep("submitting");
    try {
      const response = await webAxios.post(
        `/api/v1/retreat/${retreatSlug}/shuttle-bus/bulk-admin-register`,
        {
          registrations: validation.rows.map(row => ({
            name: row.name,
            phoneNumber: row.phoneNumber,
            gender: row.gender,
            gradeId: row.gradeId,
            shuttleBusIds: row.shuttleBusIds,
          })),
        }
      );

      addToast({
        title: "성공",
        description: `${response.data.insertedCount ?? validation.rows.length}명 신청이 추가되었습니다.${
          validation.excludedRows.length > 0
            ? ` 기존 신청자 ${validation.excludedRows.length}명은 제외되었습니다.`
            : ""
        }`,
        variant: "success",
      });
      onSuccess();
      reset();
      onOpenChange(false);
    } catch (error) {
      addToast({
        title: "가져오기 실패",
        description:
          error instanceof AxiosError
            ? (error.response?.data?.message ??
              "신청 추가 중 오류가 발생했습니다.")
            : "신청 추가 중 오류가 발생했습니다.",
        variant: "destructive",
      });
      setStep("result");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (
      !validation ||
      validation.errors.length > 0 ||
      validation.rows.length === 0
    ) {
      return;
    }

    const confirmed = await confirmDialog.open({
      title: "셔틀버스 신청 일괄 추가",
      description: `${validation.rows.length}명을 신규 셔틀버스 신청으로 추가합니다.${
        validation.excludedRows.length > 0
          ? ` 기존 신청자 ${validation.excludedRows.length}명은 제외됩니다.`
          : ""
      }`,
      confirmText: "추가",
    });
    if (!confirmed) return;

    await submitRows();
  };

  const handleSelectedSheetChange = (value: string) => {
    setSelectedSheet(value);
    setValidation(null);
    setReadError(null);
    setStep("selectSheet");
  };

  const canSubmit =
    Boolean(validation) &&
    validation!.errors.length === 0 &&
    validation!.rows.length > 0 &&
    !isSubmitting;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col overflow-hidden">
        <DialogHeader className="min-w-0">
          <DialogTitle>셔틀버스 엑셀 가져오기</DialogTitle>
          <DialogDescription>
            신규 신청만 일괄 추가합니다. 기존 신청자는 제외됩니다.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden py-1">
          <div className="flex min-w-0 shrink-0 items-center justify-between gap-2 rounded-md border bg-muted/40 p-2.5">
            <span className="text-xs text-muted-foreground">
              템플릿을 받아 신청자 정보와 탑승 버스를 채운 뒤 업로드합니다.
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => downloadShuttleBusRegistrationTemplate(schedules)}
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
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                파일 선택
              </Button>
              {fileName ? (
                <span className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
                  <FileSpreadsheet className="h-4 w-4" />
                  <span className="min-w-0 truncate">{fileName}</span>
                </span>
              ) : null}
            </div>
            {readError ? (
              <p className="text-sm text-destructive">{readError}</p>
            ) : null}
          </div>

          {sheetNames.length > 0 ? (
            <div className="min-w-0 shrink-0 space-y-2">
              <Label>2. 시트 선택</Label>
              <Select
                value={selectedSheet}
                onValueChange={handleSelectedSheetChange}
              >
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
          ) : null}

          {validation ? (
            <div className="flex min-h-0 min-w-0 flex-1 flex-col space-y-2 overflow-hidden">
              <Label>3. 검증 결과</Label>
              <div className="min-h-0 min-w-0 overflow-auto pr-1">
                <div className="space-y-3">
                  {validation.errors.length > 0 ? (
                    <div className="space-y-2">
                      <p className="flex items-center gap-1.5 text-sm font-medium text-destructive">
                        <AlertTriangle className="h-4 w-4" />
                        검증 오류 ({validation.errors.length}건)
                      </p>
                      <ul className="max-h-56 list-disc space-y-1 overflow-auto rounded-md border bg-destructive/5 p-3 pl-7 text-sm text-destructive">
                        {validation.errors.map((error, index) => (
                          <li key={`${error}-${index}`}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p
                      className={cn(
                        "flex items-center gap-1.5 rounded-md border p-3 text-sm font-medium",
                        validation.rows.length > 0
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      )}
                    >
                      {validation.rows.length > 0 ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <AlertTriangle className="h-4 w-4" />
                      )}
                      {validation.rows.length > 0
                        ? `${validation.rows.length}명 신청을 추가할 수 있습니다.`
                        : "추가할 신규 명단이 없습니다."}
                      {validation.excludedRows.length > 0
                        ? ` 기존에 있는 인원 ${validation.excludedRows.length}명은 제외됩니다.`
                        : ""}
                    </p>
                  )}

                  {validation.rows.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">
                        추가 명단 ({validation.rows.length}명)
                      </p>
                      <div className="max-h-72 min-w-0 max-w-full overflow-auto rounded-md border">
                        <table className="relative w-full min-w-[900px] caption-bottom text-sm">
                          <TableHeader className="bg-gray-100 sticky top-0 z-10">
                            <TableRow>
                              <TableHead className="px-2 py-1.5 text-center bg-gray-100">
                                행
                              </TableHead>
                              <TableHead className="px-2 py-1.5 text-center bg-gray-100">
                                부서
                              </TableHead>
                              <TableHead className="px-2 py-1.5 text-center bg-gray-100">
                                성별
                              </TableHead>
                              <TableHead className="px-2 py-1.5 text-center bg-gray-100">
                                학년
                              </TableHead>
                              <TableHead className="px-2 py-1.5 text-center bg-gray-100">
                                이름
                              </TableHead>
                              <TableHead className="px-2 py-1.5 text-center bg-gray-100">
                                연락처
                              </TableHead>
                              <TableHead className="px-2 py-1.5 text-center bg-gray-100">
                                신청 버스
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody className="divide-y divide-gray-200">
                            {validation.rows.map(row => (
                              <TableRow
                                key={`${row.excelRow}-${row.phoneNumber}`}
                              >
                                <TableCell className="px-2 py-1.5 text-center">
                                  {row.excelRow}
                                </TableCell>
                                <TableCell className="px-2 py-1.5 text-center">
                                  {row.univGroupNumber}부
                                </TableCell>
                                <TableCell className="px-2 py-1.5 text-center">
                                  {row.gender === "MALE" ? "남" : "여"}
                                </TableCell>
                                <TableCell className="px-2 py-1.5 text-center">
                                  {row.gradeNumber}학년
                                </TableCell>
                                <TableCell className="px-2 py-1.5 text-center font-medium">
                                  {row.name}
                                </TableCell>
                                <TableCell className="px-2 py-1.5 text-center">
                                  {row.phoneNumber}
                                </TableCell>
                                <TableCell className="px-2 py-1.5 text-center">
                                  {renderBusChips(row.shuttleBusIds)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </table>
                      </div>
                    </div>
                  ) : null}

                  {validation.excludedRows.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-amber-700">
                        제외 명단 ({validation.excludedRows.length}명)
                      </p>
                      <div className="max-h-72 min-w-0 max-w-full overflow-auto rounded-md border border-amber-200">
                        <table className="relative w-full min-w-[980px] caption-bottom text-sm">
                          <TableHeader className="bg-amber-50 sticky top-0 z-10">
                            <TableRow>
                              <TableHead className="px-2 py-1.5 text-center bg-amber-50">
                                행
                              </TableHead>
                              <TableHead className="px-2 py-1.5 text-center bg-amber-50">
                                부서
                              </TableHead>
                              <TableHead className="px-2 py-1.5 text-center bg-amber-50">
                                성별
                              </TableHead>
                              <TableHead className="px-2 py-1.5 text-center bg-amber-50">
                                학년
                              </TableHead>
                              <TableHead className="px-2 py-1.5 text-center bg-amber-50">
                                이름
                              </TableHead>
                              <TableHead className="px-2 py-1.5 text-center bg-amber-50">
                                연락처
                              </TableHead>
                              <TableHead className="px-2 py-1.5 text-center bg-amber-50">
                                신청 버스
                              </TableHead>
                              <TableHead className="px-2 py-1.5 text-center bg-amber-50">
                                사유
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody className="divide-y divide-gray-200">
                            {validation.excludedRows.map(row => (
                              <TableRow
                                key={`${row.excelRow}-${row.phoneNumber}`}
                              >
                                <TableCell className="px-2 py-1.5 text-center">
                                  {row.excelRow}
                                </TableCell>
                                <TableCell className="px-2 py-1.5 text-center">
                                  {row.univGroupNumber}부
                                </TableCell>
                                <TableCell className="px-2 py-1.5 text-center">
                                  {row.gender === "MALE" ? "남" : "여"}
                                </TableCell>
                                <TableCell className="px-2 py-1.5 text-center">
                                  {row.gradeNumber}학년
                                </TableCell>
                                <TableCell className="px-2 py-1.5 text-center font-medium">
                                  {row.name}
                                </TableCell>
                                <TableCell className="px-2 py-1.5 text-center">
                                  {row.phoneNumber}
                                </TableCell>
                                <TableCell className="px-2 py-1.5 text-center">
                                  {renderBusChips(row.shuttleBusIds)}
                                </TableCell>
                                <TableCell className="px-2 py-1.5 text-center text-amber-700">
                                  {row.reasonText}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </table>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter className="shrink-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            취소
          </Button>
          {validation ? (
            <Button onClick={() => void handleSubmit()} disabled={!canSubmit}>
              {isSubmitting ? "제출 중..." : "제출"}
            </Button>
          ) : (
            <Button
              onClick={() => void runValidate()}
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
