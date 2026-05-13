"use client";

import { createElement } from "react";
import { getHelpComponent } from "@/lib/help/component-registry";
import type { ComponentExample } from "@/lib/help/types";

interface HelpExampleRendererProps {
  /** 렌더링할 예시 목록 */
  examples: ComponentExample[];
  /** 레이아웃 방향 */
  direction?: "horizontal" | "vertical";
  /** 추가 CSS 클래스 */
  className?: string;
}

/**
 * 도움말 예시 컴포넌트 렌더러
 *
 * @description
 * ComponentExample 배열을 받아 실제 컴포넌트들을 렌더링합니다.
 * 레지스트리에 등록되지 않은 컴포넌트는 무시됩니다.
 */
export function HelpExampleRenderer({
  examples,
  direction = "horizontal",
  className = "",
}: HelpExampleRendererProps) {
  if (!examples || examples.length === 0) return null;

  const layoutClass =
    direction === "horizontal"
      ? "flex flex-wrap items-center gap-2"
      : "flex flex-col gap-2";

  return (
    <div className={`${layoutClass} ${className}`}>
      {examples.map((example, idx) => {
        const Component = getHelpComponent(example.component);
        if (!Component) return null;

        return (
          <div key={idx} className="flex items-center gap-2">
            {createElement(Component, example.props)}
            {example.label && (
              <span className="text-xs text-muted-foreground">
                {example.label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface SingleExampleProps {
  /** 렌더링할 예시 */
  example: ComponentExample;
  /** 라벨 표시 위치 */
  labelPosition?: "right" | "bottom";
}

/**
 * 단일 예시 컴포넌트 렌더러
 */
export function HelpSingleExample({
  example,
  labelPosition = "right",
}: SingleExampleProps) {
  const Component = getHelpComponent(example.component);
  if (!Component) return null;

  if (labelPosition === "bottom") {
    return (
      <div className="flex flex-col items-start gap-1">
        {createElement(Component, example.props)}
        {example.label && (
          <span className="text-xs text-muted-foreground">{example.label}</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {createElement(Component, example.props)}
      {example.label && (
        <span className="text-xs text-muted-foreground">{example.label}</span>
      )}
    </div>
  );
}
