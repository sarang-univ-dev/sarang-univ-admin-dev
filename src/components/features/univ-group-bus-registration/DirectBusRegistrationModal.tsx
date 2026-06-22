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
import { Checkbox } from "@/components/ui/checkbox";
import {
  ParticipantInfoFields,
  type Grade,
} from "@/components/features/common/ParticipantInfoFields";
import { webAxios } from "@/lib/api/axios";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { useToastStore } from "@/store/toast-store";
import { formatSimpleDate } from "@/utils/formatDate";
import {
  Gender,
  RetreatShuttleBusDirection,
  TRetreatShuttleBus,
} from "@/types";

interface DirectBusRegistrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  retreatSlug: string;
  grades: Grade[];
  schedules: TRetreatShuttleBus[];
  onSuccess: () => void;
}

export function DirectBusRegistrationModal({
  open,
  onOpenChange,
  retreatSlug,
  grades,
  schedules,
  onSuccess,
}: DirectBusRegistrationModalProps) {
  const addToast = useToastStore((state) => state.add);

  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [gradeId, setGradeId] = useState<number | null>(null);
  const [selectedBusIds, setSelectedBusIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setPhoneNumber("");
      setGender("");
      setGradeId(null);
      setSelectedBusIds([]);
    }
  }, [open]);

  const price = useMemo(
    () =>
      schedules
        .filter((bus) => selectedBusIds.includes(bus.id))
        .reduce((sum, bus) => sum + (bus.price || 0), 0),
    [schedules, selectedBusIds]
  );

  const toggleBus = (busId: number) => {
    setSelectedBusIds((prev) =>
      prev.includes(busId)
        ? prev.filter((id) => id !== busId)
        : [...prev, busId]
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
    if (selectedBusIds.length === 0)
      return addToast({
        title: "오류",
        description: "셔틀버스를 선택해주세요.",
        variant: "destructive",
      });

    setIsSubmitting(true);
    try {
      await webAxios.post(
        `/api/v1/retreat/${retreatSlug}/shuttle-bus/admin-register`,
        {
          name: name.trim(),
          phoneNumber,
          gender,
          gradeId,
          shuttleBusIds: selectedBusIds,
        }
      );
      addToast({
        title: "성공",
        description: "셔틀버스 신청이 추가되었습니다.",
        variant: "success",
      });
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      addToast({
        title: "오류 발생",
        description: getErrorMessage(
          error,
          "신청 추가 중 오류가 발생했습니다."
        ),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>직접 신청 추가 (셔틀버스)</DialogTitle>
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
            disabled={isSubmitting}
          />

          <div className="space-y-2">
            <Label>셔틀버스 선택</Label>
            <div className="space-y-2">
              {schedules.map((bus) => (
                <label
                  key={bus.id}
                  className="flex items-center gap-3 p-2 rounded-md border cursor-pointer"
                >
                  <Checkbox
                    checked={selectedBusIds.includes(bus.id)}
                    onCheckedChange={() => toggleBus(bus.id)}
                    disabled={isSubmitting}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {bus.name}
                      <span className="ml-2 text-xs text-gray-500">
                        {bus.direction ===
                        RetreatShuttleBusDirection.FROM_CHURCH_TO_RETREAT
                          ? "교회→수양회장"
                          : "수양회장→교회"}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500">
                      {bus.departureTime
                        ? formatSimpleDate(
                            bus.departureTime as unknown as string
                          )
                        : "-"}{" "}
                      · {bus.price.toLocaleString()}원
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-between border-t pt-4">
            <p className="font-medium">예상 금액:</p>
            <p className="font-semibold">{price.toLocaleString()}원</p>
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
