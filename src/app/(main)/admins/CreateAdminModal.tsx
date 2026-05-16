"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Switch } from "@/components/ui/switch";
import { useToastStore } from "@/store/toast-store";
import { createAdmin, getUnivGroups } from "@/lib/api/admin-api";
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
  const [isSuperuser, setIsSuperuser] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setEmail("");
      setUnivGroupId("");
      setIsSuperuser(false);
      setSubmitting(false);
    }
  }, [open]);

  const canSubmit =
    name.trim().length > 0 &&
    /^\S+@\S+\.\S+$/.test(email.trim()) &&
    univGroupId !== "" &&
    !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await createAdmin({
        name: name.trim(),
        email: email.trim(),
        univGroupId: Number(univGroupId),
        isSuperuser,
      });
      onCreated();
      onClose();
    } catch (error) {
      addToast({
        title: "Admin 추가 실패",
        description: getErrorMessage(error, "Admin을 추가하지 못했습니다."),
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
          <DialogTitle>Admin 추가</DialogTitle>
          <DialogDescription>
            새 관리자 계정을 등록합니다. 이메일은 Google 로그인 시 사용됩니다.
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

          <div className="flex items-center justify-between rounded-md border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="admin-is-superuser">Superuser 권한</Label>
              <p className="text-xs text-muted-foreground">
                수양회 생성, admin 관리, 부서/학년 관리 등 운영 권한 부여
              </p>
            </div>
            <Switch
              id="admin-is-superuser"
              checked={isSuperuser}
              onCheckedChange={setIsSuperuser}
            />
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
