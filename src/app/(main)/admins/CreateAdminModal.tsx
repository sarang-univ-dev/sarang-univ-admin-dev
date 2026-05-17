"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { createAdmin, getUnivGroups } from "@/lib/api/admin-api";
import { useToastStore } from "@/store/toast-store";
import type { AdminUnivGroup } from "@/types/retreat-create";

function getErrorMessage(error: unknown, fallback: string) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response &&
    typeof error.response.data === "object" &&
    error.response.data !== null &&
    "message" in error.response.data
  ) {
    return String(error.response.data.message);
  }
  return fallback;
}

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

export default function CreateAdminModal({ open, onClose, onCreated }: Props) {
  const addToast = useToastStore(state => state.add);
  const { data: univGroups } = useSWR<AdminUnivGroup[]>(
    open ? "/api/v1/admin/univ-groups" : null,
    getUnivGroups
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [univGroupId, setUnivGroupId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setEmail("");
      setUnivGroupId("");
      setSubmitting(false);
    }
  }, [open]);

  const normalizedEmail = email.trim().toLowerCase();
  const canSubmit =
    name.trim().length > 0 &&
    /^[^\s@]+@gmail\.com$/.test(normalizedEmail) &&
    univGroupId !== "" &&
    !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await createAdmin({
        name: name.trim(),
        email: normalizedEmail,
        univGroupId: Number(univGroupId),
      });
      onCreated();
      onClose();
    } catch (error) {
      addToast({
        title: "수양회 관리자 추가 실패",
        description: getErrorMessage(
          error,
          "수양회 관리자를 추가하지 못했습니다."
        ),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>수양회 관리자 추가</DialogTitle>
          <DialogDescription>
            전체 수양회 운영 권한을 가진 관리자 계정을 등록합니다. 이메일은
            Gmail 주소만 사용할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="admin-name">이름</Label>
            <Input
              id="admin-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="홍길동"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-email">이메일</Label>
            <Input
              id="admin-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="user@gmail.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-univ-group">부서</Label>
            <Select value={univGroupId} onValueChange={setUnivGroupId}>
              <SelectTrigger id="admin-univ-group">
                <SelectValue placeholder="부서를 선택해주세요" />
              </SelectTrigger>
              <SelectContent>
                {univGroups?.map(ug => (
                  <SelectItem key={ug.id} value={ug.id.toString()}>
                    {ug.number}부 {ug.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {submitting ? "추가 중…" : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
