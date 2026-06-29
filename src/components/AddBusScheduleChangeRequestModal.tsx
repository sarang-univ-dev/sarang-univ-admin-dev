"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { webAxios } from "@/lib/api/axios";
import { useToastStore } from "@/store/toast-store";

interface UnivGroupAndGrade {
  univGroupId: number;
  univGroupName: string;
  univGroupNumber: number;
  grades: { gradeId: number; gradeName: string; gradeNumber: number }[];
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: unknown }).response === "object" &&
    (error as { response: unknown }).response !== null &&
    "data" in (error as { response: { data?: unknown } }).response &&
    typeof (error as { response: { data?: unknown } }).response.data ===
      "object" &&
    (error as { response: { data: unknown } }).response.data !== null &&
    "message" in
      (error as { response: { data: { message?: unknown } } }).response.data
  ) {
    return String(
      (error as { response: { data: { message: unknown } } }).response.data
        .message
    );
  }
  return fallback;
}

function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length < 4) return digits;
  if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

interface AddBusScheduleChangeRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  retreatSlug: string;
  univGroupAndGrade: UnivGroupAndGrade[];
  onSuccess: () => void;
}

export function AddBusScheduleChangeRequestModal({
  open,
  onOpenChange,
  retreatSlug,
  univGroupAndGrade,
  onSuccess,
}: AddBusScheduleChangeRequestModalProps) {
  const addToast = useToastStore(state => state.add);

  const [univGroupNumber, setUnivGroupNumber] = useState<number | null>(null);
  const [gradeId, setGradeId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [memo, setMemo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setUnivGroupNumber(null);
      setGradeId(null);
      setName("");
      setPhoneNumber("");
      setMemo("");
    }
  }, [open]);

  const availableGrades = useMemo(
    () =>
      univGroupAndGrade.find(g => g.univGroupNumber === univGroupNumber)
        ?.grades ?? [],
    [univGroupAndGrade, univGroupNumber]
  );

  const handleSubmit = async () => {
    if (univGroupNumber === null)
      return addToast({
        title: "오류",
        description: "부서를 선택해주세요.",
        variant: "destructive",
      });
    if (!gradeId)
      return addToast({
        title: "오류",
        description: "학년을 선택해주세요.",
        variant: "destructive",
      });
    if (!name.trim())
      return addToast({
        title: "오류",
        description: "이름을 입력해주세요.",
        variant: "destructive",
      });
    if (!/^010-\d{4}-\d{4}$/.test(phoneNumber))
      return addToast({
        title: "오류",
        description: "전화번호 형식이 올바르지 않습니다.",
        variant: "destructive",
      });

    setIsSubmitting(true);
    try {
      // 매칭은 서버에서 이름+전화번호로 수행. 부서/학년은 운영자 식별용으로 전송하지 않는다.
      await webAxios.post(
        `/api/v1/retreat/${retreatSlug}/shuttle-bus/bus-registration-change-request`,
        {
          name: name.trim(),
          phoneNumber,
          memo: memo.trim(),
        }
      );
      addToast({
        title: "성공",
        description: "일정 변경 요청이 추가되었습니다.",
        variant: "success",
      });
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      addToast({
        title: "오류 발생",
        description: getErrorMessage(
          error,
          "일정 변경 요청 추가 중 오류가 발생했습니다."
        ),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>일정 변경 요청 추가</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="univGroup">부서</Label>
            <Select
              value={univGroupNumber !== null ? univGroupNumber.toString() : ""}
              onValueChange={v => {
                setUnivGroupNumber(Number(v));
                setGradeId(null);
              }}
              disabled={isSubmitting}
            >
              <SelectTrigger id="univGroup">
                <SelectValue placeholder="부서 선택" />
              </SelectTrigger>
              <SelectContent>
                {[...univGroupAndGrade]
                  .sort((a, b) => a.univGroupNumber - b.univGroupNumber)
                  .map(group => (
                    <SelectItem
                      key={group.univGroupId}
                      value={group.univGroupNumber.toString()}
                    >
                      {group.univGroupNumber}부
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="grade">학년</Label>
            <Select
              value={gradeId?.toString() ?? ""}
              onValueChange={value => setGradeId(Number(value))}
              disabled={isSubmitting || univGroupNumber === null}
            >
              <SelectTrigger id="grade">
                <SelectValue placeholder="학년 선택" />
              </SelectTrigger>
              <SelectContent>
                {availableGrades.map(grade => (
                  <SelectItem
                    key={grade.gradeId}
                    value={grade.gradeId.toString()}
                  >
                    {`${grade.gradeNumber}학년 ${grade.gradeName}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">이름</Label>
            <Input
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="이름"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">전화번호</Label>
            <Input
              id="phoneNumber"
              value={phoneNumber}
              onChange={e => setPhoneNumber(formatPhoneNumber(e.target.value))}
              placeholder="010-0000-0000"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="memo">메모 (선택)</Label>
            <Textarea
              id="memo"
              value={memo}
              onChange={e => setMemo(e.target.value)}
              placeholder="변경 요청 내용"
              disabled={isSubmitting}
            />
          </div>

          <p className="text-xs text-gray-500">
            * 이름과 전화번호로 기존 셔틀버스 신청자를 찾습니다. 신청 내역이
            없는 인원이면 추가되지 않습니다.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "추가 중..." : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
