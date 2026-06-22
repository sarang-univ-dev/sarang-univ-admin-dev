"use client";

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

export type Grade = {
  gradeId: number;
  gradeName: string;
  gradeNumber: number;
};

export function formatPhoneNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length < 4) return digits;
  if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

interface ParticipantInfoFieldsProps {
  name: string;
  onNameChange: (value: string) => void;
  phoneNumber: string;
  onPhoneChange: (value: string) => void;
  gender: Gender | "";
  onGenderChange: (value: Gender) => void;
  gradeId: number | null;
  onGradeChange: (value: number) => void;
  grades: Grade[];
  showLeaderName?: boolean;
  currentLeaderName?: string;
  onLeaderChange?: (value: string) => void;
  disabled?: boolean;
}

export function ParticipantInfoFields({
  name,
  onNameChange,
  phoneNumber,
  onPhoneChange,
  gender,
  onGenderChange,
  gradeId,
  onGradeChange,
  grades,
  showLeaderName = false,
  currentLeaderName = "",
  onLeaderChange,
  disabled = false,
}: ParticipantInfoFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">이름</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="이름"
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phoneNumber">전화번호</Label>
        <Input
          id="phoneNumber"
          value={phoneNumber}
          onChange={(e) => onPhoneChange(formatPhoneNumber(e.target.value))}
          placeholder="010-0000-0000"
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="gender">성별</Label>
        <Select
          value={gender}
          onValueChange={(value) => onGenderChange(value as Gender)}
          disabled={disabled}
        >
          <SelectTrigger id="gender">
            <SelectValue placeholder="성별 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={Gender.MALE}>남성</SelectItem>
            <SelectItem value={Gender.FEMALE}>여성</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="grade">학년</Label>
        <Select
          value={gradeId?.toString() ?? ""}
          onValueChange={(value) => onGradeChange(Number(value))}
          disabled={disabled}
        >
          <SelectTrigger id="grade">
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

      {showLeaderName && (
        <div className="space-y-2">
          <Label htmlFor="currentLeaderName">GBS 리더명</Label>
          <Input
            id="currentLeaderName"
            value={currentLeaderName}
            onChange={(e) => onLeaderChange?.(e.target.value)}
            placeholder="리더명"
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
}
