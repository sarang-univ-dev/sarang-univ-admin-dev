# Zustand 개요 및 시작 가이드

## Zustand란?

Zustand는 React 애플리케이션을 위한 **작고, 빠르며, 확장 가능한** 상태 관리 라이브러리입니다. 독일어로 "상태(state)"를 의미하며, 2025년 기준 React 생태계에서 가장 인기 있는 상태 관리 솔루션 중 하나입니다.

## 핵심 개념

### 미니멀리즘

Zustand는 최소한의 보일러플레이트로 강력한 상태 관리를 제공합니다.

**특징:**
- 번들 크기: ~1KB (gzipped)
- Provider 래퍼 불필요
- 단 4줄의 코드로 글로벌 스토어 생성
- React hooks 기반 API

### 플럭스 원칙 기반

Redux와 유사하게 단방향 데이터 흐름을 따르지만, 훨씬 더 간단한 API를 제공합니다.

```typescript
import { create } from 'zustand';

const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}));
```

### 헤드리스(Headless) 아키텍처

Zustand는 UI와 완전히 분리된 순수한 상태 관리 로직만 제공합니다.

**장점:**
- 어떤 UI 라이브러리와도 호환
- 테스트 용이성
- 최대한의 유연성
- 프레임워크 독립적 사용 가능

## 주요 기능

### 1. 간단한 API

```typescript
// 스토어 생성
const useStore = create((set) => ({
  bears: 0,
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
  removeAllBears: () => set({ bears: 0 }),
}));

// 컴포넌트에서 사용
function BearCounter() {
  const bears = useStore((state) => state.bears);
  return <h1>{bears} around here...</h1>;
}

function Controls() {
  const increasePopulation = useStore((state) => state.increasePopulation);
  return <button onClick={increasePopulation}>Add bear</button>;
}
```

### 2. 선택적 구독 (Selective Subscription)

필요한 상태만 구독하여 불필요한 리렌더링을 방지합니다.

```typescript
// count가 변경될 때만 리렌더링
const count = useStore((state) => state.count);

// user가 변경될 때만 리렌더링
const user = useStore((state) => state.user);
```

### 3. 비동기 액션 지원

Promise와 async/await를 자연스럽게 사용할 수 있습니다.

```typescript
const useStore = create((set) => ({
  data: null,
  isLoading: false,
  fetchData: async () => {
    set({ isLoading: true });
    const response = await fetch('/api/data');
    const data = await response.json();
    set({ data, isLoading: false });
  },
}));
```

### 4. 미들웨어 생태계

```typescript
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

const useStore = create(
  devtools(
    persist(
      (set) => ({
        count: 0,
        increment: () => set((state) => ({ count: state.count + 1 })),
      }),
      { name: 'counter-storage' }
    )
  )
);
```

**사용 가능한 미들웨어:**
- `devtools` - Redux DevTools 통합
- `persist` - LocalStorage/SessionStorage 자동 저장
- `immer` - 불변성 관리 간소화
- `subscribeWithSelector` - 선택적 구독 최적화
- `combine` - 여러 스토어 결합

### 5. TypeScript 완벽 지원

타입 추론이 자동으로 작동하며, 명시적 타입 정의도 가능합니다.

```typescript
interface BearState {
  bears: number;
  increasePopulation: () => void;
  removeAllBears: () => void;
}

const useStore = create<BearState>((set) => ({
  bears: 0,
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
  removeAllBears: () => set({ bears: 0 }),
}));
```

## 언제 Zustand를 사용해야 하나?

### 적합한 경우

✅ **소규모에서 중대형 애플리케이션**
- 단순한 API로 빠른 개발 가능
- 필요에 따라 확장 가능

✅ **Redux의 복잡성을 피하고 싶을 때**
- 보일러플레이트 최소화
- 학습 곡선이 낮음

✅ **Context API의 성능 문제 해결**
- 선택적 구독으로 리렌더링 최적화
- Provider 지옥 회피

✅ **여러 컴포넌트 간 상태 공유**
- 전역 상태 관리
- Props drilling 방지

✅ **TypeScript 프로젝트**
- 우수한 타입 추론
- 완벽한 타입 안전성

### 부적합한 경우

❌ **매우 복잡한 상태 로직 (예: 대규모 엔터프라이즈 앱)**
- Redux Toolkit + Redux Saga/Thunk가 더 적합할 수 있음
- 단, Zustand도 슬라이스 패턴으로 충분히 확장 가능

❌ **서버 상태 관리**
- TanStack Query (React Query), SWR 사용 권장
- Zustand는 클라이언트 상태(UI 상태)에 집중

❌ **URL 상태 관리**
- React Router, Next.js Router 사용
- Zustand와 함께 사용 가능하지만 주 용도는 아님

## 성능 특성

### 벤치마크 비교 (2025년 기준)

