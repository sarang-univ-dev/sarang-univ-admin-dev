/**
 * Help Component Registry
 *
 * @description
 * 도움말 시스템에서 렌더링 가능한 컴포넌트들의 레지스트리
 * 새 컴포넌트를 추가하려면:
 * 1. types.ts의 HelpComponentName에 이름 추가
 * 2. 이 파일의 HELP_COMPONENTS에 컴포넌트 등록
 */

import { ComponentType } from "react";
import { StatusBadge, TypeBadge } from "@/components/common/retreat/badges";
import { GenderBadge } from "@/components/Badge";
import { ShuttleBusStatusBadge } from "@/components/features/univ-group-retreat-registration/ShuttleBusStatusBadge";
import { Button } from "@/components/ui/button";
import type { HelpComponentName } from "./types";

/**
 * 도움말에서 렌더링 가능한 컴포넌트 레지스트리
 */
export const HELP_COMPONENTS: Record<HelpComponentName, ComponentType<any>> = {
  StatusBadge,
  TypeBadge,
  GenderBadge,
  ShuttleBusStatusBadge,
  Button,
};

/**
 * 컴포넌트 이름으로 해당 컴포넌트 가져오기
 */
export function getHelpComponent(
  name: HelpComponentName
): ComponentType<any> | null {
  return HELP_COMPONENTS[name] ?? null;
}
