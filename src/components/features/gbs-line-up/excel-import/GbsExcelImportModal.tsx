"use client";

import { AlertTriangle, CheckCircle2, FileSpreadsheet, Upload } from "lucide-react";
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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IUserRetreatGBSLineup } from "@/hooks/gbs-line-up/use-retreat-gbs-lineup-data";
import { TRetreatRegistrationSchedule } from "@/types";
import { generateScheduleColumns } from "@/utils/retreat-utils";

import { PersonRef, ScheduleMismatchRow, ValidationResult } from "./types";
import { useGbsExcelImport } from "./use-gbs-excel-import";

interface GbsExcelImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  retreatSlug: string;
  lineups: IUserRetreatGBSLineup[];
  schedules: TRetreatRegistrationSchedule[];
  onImported: () => void;
  isSuperuser: boolean;
}

const CATEGORY_TITLES: Record<number, string> = {
  1: "파일 형식 오류 (컬럼)",
  2: "시트 내 중복 레코드",
  3: "시트에 있으나 명단(DB)에 없는 인원",
  4: "명단(DB)에 있으나 시트에 없는 인원",
  5: "GBS(조번호)가 비어있는 인원",
  6: "신청 일정이 시트와 다른 인원",
};

function PersonList({
  people,
}: {
  people: PersonRef[];
}) {
  return (
    <ScrollArea className="max-h-72 rounded-md border">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-gray-100">
          <tr className="text-left">
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
    </ScrollArea>
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
    <ScrollArea className="max-h-80 rounded-md border">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-gray-100">
          <tr className="text-left">
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
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
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

  if (cat === 1) {
    return (
      <div className="space-y-2">
        <p className="flex items-center gap-1.5 text-sm font-medium text-destructive">
          <AlertTriangle className="h-4 w-4" />
          {CATEGORY_TITLES[1]} — 이 오류는 무시할 수 없습니다.
        </p>
        <ul className="list-disc space-y-1 rounded-md border bg-destructive/5 p-3 pl-7 text-sm text-destructive">
          {validation.fileFormatErrors.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      </div>
    );
  }

  // 카테고리6: 일정 불일치 — 체크박스 그리드
  if (cat === 6) {
    return (
      <div className="space-y-2">
        <p className="flex items-center gap-1.5 text-sm font-medium text-destructive">
          <AlertTriangle className="h-4 w-4" />
          {CATEGORY_TITLES[6]} ({validation.scheduleMismatches.length}명)
        </p>
        <ScheduleMismatchList
          rows={validation.scheduleMismatches}
          schedules={schedules}
        />
      </div>
    );
  }

  if (cat != null) {
    const map: Record<number, PersonRef[]> = {
      2: validation.sheetDuplicates,
      3: validation.unmatchedSheetPeople,
      4: validation.missingDbRegistrants,
      5: validation.matchedButNoGbs,
    };
    const people = map[cat] ?? [];
    const lockNote = cat === 2 ? " — 이 오류는 무시할 수 없습니다." : "";
    return (
      <div className="space-y-2">
        <p className="flex items-center gap-1.5 text-sm font-medium text-destructive">
          <AlertTriangle className="h-4 w-4" />
          {CATEGORY_TITLES[cat]} ({people.length}명){lockNote}
        </p>
        <PersonList people={people} />
      </div>
    );
  }

  // blocking 없음: 성공 + 경고
  return (
    <div className="space-y-3">
      <p className="flex items-center gap-1.5 text-sm font-medium text-green-700">
        <CheckCircle2 className="h-4 w-4" />
        검증 통과 — {validation.assignments.length}명 적용 예정
      </p>
      {validation.newGbsNumbers.length > 0 && (
        <p className="text-sm text-muted-foreground">
          신규 생성 예정 GBS: {validation.newGbsNumbers.join(", ")}
        </p>
      )}
      {validation.changeWarnings.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-yellow-700">
            변경 내역 ({validation.changeWarnings.length}건)
          </p>
          <ScrollArea className="max-h-60 rounded-md border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-100">
                <tr className="text-left">
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
          </ScrollArea>
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
  isSuperuser,
}: GbsExcelImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const imp = useGbsExcelImport({
    retreatSlug,
    lineups,
    schedules,
    isSuperuser,
    onImported,
    onClose: () => onOpenChange(false),
  });

  // 모달이 닫히면 상태 초기화
  useEffect(() => {
    if (!open) imp.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const showIgnoreCheckbox =
    !!imp.validation &&
    !imp.validation.nonBypassable &&
    imp.validation.blockingCategory != null &&
    isSuperuser;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>GBS 라인업 엑셀 가져오기</DialogTitle>
          <DialogDescription>
            마스터 워크북의 「{`(꼬리표) 수양회GBS`}」 시트를 업로드해 GBS 배정·리더
            정보를 일괄 반영합니다. (일정/개인정보/메모는 변경되지 않습니다.)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* 1) 파일 선택 */}
          <div className="space-y-2">
            <Label>1. 파일 선택</Label>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => {
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
            <div className="space-y-2">
              <Label>2. 시트 선택</Label>
              <Select
                value={imp.selectedSheet}
                onValueChange={imp.setSelectedSheet}
              >
                <SelectTrigger>
                  <SelectValue placeholder="시트를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {imp.sheetNames.map((name) => (
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

          {/* superuser 오류 무시 체크박스 */}
          {showIgnoreCheckbox && (
            <div className="flex items-start gap-2 rounded-md border border-yellow-200 bg-yellow-50 p-3">
              <Checkbox
                id="ignore-errors"
                checked={imp.ignoreErrors}
                onCheckedChange={(v) => imp.setIgnoreErrors(v === true)}
                className="mt-0.5"
              />
              <Label
                htmlFor="ignore-errors"
                className="cursor-pointer text-sm font-normal text-yellow-800"
              >
                오류를 무시하고 제출 (슈퍼유저 전용) — 위 오류 인원은 적용에서
                제외됩니다.
              </Label>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          {imp.validation ? (
            <Button onClick={imp.submit} disabled={!imp.canSubmit || imp.submitting}>
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
