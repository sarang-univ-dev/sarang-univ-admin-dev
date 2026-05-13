"use client";

import { Download, Save } from "lucide-react";
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
  downloadRetreatAsset,
  updateRetreat,
  uploadRetreatAsset,
} from "@/lib/api/admin-api";
import { useToastStore } from "@/store/toast-store";
import type {
  ManagedRetreatDetail,
  RetreatUnivGroupInformation,
  UpdateRetreatRequest,
} from "@/types/retreat-create";

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
