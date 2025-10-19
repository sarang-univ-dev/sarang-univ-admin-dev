# Zustand Best Practices

> 2025년 최신 Zustand best practices 종합 가이드

## 개요

이 문서는 Zustand를 사용한 React 상태 관리의 best practices를 다룹니다. 공식 문서, 커뮤니티 가이드, 실전 경험을 바탕으로 작성되었습니다.

## 목차

1. [개요 및 시작 가이드](./zustand-overview.md)
   - Zustand란?
   - 핵심 개념
   - 주요 기능
   - 언제 사용해야 하나?
   - 기본 사용 예제
   - 다른 라이브러리와 비교

2. [성능 최적화](./zustand-performance-optimization.md)
   - 선택적 구독 (Selective Subscription)
   - Actions 분리 패턴
   - 셀렉터 메모이제이션
   - Shallow 비교 최적화
   - 스토어 분할
   - 리렌더링 디버깅
   - 성능 측정

3. [흔한 실수와 안티패턴](./zustand-common-mistakes.md)
   - 전체 스토어 구독
   - 객체 반환 셀렉터
   - 상태 직접 변경
   - 컴포넌트 내부에 스토어 정의
   - Computed Values를 상태에 저장
   - React Server Components에서 사용
   - 비동기 에러 처리 누락
   - 과도한 Shallow 사용

4. [스토어 아키텍처](./zustand-store-architecture.md)
   - 단일 스토어 vs 다중 스토어
   - Slices 패턴
   - Actions 패턴
   - 스토어 간 통신
   - 폴더 구조
   - 상태 정규화
   - 초기화 패턴

5. [TypeScript 패턴](./zustand-typescript-patterns.md)
   - 기본 타입 정의
   - 미들웨어와 함께 사용
   - Slices 패턴 타입 정의
   - Generic Store
   - Conditional Types
   - Selector 타입 안전성
   - 에러 처리 타입
   - 유틸리티 타입

6. [미들웨어](./zustand-middleware.md)
   - 미들웨어 기본 개념
   - Persist 미들웨어
   - DevTools 미들웨어
   - Immer 미들웨어
   - SubscribeWithSelector 미들웨어
   - Combine 유틸리티
   - 커스텀 미들웨어
   - 미들웨어 조합

7. [테스팅](./zustand-testing.md)
   - 테스트 환경 설정
   - Unit 테스트
   - React 컴포넌트 테스트
   - 스토어 리셋 패턴
   - Mock 스토어
   - Persist 미들웨어 테스트
   - 베스트 프랙티스
   - 통합 테스트

8. [Next.js 통합](./zustand-nextjs-integration.md)
   - 핵심 규칙
   - Client Components에서 사용
   - Store Provider 패턴
   - SSR과 Hydration
   - Persist 미들웨어와 SSR
   - Server Actions와 통합
   - 성능 최적화
   - 안티패턴

## 빠른 시작

### 설치

```bash
npm install zustand
# or
yarn add zustand
# or
pnpm add zustand
```

### 기본 사용법

```typescript
import { create } from 'zustand';

interface BearStore {
  bears: number;
  increase: () => void;
}

const useBearStore = create<BearStore>((set) => ({
  bears: 0,
  increase: () => set((state) => ({ bears: state.bears + 1 })),
}));

function BearCounter() {
  const bears = useBearStore((state) => state.bears);
  return <h1>{bears} around here...</h1>;
}

function Controls() {
  const increase = useBearStore((state) => state.increase);
  return <button onClick={increase}>Add bear</button>;
}
```

## 핵심 원칙

### 1. 선택적 구독 사용

```typescript
// ❌ 나쁜 예
const store = useStore();

// ✅ 좋은 예
const count = useStore((state) => state.count);
```

### 2. 불변성 유지

```typescript
// ❌ 나쁜 예
useStore.getState().count = 5;

// ✅ 좋은 예
set({ count: 5 });
```

### 3. 비즈니스 로직을 스토어에 유지

```typescript
// ✅ 좋은 예
const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: Math.max(0, state.count - 1) })),
}));
```

### 4. TypeScript 활용

```typescript
interface State {
  count: number;
}

interface Actions {
  increment: () => void;
}

type Store = State & Actions;

const useStore = create<Store>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));
```

## 주요 패턴

### 다중 스토어

```typescript
export const useAuthStore = create((set) => ({ /* ... */ }));
export const useCartStore = create((set) => ({ /* ... */ }));
export const useUIStore = create((set) => ({ /* ... */ }));
```

### Slices 패턴

```typescript
const useStore = create((...a) => ({
  ...createAuthSlice(...a),
  ...createCartSlice(...a),
  ...createUISlice(...a),
}));
```

### Actions 분리

```typescript
const useStore = create((set) => ({
  // State
  count: 0,

  // Actions
  actions: {
    increment: () => set((state) => ({ count: state.count + 1 })),
  },
}));
```

### Persist

```typescript
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set) => ({ /* ... */ }),
    { name: 'storage' }
  )
);
```

## 성능 최적화 체크리스트

- [ ] 전체 스토어 구독 대신 개별 셀렉터 사용
- [ ] 객체 반환 시 `useShallow` 사용
- [ ] Actions를 별도 객체로 분리
- [ ] 도메인별로 스토어 분할
- [ ] 복잡한 계산은 메모이제이션

## Next.js 사용 시 주의사항

- [ ] Server Components에서 Zustand 사용 금지
- [ ] 'use client' 디렉티브 추가
- [ ] Store Provider 패턴 고려
- [ ] Hydration 처리 (Persist 사용 시)

## 테스팅 체크리스트

- [ ] 각 테스트 전 스토어 초기화
- [ ] 비동기 작업은 Mock 활용
- [ ] 독립적인 테스트 작성
- [ ] AAA 패턴 준수

## 리소스

### 공식 문서
- [Zustand 공식 문서](https://zustand.docs.pmnd.rs/)
- [GitHub 저장소](https://github.com/pmndrs/zustand)
- [TypeScript 가이드](https://zustand.docs.pmnd.rs/guides/typescript)

### 커뮤니티
- [TkDodo's Blog - Working with Zustand](https://tkdodo.eu/blog/working-with-zustand)
- [Reddit - r/reactjs](https://www.reddit.com/r/reactjs/)
- [Discord - Poimandres](https://discord.gg/poimandres)

### 관련 라이브러리
- [Immer](https://immerjs.github.io/immer/) - 불변성 관리
- [Redux DevTools](https://github.com/reduxjs/redux-devtools) - 디버깅
- [TanStack Query](https://tanstack.com/query/latest) - 서버 상태 관리

## 기여

이 문서에 기여하고 싶으시다면 Pull Request를 보내주세요.

## 라이선스

이 문서는 MIT 라이선스 하에 배포됩니다.

---

*최종 업데이트: 2025년 1월*
*버전: 1.0.0*
