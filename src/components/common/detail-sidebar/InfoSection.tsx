import { cn } from "@/lib/utils/utils";
import { LucideIcon } from "lucide-react";

interface InfoSectionProps {
  title: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
  /**
   * 그리드 컬럼 수 (기본값: 1)
   * - 1: 세로로 나열
   * - 2: 2컬럼 그리드 (반응형)
   */
  columns?: 1 | 2;
  /**
   * 섹션 헤더 오른쪽에 표시할 액션 버튼
   */
  action?: React.ReactNode;
}

export function InfoSection({
  title,
  icon: Icon,
  children,
  className,
  columns = 1,
  action
}: InfoSectionProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="text-base font-semibold text-gray-900 pb-2 border-b flex items-center justify-between">
        <span className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4" />}
          {title}
        </span>
        {action}
      </h3>
      <div className={cn(
        columns === 2
          ? "grid grid-cols-1 md:grid-cols-2 gap-x-6"
          : "space-y-2"
      )}>
        {children}
      </div>
    </div>
  );
}
