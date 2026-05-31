"use client";

import { Plus, Save, Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, ReactNode, useEffect, useState } from "react";

import {
  createEmptyRetreatUnivGroupInformation,
  RetreatUnivGroupOperationInfoFields,
} from "@/components/features/retreat-management/RetreatUnivGroupOperationInfoFields";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createRetreat,
  getUnivGroups,
  uploadRetreatAsset,
} from "@/lib/api/admin-api";
import { useToastStore } from "@/store/toast-store";
import type {
  AdminUnivGroup,
  CreateRetreatRequest,
  RetreatUnivGroupInformation,
} from "@/types/retreat-create";

type RegistrationScheduleInput =
  CreateRetreatRequest["registrationSchedules"][number] & { id: number };
type PaymentScheduleInput = CreateRetreatRequest["paymentSchedules"][number] & {
  id: number;
};
type ShuttleBusInput = CreateRetreatRequest["shuttleBuses"][number] & {
  id: number;
};

const scheduleTypes = ["BREAKFAST", "LUNCH", "DINNER", "SLEEP"] as const;
const shuttleDirections = [
  "FROM_CHURCH_TO_RETREAT",
  "FROM_RETREAT_TO_CHURCH",
] as const;

const scheduleLabels = {
  BREAKFAST: "아침",
  LUNCH: "점심",
  DINNER: "저녁",
  SLEEP: "숙박",
};

const shuttleDirectionLabels = {
  FROM_CHURCH_TO_RETREAT: "교회 -> 수양회",
  FROM_RETREAT_TO_CHURCH: "수양회 -> 교회",
};

const scheduleDefaultTimes = {
  BREAKFAST: "08:00",
  LUNCH: "12:00",
  DINNER: "18:00",
  SLEEP: "22:00",
} satisfies Record<(typeof scheduleTypes)[number], string>;

function createId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

function toIsoDateTime(value: string) {
  return new Date(value).toISOString();
}

function normalizeRetreatSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getErrorMessage(error: unknown) {
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

  return "요청 처리 중 오류가 발생했습니다.";
}

