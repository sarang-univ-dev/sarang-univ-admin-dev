"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Upload,
} from "lucide-react";
import { Fragment, useEffect, useMemo, useRef } from "react";

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
import { IUserRetreatGBSLineup } from "@/hooks/gbs-line-up/use-retreat-gbs-lineup-data";
import { TRetreatRegistrationSchedule } from "@/types";
import {
  downloadChangeWarningReport,
  downloadPersonListReport,
  downloadScheduleMismatchReport,
} from "@/utils/gbs-excel/mismatch-report";
import { downloadTemplate } from "@/utils/gbs-excel/template";
import {
  PersonRef,
  ScheduleMismatchRow,
  ValidationResult,
} from "@/utils/gbs-excel/types";
import { generateScheduleColumns } from "@/utils/retreat-utils";

import { useGbsExcelImport } from "./use-gbs-excel-import";

interface GbsExcelImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  retreatSlug: string;
  lineups: IUserRetreatGBSLineup[];
  schedules: TRetreatRegistrationSchedule[];
  onImported: () => void;
}

const CATEGORY_TITLES: Record<number, string> = {
  1: "파일 형식 오류 (컬럼)",
  2: "시트 내 중복 레코드",
  3: "시트에 있으나 명단(DB)에 없는 인원",
  4: "명단(DB)에 있으나 시트에 없는 인원",
  5: "GBS(조번호)가 비어있는 인원",
  6: "신청 일정이 시트와 다른 인원",
};

