"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HelpTooltipProps {
  content: string | React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  delayDuration?: number;
}

/**
 * 도움말 툴팁 래퍼 컴포넌트
 *
 * @description
 * - TooltipProvider를 포함하여 어디서든 독립적으로 사용 가능
 * - 뱃지나 컬럼 헤더에 래핑하여 hover 시 도움말 표시
 */
export function HelpTooltip({
  content,
  children,
  side = "top",
  delayDuration = 200,
}: HelpTooltipProps) {
  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side} className="max-w-[280px]">
          {typeof content === "string" ? (
            <p className="text-sm">{content}</p>
          ) : (
            content
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
