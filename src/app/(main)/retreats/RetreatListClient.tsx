"use client";

import { Copy, Pencil } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToastStore } from "@/store/toast-store";
import type { ManagedRetreat } from "@/types/retreat-create";

type RetreatListClientProps = {
  retreats: ManagedRetreat[];
  retreatWebHost: string;
  canManageRetreats: boolean;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "링크를 복사하지 못했습니다.";
}

export default function RetreatListClient({
  retreats,
  retreatWebHost,
  canManageRetreats,
}: RetreatListClientProps) {
  const addToast = useToastStore(state => state.add);

  const copyLink = async (label: string, href: string) => {
    try {
      await navigator.clipboard.writeText(href);
      addToast({
        title: `${label} 링크를 복사했습니다.`,
        variant: "success",
      });
    } catch (error) {
      addToast({
        title: "링크 복사 실패",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">수양회 목록</h1>
        <p className="text-muted-foreground">
          접근 가능한 수양회의 신청 링크를 복사하고 기본 정보를 관리합니다.
        </p>
      </div>

      {retreats.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-[180px] items-center justify-center text-sm text-muted-foreground">
            접근 가능한 수양회가 없습니다.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {retreats.map(retreat => {
            const registrationLink = `${retreatWebHost}/retreat/${retreat.slug}/retreat-gansa`;
            const shuttleBusLink = `${retreatWebHost}/retreat/${retreat.slug}/shuttle-bus`;

            return (
              <Card key={retreat.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <CardTitle className="truncate text-lg">
                        {retreat.name}
                      </CardTitle>
                      <CardDescription className="truncate">
                        {retreat.slug}
                      </CardDescription>
                    </div>
                    {canManageRetreats && (
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/retreats/${retreat.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                          수정
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <dl className="grid gap-2 text-sm">
                    <div className="flex gap-2">
                      <dt className="shrink-0 text-muted-foreground">장소</dt>
                      <dd className="truncate font-medium">
                        {retreat.location}
                      </dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="shrink-0 text-muted-foreground">강사</dt>
                      <dd className="truncate font-medium">
                        {retreat.mainSpeaker}
                      </dd>
                    </div>
                  </dl>

                  <div className="grid gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => copyLink("수양회 신청", registrationLink)}
                    >
                      <Copy className="h-4 w-4" />
                      수양회 신청 링크 복사
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => copyLink("셔틀버스 신청", shuttleBusLink)}
                    >
                      <Copy className="h-4 w-4" />
                      셔틀버스 신청 링크 복사
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
