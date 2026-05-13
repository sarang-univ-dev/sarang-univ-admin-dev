"use client";

import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { cn } from "@/lib/utils/utils";

interface HelpDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modal?: boolean;
  snapPoints?: (number | string)[];
  children: React.ReactNode;
}

/**
 * 도움말 전용 Drawer 컴포넌트
 *
 * @description
 * - vaul 라이브러리 직접 사용
 * - modal={false} 시 overlay 없이 테이블과 interaction 가능
 * - snapPoints로 높이 단계 조절 지원
 */
export function HelpDrawer({
  open,
  onOpenChange,
  modal = false,
  snapPoints = [0.25, 0.5, 0.75],
  children,
}: HelpDrawerProps) {
  return (
    <DrawerPrimitive.Root
      open={open}
      onOpenChange={onOpenChange}
      modal={modal}
      snapPoints={snapPoints}
    >
      {children}
    </DrawerPrimitive.Root>
  );
}

const HelpDrawerPortal = DrawerPrimitive.Portal;

const HelpDrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-50 bg-black/80", className)}
    {...props}
  />
));
HelpDrawerOverlay.displayName = "HelpDrawerOverlay";

interface HelpDrawerContentProps
  extends React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content> {
  modal?: boolean;
}

const HelpDrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  HelpDrawerContentProps
>(({ className, children, modal = false, ...props }, ref) => (
  <HelpDrawerPortal>
    {modal && <HelpDrawerOverlay />}
    <DrawerPrimitive.Content
      ref={ref}
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border bg-background shadow-lg",
        className
      )}
      {...props}
    >
      <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
      {children}
    </DrawerPrimitive.Content>
  </HelpDrawerPortal>
));
HelpDrawerContent.displayName = "HelpDrawerContent";

const HelpDrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "grid gap-1.5 p-4 text-center sm:text-left border-b",
      className
    )}
    {...props}
  />
);
HelpDrawerHeader.displayName = "HelpDrawerHeader";

const HelpDrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
HelpDrawerTitle.displayName = "HelpDrawerTitle";

const HelpDrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
HelpDrawerDescription.displayName = "HelpDrawerDescription";

const HelpDrawerBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex-1 overflow-auto p-4", className)}
    {...props}
  />
);
HelpDrawerBody.displayName = "HelpDrawerBody";

export {
  HelpDrawerPortal,
  HelpDrawerOverlay,
  HelpDrawerContent,
  HelpDrawerHeader,
  HelpDrawerTitle,
  HelpDrawerDescription,
  HelpDrawerBody,
};
