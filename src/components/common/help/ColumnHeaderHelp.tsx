"use client";

import { HelpCircle } from "lucide-react";
import { HelpTooltip } from "./HelpTooltip";
import type { ColumnHelpContent } from "@/lib/help/types";

interface ColumnHeaderHelpProps {
  helpContent: ColumnHelpContent;
}

/**
 * 컬럼 헤더용 도움말 아이콘 컴포넌트
 *
 * @description
 * - 컬럼 헤더 옆에 표시되는 작은 ? 아이콘
 * - hover 시 해당 컬럼에 대한 도움말 툴팁 표시
 */
export function ColumnHeaderHelp({ helpContent }: ColumnHeaderHelpProps) {
  return (
    <HelpTooltip
      content={
        <div className="space-y-1.5">
          <p className="font-medium">{helpContent.title}</p>
          <p className="text-muted-foreground">{helpContent.description}</p>
          {helpContent.tips && helpContent.tips.length > 0 && (
            <ul className="text-xs text-muted-foreground mt-2 space-y-0.5">
              {helpContent.tips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-1">
                  <span className="shrink-0">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      }
      side="bottom"
    >
      <button
        type="button"
        className="inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <HelpCircle className="h-3.5 w-3.5" />
        <span className="sr-only">{helpContent.title} 도움말</span>
      </button>
    </HelpTooltip>
  );
}