| 라이브러리 | 번들 크기 | 초기 렌더링 | 리렌더링 성능 |
|-----------|----------|-----------|-------------|
| Zustand | ~1KB | 매우 빠름 | 우수 |
| Redux Toolkit | ~10KB | 빠름 | 우수 |
| Context API | 0KB (내장) | 보통 | 보통 |
| Jotai | ~3KB | 매우 빠름 | 우수 |
| Recoil | ~14KB | 보통 | 우수 |

### 최적화 전략

Zustand는 기본적으로 최적화되어 있지만, 추가 최적화가 가능합니다:

1. **선택적 구독** - 필요한 상태만 선택
2. **Shallow 비교** - 객체 비교 시 useShallow 사용
3. **Actions 분리** - 정적 actions 객체로 분리
4. **스토어 분할** - 도메인별 작은 스토어 생성

## 기본 사용 예제

### 1. 간단한 카운터

```typescript
import { create } from 'zustand';

interface CounterState {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}

const useCounterStore = create<CounterState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}));

function Counter() {
  const { count, increment, decrement, reset } = useCounterStore();

  return (
    <div>
      <h1>Count: {count}</h1>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}
```

### 2. 사용자 인증 스토어

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const response = await fetch('/api/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });

        if (response.ok) {
          const { user, token } = await response.json();
          set({ user, token, isAuthenticated: true });
        }
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },

      checkAuth: async () => {
        const token = useAuthStore.getState().token;
        if (!token) return;

        const response = await fetch('/api/verify', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          set({ user: null, token: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
    }
  )
);
```

### 3. TODO 리스트

```typescript
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

interface TodoState {
  todos: Todo[];
  addTodo: (text: string) => void;
  toggleTodo: (id: string) => void;
  removeTodo: (id: string) => void;
  clearCompleted: () => void;
}

const useTodoStore = create<TodoState>()(
  immer((set) => ({
    todos: [],

    addTodo: (text) =>
      set((state) => {
        state.todos.push({
          id: Date.now().toString(),
          text,
          completed: false,
        });
      }),

    toggleTodo: (id) =>
      set((state) => {
        const todo = state.todos.find((t) => t.id === id);
        if (todo) todo.completed = !todo.completed;
      }),

    removeTodo: (id) =>
      set((state) => {
        state.todos = state.todos.filter((t) => t.id !== id);
      }),

    clearCompleted: () =>
      set((state) => {
        state.todos = state.todos.filter((t) => !t.completed);
      }),
  }))
);
```

## Zustand vs 다른 상태 관리 라이브러리

### Zustand vs Redux

| 특징 | Zustand | Redux |
|------|---------|-------|
| 보일러플레이트 | 최소 | 많음 |
| 학습 곡선 | 낮음 | 높음 |
| Provider 필요 | 아니오 | 예 |
| DevTools | 미들웨어 | 기본 내장 |
| 타입 추론 | 우수 | 좋음 |
| 미들웨어 | 선택적 | 핵심 개념 |

### Zustand vs Context API

| 특징 | Zustand | Context API |
|------|---------|-------------|
| 성능 | 우수 | 보통 |
| 보일러플레이트 | 적음 | 중간 |
| 리렌더링 제어 | 우수 | 제한적 |
| DevTools | 지원 | 없음 |
| 사용 편의성 | 높음 | 중간 |

### Zustand vs Jotai/Recoil

| 특징 | Zustand | Jotai/Recoil |
|------|---------|--------------|
| 패러다임 | 중앙 집중형 | 원자적(Atomic) |
| 번들 크기 | 가장 작음 | 작음 |
| 학습 곡선 | 낮음 | 중간 |
| 비동기 처리 | 직관적 | 복잡 |
| 적합한 경우 | 대부분의 앱 | 복잡한 의존성 |

## 추가 리소스

- [공식 문서](https://zustand.docs.pmnd.rs/)
- [GitHub 저장소](https://github.com/pmndrs/zustand)
- [Examples](https://github.com/pmndrs/zustand/tree/main/examples)
- [TkDodo의 Working with Zustand](https://tkdodo.eu/blog/working-with-zustand)
- [TypeScript 가이드](https://zustand.docs.pmnd.rs/guides/typescript)

## 다음 단계

이 개요를 읽은 후, 다음 문서들을 참고하여 더 깊이 있는 내용을 학습하세요:

1. **성능 최적화** - `zustand-performance-optimization.md`
2. **스토어 아키텍처** - `zustand-store-architecture.md`
3. **흔한 실수와 안티패턴** - `zustand-common-mistakes.md`
4. **TypeScript 패턴** - `zustand-typescript-patterns.md`
5. **미들웨어 사용** - `zustand-middleware.md`
6. **테스팅 전략** - `zustand-testing.md`
7. **Next.js 통합** - `zustand-nextjs-integration.md`
