"use client";

import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHelpPanel } from "@/components/common/help";
import { univGroupRetreatRegistrationHelp } from "@/lib/help";

interface UnivGroupRetreatRegistrationHeaderProps {
  title?: string;
  filteredCount?: number;
}

/**
 * 부서 수양회 신청 조회 헤더 컴포넌트
 *
 * @description
 * - 페이지 제목 표시
 * - 필터 후 인원 수 표시
 * - 도움말 버튼 (PageHelpPanel 연결)
 */
export function UnivGroupRetreatRegistrationHeader({
  title = "부서 수양회 신청 조회",
  filteredCount,
}: UnivGroupRetreatRegistrationHeaderProps) {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">{title}</h1>
        {filteredCount !== undefined && (
          <p className="text-sm text-muted-foreground mt-1">
            부서 신청자 목록 ({filteredCount}명)
          </p>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setHelpOpen(true)}
        className="shrink-0"
      >
        <HelpCircle className="h-5 w-5" />
        <span className="sr-only">도움말</span>
      </Button>
      <PageHelpPanel
        content={univGroupRetreatRegistrationHelp}
        open={helpOpen}
        onOpenChange={setHelpOpen}
      />
    </div>
  );
}