function PersonList({ people }: { people: PersonRef[] }) {
  return (
    <div className="max-h-72 min-w-0 max-w-full overflow-auto rounded-md border">
      <table className="w-full text-sm text-center">
        <thead className="sticky top-0 bg-gray-100">
          <tr>
            <th className="px-2 py-1.5 font-medium">부서</th>
            <th className="px-2 py-1.5 font-medium">학년</th>
            <th className="px-2 py-1.5 font-medium">이름</th>
            <th className="px-2 py-1.5 font-medium">연락처</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {people.map((p, i) => (
            <tr key={`${p.name}-${p.phone}-${i}`}>
              <td className="px-2 py-1.5">{p.univGroupNumber}부</td>
              <td className="px-2 py-1.5">{p.gradeNumber}학년</td>
              <td className="px-2 py-1.5 font-medium">{p.name}</td>
              <td className="px-2 py-1.5">{p.phone}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** 카테고리6: 일정 불일치 — 시트 vs 명단(DB)을 일정 체크박스 그리드로 표시 */
function ScheduleMismatchList({
  rows,
  schedules,
}: {
  rows: ScheduleMismatchRow[];
  schedules: TRetreatRegistrationSchedule[];
}) {
  const cols = useMemo(() => generateScheduleColumns(schedules), [schedules]);

  return (
    <div className="max-h-72 min-w-0 max-w-full overflow-auto rounded-md border">
      <table className="min-w-max text-sm text-center">
        <thead className="sticky top-0 bg-gray-100">
          <tr>
            <th className="px-2 py-1.5 font-medium whitespace-nowrap">부서</th>
            <th className="px-2 py-1.5 font-medium whitespace-nowrap">학년</th>
            <th className="px-2 py-1.5 font-medium whitespace-nowrap">이름</th>
            <th className="px-2 py-1.5 font-medium whitespace-nowrap">구분</th>
            {cols.map(col => (
              <th
                key={col.id}
                className="px-1 py-1.5 font-medium text-center whitespace-nowrap"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {rows.map((p, i) => {
            const sheetSet = new Set(p.sheetScheduleIds);
            const dbSet = new Set(p.dbScheduleIds);
            return (
              <Fragment key={`${p.name}-${p.phone}-${i}`}>
                <tr className="border-t border-gray-200">
                  <td rowSpan={2} className="px-2 py-1.5 align-middle">
                    {p.univGroupNumber}부
                  </td>
                  <td rowSpan={2} className="px-2 py-1.5 align-middle">
                    {p.gradeNumber}학년
                  </td>
                  <td
                    rowSpan={2}
                    className="px-2 py-1.5 align-middle font-medium whitespace-nowrap"
                  >
                    {p.name}
                  </td>
                  <td className="px-2 py-1 text-muted-foreground whitespace-nowrap">
                    시트
                  </td>
                  {cols.map(col => (
                    <td key={col.id} className="px-1 py-1 text-center">
                      <Checkbox
                        checked={sheetSet.has(col.id)}
                        disabled
                        className={col.bgColorClass}
                      />
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-2 py-1 text-muted-foreground whitespace-nowrap">
                    명단
                  </td>
                  {cols.map(col => (
                    <td key={col.id} className="px-1 py-1 text-center">
                      <Checkbox
                        checked={dbSet.has(col.id)}
                        disabled
                        className={col.bgColorClass}
                      />
                    </td>
                  ))}
                </tr>
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ResultBody({
  validation,
  schedules,
}: {
  validation: ValidationResult;
  schedules: TRetreatRegistrationSchedule[];
}) {
  const cat = validation.blockingCategory;

  // ── 차단 카테고리 (1·2·3·6) ──
  if (cat === 1) {
    return (
      <div className="space-y-2">
        <p className="flex items-center gap-1.5 text-sm font-medium text-destructive">
          <AlertTriangle className="h-4 w-4" />
          {CATEGORY_TITLES[1]} ({validation.fileFormatErrors.length}건)
        </p>
        <ul className="list-disc space-y-1 rounded-md border bg-destructive/5 p-3 pl-7 text-sm text-destructive">
          {validation.fileFormatErrors.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      </div>
    );
  }
  if (cat === 6) {
    return (
      <div className="min-w-0 space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-1.5 text-sm font-medium text-destructive">
            <AlertTriangle className="h-4 w-4" />
            {CATEGORY_TITLES[6]} ({validation.scheduleMismatches.length}명)
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              downloadScheduleMismatchReport(
                validation.scheduleMismatches,
                schedules
              )
            }
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            엑셀 다운로드
          </Button>
        </div>
        <ScheduleMismatchList
          rows={validation.scheduleMismatches}
          schedules={schedules}
        />
      </div>
    );
  }
  if (cat != null) {
    const people =
      cat === 2 ? validation.sheetDuplicates : validation.unmatchedSheetPeople;
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

  // ── 차단 없음: 적용 예정 + 경고(4·5) + 변경 내역 ──
  return (
    <div className="min-w-0 space-y-3">
      <p className="flex items-center gap-1.5 text-sm font-medium text-green-700">
        <CheckCircle2 className="h-4 w-4" />
        {validation.assignments.length}명 적용 예정
      </p>
      {validation.newGbsNumbers.length > 0 && (
        <p className="text-sm text-muted-foreground">
          신규 생성 예정 GBS: {validation.newGbsNumbers.join(", ")}
        </p>
      )}

      {validation.missingDbRegistrants.length > 0 && (
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-1.5 text-sm font-medium text-amber-700">
              <AlertTriangle className="h-4 w-4" />
              {CATEGORY_TITLES[4]} ({validation.missingDbRegistrants.length}명)
              — 적용에서 제외
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                downloadPersonListReport(
                  validation.missingDbRegistrants,
                  CATEGORY_TITLES[4]
                )
              }
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              엑셀 다운로드
            </Button>
          </div>
          <PersonList people={validation.missingDbRegistrants} />
        </div>
      )}
      {validation.matchedButNoGbs.length > 0 && (
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-1.5 text-sm font-medium text-amber-700">
              <AlertTriangle className="h-4 w-4" />
              {CATEGORY_TITLES[5]} ({validation.matchedButNoGbs.length}명) —
              적용에서 제외
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                downloadPersonListReport(
                  validation.matchedButNoGbs,
                  CATEGORY_TITLES[5]
                )
              }
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              엑셀 다운로드
            </Button>
          </div>
          <PersonList people={validation.matchedButNoGbs} />
        </div>
      )}

      {validation.changeWarnings.length > 0 && (
        <div className="min-w-0 space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-yellow-700">
              변경 내역 ({validation.changeWarnings.length}건)
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                downloadChangeWarningReport(validation.changeWarnings)
              }
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              엑셀 다운로드
            </Button>
          </div>
          <div className="max-h-60 min-w-0 max-w-full overflow-auto rounded-md border">
            <table className="w-full text-sm text-center">
              <thead className="sticky top-0 bg-gray-100">
                <tr>
                  <th className="px-2 py-1.5 font-medium">부서</th>
                  <th className="px-2 py-1.5 font-medium">학년</th>
                  <th className="px-2 py-1.5 font-medium">이름</th>
                  <th className="px-2 py-1.5 font-medium">변경</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {validation.changeWarnings.map((w, i) => (
                  <tr key={`${w.name}-${i}`}>
                    <td className="px-2 py-1.5">{w.univGroupNumber}부</td>
                    <td className="px-2 py-1.5">{w.gradeNumber}학년</td>
                    <td className="px-2 py-1.5 font-medium">{w.name}</td>
                    <td className="px-2 py-1.5 text-muted-foreground">
                      {w.changes.join(", ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export function GbsExcelImportModal({
  open,
  onOpenChange,
  retreatSlug,
  lineups,
  schedules,
  onImported,
}: GbsExcelImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const imp = useGbsExcelImport({
    retreatSlug,
    lineups,
    schedules,
    onImported,
    onClose: () => onOpenChange(false),
  });

  // 모달이 닫히면 상태 초기화
  useEffect(() => {
    if (!open) imp.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const showAckCheckbox =
    !!imp.validation &&
    imp.validation.blockingCategory == null &&
    imp.validation.hasWarnings;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col overflow-hidden">
        <DialogHeader className="min-w-0">
          <DialogTitle>GBS 라인업 엑셀 가져오기</DialogTitle>
          <DialogDescription>
            마스터 워크북의 「{`(꼬리표) 수양회GBS`}」 시트를 업로드해 GBS
            배정·리더 정보를 일괄 반영합니다. (일정/개인정보/메모는 변경되지
            않습니다.)
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 min-w-0 flex-1 space-y-4 overflow-hidden py-1">
          {/* 템플릿 다운로드 */}
          <div className="flex min-w-0 items-center justify-between gap-2 rounded-md border bg-muted/40 p-2.5">
            <span className="text-xs text-muted-foreground">
              예시가 채워진 템플릿을 받아 본인 명단으로 바꾼 뒤 업로드하세요.
              (일정 컬럼은 이 수양회에 맞게 채워져 있습니다.)
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadTemplate(schedules)}
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              템플릿 다운로드
            </Button>
          </div>
          {/* 1) 파일 선택 */}
          <div className="space-y-2">
            <Label>1. 파일 선택</Label>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) imp.handleFile(file);
                  e.target.value = "";
                }}
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                파일 선택
              </Button>
              {imp.fileName && (
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <FileSpreadsheet className="h-4 w-4" />
                  {imp.fileName}
                </span>
              )}
            </div>
            {imp.error && (
              <p className="text-sm text-destructive">{imp.error}</p>
            )}
          </div>

          {/* 2) 시트 선택 */}
          {imp.sheetNames.length > 0 && (
            <div className="min-w-0 space-y-2">
              <Label>2. 시트 선택</Label>
              <Select
                value={imp.selectedSheet}
                onValueChange={imp.setSelectedSheet}
              >
                <SelectTrigger>
                  <SelectValue placeholder="시트를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {imp.sheetNames.map(name => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 3) 검증 결과 */}
          {imp.validation && (
            <div className="space-y-2">
              <Label>3. 검증 결과</Label>
              <ResultBody validation={imp.validation} schedules={schedules} />
            </div>
          )}

          {/* 경고 확인 체크박스 (시트 누락 / 조번호 빈칸) */}
          {showAckCheckbox && (
            <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3">
              <Checkbox
                id="ack-warnings"
                checked={imp.acknowledgedWarnings}
                onCheckedChange={v => imp.setAcknowledgedWarnings(v === true)}
                className="mt-0.5"
              />
              <Label
                htmlFor="ack-warnings"
                className="cursor-pointer text-sm font-normal text-amber-800"
              >
                위 경고 인원(시트 누락 / 조번호 빈칸)은 적용에서 제외됨을
                확인했습니다. 시트에 정상 포함된 인원만 제출합니다.
              </Label>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          {imp.validation ? (
            <Button
              onClick={imp.submit}
              disabled={!imp.canSubmit || imp.submitting}
            >
              {imp.submitting ? "적용 중…" : "제출"}
            </Button>
          ) : (
            <Button
              onClick={imp.runValidate}
              disabled={!imp.selectedSheet || imp.step === "validate"}
            >
              {imp.step === "validate" ? "검증 중…" : "검증"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
