"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils/utils";

// checked와 unchecked 상태에 따른 동적 클래스 적용 및 읽기 전용 처리
const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> & {
    checked?: boolean;
    uncheckedColor?: string;
    checkedColor?: string;
  }
>(({ className, checked, uncheckedColor, checkedColor, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      // checked 상태에 따라 배경색을 동적으로 적용
      `${checked ? checkedColor : uncheckedColor}`,
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
    checked={checked} // checked 상태 반영
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      {checked && <Check className="h-4 w-4" />} {/* 체크 상태에 따라 표시 */}
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
