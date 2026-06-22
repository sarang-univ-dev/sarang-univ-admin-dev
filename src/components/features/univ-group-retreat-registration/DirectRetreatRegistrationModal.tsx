"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScheduleSelectionTable } from "@/components/common/retreat";
import {
  ParticipantInfoFields,
  type Grade,
} from "@/components/features/common/ParticipantInfoFields";
import { useScheduleChangePrice } from "@/hooks/retreat/use-schedule-change-price";
import { webAxios } from "@/lib/api/axios";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { useToastStore } from "@/store/toast-store";
import { formatSimpleDate } from "@/utils/formatDate";
import {
  Gender,
  TRetreatPaymentSchedule,
  TRetreatRegistrationSchedule,
  UserRetreatRegistrationType,
} from "@/types";

interface DirectRetreatRegistrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  retreatSlug: string;
  grades: Grade[];
  schedules: TRetreatRegistrationSchedule[];
  payments: TRetreatPaymentSchedule[];
  onSuccess: () => void;
}

export function DirectRetreatRegistrationModal({
  open,
  onOpenChange,
  retreatSlug,
  grades,
  schedules,
  payments,
  onSuccess,
}: DirectRetreatRegistrationModalProps) {
  const addToast = useToastStore((state) => state.add);

  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [gradeId, setGradeId] = useState<number | null>(null);
  const [currentLeaderName, setCurrentLeaderName] = useState("");
  const [userType, setUserType] = useState<UserRetreatRegistrationType | "">(
    ""
  );
  const [selectedScheduleIds, setSelectedScheduleIds] = useState<number[]>([]);
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 모달 열릴 때 초기화
  useEffect(() => {
    if (open) {
      setName("");
      setPhoneNumber("");
      setGender("");
      setGradeId(null);
      setCurrentLeaderName("");
      setUserType("");
      setSelectedScheduleIds([]);
      setSelectedPaymentId(null);
    }
  }, [open]);

  const gradeNumber = useMemo(
    () => grades.find((g) => g.gradeId === gradeId)?.gradeNumber,
    [grades, gradeId]
  );

  // 금액 기준 자동 기본값: 새가족/군지체/1학년 → 가장 이른 회차, 그 외 → 오늘 포함 회차(없으면 첫 회차)
  useEffect(() => {
    if (payments.length === 0) return;
    const isFirstRound =
      userType === UserRetreatRegistrationType.NEW_COMER ||
      userType === UserRetreatRegistrationType.SOLDIER ||
      gradeNumber === 1;
    if (isFirstRound) {
      const earliest = [...payments].sort(
        (a, b) =>
          new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
      )[0];
      setSelectedPaymentId(earliest.id);
      return;
    }
    const now = Date.now();
    const active = payments.find(
      (p) =>
        new Date(p.startAt).getTime() <= now &&
        new Date(p.endAt).getTime() >= now
    );
    setSelectedPaymentId((active ?? payments[0]).id);
  }, [payments, userType, gradeNumber]);

  const { calculatedPrice } = useScheduleChangePrice({
    userType: userType || "",
    grade: gradeNumber ? gradeNumber.toString() : "",
    schedules,
    payments,
    selectedScheduleIds,
    originalAmount: 0,
    selectedPaymentId: selectedPaymentId ?? undefined,
  });

  const toggleSchedule = (scheduleId: number) => {
    setSelectedScheduleIds((prev) =>
      prev.includes(scheduleId)
        ? prev.filter((id) => id !== scheduleId)
        : [...prev, scheduleId]
    );
  };

  const handleSubmit = async () => {
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
    if (!gender)
      return addToast({
        title: "오류",
        description: "성별을 선택해주세요.",
        variant: "destructive",
      });
    if (!gradeId)
      return addToast({
        title: "오류",
        description: "학년을 선택해주세요.",
        variant: "destructive",
      });
    if (!currentLeaderName.trim())
      return addToast({
        title: "오류",
        description: "리더명을 입력해주세요.",
        variant: "destructive",
      });
    if (selectedScheduleIds.length === 0)
      return addToast({
        title: "오류",
        description: "신청 일정을 선택해주세요.",
        variant: "destructive",
      });
    if (!selectedPaymentId)
      return addToast({
        title: "오류",
        description: "금액 기준을 선택해주세요.",
        variant: "destructive",
      });

    setIsSubmitting(true);
    try {
      await webAxios.post(
        `/api/v1/retreat/${retreatSlug}/registration/admin-register`,
        {
          name: name.trim(),
          phoneNumber,
          gender,
          gradeId,
          currentLeaderName: currentLeaderName.trim(),
          retreatRegistrationScheduleIds: selectedScheduleIds,
          userType: userType || null,
          selectedPaymentScheduleId: selectedPaymentId,
        }
      );
      addToast({
        title: "성공",
        description: "신청이 추가되었습니다.",
        variant: "success",
      });
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      addToast({
        title: "오류 발생",
        description: getErrorMessage(error, "신청 추가 중 오류가 발생했습니다."),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>직접 신청 추가 (수양회)</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <ParticipantInfoFields
            name={name}
            onNameChange={setName}
            phoneNumber={phoneNumber}
            onPhoneChange={setPhoneNumber}
            gender={gender}
            onGenderChange={setGender}
            gradeId={gradeId}
            onGradeChange={setGradeId}
            grades={grades}
            showLeaderName
            currentLeaderName={currentLeaderName}
            onLeaderChange={setCurrentLeaderName}
            disabled={isSubmitting}
          />

          <div className="space-y-2">
            <Label>지체 구분</Label>
            <Select
              value={userType}
              onValueChange={(value) =>
                setUserType(
                  value === "GENERAL"
                    ? ""
                    : (value as UserRetreatRegistrationType)
                )
              }
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="일반" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GENERAL">일반</SelectItem>
                <SelectItem value={UserRetreatRegistrationType.NEW_COMER}>
                  새가족
                </SelectItem>
                <SelectItem value={UserRetreatRegistrationType.SOLDIER}>
                  군지체
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>신청 일정</Label>
            <ScheduleSelectionTable
              schedules={schedules}
              selectedScheduleIds={selectedScheduleIds}
              onScheduleChange={toggleSchedule}
              disabled={isSubmitting}
            />
          </div>

          {payments.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">금액 기준 선택</h4>
              <RadioGroup
                value={selectedPaymentId?.toString()}
                onValueChange={(value) =>
                  setSelectedPaymentId(parseInt(value))
                }
                className="space-y-2"
              >
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center space-x-3"
                  >
                    <RadioGroupItem
                      value={payment.id.toString()}
                      id={`direct-payment-${payment.id}`}
                    />
                    <Label
                      htmlFor={`direct-payment-${payment.id}`}
                      className="text-sm cursor-pointer"
                    >
                      {payment.name} (
                      {formatSimpleDate(
                        payment.startAt as unknown as string
                      )}{" "}
                      ~{" "}
                      {formatSimpleDate(payment.endAt as unknown as string)})
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          <div className="flex justify-between border-t pt-4">
            <p className="font-medium">예상 금액:</p>
            <p className="font-semibold">
              {calculatedPrice.toLocaleString()}원
            </p>
          </div>
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
            {isSubmitting ? "추가 중..." : "신청 추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
