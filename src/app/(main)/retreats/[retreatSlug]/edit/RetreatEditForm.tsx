"use client";

import { Download, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, ReactNode, useMemo, useState } from "react";
import useSWR, { useSWRConfig } from "swr";

import {
  createEmptyRetreatUnivGroupInformation,
  RetreatUnivGroupOperationInfoFields,
} from "@/components/features/retreat-management/RetreatUnivGroupOperationInfoFields";
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
import { Textarea } from "@/components/ui/textarea";
import {
  addPaymentSchedule,
  addRegistrationSchedule,
  addShuttleBus,
  createRetreatAdminAssignment,
  deletePaymentSchedule,
  deleteRegistrationSchedule,
  deleteShuttleBus,
  downloadRetreatAsset,
  getRetreatAdminAssignmentOptions,
  getRetreatAdminAssignments,
  updatePaymentSchedule,
  updateRetreatAdminUser,
  updateRegistrationSchedule,
  updateRetreat,
  updateShuttleBus,
  uploadRetreatAsset,
} from "@/lib/api/admin-api";
import { useToastStore } from "@/store/toast-store";
import type {
  CreateRetreatAdminAssignmentRequest,
  ManagedRetreatDetail,
  ManagedRetreatPaymentSchedule,
  ManagedRetreatRegistrationSchedule,
  ManagedRetreatShuttleBus,
  RetreatAdminAssignment,
  RetreatUnivGroupInformation,
  UpdateRetreatAdminUserRequest,
  UpdateRetreatRequest,
} from "@/types/retreat-create";

const registrationScheduleTypes = [
  "BREAKFAST",
  "LUNCH",
  "DINNER",
  "SLEEP",
] as const;
const registrationScheduleLabels: Record<
  (typeof registrationScheduleTypes)[number],
  string
> = {
  BREAKFAST: "아침",
  LUNCH: "점심",
  DINNER: "저녁",
  SLEEP: "숙박",
};
const registrationScheduleDefaultTimes: Record<
  (typeof registrationScheduleTypes)[number],
  string
> = {
  BREAKFAST: "08:00",
  LUNCH: "12:00",
  DINNER: "18:00",
  SLEEP: "22:00",
};

const shuttleDirections = [
  "FROM_CHURCH_TO_RETREAT",
  "FROM_RETREAT_TO_CHURCH",
] as const;
const shuttleDirectionLabels: Record<
  (typeof shuttleDirections)[number],
  string
> = {
  FROM_CHURCH_TO_RETREAT: "교회 -> 수양회",
  FROM_RETREAT_TO_CHURCH: "수양회 -> 교회",
};

function toIsoDateTime(value: string) {
  return new Date(value).toISOString();
}

const gmailEmailPattern = /^[^\s@]+@gmail\.com$/;

const retreatAdminRoleOrder = [
  "UNIV_GROUP_ADMIN_STAFF",
  "ACCOUNT_STAFF",
  "LINEUP_STAFF",
  "DORMITORY_STAFF",
  "SHUTTLE_BUS_ACCOUNT_STAFF",
  "SHUTTLE_BUS_BOARDING_STAFF",
  "UNIV_GROUP_MINISTER",
  "ADMIN_MINISTER",
  "UNIV_GROUP_ACCOUNT_MEMBER",
  "UNIV_GROUP_DORMITORY_MEMBER",
  "SHUTTLE_BUS_ACCOUNT_MEMBER",
] as const;

const retreatAdminRoleLabels: Record<string, string> = {
  UNIV_GROUP_ADMIN_STAFF: "행정 간사",
  ACCOUNT_STAFF: "재정 간사",
  LINEUP_STAFF: "라인업 간사",
  DORMITORY_STAFF: "인원관리 간사",
  SHUTTLE_BUS_ACCOUNT_STAFF: "버스 간사",
  SHUTTLE_BUS_BOARDING_STAFF: "부분참 선탑 간사",
  UNIV_GROUP_MINISTER: "부서 교역자",
  ADMIN_MINISTER: "행정 총괄 교역자",
  UNIV_GROUP_ACCOUNT_MEMBER: "부서 재정팀원",
  UNIV_GROUP_DORMITORY_MEMBER: "부서 인원관리 팀원",
  SHUTTLE_BUS_ACCOUNT_MEMBER: "총무 팀원/셔틀버스 재정 팀원",
};

function getRetreatAdminRoleLabel(roleName: string, fallback: string) {
  return retreatAdminRoleLabels[roleName] ?? fallback;
}

type RetreatEditFormProps = {
  retreat: ManagedRetreatDetail;
  canManageRetreats: boolean;
};

function getErrorMessage(
  error: unknown,
  fallbackMessage = "수양회 정보를 저장하지 못했습니다."
) {
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

  return fallbackMessage;
}

