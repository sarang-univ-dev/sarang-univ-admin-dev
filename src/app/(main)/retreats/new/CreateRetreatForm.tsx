"use client";

import { Plus, Save, Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, ReactNode, useEffect, useState } from "react";

import {
  createRetreat,
  getUnivGroups,
  uploadRetreatAsset,
} from "@/lib/api/admin-api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToastStore } from "@/store/toast-store";
import type {
  AdminUnivGroup,
  CreateRetreatRequest,
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
  FROM_CHURCH_TO_RETREAT: "교회에서 수양회 장소",
  FROM_RETREAT_TO_CHURCH: "수양회 장소에서 교회",
};

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
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
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
  const [posterImage, setPosterImage] = useState<File | null>(null);
  const [qrImage, setQrImage] = useState<File | null>(null);
  const [retreat, setRetreat] = useState({
    slug: "",
    name: "",
    location: "",
    mainVerse: "",
    mainSpeaker: "",
    memo: "",
  });
  const [registrationSchedules, setRegistrationSchedules] = useState<
    RegistrationScheduleInput[]
  >([{ id: createId(), date: "", type: "DINNER" }]);
  const [paymentSchedules, setPaymentSchedules] = useState<
    PaymentScheduleInput[]
  >([
    {
      id: createId(),
      name: "",
      totalPrice: 0,
      partialPricePerSchedule: 0,
      startAt: "",
      endAt: "",
    },
  ]);
  const [shuttleBuses, setShuttleBuses] = useState<ShuttleBusInput[]>([
    {
      id: createId(),
      name: "",
      direction: "FROM_CHURCH_TO_RETREAT",
      price: 0,
      departureTime: "",
      arrivalTime: "",
    },
  ]);
  const allUnivGroupsSelected =
    univGroups.length > 0 && selectedUnivGroupIds.length === univGroups.length;
  const retreatPathPreview = `/retreat/${retreat.slug || "영문-수양회-이름"}`;

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

      if (qrImage) {
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
          memo: retreat.memo || undefined,
          posterUrl,
          qrTemplateImageKey,
        },
        univGroupIds: selectedUnivGroupIds,
        registrationSchedules: registrationSchedules.map(
          ({ id, date, type }) => ({
            date: toIsoDateTime(date),
            type,
          })
        ),
        paymentSchedules: paymentSchedules.map(
          ({
            id,
            name,
            totalPrice,
            partialPricePerSchedule,
            startAt,
            endAt,
          }) => ({
            name,
            totalPrice: Number(totalPrice),
            partialPricePerSchedule: Number(partialPricePerSchedule),
            startAt: toIsoDateTime(startAt),
            endAt: toIsoDateTime(endAt),
          })
        ),
        shuttleBuses: shuttleBuses.map(
          ({ id, name, direction, price, departureTime, arrivalTime }) => ({
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
          공개 페이지 정보, 대상 부서, 신청/결제/셔틀 운영 기준을 순서대로
          입력합니다. 생성 후 제한되는 항목은 각 섹션에서 바로 확인할 수
          있습니다.
        </p>
      </div>

      <section className="space-y-5 border-b py-8">
        <SectionHeader
          title="기본 정보"
          description="수양회 공개 페이지에 표시되는 정보입니다."
        />
        <div className="space-y-5">
          <Field
            label="영문 수양회 이름"
            description="공개 페이지 주소에 사용됩니다. 생성 후 수정할 수 없습니다."
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
            <Input
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
          <Field label="신청폼 메모">
            <Textarea
              value={retreat.memo}
              onChange={event =>
                setRetreat(current => ({
                  ...current,
                  memo: event.target.value,
                }))
              }
            />
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
            onClick={() =>
              setSelectedUnivGroupIds(
                allUnivGroupsSelected ? [] : univGroups.map(group => group.id)
              )
            }
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
                      setSelectedUnivGroupIds(current =>
                        value
                          ? [...current, group.id]
                          : current.filter(id => id !== group.id)
                      )
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
          title="이미지"
          description="포스터와 QR 템플릿 이미지를 업로드합니다. 포스터와 QR 템플릿은 추후에도 추가할 수 있으나, QR 템플릿 추가 전에 신청한 내역에는 QR이 발급되지 않습니다. QR 템플릿은 1080 x 1920 픽셀만 사용할 수 있습니다."
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
          <Field label="QR 템플릿 이미지">
            <Input
              type="file"
              accept="image/*"
              onChange={event => setQrImage(event.target.files?.[0] ?? null)}
            />
          </Field>
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
          disabled={isSubmitting || selectedUnivGroupIds.length === 0}
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

function ScheduleSection({
  schedules,
  onChange,
}: {
  schedules: RegistrationScheduleInput[];
  onChange: (schedules: RegistrationScheduleInput[]) => void;
}) {
  return (
    <section className="space-y-5 border-b py-8">
      <div className="flex items-start justify-between gap-4">
        <SectionHeader
          title="신청 일정"
          description="식사/숙박 선택 단위입니다. 생성 후 기존 일정은 수정할 수 없고 추가만 가능합니다. 신청 내역이 없으면 삭제할 수 있고, 신청 내역이 있으면 삭제할 수 없습니다."
        />
        <Button
          type="button"
          variant="outline"
          className="h-10"
          onClick={() =>
            onChange([
              ...schedules,
              { id: createId(), date: "", type: "DINNER" },
            ])
          }
        >
          <Plus className="h-4 w-4" />
          추가
        </Button>
      </div>
      <div className="space-y-3">
        {schedules.map(schedule => (
          <div key={schedule.id} className="space-y-3 rounded-md border p-4">
            <Field label="일정 시간">
              <Input
                type="datetime-local"
                value={schedule.date}
                onChange={event =>
                  onChange(
                    schedules.map(item =>
                      item.id === schedule.id
                        ? { ...item, date: event.target.value }
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
                onChange={event =>
                  onChange(
                    schedules.map(item =>
                      item.id === schedule.id
                        ? {
                            ...item,
                            type: event.target
                              .value as RegistrationScheduleInput["type"],
                          }
                        : item
                    )
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
            <div className="flex justify-end">
              <RemoveButton
                disabled={schedules.length === 1}
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
          description="신청 기간별 금액 정책입니다. 신청 내역이 없을 때만 변경할 수 있습니다."
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
        {schedules.map(schedule => (
          <div key={schedule.id} className="space-y-3 rounded-md border p-3">
            <div className="space-y-3">
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
                          ? { ...item, totalPrice: Number(event.target.value) }
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
              <div className="flex justify-end">
                <RemoveButton
                  disabled={schedules.length === 1}
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
          description="신청 가능한 셔틀버스 노선입니다. 생성 후 기존 셔틀버스 일정은 수정할 수 없고 추가만 가능합니다. 신청 내역이 없으면 삭제할 수 있고, 신청 내역이 있으면 삭제할 수 없습니다."
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
                  placeholder="교회 출발 1호차"
                  required
                />
              </Field>
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
              <div className="flex justify-end">
                <RemoveButton
                  disabled={buses.length === 1}
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
  disabled: boolean;
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
