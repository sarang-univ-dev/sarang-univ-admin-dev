"use client";

import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, ReactNode, useState } from "react";

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
import { updateRetreat } from "@/lib/api/admin-api";
import { useToastStore } from "@/store/toast-store";
import type {
  ManagedRetreat,
  UpdateRetreatRequest,
} from "@/types/retreat-create";

type RetreatEditFormProps = {
  retreat: ManagedRetreat;
};

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

  return "수양회 정보를 저장하지 못했습니다.";
}

export default function RetreatEditForm({ retreat }: RetreatEditFormProps) {
  const router = useRouter();
  const addToast = useToastStore(state => state.add);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<UpdateRetreatRequest>({
    name: retreat.name,
    location: retreat.location,
    mainVerse: retreat.mainVerse,
    mainSpeaker: retreat.mainSpeaker,
    memo: retreat.memo || "",
    posterUrl: retreat.posterUrl || "",
    qrTemplateImageKey: retreat.qrTemplateImageKey || "",
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await updateRetreat(retreat.id, form);
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">수양회 정보 수정</h1>
        <p className="text-muted-foreground">
          신청 일정, 결제 일정, 셔틀버스 노선은 이 화면에서 수정하지 않습니다.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{retreat.name}</CardTitle>
          <CardDescription>{retreat.slug}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="이름">
            <Input
              value={form.name}
              onChange={event =>
                setForm(current => ({ ...current, name: event.target.value }))
              }
              required
            />
          </Field>
          <Field label="장소">
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
          <Field label="메인 강사">
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
          <Field label="메인 말씀">
            <Input
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
          <Field label="포스터 URL" className="md:col-span-2">
            <Input
              value={form.posterUrl || ""}
              onChange={event =>
                setForm(current => ({
                  ...current,
                  posterUrl: event.target.value,
                }))
              }
            />
          </Field>
          <Field label="QR 템플릿 키" className="md:col-span-2">
            <Input
              value={form.qrTemplateImageKey || ""}
              onChange={event =>
                setForm(current => ({
                  ...current,
                  qrTemplateImageKey: event.target.value,
                }))
              }
            />
          </Field>
          <Field label="메모" className="md:col-span-2">
            <Textarea
              value={form.memo || ""}
              onChange={event =>
                setForm(current => ({ ...current, memo: event.target.value }))
              }
            />
          </Field>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          <Save className="h-4 w-4" />
          {isSubmitting ? "저장 중" : "저장"}
        </Button>
      </div>
    </form>
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