export default function RetreatEditForm({
  retreat,
  canManageRetreats,
}: RetreatEditFormProps) {
  const router = useRouter();
  const addToast = useToastStore(state => state.add);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [downloadingAsset, setDownloadingAsset] = useState<
    "poster" | "qr-template" | null
  >(null);
  const [posterImage, setPosterImage] = useState<File | null>(null);
  const [qrImage, setQrImage] = useState<File | null>(null);
  const [form, setForm] = useState<
    Omit<UpdateRetreatRequest, "memo" | "univGroups">
  >({
    name: retreat.name,
    location: retreat.location,
    mainVerse: retreat.mainVerse,
    mainSpeaker: retreat.mainSpeaker,
    posterUrl: retreat.posterUrl || "",
    qrTemplateImageKey: retreat.qrTemplateImageKey || "",
  });
  const [operationInfoByUnivGroupId, setOperationInfoByUnivGroupId] = useState<
    Record<number, RetreatUnivGroupInformation>
  >(() =>
    Object.fromEntries(
      retreat.univGroups.map(univGroup => [
        univGroup.id,
        univGroup.information ?? createEmptyRetreatUnivGroupInformation(),
      ])
    )
  );

  const updateOperationInfo = (
    univGroupId: number,
    field: keyof RetreatUnivGroupInformation,
    value: string
  ) => {
    setOperationInfoByUnivGroupId(current => ({
      ...current,
      [univGroupId]: {
        ...(current[univGroupId] ?? createEmptyRetreatUnivGroupInformation()),
        [field]: value,
      },
    }));
  };

  const handleDownloadAsset = async (assetType: "poster" | "qr-template") => {
    setDownloadingAsset(assetType);

    try {
      const { blob, fileName } = await downloadRetreatAsset(
        retreat.id,
        assetType
      );
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      addToast({
        title: "이미지 다운로드 실패",
        description: getErrorMessage(
          error,
          "현재 이미지를 다운로드하지 못했습니다."
        ),
        variant: "destructive",
      });
    } finally {
      setDownloadingAsset(null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      let posterUrl = form.posterUrl || undefined;
      let qrTemplateImageKey = form.qrTemplateImageKey || undefined;

      if (posterImage) {
        const poster = await uploadRetreatAsset({
          assetType: "POSTER",
          image: posterImage,
        });
        if (poster.assetType === "POSTER") {
          posterUrl = poster.posterUrl;
        }
      }

      if (qrImage) {
        const qrTemplate = await uploadRetreatAsset({
          assetType: "QR_TEMPLATE",
          image: qrImage,
        });
        if (qrTemplate.assetType === "QR_TEMPLATE") {
          qrTemplateImageKey = qrTemplate.qrTemplateImageKey;
        }
      }

      await updateRetreat(retreat.id, {
        ...form,
        posterUrl,
        qrTemplateImageKey,
        univGroups: retreat.univGroups.map(univGroup => ({
          univGroupId: univGroup.id,
          information:
            operationInfoByUnivGroupId[univGroup.id] ??
            createEmptyRetreatUnivGroupInformation(),
        })),
      });
      addToast({
        title: "수양회 정보를 저장했습니다.",
        variant: "success",
      });
      router.push("/retreats");
      router.refresh();
    } catch (error) {
      addToast({
        title: "수양회 정보 저장 실패",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">수양회 정보 수정</h1>
        <p className="text-muted-foreground">
          {canManageRetreats
            ? "신청 일정, 결제 일정, 셔틀버스 노선과 권한을 관리합니다."
            : "접근 가능한 수양회의 권한을 관리합니다."}
        </p>
      </div>

      {canManageRetreats ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
              <CardDescription>
                수양회 신청 폼에 표시되는 정보입니다. 신청 폼 주소:{" "}
                {retreat.slug}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Field label="수양회 이름">
                <Input
                  value={form.name}
                  onChange={event =>
                    setForm(current => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  required
                />
              </Field>
              <Field label="수양회 장소">
                <Input
                  value={form.location}
                  onChange={event =>
                    setForm(current => ({
                      ...current,
                      location: event.target.value,
                    }))
                  }
                  required
                />
              </Field>
              <Field label="수양회 강사">
                <Input
                  value={form.mainSpeaker}
                  onChange={event =>
                    setForm(current => ({
                      ...current,
                      mainSpeaker: event.target.value,
                    }))
                  }
                  required
                />
              </Field>
              <Field label="주제 말씀" className="md:col-span-2">
                <Textarea
                  value={form.mainVerse}
                  onChange={event =>
                    setForm(current => ({
                      ...current,
                      mainVerse: event.target.value,
                    }))
                  }
                  required
                />
              </Field>
              <Field label="포스터 이미지" className="md:col-span-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={event =>
                    setPosterImage(event.target.files?.[0] ?? null)
                  }
                />
                {form.posterUrl ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void handleDownloadAsset("poster")}
                    disabled={downloadingAsset !== null}
                  >
                    <Download className="h-4 w-4" />
                    {downloadingAsset === "poster"
                      ? "포스터 다운로드 중"
                      : "현재 포스터 다운로드"}
                  </Button>
                ) : null}
              </Field>
              <Field label="QR 템플릿 이미지" className="md:col-span-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={event =>
                    setQrImage(event.target.files?.[0] ?? null)
                  }
                />
                {form.qrTemplateImageKey ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void handleDownloadAsset("qr-template")}
                    disabled={downloadingAsset !== null}
                  >
                    <Download className="h-4 w-4" />
                    {downloadingAsset === "qr-template"
                      ? "QR 템플릿 다운로드 중"
                      : "현재 QR 템플릿 다운로드"}
                  </Button>
                ) : null}
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>부서별 운영 정보</CardTitle>
              <CardDescription>
                신청 완료 안내와 문자 발송에 사용되는 정보입니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RetreatUnivGroupOperationInfoFields
                univGroups={retreat.univGroups}
                informationByUnivGroupId={operationInfoByUnivGroupId}
                onChange={updateOperationInfo}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              <Save className="h-4 w-4" />
              {isSubmitting ? "저장 중" : "저장"}
            </Button>
          </div>
        </form>
      ) : (
        <RetreatSummaryCard retreat={retreat} />
      )}

      {canManageRetreats ? (
        <>
          <RegistrationSchedulesCard
            retreatId={retreat.id}
            registrationSchedules={retreat.registrationSchedules}
          />
          <PaymentSchedulesCard
            retreatId={retreat.id}
            paymentSchedules={retreat.paymentSchedules}
          />
          <AddPaymentScheduleCard retreatId={retreat.id} />
          <ShuttleBusesCard
            retreatId={retreat.id}
            shuttleBuses={retreat.shuttleBuses}
          />
          <AddShuttleBusCard retreatId={retreat.id} />
        </>
      ) : null}

      <RetreatAdminAssignmentsCard retreatSlug={retreat.slug} />
    </div>
  );
}

