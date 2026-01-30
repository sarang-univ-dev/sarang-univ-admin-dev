"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Gender } from "@/types";

interface Grade {
  gradeId: number;
  gradeName: string;
  gradeNumber: number;
}

interface RegistrationEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    name: string;
    phoneNumber: string;
    gender: Gender;
    gradeId: number;
    currentLeaderName: string;
  }) => Promise<void>;
  initialData: {
    name: string;
    phoneNumber: string;
    gender: Gender;
    gradeNumber: number;
    currentLeaderName: string;
  };
  grades: Grade[];
  isLoading?: boolean;
  /** 현재 리더명 필드 표시 여부 (수양회 신청에서만 true) */
  showCurrentLeaderName?: boolean;
}

export function RegistrationEditModal({
  open,
  onOpenChange,
  onSave,
  initialData,
  grades,
  isLoading = false,
  showCurrentLeaderName = true,
}: RegistrationEditModalProps) {
  const [name, setName] = useState(initialData.name);
  const [phoneNumber, setPhoneNumber] = useState(initialData.phoneNumber);
  const [gender, setGender] = useState<Gender>(initialData.gender);
  const [gradeId, setGradeId] = useState<number | null>(null);
  const [currentLeaderName, setCurrentLeaderName] = useState(
    initialData.currentLeaderName || ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 초기 gradeId 설정 (gradeNumber로 찾기)
  useEffect(() => {
    if (open && grades.length > 0) {
      const matchingGrade = grades.find(
        (g) => g.gradeNumber === initialData.gradeNumber
      );
      if (matchingGrade) {
        setGradeId(matchingGrade.gradeId);
      }
    }
  }, [open, grades, initialData.gradeNumber]);

  // 모달이 열릴 때 초기값으로 리셋
  useEffect(() => {
    if (open) {
      setName(initialData.name);
      setPhoneNumber(initialData.phoneNumber);
      setGender(initialData.gender);
      setCurrentLeaderName(initialData.currentLeaderName || "");
      setError(null);
    }
  }, [open, initialData]);

  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^010-\d{4}-\d{4}$/;
    return phoneRegex.test(phone);
  };

  const handleSave = async () => {
    setError(null);

    // 유효성 검사
    if (!name.trim()) {
      setError("이름을 입력해주세요.");
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      setError("전화번호는 010-XXXX-XXXX 형식이어야 합니다.");
      return;
    }

    if (!gradeId) {
      setError("학년을 선택해주세요.");
      return;
    }

    if (showCurrentLeaderName && !currentLeaderName.trim()) {
      setError("현재 리더명을 입력해주세요.");
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        name: name.trim(),
        phoneNumber,
        gender,
        gradeId,
        currentLeaderName: currentLeaderName.trim(),
      });
      onOpenChange(false);
    } catch (err) {
      // 에러는 상위 컴포넌트에서 처리됨
    } finally {
      setIsSaving(false);
    }
  };

  const formatPhoneNumber = (value: string): string => {
    // 숫자만 추출
    const numbers = value.replace(/\D/g, "");

    // 010-XXXX-XXXX 형식으로 포맷
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>신청자 정보 수정</DialogTitle>
          <DialogDescription>
            신청자의 기본 정보를 수정합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* 이름 */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              이름
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              disabled={isSaving || isLoading}
            />
          </div>

          {/* 전화번호 */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phoneNumber" className="text-right">
              전화번호
            </Label>
            <Input
              id="phoneNumber"
              value={phoneNumber}
              onChange={handlePhoneNumberChange}
              placeholder="010-0000-0000"
              className="col-span-3"
              disabled={isSaving || isLoading}
            />
          </div>

          {/* 성별 */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="gender" className="text-right">
              성별
            </Label>
            <Select
              value={gender}
              onValueChange={(value) => setGender(value as Gender)}
              disabled={isSaving || isLoading}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="성별 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Gender.MALE}>남성</SelectItem>
                <SelectItem value={Gender.FEMALE}>여성</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 학년 */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="grade" className="text-right">
              학년
            </Label>
            <Select
              value={gradeId?.toString() ?? ""}
              onValueChange={(value) => setGradeId(Number(value))}
              disabled={isSaving || isLoading}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="학년 선택" />
              </SelectTrigger>
              <SelectContent>
                {grades.map((grade) => (
                  <SelectItem
                    key={grade.gradeId}
                    value={grade.gradeId.toString()}
                  >
                    {grade.gradeName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 현재 리더명 */}
          {showCurrentLeaderName && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="currentLeaderName" className="text-right">
                현재 리더명
              </Label>
              <Input
                id="currentLeaderName"
                value={currentLeaderName}
                onChange={(e) => setCurrentLeaderName(e.target.value)}
                className="col-span-3"
                disabled={isSaving || isLoading}
              />
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            취소
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isLoading}>
            {isSaving ? "저장 중..." : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
