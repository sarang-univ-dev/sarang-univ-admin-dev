import React from "react";

/**
 * React.ReactNode에서 숫자를 추출하는 타입 안전한 유틸 함수
 *
 * @description
 * - ReactNode의 다양한 타입(number, string, JSX.Element)에서 숫자 추출
 * - 타입 가드를 사용하여 타입 안전성 보장
 * - 정규식으로 문자열에서 첫 번째 숫자 추출
 *
 * @param node - React.ReactNode (JSX.Element, string, number 등)
 * @returns 추출된 숫자. 없으면 0
 *
 * @example
 * ```tsx
 * extractNumber(42) // 42
 * extractNumber("123명") // 123
 * extractNumber(<span>456명</span>) // 456
 * extractNumber(<div><span>789</span></div>) // 789
 * ```
 */
export function extractNumber(node: React.ReactNode): number {
  // 1. number 타입인 경우
  if (typeof node === "number") {
    return node;
  }

  // 2. string 타입인 경우
  if (typeof node === "string") {
    const match = node.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  // 3. JSX.Element인 경우 (props.children 재귀)
  if (React.isValidElement(node)) {
    const { children } = node.props;

    // children이 없으면 0
    if (!children) return 0;

    // children이 배열인 경우 첫 번째 요소 처리
    if (Array.isArray(children)) {
      for (const child of children) {
        const result = extractNumber(child);
        if (result > 0) return result;
      }
      return 0;
    }

    // children 재귀 처리
    return extractNumber(children);
  }

  // 4. 그 외 (null, undefined, boolean 등)
  return 0;
}

/**
 * React.ReactNode 배열에서 숫자를 추출하여 합산
 *
 * @param nodes - React.ReactNode 배열
 * @returns 모든 노드에서 추출한 숫자의 합
 *
 * @example
 * ```tsx
 * sumExtractedNumbers([<span>10명</span>, <span>20명</span>]) // 30
 * ```
 */
export function sumExtractedNumbers(nodes: React.ReactNode[]): number {
  return nodes.reduce<number>((sum, node) => sum + extractNumber(node), 0);
}
