"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { ArrowLeft, Shield, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToastStore } from "@/store/toast-store";
import {
  getAdminDetail,
  getUnivGroups,
  updateAdmin,
} from "@/lib/api/admin-api";
import type { AdminDetail } from "@/types/admin-management";
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

type Props = { adminUserId: number };

export default function AdminDetailClient({ adminUserId }: Props) {
  const addToast = useToastStore(state => state.add);

  const { data, error, isLoading, mutate } = useSWR<AdminDetail>(
    `/api/v1/admin/admins/${adminUserId}`,
    () => getAdminDetail(adminUserId)
  );

  const { data: univGroups } = useSWR<AdminUnivGroup[]>(
    "/api/v1/admin/univ-groups",
    getUnivGroups
  );

  const [name, setName] = useState("");
  const [univGroupId, setUnivGroupId] = useState<string>("");
  const [isActive, setIsActive] = useState(true);
  const [isSuperuser, setIsSuperuser] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data?.admin) {
      setName(data.admin.name);
      setUnivGroupId(data.admin.univGroupId.toString());
      setIsActive(data.admin.isActive);
      setIsSuperuser(data.admin.isSuperuser);
    }
  }, [data]);

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        {error ? (
          <p className="text-destructive">
            조회 실패: {getErrorMessage(error, "Admin 정보를 불러오지 못했습니다.")}
          </p>
        ) : (
          <p className="text-muted-foreground">불러오는 중…</p>
        )}
      </div>
    );
  }

  const { admin } = data;
  const dirty =
    name !== admin.name ||
    univGroupId !== admin.univGroupId.toString() ||
    isActive !== admin.isActive ||
    isSuperuser !== admin.isSuperuser;

  const handleSave = async () => {
    if (!dirty || saving) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {};
      if (name !== admin.name) payload.name = name.trim();
      if (univGroupId !== admin.univGroupId.toString())
        payload.univGroupId = Number(univGroupId);
      if (isActive !== admin.isActive) payload.isActive = isActive;
      if (isSuperuser !== admin.isSuperuser) payload.isSuperuser = isSuperuser;

      await updateAdmin(adminUserId, payload);
      addToast({ title: "변경사항을 저장했습니다.", variant: "success" });
      await mutate();
    } catch (err) {
      addToast({
        title: "저장 실패",
        description: getErrorMessage(err, "변경사항을 저장하지 못했습니다."),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admins">
            <ArrowLeft className="h-4 w-4 mr-1" />
            목록으로
          </Link>
        </Button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{admin.name}</h1>
          {admin.isSuperuser && (
            <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200">
              <Shield className="h-3.5 w-3.5 text-indigo-500 mr-1.5 flex-shrink-0" />
              <span className="text-xs font-medium text-indigo-700 whitespace-nowrap">
                Superuser
              </span>
            </div>
          )}
          {!admin.isActive && (
            <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200">
              <XCircle className="h-3.5 w-3.5 text-gray-500 mr-1.5 flex-shrink-0" />
              <span className="text-xs font-medium text-gray-700 whitespace-nowrap">
                비활성
              </span>
            </div>
          )}
        </div>
        <p className="text-muted-foreground">{admin.email}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
          <CardDescription>
            이름, 부서, 활성 여부, superuser 권한을 변경할 수 있습니다. 이메일은 로그인 키이므로 수정할 수 없습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <Input
                id="name"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input id="email" value={admin.email} disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="univ-group">부서</Label>
              <Select value={univGroupId} onValueChange={setUnivGroupId}>
                <SelectTrigger id="univ-group">
                  <SelectValue />
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

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between rounded-md border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="is-active">활성</Label>
                <p className="text-xs text-muted-foreground">
                  비활성 시 로그인 및 권한 체크에서 즉시 차단됩니다.
                </p>
              </div>
              <Switch
                id="is-active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>

            <div className="flex items-center justify-between rounded-md border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="is-superuser">Superuser</Label>
                <p className="text-xs text-muted-foreground">
                  수양회 생성, admin 관리, 부서/학년 관리 등 운영 권한을 가집니다.
                </p>
              </div>
              <Switch
                id="is-superuser"
                checked={isSuperuser}
                onCheckedChange={setIsSuperuser}
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} disabled={!dirty || saving}>
              {saving ? "저장 중…" : "저장"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
