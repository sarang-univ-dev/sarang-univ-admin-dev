"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { cn } from "@/lib/utils/utils";

interface DetailSidebarProps<T> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: T | null;
  title?: string;
  description?: string | ((data: T) => string);
  side?: "left" | "right" | "top" | "bottom";
  className?: string;
  children: (data: T) => React.ReactNode;
}

export function DetailSidebar<T>({
  open,
  onOpenChange,
  data,
  title = "상세 정보",
  description,
  side = "right",
  className,
  children,
}: DetailSidebarProps<T>) {
  if (!data) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={side}
        className={cn("w-[500px] sm:w-[600px] overflow-y-auto", className)}
      >
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description && (
            <SheetDescription>
              {typeof description === 'function'
                ? description(data)
                : description}
            </SheetDescription>
          )}
        </SheetHeader>
        <div className="mt-6 space-y-6">
          {children(data)}
        </div>
      </SheetContent>
    </Sheet>
  );
}