function RetreatSummaryCard({ retreat }: { retreat: ManagedRetreatDetail }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>수양회 정보</CardTitle>
        <CardDescription>{retreat.slug}</CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-3 text-sm md:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">수양회 이름</dt>
            <dd className="font-medium">{retreat.name}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">장소</dt>
            <dd className="font-medium">{retreat.location}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">강사</dt>
            <dd className="font-medium">{retreat.mainSpeaker}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">주제 말씀</dt>
            <dd className="font-medium">{retreat.mainVerse}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}

function RetreatAdminAssignmentsCard({ retreatSlug }: { retreatSlug: string }) {
  const router = useRouter();
  const addToast = useToastStore(state => state.add);
  const { mutate: mutateGlobal } = useSWRConfig();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    univGroupId: "",
    name: "",
    email: "",
    roleId: "",
    startDate: "",
    endDate: "",
  });
  const {
    data: options,
    error: optionsError,
    isLoading: optionsLoading,
  } = useSWR(["retreat-admin-assignment-options", retreatSlug], () =>
    getRetreatAdminAssignmentOptions(retreatSlug)
  );
  const {
    data: assignments = [],
    error: assignmentsError,
    isLoading: assignmentsLoading,
    mutate,
  } = useSWR(["retreat-admin-assignments", retreatSlug], () =>
    getRetreatAdminAssignments(retreatSlug)
  );

  const sortedRoles = useMemo(() => {
    if (!options) return [];
    return [...options.roles].sort((a, b) => {
      const indexA = retreatAdminRoleOrder.indexOf(
        a.name as (typeof retreatAdminRoleOrder)[number]
      );
      const indexB = retreatAdminRoleOrder.indexOf(
        b.name as (typeof retreatAdminRoleOrder)[number]
      );

      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.displayName.localeCompare(b.displayName, "ko");
    });
  }, [options]);

  const groupedAssignments = useMemo(() => {
    const groupMap = new Map<string, RetreatAdminAssignment[]>();

    assignments.forEach(assignment => {
      const group = groupMap.get(assignment.roleName) ?? [];
      group.push(assignment);
      groupMap.set(assignment.roleName, group);
    });

    return Array.from(groupMap.entries())
      .sort(([roleNameA], [roleNameB]) => {
        const indexA = retreatAdminRoleOrder.indexOf(
          roleNameA as (typeof retreatAdminRoleOrder)[number]
        );
        const indexB = retreatAdminRoleOrder.indexOf(
          roleNameB as (typeof retreatAdminRoleOrder)[number]
        );

        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return roleNameA.localeCompare(roleNameB, "ko");
      })
      .map(([roleName, items]) => ({
        roleName,
        roleLabel: getRetreatAdminRoleLabel(
          roleName,
          items[0]?.roleDisplayName ?? roleName
        ),
        assignments: [...items].sort((a, b) => {
          if (a.univGroupNumber !== b.univGroupNumber) {
            return a.univGroupNumber - b.univGroupNumber;
          }
          return a.adminName.localeCompare(b.adminName, "ko");
        }),
      }));
  }, [assignments]);

  const reset = () =>
    setForm({
      univGroupId: "",
      name: "",
      email: "",
      roleId: "",
      startDate: "",
      endDate: "",
    });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const univGroupId = Number(form.univGroupId);
    const roleId = Number(form.roleId);

    if (!Number.isInteger(univGroupId) || univGroupId <= 0) {
      addToast({
        title: "부서를 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (!name) {
      addToast({
        title: "이름을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (!gmailEmailPattern.test(email)) {
      addToast({
        title: "Gmail 주소를 입력해주세요.",
        description: "@gmail.com 이메일만 사용할 수 있습니다.",
        variant: "destructive",
      });
      return;
    }

    if (!Number.isInteger(roleId) || roleId <= 0) {
      addToast({
        title: "권한을 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (!form.startDate) {
      addToast({
        title: "시작 일자를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (form.endDate && form.endDate < form.startDate) {
      addToast({
        title: "끝 일자는 시작 일자 이후로 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    const request: CreateRetreatAdminAssignmentRequest = {
      univGroupId,
      name,
      email,
      roleId,
      startDate: toIsoDateTime(`${form.startDate}T00:00`),
      endDate: form.endDate ? toIsoDateTime(`${form.endDate}T23:59`) : null,
    };

    setSubmitting(true);

    try {
      await createRetreatAdminAssignment(retreatSlug, request);
      addToast({
        title: "권한을 추가했습니다.",
        variant: "success",
      });
      reset();
      await Promise.all([
        mutate(),
        mutateGlobal("/api/v1/auth/check-auth"),
        mutateGlobal("/api/v1/admin/navigation"),
      ]);
      router.refresh();
    } catch (error) {
      addToast({
        title: "권한 추가 실패",
        description: getErrorMessage(error, "권한을 추가하지 못했습니다."),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateUser = async (
    adminUserId: number,
    request: UpdateRetreatAdminUserRequest
  ) => {
    await updateRetreatAdminUser(retreatSlug, adminUserId, request);
    await Promise.all([
      mutate(),
      mutateGlobal("/api/v1/auth/check-auth"),
      mutateGlobal("/api/v1/admin/navigation"),
    ]);
    router.refresh();
  };

  const isOptionEmpty =
    !!options &&
    (options.roles.length === 0 || options.univGroups.length === 0);
  const isFormDisabled =
    submitting || !options || optionsLoading || isOptionEmpty;

  return (
    <Card>
      <CardHeader>
        <CardTitle>권한</CardTitle>
        <CardDescription>
          수양회 팀별 권한을 관리합니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="부서">
              <select
                value={form.univGroupId}
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    univGroupId: event.target.value,
                  }))
                }
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                disabled={isFormDisabled}
                required
              >
                <option value="">선택</option>
                {options?.univGroups.map(univGroup => (
                  <option key={univGroup.id} value={univGroup.id}>
                    {univGroup.number}부
                  </option>
                ))}
              </select>
            </Field>
            <Field label="이름">
              <Input
                value={form.name}
                onChange={event =>
                  setForm(current => ({ ...current, name: event.target.value }))
                }
                disabled={isFormDisabled}
                required
              />
            </Field>
            <Field label="이메일">
              <Input
                type="email"
                value={form.email}
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                disabled={isFormDisabled}
                required
              />
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="권한">
              <select
                value={form.roleId}
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    roleId: event.target.value,
                  }))
                }
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                disabled={isFormDisabled}
                required
              >
                <option value="">선택</option>
                {sortedRoles.map(role => (
                  <option key={role.id} value={role.id}>
                    {getRetreatAdminRoleLabel(role.name, role.displayName)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="시작 일자">
              <Input
                type="date"
                value={form.startDate}
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    startDate: event.target.value,
                  }))
                }
                disabled={isFormDisabled}
                required
              />
            </Field>
            <Field label="끝 일자 (선택)">
              <Input
                type="date"
                value={form.endDate}
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    endDate: event.target.value,
                  }))
                }
                disabled={isFormDisabled}
              />
            </Field>
          </div>
          {optionsError || assignmentsError ? (
            <p className="text-sm text-destructive">
              권한 정보를 불러오지 못했습니다.
            </p>
          ) : null}
          {isOptionEmpty ? (
            <p className="text-sm text-muted-foreground">
              등록 가능한 부서 또는 권한이 없습니다.
            </p>
          ) : null}
          <div className="flex justify-end">
            <Button type="submit" disabled={isFormDisabled}>
              <Plus className="h-4 w-4" />
              {submitting ? "추가 중" : "권한 추가"}
            </Button>
          </div>
        </form>

        <div className="space-y-2">
          {assignmentsLoading ? (
            <p className="text-sm text-muted-foreground">
              권한 목록을 불러오는 중입니다.
            </p>
          ) : assignments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              등록된 권한이 없습니다.
            </p>
          ) : (
            groupedAssignments.map(group => (
              <section key={group.roleName} className="space-y-2">
                <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
                  <h3 className="text-sm font-semibold">{group.roleLabel}</h3>
                  <span className="text-xs text-muted-foreground">
                    {group.assignments.length}명
                  </span>
                </div>
                <div className="space-y-2">
                  {group.assignments.map(assignment => (
                    <RetreatAdminAssignmentRow
                      key={assignment.assignmentId}
                      assignment={assignment}
                      univGroups={options?.univGroups ?? []}
                      onUpdate={handleUpdateUser}
                    />
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function RetreatAdminAssignmentRow({
  assignment,
  univGroups,
  onUpdate,
}: {
  assignment: RetreatAdminAssignment;
  univGroups: { id: number; number: number }[];
  onUpdate: (
    adminUserId: number,
    request: UpdateRetreatAdminUserRequest
  ) => Promise<void>;
}) {
  const addToast = useToastStore(state => state.add);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: assignment.adminName,
    email: assignment.adminEmail,
    univGroupId: String(assignment.univGroupId),
  });

  const startEditing = () => {
    setEditForm({
      name: assignment.adminName,
      email: assignment.adminEmail,
      univGroupId: String(assignment.univGroupId),
    });
    setEditing(true);
  };

  const handleSave = async () => {
    const name = editForm.name.trim();
    const email = editForm.email.trim().toLowerCase();
    const univGroupId = Number(editForm.univGroupId);

    if (!name) {
      addToast({ title: "이름을 입력해주세요.", variant: "destructive" });
      return;
    }

    if (!gmailEmailPattern.test(email)) {
      addToast({
        title: "Gmail 주소를 입력해주세요.",
        description: "@gmail.com 이메일만 사용할 수 있습니다.",
        variant: "destructive",
      });
      return;
    }

    if (!Number.isInteger(univGroupId) || univGroupId <= 0) {
      addToast({ title: "부서를 선택해주세요.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      await onUpdate(assignment.adminUserId, {
        name,
        email,
        univGroupId,
      });
      addToast({ title: "사용자 정보를 수정했습니다.", variant: "success" });
      setEditing(false);
    } catch (error) {
      addToast({
        title: "사용자 정보 수정 실패",
        description: getErrorMessage(
          error,
          "사용자 정보를 수정하지 못했습니다."
        ),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-md border p-3 text-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        {editing ? (
          <div className="grid flex-1 gap-2 md:grid-cols-[1fr_1.5fr_96px]">
            <Input
              value={editForm.name}
              onChange={event =>
                setEditForm(current => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              disabled={saving}
              aria-label="이름"
            />
            <Input
              type="email"
              value={editForm.email}
              onChange={event =>
                setEditForm(current => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              disabled={saving}
              aria-label="이메일"
            />
            <select
              value={editForm.univGroupId}
              onChange={event =>
                setEditForm(current => ({
                  ...current,
                  univGroupId: event.target.value,
                }))
              }
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              disabled={saving}
              aria-label="부서"
            >
              {univGroups.map(univGroup => (
                <option key={univGroup.id} value={univGroup.id}>
                  {univGroup.number}부
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="min-w-0">
            <div className="font-medium">{assignment.adminName}</div>
            <div className="break-all text-muted-foreground">
              {assignment.adminEmail}
            </div>
          </div>
        )}
        <div className="flex shrink-0 gap-2">
          {editing ? (
            <>
              <Button
                type="button"
                size="sm"
                onClick={() => void handleSave()}
                disabled={saving}
              >
                <Save className="h-4 w-4" />
                {saving ? "저장 중" : "저장"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setEditing(false)}
                disabled={saving}
              >
                <X className="h-4 w-4" />
                취소
              </Button>
            </>
          ) : (
            <Button type="button" size="sm" variant="outline" onClick={startEditing}>
              <Pencil className="h-4 w-4" />
              수정
            </Button>
          )}
        </div>
      </div>
      <div className="mt-2 grid gap-1 text-muted-foreground md:grid-cols-2">
        <div>부서: {assignment.univGroupNumber}부</div>
        <div>
          기간: {formatDateTime(assignment.startDate)}
          {assignment.endDate
            ? ` - ${formatDateTime(assignment.endDate)}`
            : " - 종료일 없음"}
        </div>
      </div>
    </div>
  );
}

function AddPaymentScheduleCard({ retreatId }: { retreatId: number }) {
  const router = useRouter();
  const addToast = useToastStore(state => state.add);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    totalPrice: "",
    partialPricePerSchedule: "",
    startAt: "",
    endAt: "",
  });

  const reset = () =>
    setForm({
      name: "",
      totalPrice: "",
      partialPricePerSchedule: "",
      startAt: "",
      endAt: "",
    });

  const handleAdd = async () => {
    setSubmitting(true);
    try {
      await addPaymentSchedule(retreatId, {
        name: form.name,
        totalPrice: Number(form.totalPrice),
        partialPricePerSchedule: Number(form.partialPricePerSchedule),
        startAt: toIsoDateTime(form.startAt),
        endAt: toIsoDateTime(form.endAt),
      });
      addToast({
        title: "결제 일정을 추가했습니다.",
        variant: "success",
      });
      reset();
      router.refresh();
    } catch (error) {
      addToast({
        title: "결제 일정 추가 실패",
        description: getErrorMessage(error, "결제 일정을 추가하지 못했습니다."),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>결제 일정 추가</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="결제 일정 이름">
              <Input
                value={form.name}
                onChange={event =>
                  setForm(current => ({ ...current, name: event.target.value }))
                }
                placeholder="1차 등록"
                required
              />
            </Field>
            <Field label="전참 가격">
              <Input
                type="number"
                min={0}
                value={form.totalPrice}
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    totalPrice: event.target.value,
                  }))
                }
                required
              />
            </Field>
            <Field label="식수 당 부분참 가격">
              <Input
                type="number"
                min={0}
                value={form.partialPricePerSchedule}
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    partialPricePerSchedule: event.target.value,
                  }))
                }
                required
              />
            </Field>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="신청 시작 시간">
              <Input
                type="datetime-local"
                value={form.startAt}
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    startAt: event.target.value,
                  }))
                }
                required
              />
            </Field>
            <Field label="신청 종료 시간">
              <Input
                type="datetime-local"
                value={form.endAt}
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    endAt: event.target.value,
                  }))
                }
                required
              />
            </Field>
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              disabled={submitting}
              onClick={() => void handleAdd()}
            >
              <Plus className="h-4 w-4" />
              {submitting ? "추가 중" : "결제 일정 추가"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AddShuttleBusCard({ retreatId }: { retreatId: number }) {
  const router = useRouter();
  const addToast = useToastStore(state => state.add);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    direction: "FROM_CHURCH_TO_RETREAT" as (typeof shuttleDirections)[number],
    price: "",
    departureTime: "",
    arrivalTime: "",
  });

  const reset = () =>
    setForm({
      name: "",
      direction: "FROM_CHURCH_TO_RETREAT",
      price: "",
      departureTime: "",
      arrivalTime: "",
    });

  const handleAdd = async () => {
    setSubmitting(true);
    try {
      await addShuttleBus(retreatId, {
        name: form.name,
        direction: form.direction,
        price: Number(form.price),
        departureTime: toIsoDateTime(form.departureTime),
        arrivalTime: form.arrivalTime
          ? toIsoDateTime(form.arrivalTime)
          : undefined,
      });
      addToast({
        title: "셔틀버스를 추가했습니다.",
        variant: "success",
      });
      reset();
      router.refresh();
    } catch (error) {
      addToast({
        title: "셔틀버스 추가 실패",
        description: getErrorMessage(error, "셔틀버스를 추가하지 못했습니다."),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>셔틀버스 추가</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Field label="셔틀버스 이름">
            <Input
              value={form.name}
              onChange={event =>
                setForm(current => ({ ...current, name: event.target.value }))
              }
              placeholder="목요일 부분참, 수요일 정발"
              required
            />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="방향">
              <select
                value={form.direction}
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    direction: event.target
                      .value as (typeof shuttleDirections)[number],
                  }))
                }
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                {shuttleDirections.map(direction => (
                  <option key={direction} value={direction}>
                    {shuttleDirectionLabels[direction]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="가격">
              <Input
                type="number"
                min={0}
                value={form.price}
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    price: event.target.value,
                  }))
                }
                required
              />
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="출발 시간">
              <Input
                type="datetime-local"
                value={form.departureTime}
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    departureTime: event.target.value,
                  }))
                }
                required
              />
            </Field>
            <Field label="도착 시간 (선택)">
              <Input
                type="datetime-local"
                value={form.arrivalTime}
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    arrivalTime: event.target.value,
                  }))
                }
              />
            </Field>
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              disabled={submitting}
              onClick={() => void handleAdd()}
            >
              <Plus className="h-4 w-4" />
              {submitting ? "추가 중" : "셔틀버스 추가"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function toDateTimeLocalInput(iso: string) {
  // datetime-local input 은 'YYYY-MM-DDTHH:MM' 포맷을 요구
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate()
    )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}