export default function CreateRetreatForm() {
  const router = useRouter();
  const addToast = useToastStore(state => state.add);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [origin, setOrigin] = useState("");
  const [univGroups, setUnivGroups] = useState<AdminUnivGroup[]>([]);
  const [selectedUnivGroupIds, setSelectedUnivGroupIds] = useState<number[]>(
    []
  );
  const [operationInfoByUnivGroupId, setOperationInfoByUnivGroupId] = useState<
    Record<number, RetreatUnivGroupInformation>
  >({});
  const [posterImage, setPosterImage] = useState<File | null>(null);
  const [qrImage, setQrImage] = useState<File | null>(null);
  const [retreat, setRetreat] = useState({
    slug: "",
    name: "",
    location: "",
    mainVerse: "",
    mainSpeaker: "",
  });
  const [registrationSchedules, setRegistrationSchedules] = useState<
    RegistrationScheduleInput[]
  >([]);
  const [paymentSchedules, setPaymentSchedules] = useState<
    PaymentScheduleInput[]
  >([]);
  const [shuttleBuses, setShuttleBuses] = useState<ShuttleBusInput[]>([]);
  const [disableQr, setDisableQr] = useState(false);
  const allUnivGroupsSelected =
    univGroups.length > 0 && selectedUnivGroupIds.length === univGroups.length;
  const selectedUnivGroups = univGroups.filter(group =>
    selectedUnivGroupIds.includes(group.id)
  );
  const retreatPathPreview = `/retreat/${retreat.slug || "영문-수양회-이름"}`;

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

  const toggleUnivGroup = (univGroupId: number, checked: boolean) => {
    setSelectedUnivGroupIds(current =>
      checked
        ? current.includes(univGroupId)
          ? current
          : [...current, univGroupId]
        : current.filter(id => id !== univGroupId)
    );

    setOperationInfoByUnivGroupId(current => {
      if (checked) {
        return {
          ...current,
          [univGroupId]:
            current[univGroupId] ?? createEmptyRetreatUnivGroupInformation(),
        };
      }

      const next = { ...current };
      delete next[univGroupId];
      return next;
    });
  };

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    getUnivGroups()
      .then(setUnivGroups)
      .catch(error => {
        addToast({
          title: "부서 목록 조회 실패",
          description: getErrorMessage(error),
          variant: "destructive",
        });
      });
  }, [addToast]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      let posterUrl: string | undefined;
      let qrTemplateImageKey: string | undefined;

      if (posterImage) {
        const poster = await uploadRetreatAsset({
          assetType: "POSTER",
          image: posterImage,
        });
        if (poster.assetType === "POSTER") {
          posterUrl = poster.posterUrl;
        }
      }

      if (!disableQr && qrImage) {
        const qrTemplate = await uploadRetreatAsset({
          assetType: "QR_TEMPLATE",
          image: qrImage,
        });
        if (qrTemplate.assetType === "QR_TEMPLATE") {
          qrTemplateImageKey = qrTemplate.qrTemplateImageKey;
        }
      }

      await createRetreat({
        retreat: {
          ...retreat,
          slug: retreat.slug.replace(/^-|-$/g, ""),
          posterUrl,
          qrTemplateImageKey,
        },
        univGroups: selectedUnivGroupIds.map(univGroupId => {
          const information =
            operationInfoByUnivGroupId[univGroupId] ??
            createEmptyRetreatUnivGroupInformation();
          const hasAnyValue = Object.values(information).some(
            value => value && value.trim().length > 0
          );
          return hasAnyValue
            ? { univGroupId, information }
            : { univGroupId };
        }),
        registrationSchedules: registrationSchedules.map(({ date, type }) => ({
          date: toIsoDateTime(date),
          type,
        })),
        paymentSchedules: paymentSchedules.map(
          ({ name, totalPrice, partialPricePerSchedule, startAt, endAt }) => ({
            name,
            totalPrice: Number(totalPrice),
            partialPricePerSchedule: Number(partialPricePerSchedule),
            startAt: toIsoDateTime(startAt),
            endAt: toIsoDateTime(endAt),
          })
        ),
        shuttleBuses: shuttleBuses.map(
          ({ name, direction, price, departureTime, arrivalTime }) => ({
            name,
            direction,
            price: Number(price),
            departureTime: toIsoDateTime(departureTime),
            arrivalTime: arrivalTime ? toIsoDateTime(arrivalTime) : undefined,
          })
        ),
      });

      addToast({
        title: "수양회가 생성되었습니다.",
        variant: "success",
      });
      router.push("/");
      router.refresh();
    } catch (error) {
      addToast({
        title: "수양회 생성 실패",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
      <div className="border-b pb-8">
        <p className="text-sm font-medium text-muted-foreground">
          신규 수양회 초기 설정
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">수양회 추가</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          신청 폼 정보, 대상 부서, 신청/결제/셔틀 운영 기준을 순서대로
          입력합니다. 생성 후 제한되는 항목은 각 섹션에서 바로 확인할 수
          있습니다.
        </p>
      </div>

      <section className="space-y-5 border-b py-8">
        <SectionHeader
          title="기본 정보"
          description="수양회 신청 폼에 표시되는 정보입니다."
        />
        <div className="space-y-5">
          <Field label="수양회 주제">
            <Input
              value={retreat.name}
              onChange={event =>
                setRetreat(current => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              required
            />
          </Field>
          <Field label="수양회 장소">
            <Input
              value={retreat.location}
              onChange={event =>
                setRetreat(current => ({
                  ...current,
                  location: event.target.value,
                }))
              }
              required
            />
          </Field>
          <Field label="수양회 강사">
            <Input
              value={retreat.mainSpeaker}
              onChange={event =>
                setRetreat(current => ({
                  ...current,
                  mainSpeaker: event.target.value,
                }))
              }
              required
            />
          </Field>
          <Field label="수양회 주제 말씀">
            <Textarea
              value={retreat.mainVerse}
              onChange={event =>
                setRetreat(current => ({
                  ...current,
                  mainVerse: event.target.value,
                }))
              }
              required
            />
          </Field>
          <Field
            label="영문 수양회 이름"
            description="신청 폼 주소에 사용됩니다. 영문 소문자, 숫자, 하이픈(-)을 사용할 수 있으며 생성 후 수정할 수 없습니다."
          >
            <Input
              value={retreat.slug}
              onChange={event =>
                setRetreat(current => ({
                  ...current,
                  slug: normalizeRetreatSlug(event.target.value),
                }))
              }
              placeholder="arise-shine"
              required
            />
            <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
              미리보기:{" "}
              {origin ? `${origin}${retreatPathPreview}` : retreatPathPreview}
            </p>
          </Field>
        </div>
      </section>

      <section className="space-y-5 border-b py-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <SectionHeader
              title="부서 선택"
              description="선택한 부서만 이 수양회 신청/조회 대상에 포함됩니다. 생성 후 수정할 수 없습니다."
            />
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-10"
            disabled={univGroups.length === 0}
            onClick={() => {
              if (allUnivGroupsSelected) {
                setSelectedUnivGroupIds([]);
                setOperationInfoByUnivGroupId({});
                return;
              }

              const allUnivGroupIds = univGroups.map(group => group.id);
              setSelectedUnivGroupIds(allUnivGroupIds);
              setOperationInfoByUnivGroupId(current => {
                const next = { ...current };
                allUnivGroupIds.forEach(univGroupId => {
                  next[univGroupId] =
                    next[univGroupId] ??
                    createEmptyRetreatUnivGroupInformation();
                });
                return next;
              });
            }}
          >
            {allUnivGroupsSelected ? "전체 해제" : "전체 선택"}
          </Button>
        </div>
        {univGroups.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            부서 목록을 불러오는 중입니다.
          </p>
        ) : (
          <div className="space-y-3">
            {univGroups.map(group => {
              const checked = selectedUnivGroupIds.includes(group.id);

              return (
                <label
                  key={group.id}
                  className="flex cursor-pointer items-center gap-3 rounded-md border px-4 py-3 text-sm transition-colors hover:bg-muted/50"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={value =>
                      toggleUnivGroup(group.id, Boolean(value))
                    }
                  />
                  <span className="font-medium">
                    {group.number}부 {group.name}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-5 border-b py-8">
        <SectionHeader
          title="부서별 운영 정보"
          description="신청 완료 안내와 문자 발송에 사용되는 정보입니다. 아직 정해지지 않은 항목은 비워두고 생성한 뒤 운영 페이지에서 나중에 채울 수 있습니다."
        />
        <RetreatUnivGroupOperationInfoFields
          univGroups={selectedUnivGroups}
          informationByUnivGroupId={operationInfoByUnivGroupId}
          onChange={updateOperationInfo}
        />
      </section>

      <section className="space-y-5 border-b py-8">
        <SectionHeader
          title="이미지"
          description="포스터는 신청 폼 상단 배경으로 사용됩니다. QR 템플릿은 입금 확인 후 신청자별 QR 이미지를 생성해 문자로 발송하는 데 사용되며, 템플릿 등록 전에 신청한 내역에는 QR이 발급되지 않습니다. QR 템플릿은 1080 x 1920 픽셀만 사용할 수 있습니다."
        />
        <div className="space-y-5">
          <Field label="포스터 이미지">
            <Input
              type="file"
              accept="image/*"
              onChange={event =>
                setPosterImage(event.target.files?.[0] ?? null)
              }
            />
          </Field>
          <label className="flex items-start gap-3 rounded-md border bg-muted/30 p-3 text-sm">
            <Checkbox
              checked={disableQr}
              onCheckedChange={value => {
                const next = Boolean(value);
                setDisableQr(next);
                if (next) setQrImage(null);
              }}
            />
            <span className="space-y-1">
              <span className="block font-medium">
                이번 수양회는 QR을 사용하지 않습니다
              </span>
              <span className="block text-muted-foreground">
                체크 시 QR 템플릿 업로드가 비활성화되며, 입금 확인 후 발송 문자에 QR 다운로드 링크가 포함되지 않습니다.
              </span>
            </span>
          </label>
          {!disableQr && (
            <Field label="QR 템플릿 이미지">
              <Input
                type="file"
                accept="image/*"
                onChange={event => setQrImage(event.target.files?.[0] ?? null)}
              />
            </Field>
          )}
        </div>
      </section>

      <ScheduleSection
        schedules={registrationSchedules}
        onChange={setRegistrationSchedules}
      />
      <PaymentSection
        schedules={paymentSchedules}
        onChange={setPaymentSchedules}
      />
      <ShuttleBusSection buses={shuttleBuses} onChange={setShuttleBuses} />

      <div className="flex justify-end py-8">
        <Button
          type="submit"
          disabled={
            isSubmitting ||
            selectedUnivGroupIds.length === 0 ||
            registrationSchedules.length === 0
          }
        >
          {isSubmitting ? (
            <>
              <Upload className="h-4 w-4" />
              생성 중
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              수양회 생성
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-2">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <p className="text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

function Field({
  label,
  description,
  className,
  children,
}: {
  label: string;
  description?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`space-y-2 ${className || ""}`}>
      <Label>{label}</Label>
      {children}
      {description && (
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

function scheduleDateOnly(date: string) {
  return date ? date.split("T")[0] : "";
}

function composeScheduleDateTime(
  dateOnly: string,
  type: RegistrationScheduleInput["type"]
) {
  if (!dateOnly) return "";
  return `${dateOnly}T${scheduleDefaultTimes[type]}`;
}

function ScheduleSection({
  schedules,
  onChange,
}: {
  schedules: RegistrationScheduleInput[];
  onChange: (schedules: RegistrationScheduleInput[]) => void;
}) {
  const [bulkStartDate, setBulkStartDate] = useState("");
  const [bulkEndDate, setBulkEndDate] = useState("");
  const [bulkStartType, setBulkStartType] =
    useState<RegistrationScheduleInput["type"]>("DINNER");
  const [bulkEndType, setBulkEndType] =
    useState<RegistrationScheduleInput["type"]>("LUNCH");

  const bulkStartTypeIndex = scheduleTypes.indexOf(bulkStartType);
  const bulkEndTypeIndex = scheduleTypes.indexOf(bulkEndType);
  const canBulkAdd =
    Boolean(bulkStartDate && bulkEndDate) &&
    (bulkStartDate < bulkEndDate ||
      (bulkStartDate === bulkEndDate &&
        bulkStartTypeIndex <= bulkEndTypeIndex));

  const handleBulkAdd = () => {
    if (!canBulkAdd) return;

    const generated: RegistrationScheduleInput[] = [];
    // Parse with explicit local time to avoid UTC off-by-one
    const cursor = new Date(`${bulkStartDate}T00:00:00`);
    const stop = new Date(`${bulkEndDate}T00:00:00`);

    while (cursor <= stop) {
      const cursorDay = toDateInputValue(cursor);

      scheduleTypes.forEach((type, idx) => {
        if (cursorDay === bulkStartDate && idx < bulkStartTypeIndex) return;
        if (cursorDay === bulkEndDate && idx > bulkEndTypeIndex) return;

        generated.push({
          id: createId() + generated.length,
          date: composeScheduleDateTime(cursorDay, type),
          type,
        });
      });

      cursor.setDate(cursor.getDate() + 1);
    }

    onChange([
      ...schedules.filter(schedule => schedule.date),
      ...generated,
    ]);
  };

  return (
    <section className="space-y-5 border-b py-8">
      <div className="flex items-start justify-between gap-4">
        <SectionHeader
          title="신청 일정"
          description="식사/숙박 선택 단위입니다. 각 일정의 시간은 종류에 따라 자동 지정됩니다 (아침 08:00, 점심 12:00, 저녁 18:00, 숙박 22:00). 생성 후 기존 일정은 수정할 수 없고 추가만 가능합니다."
        />
        <Button
          type="button"
          variant="outline"
          className="h-10"
          onClick={() =>
            onChange([
              ...schedules,
              {
                id: createId(),
                date: composeScheduleDateTime(
                  toDateInputValue(new Date()),
                  "DINNER"
                ),
                type: "DINNER",
              },
            ])
          }
        >
          <Plus className="h-4 w-4" />
          추가
        </Button>
      </div>
      <div className="rounded-md border bg-muted/30 p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_10rem]">
            <Field label="시작 날짜">
              <Input
                type="date"
                value={bulkStartDate}
                onChange={event => setBulkStartDate(event.target.value)}
              />
            </Field>
            <Field label="시작 식사">
              <select
                value={bulkStartType}
                onChange={event =>
                  setBulkStartType(
                    event.target.value as RegistrationScheduleInput["type"]
                  )
                }
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                {scheduleTypes.map(type => (
                  <option key={type} value={type}>
                    {scheduleLabels[type]}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_10rem]">
            <Field label="끝 날짜">
              <Input
                type="date"
                value={bulkEndDate}
                onChange={event => setBulkEndDate(event.target.value)}
              />
            </Field>
            <Field label="끝 식사">
              <select
                value={bulkEndType}
                onChange={event =>
                  setBulkEndType(
                    event.target.value as RegistrationScheduleInput["type"]
                  )
                }
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                {scheduleTypes.map(type => (
                  <option key={type} value={type}>
                    {scheduleLabels[type]}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-10"
            disabled={!canBulkAdd}
            onClick={handleBulkAdd}
          >
            일정 자동 채우기
          </Button>
        </div>
      </div>
      <div className="space-y-3">
        {schedules.length === 0 && (
          <p className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
            아직 등록된 일정이 없습니다. 위의 자동 채우기 또는 "추가" 버튼으로
            일정을 등록해주세요.
          </p>
        )}
        {schedules.map(schedule => (
          <div
            key={schedule.id}
            className="grid gap-3 rounded-md border p-4 md:grid-cols-[minmax(0,1fr)_12rem_auto] md:items-end"
          >
            <Field label="날짜">
              <Input
                type="date"
                value={scheduleDateOnly(schedule.date)}
                onChange={event =>
                  onChange(
                    schedules.map(item =>
                      item.id === schedule.id
                        ? {
                            ...item,
                            date: composeScheduleDateTime(
                              event.target.value,
                              item.type
                            ),
                          }
                        : item
                    )
                  )
                }
                required
              />
            </Field>
            <Field label="일정 종류">
              <select
                value={schedule.type}
                onChange={event => {
                  const nextType = event.target
                    .value as RegistrationScheduleInput["type"];
                  onChange(
                    schedules.map(item =>
                      item.id === schedule.id
                        ? {
                            ...item,
                            type: nextType,
                            date: composeScheduleDateTime(
                              scheduleDateOnly(item.date),
                              nextType
                            ),
                          }
                        : item
                    )
                  );
                }}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                {scheduleTypes.map(type => (
                  <option key={type} value={type}>
                    {scheduleLabels[type]}
                  </option>
                ))}
              </select>
            </Field>
            <div className="flex justify-end md:justify-start">
              <RemoveButton
                onClick={() =>
                  onChange(schedules.filter(item => item.id !== schedule.id))
                }
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function PaymentSection({
  schedules,
  onChange,
}: {
  schedules: PaymentScheduleInput[];
  onChange: (schedules: PaymentScheduleInput[]) => void;
}) {
  return (
    <section className="space-y-5 border-b py-8">
      <div className="flex items-start justify-between gap-4">
        <SectionHeader
          title="결제 일정"
          description="신청 기간별 금액 정책입니다. 지금 비워두고 운영 페이지에서 나중에 추가해도 됩니다."
        />
        <Button
          type="button"
          variant="outline"
          className="h-10"
          onClick={() =>
            onChange([
              ...schedules,
              {
                id: createId(),
                name: "",
                totalPrice: 0,
                partialPricePerSchedule: 0,
                startAt: "",
                endAt: "",
              },
            ])
          }
        >
          <Plus className="h-4 w-4" />
          추가
        </Button>
      </div>
      <div className="space-y-3">
        {schedules.length === 0 && (
          <p className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
            등록된 결제 일정이 없습니다. 수양회 생성 후 운영 페이지에서 추가할
            수 있습니다.
          </p>
        )}
        {schedules.map(schedule => (
          <div key={schedule.id} className="space-y-3 rounded-md border p-3">
            <div className="space-y-3">
              <div className="grid gap-3 md:grid-cols-3">
                <Field label="결제 일정 이름">
                  <Input
                    value={schedule.name}
                    onChange={event =>
                      onChange(
                        schedules.map(item =>
                          item.id === schedule.id
                            ? { ...item, name: event.target.value }
                            : item
                        )
                      )
                    }
                    placeholder="1차 등록"
                    required
                  />
                </Field>
                <Field label="전참 가격">
                  <Input
                    type="number"
                    min={0}
                    value={schedule.totalPrice}
                    onChange={event =>
                      onChange(
                        schedules.map(item =>
                          item.id === schedule.id
                            ? {
                                ...item,
                                totalPrice: Number(event.target.value),
                              }
                            : item
                        )
                      )
                    }
                    placeholder="150000"
                    required
                  />
                </Field>
                <Field label="식수 당 부분참 가격">
                  <Input
                    type="number"
                    min={0}
                    value={schedule.partialPricePerSchedule}
                    onChange={event =>
                      onChange(
                        schedules.map(item =>
                          item.id === schedule.id
                            ? {
                                ...item,
                                partialPricePerSchedule: Number(
                                  event.target.value
                                ),
                              }
                            : item
                        )
                      )
                    }
                    placeholder="10000"
                    required
                  />
                </Field>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="신청 시작 시간">
                  <Input
                    type="datetime-local"
                    value={schedule.startAt}
                    onChange={event =>
                      onChange(
                        schedules.map(item =>
                          item.id === schedule.id
                            ? { ...item, startAt: event.target.value }
                            : item
                        )
                      )
                    }
                    required
                  />
                </Field>
                <Field label="신청 종료 시간">
                  <Input
                    type="datetime-local"
                    value={schedule.endAt}
                    onChange={event =>
                      onChange(
                        schedules.map(item =>
                          item.id === schedule.id
                            ? { ...item, endAt: event.target.value }
                            : item
                        )
                      )
                    }
                    required
                  />
                </Field>
              </div>
              <div className="flex justify-end">
                <RemoveButton
                  onClick={() =>
                    onChange(schedules.filter(item => item.id !== schedule.id))
                  }
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ShuttleBusSection({
  buses,
  onChange,
}: {
  buses: ShuttleBusInput[];
  onChange: (buses: ShuttleBusInput[]) => void;
}) {
  return (
    <section className="space-y-5 border-b py-8">
      <div className="flex items-start justify-between gap-4">
        <SectionHeader
          title="셔틀버스"
          description="신청 가능한 셔틀버스 노선입니다. 지금 비워두고 운영 페이지에서 나중에 추가해도 됩니다. 생성 후 기존 셔틀버스는 수정할 수 없고 추가만 가능합니다."
        />
        <Button
          type="button"
          variant="outline"
          className="h-10"
          onClick={() =>
            onChange([
              ...buses,
              {
                id: createId(),
                name: "",
                direction: "FROM_CHURCH_TO_RETREAT",
                price: 0,
                departureTime: "",
                arrivalTime: "",
              },
            ])
          }
        >
          <Plus className="h-4 w-4" />
          추가
        </Button>
      </div>
      <div className="space-y-3">
        {buses.length === 0 && (
          <p className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
            등록된 셔틀버스가 없습니다. 수양회 생성 후 운영 페이지에서 추가할
            수 있습니다.
          </p>
        )}
        {buses.map(bus => (
          <div key={bus.id} className="space-y-3 rounded-md border p-3">
            <div className="space-y-3">
              <Field label="셔틀버스 이름">
                <Input
                  value={bus.name}
                  onChange={event =>
                    onChange(
                      buses.map(item =>
                        item.id === bus.id
                          ? { ...item, name: event.target.value }
                          : item
                      )
                    )
                  }
                  placeholder="목요일 부분참, 수요일 정발"
                  required
                />
              </Field>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="방향">
                  <select
                    value={bus.direction}
                    onChange={event =>
                      onChange(
                        buses.map(item =>
                          item.id === bus.id
                            ? {
                                ...item,
                                direction: event.target
                                  .value as ShuttleBusInput["direction"],
                              }
                            : item
                        )
                      )
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
                <Field label="셔틀버스 가격">
                  <Input
                    type="number"
                    min={0}
                    value={bus.price}
                    onChange={event =>
                      onChange(
                        buses.map(item =>
                          item.id === bus.id
                            ? { ...item, price: Number(event.target.value) }
                            : item
                        )
                      )
                    }
                    placeholder="10000"
                    required
                  />
                </Field>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="출발 시간">
                  <Input
                    type="datetime-local"
                    value={bus.departureTime}
                    onChange={event =>
                      onChange(
                        buses.map(item =>
                          item.id === bus.id
                            ? { ...item, departureTime: event.target.value }
                            : item
                        )
                      )
                    }
                    required
                  />
                </Field>
                <Field label="도착 시간">
                  <Input
                    type="datetime-local"
                    value={bus.arrivalTime || ""}
                    onChange={event =>
                      onChange(
                        buses.map(item =>
                          item.id === bus.id
                            ? { ...item, arrivalTime: event.target.value }
                            : item
                        )
                      )
                    }
                  />
                </Field>
              </div>
              <div className="flex justify-end">
                <RemoveButton
                  onClick={() =>
                    onChange(buses.filter(item => item.id !== bus.id))
                  }
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function RemoveButton({
  disabled,
  onClick,
}: {
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="h-10 w-10 shrink-0"
      disabled={disabled}
      onClick={onClick}
      aria-label="삭제"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
