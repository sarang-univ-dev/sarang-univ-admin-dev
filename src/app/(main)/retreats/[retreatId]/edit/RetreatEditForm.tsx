"use client";

import { Download, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, ReactNode, useState } from "react";

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
  deletePaymentSchedule,
  deleteRegistrationSchedule,
  deleteShuttleBus,
  downloadRetreatAsset,
  updatePaymentSchedule,
  updateRegistrationSchedule,
  updateRetreat,
  updateShuttleBus,
  uploadRetreatAsset,
} from "@/lib/api/admin-api";
import { useToastStore } from "@/store/toast-store";
import type {
  ManagedRetreatDetail,
  ManagedRetreatPaymentSchedule,
  ManagedRetreatRegistrationSchedule,
  ManagedRetreatShuttleBus,
  RetreatUnivGroupInformation,
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
const shuttleDirectionLabels: Record<(typeof shuttleDirections)[number], string> = {
  FROM_CHURCH_TO_RETREAT: "교회 -> 수양회",
  FROM_RETREAT_TO_CHURCH: "수양회 -> 교회",
};

function toIsoDateTime(value: string) {
  return new Date(value).toISOString();
}

type RetreatEditFormProps = {
  retreat: ManagedRetreatDetail;
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

export default function RetreatEditForm({ retreat }: RetreatEditFormProps) {
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">수양회 정보 수정</h1>
        <p className="text-muted-foreground">
          신청 일정, 결제 일정, 셔틀버스 노선은 이 화면에서 수정하지 않습니다.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
          <CardDescription>
            수양회 신청 폼에 표시되는 정보입니다. 신청 폼 주소: {retreat.slug}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="수양회 이름">
            <Input
              value={form.name}
              onChange={event =>
                setForm(current => ({ ...current, name: event.target.value }))
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
              onChange={event => setQrImage(event.target.files?.[0] ?? null)}
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
        <CardDescription>
          신청 내역이 없을 때만 추가할 수 있습니다.
        </CardDescription>
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
    direction:
      "FROM_CHURCH_TO_RETREAT" as (typeof shuttleDirections)[number],
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
        <CardDescription>
          신청 내역이 없을 때만 추가할 수 있습니다.
        </CardDescription>
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
        <CardDescription>
          현재 등록된 결제 일정입니다. 신청 내역이 없을 때만 변경/삭제할 수 있습니다.
        </CardDescription>
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
            부분참(식수당): {schedule.partialPricePerSchedule.toLocaleString()}원
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
          현재 등록된 셔틀버스입니다. 신청 내역이 없을 때만 변경/삭제할 수 있습니다.
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
              <ShuttleBusRow
                key={bus.id}
                retreatId={retreatId}
                bus={bus}
              />
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
    dateOnly
      ? `${dateOnly}T${registrationScheduleDefaultTimes[type]}`
      : "";

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
              현재 등록된 신청 일정입니다. 시간은 종류에 따라 자동 지정됩니다 (아침 08:00, 점심 12:00, 저녁 18:00, 숙박 22:00).
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
              <Button type="button" onClick={handleAdd} disabled={busy || !newForm.date}>
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
            {formatDateTime(schedule.time)} · {registrationScheduleLabels[schedule.type]}
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