function toDateInput(iso: string) {
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  } catch {
    return "";
  }
}

function PaymentSchedulesCard({
  retreatId,
  paymentSchedules,
}: {
  retreatId: number;
  paymentSchedules: ManagedRetreatPaymentSchedule[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>결제 일정 목록</CardTitle>
        <CardDescription>현재 등록된 결제 일정입니다.</CardDescription>
      </CardHeader>
      <CardContent>
        {paymentSchedules.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            등록된 결제 일정이 없습니다.
          </p>
        ) : (
          <div className="space-y-2">
            {paymentSchedules.map(schedule => (
              <PaymentScheduleRow
                key={schedule.id}
                retreatId={retreatId}
                schedule={schedule}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PaymentScheduleRow({
  retreatId,
  schedule,
}: {
  retreatId: number;
  schedule: ManagedRetreatPaymentSchedule;
}) {
  const router = useRouter();
  const addToast = useToastStore(state => state.add);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: schedule.name,
    totalPrice: String(schedule.totalPrice),
    partialPricePerSchedule: String(schedule.partialPricePerSchedule),
    startAt: toDateTimeLocalInput(schedule.startAt),
    endAt: toDateTimeLocalInput(schedule.endAt),
  });

  const reset = () => {
    setForm({
      name: schedule.name,
      totalPrice: String(schedule.totalPrice),
      partialPricePerSchedule: String(schedule.partialPricePerSchedule),
      startAt: toDateTimeLocalInput(schedule.startAt),
      endAt: toDateTimeLocalInput(schedule.endAt),
    });
  };

  const handleSave = async () => {
    setBusy(true);
    try {
      await updatePaymentSchedule(retreatId, schedule.id, {
        name: form.name,
        totalPrice: Number(form.totalPrice),
        partialPricePerSchedule: Number(form.partialPricePerSchedule),
        startAt: toIsoDateTime(form.startAt),
        endAt: toIsoDateTime(form.endAt),
      });
      addToast({ title: "결제 일정을 수정했습니다.", variant: "success" });
      setEditing(false);
      router.refresh();
    } catch (error) {
      addToast({
        title: "결제 일정 수정 실패",
        description: getErrorMessage(error, "수정에 실패했습니다."),
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("이 결제 일정을 삭제하시겠습니까?")) return;
    setBusy(true);
    try {
      await deletePaymentSchedule(retreatId, schedule.id);
      addToast({ title: "결제 일정을 삭제했습니다.", variant: "success" });
      router.refresh();
    } catch (error) {
      addToast({
        title: "결제 일정 삭제 실패",
        description: getErrorMessage(error, "삭제에 실패했습니다."),
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  if (!editing) {
    return (
      <div className="rounded-md border p-3 text-sm">
        <div className="flex items-start justify-between gap-2">
          <div className="font-medium">{schedule.name}</div>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setEditing(true)}
              disabled={busy}
            >
              <Pencil className="h-3 w-3" />
              수정
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleDelete}
              disabled={busy}
            >
              <Trash2 className="h-3 w-3" />
              삭제
            </Button>
          </div>
        </div>
        <div className="mt-1 grid gap-1 text-muted-foreground md:grid-cols-2">
          <div>전참: {schedule.totalPrice.toLocaleString()}원</div>
          <div>
            부분참(식수당): {schedule.partialPricePerSchedule.toLocaleString()}
            원
          </div>
          <div>시작: {formatDateTime(schedule.startAt)}</div>
          <div>종료: {formatDateTime(schedule.endAt)}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-muted/20 p-3 text-sm space-y-3">
      <div className="grid gap-3 md:grid-cols-3">
        <Field label="이름">
          <Input
            value={form.name}
            onChange={event =>
              setForm(current => ({ ...current, name: event.target.value }))
            }
          />
        </Field>
        <Field label="전참 가격">
          <Input
            type="number"
            min={0}
            value={form.totalPrice}
            onChange={event =>
              setForm(current => ({
                ...current,
                totalPrice: event.target.value,
              }))
            }
          />
        </Field>
        <Field label="식수 당 부분참 가격">
          <Input
            type="number"
            min={0}
            value={form.partialPricePerSchedule}
            onChange={event =>
              setForm(current => ({
                ...current,
                partialPricePerSchedule: event.target.value,
              }))
            }
          />
        </Field>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="시작">
          <Input
            type="datetime-local"
            value={form.startAt}
            onChange={event =>
              setForm(current => ({ ...current, startAt: event.target.value }))
            }
          />
        </Field>
        <Field label="종료">
          <Input
            type="datetime-local"
            value={form.endAt}
            onChange={event =>
              setForm(current => ({ ...current, endAt: event.target.value }))
            }
          />
        </Field>
      </div>
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            reset();
            setEditing(false);
          }}
          disabled={busy}
        >
          <X className="h-4 w-4" />
          취소
        </Button>
        <Button type="button" onClick={handleSave} disabled={busy}>
          <Save className="h-4 w-4" />
          {busy ? "저장 중" : "저장"}
        </Button>
      </div>
    </div>
  );
}

function ShuttleBusesCard({
  retreatId,
  shuttleBuses,
}: {
  retreatId: number;
  shuttleBuses: ManagedRetreatShuttleBus[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>셔틀버스 목록</CardTitle>
        <CardDescription>
          현재 등록된 셔틀버스입니다. 해당 버스를 신청한 인원이 없을 때만
          변경·삭제할 수 있습니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {shuttleBuses.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            등록된 셔틀버스가 없습니다.
          </p>
        ) : (
          <div className="space-y-2">
            {shuttleBuses.map(bus => (
              <ShuttleBusRow key={bus.id} retreatId={retreatId} bus={bus} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ShuttleBusRow({
  retreatId,
  bus,
}: {
  retreatId: number;
  bus: ManagedRetreatShuttleBus;
}) {
  const router = useRouter();
  const addToast = useToastStore(state => state.add);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: bus.name,
    direction: bus.direction,
    price: String(bus.price),
    departureTime: toDateTimeLocalInput(bus.departureTime),
    arrivalTime: bus.arrivalTime ? toDateTimeLocalInput(bus.arrivalTime) : "",
  });

  const reset = () => {
    setForm({
      name: bus.name,
      direction: bus.direction,
      price: String(bus.price),
      departureTime: toDateTimeLocalInput(bus.departureTime),
      arrivalTime: bus.arrivalTime ? toDateTimeLocalInput(bus.arrivalTime) : "",
    });
  };

  const handleSave = async () => {
    setBusy(true);
    try {
      await updateShuttleBus(retreatId, bus.id, {
        name: form.name,
        direction: form.direction,
        price: Number(form.price),
        departureTime: toIsoDateTime(form.departureTime),
        arrivalTime: form.arrivalTime ? toIsoDateTime(form.arrivalTime) : null,
      });
      addToast({ title: "셔틀버스를 수정했습니다.", variant: "success" });
      setEditing(false);
      router.refresh();
    } catch (error) {
      addToast({
        title: "셔틀버스 수정 실패",
        description: getErrorMessage(error, "수정에 실패했습니다."),
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("이 셔틀버스를 삭제하시겠습니까?")) return;
    setBusy(true);
    try {
      await deleteShuttleBus(retreatId, bus.id);
      addToast({ title: "셔틀버스를 삭제했습니다.", variant: "success" });
      router.refresh();
    } catch (error) {
      addToast({
        title: "셔틀버스 삭제 실패",
        description: getErrorMessage(error, "삭제에 실패했습니다."),
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  if (!editing) {
    return (
      <div className="rounded-md border p-3 text-sm">
        <div className="flex items-start justify-between gap-2">
          <div className="font-medium">{bus.name}</div>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setEditing(true)}
              disabled={busy}
            >
              <Pencil className="h-3 w-3" />
              수정
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleDelete}
              disabled={busy}
            >
              <Trash2 className="h-3 w-3" />
              삭제
            </Button>
          </div>
        </div>
        <div className="mt-1 grid gap-1 text-muted-foreground md:grid-cols-2">
          <div>
            방향:{" "}
            {bus.direction === "FROM_CHURCH_TO_RETREAT"
              ? "교회 → 수양회"
              : "수양회 → 교회"}
          </div>
          <div>가격: {bus.price.toLocaleString()}원</div>
          <div>출발: {formatDateTime(bus.departureTime)}</div>
          {bus.arrivalTime ? (
            <div>도착: {formatDateTime(bus.arrivalTime)}</div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-muted/20 p-3 text-sm space-y-3">
      <Field label="이름">
        <Input
          value={form.name}
          onChange={event =>
            setForm(current => ({ ...current, name: event.target.value }))
          }
        />
      </Field>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="방향">
          <select
            value={form.direction}
            onChange={event =>
              setForm(current => ({
                ...current,
                direction: event.target.value as typeof bus.direction,
              }))
            }
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          >
            {shuttleDirections.map(direction => (
              <option key={direction} value={direction}>
                {shuttleDirectionLabels[direction]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="가격">
          <Input
            type="number"
            min={0}
            value={form.price}
            onChange={event =>
              setForm(current => ({ ...current, price: event.target.value }))
            }
          />
        </Field>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="출발">
          <Input
            type="datetime-local"
            value={form.departureTime}
            onChange={event =>
              setForm(current => ({
                ...current,
                departureTime: event.target.value,
              }))
            }
          />
        </Field>
        <Field label="도착 (선택)">
          <Input
            type="datetime-local"
            value={form.arrivalTime}
            onChange={event =>
              setForm(current => ({
                ...current,
                arrivalTime: event.target.value,
              }))
            }
          />
        </Field>
      </div>
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            reset();
            setEditing(false);
          }}
          disabled={busy}
        >
          <X className="h-4 w-4" />
          취소
        </Button>
        <Button type="button" onClick={handleSave} disabled={busy}>
          <Save className="h-4 w-4" />
          {busy ? "저장 중" : "저장"}
        </Button>
      </div>
    </div>
  );
}

function RegistrationSchedulesCard({
  retreatId,
  registrationSchedules,
}: {
  retreatId: number;
  registrationSchedules: ManagedRetreatRegistrationSchedule[];
}) {
  const router = useRouter();
  const addToast = useToastStore(state => state.add);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [newForm, setNewForm] = useState({
    date: "",
    type: "DINNER" as ManagedRetreatRegistrationSchedule["type"],
  });

  const composeDateTime = (
    dateOnly: string,
    type: ManagedRetreatRegistrationSchedule["type"]
  ) =>
    dateOnly ? `${dateOnly}T${registrationScheduleDefaultTimes[type]}` : "";

  const handleAdd = async () => {
    if (!newForm.date) return;
    setBusy(true);
    try {
      await addRegistrationSchedule(retreatId, {
        date: toIsoDateTime(composeDateTime(newForm.date, newForm.type)),
        type: newForm.type,
      });
      addToast({ title: "신청 일정을 추가했습니다.", variant: "success" });
      setNewForm({ date: "", type: "DINNER" });
      setAdding(false);
      router.refresh();
    } catch (error) {
      addToast({
        title: "신청 일정 추가 실패",
        description: getErrorMessage(error, "추가에 실패했습니다."),
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle>신청 일정 목록</CardTitle>
            <CardDescription>
              현재 등록된 신청 일정입니다. 시간은 종류에 따라 자동 지정됩니다
              (아침 08:00, 점심 12:00, 저녁 18:00, 숙박 22:00).
            </CardDescription>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setAdding(prev => !prev)}
          >
            <Plus className="h-4 w-4" />
            추가
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {adding && (
          <div className="mb-4 rounded-md border bg-muted/20 p-3 text-sm space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="날짜">
                <Input
                  type="date"
                  value={newForm.date}
                  onChange={event =>
                    setNewForm(current => ({
                      ...current,
                      date: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="종류">
                <select
                  value={newForm.type}
                  onChange={event =>
                    setNewForm(current => ({
                      ...current,
                      type: event.target
                        .value as ManagedRetreatRegistrationSchedule["type"],
                    }))
                  }
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  {registrationScheduleTypes.map(type => (
                    <option key={type} value={type}>
                      {registrationScheduleLabels[type]}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setNewForm({ date: "", type: "DINNER" });
                  setAdding(false);
                }}
                disabled={busy}
              >
                <X className="h-4 w-4" />
                취소
              </Button>
              <Button
                type="button"
                onClick={handleAdd}
                disabled={busy || !newForm.date}
              >
                <Plus className="h-4 w-4" />
                {busy ? "추가 중" : "추가"}
              </Button>
            </div>
          </div>
        )}
        {registrationSchedules.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            등록된 신청 일정이 없습니다.
          </p>
        ) : (
          <div className="space-y-2">
            {registrationSchedules.map(schedule => (
              <RegistrationScheduleRow
                key={schedule.id}
                retreatId={retreatId}
                schedule={schedule}
                composeDateTime={composeDateTime}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RegistrationScheduleRow({
  retreatId,
  schedule,
  composeDateTime,
}: {
  retreatId: number;
  schedule: ManagedRetreatRegistrationSchedule;
  composeDateTime: (
    dateOnly: string,
    type: ManagedRetreatRegistrationSchedule["type"]
  ) => string;
}) {
  const router = useRouter();
  const addToast = useToastStore(state => state.add);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    date: toDateInput(schedule.time),
    type: schedule.type,
  });

  const reset = () => {
    setForm({
      date: toDateInput(schedule.time),
      type: schedule.type,
    });
  };

  const handleSave = async () => {
    setBusy(true);
    try {
      await updateRegistrationSchedule(retreatId, schedule.id, {
        date: toIsoDateTime(composeDateTime(form.date, form.type)),
        type: form.type,
      });
      addToast({ title: "신청 일정을 수정했습니다.", variant: "success" });
      setEditing(false);
      router.refresh();
    } catch (error) {
      addToast({
        title: "신청 일정 수정 실패",
        description: getErrorMessage(error, "수정에 실패했습니다."),
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("이 신청 일정을 삭제하시겠습니까?")) return;
    setBusy(true);
    try {
      await deleteRegistrationSchedule(retreatId, schedule.id);
      addToast({ title: "신청 일정을 삭제했습니다.", variant: "success" });
      router.refresh();
    } catch (error) {
      addToast({
        title: "신청 일정 삭제 실패",
        description: getErrorMessage(error, "삭제에 실패했습니다."),
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  if (!editing) {
    return (
      <div className="rounded-md border p-3 text-sm">
        <div className="flex items-start justify-between gap-2">
          <div className="font-medium">
            {formatDateTime(schedule.time)} ·{" "}
            {registrationScheduleLabels[schedule.type]}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setEditing(true)}
              disabled={busy}
            >
              <Pencil className="h-3 w-3" />
              수정
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleDelete}
              disabled={busy}
            >
              <Trash2 className="h-3 w-3" />
              삭제
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-muted/20 p-3 text-sm space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="날짜">
          <Input
            type="date"
            value={form.date}
            onChange={event =>
              setForm(current => ({ ...current, date: event.target.value }))
            }
          />
        </Field>
        <Field label="종류">
          <select
            value={form.type}
            onChange={event =>
              setForm(current => ({
                ...current,
                type: event.target
                  .value as ManagedRetreatRegistrationSchedule["type"],
              }))
            }
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          >
            {registrationScheduleTypes.map(type => (
              <option key={type} value={type}>
                {registrationScheduleLabels[type]}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            reset();
            setEditing(false);
          }}
          disabled={busy}
        >
          <X className="h-4 w-4" />
          취소
        </Button>
        <Button type="button" onClick={handleSave} disabled={busy}>
          <Save className="h-4 w-4" />
          {busy ? "저장 중" : "저장"}
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`space-y-2 ${className || ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
