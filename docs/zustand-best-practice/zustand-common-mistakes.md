# Zustand 흔한 실수와 안티패턴

## 개요

Zustand를 사용할 때 개발자들이 자주 범하는 실수와 이를 피하는 방법을 설명합니다. 이 가이드를 따르면 대부분의 일반적인 문제를 예방할 수 있습니다.

## 1. 전체 스토어 구독

### 가장 흔한 실수

#### ❌ 잘못된 예제

```typescript
function Component() {
  // 모든 상태 변경에 리렌더링!
  const store = useStore();

  return <div>{store.count}</div>;
}
```

#### 증상

- 관련 없는 상태가 변경되어도 컴포넌트가 리렌더링됨
- 성능 저하
- React DevTools에서 과도한 리렌더링 관찰됨

#### ✅ 해결 방법

```typescript
// 방법 1: 필요한 상태만 선택
function Component() {
  const count = useStore((state) => state.count);
  return <div>{count}</div>;
}

// 방법 2: 여러 값이 필요한 경우 useShallow
import { useShallow } from 'zustand/react/shallow';

function Component() {
  const { count, user } = useStore(
    useShallow((state) => ({
      count: state.count,
      user: state.user,
    }))
  );

  return <div>{count}</div>;
}
```

## 2. 객체 반환 셀렉터

### 실수: 매번 새로운 객체 참조 생성

#### ❌ 잘못된 예제

```typescript
function Component() {
  // 매 렌더링마다 새 객체 생성 → 항상 리렌더링
  const { firstName, lastName } = useStore((state) => ({
    firstName: state.firstName,
    lastName: state.lastName,
  }));

  return <div>{firstName} {lastName}</div>;
}
```

#### 증상

- firstName이나 lastName이 변경되지 않아도 리렌더링
- React는 `{}` 객체를 항상 다른 것으로 인식
- 성능 문제

#### ✅ 해결 방법

```typescript
// 방법 1: 개별 셀렉터 (가장 권장)
function Component() {
  const firstName = useStore((state) => state.firstName);
  const lastName = useStore((state) => state.lastName);

  return <div>{firstName} {lastName}</div>;
}

// 방법 2: useShallow 사용
import { useShallow } from 'zustand/react/shallow';

function Component() {
  const { firstName, lastName } = useStore(
    useShallow((state) => ({
      firstName: state.firstName,
      lastName: state.lastName,
    }))
  );

  return <div>{firstName} {lastName}</div>;
}

// 방법 3: shallow equality 함수
import { shallow } from 'zustand/shallow';

function Component() {
  const { firstName, lastName } = useStore(
    (state) => ({ firstName: state.firstName, lastName: state.lastName }),
    shallow
  );

  return <div>{firstName} {lastName}</div>;
}
```

## 3. 상태 직접 변경

### 실수: 불변성 위반

#### ❌ 잘못된 예제

```typescript
const useStore = create((set) => ({
  user: { name: 'John', age: 30 },
  todos: [],

  // ❌ 직접 변경
  updateAge: (age) => {
    useStore.getState().user.age = age; // 절대 금지!
  },

  // ❌ 배열 직접 변경
  addTodo: (todo) => {
    useStore.getState().todos.push(todo); // 절대 금지!
  },
}));
```

#### 증상

- 상태가 업데이트되지 않음
- 컴포넌트가 리렌더링되지 않음
- 예측 불가능한 동작

#### ✅ 해결 방법

```typescript
const useStore = create((set) => ({
  user: { name: 'John', age: 30 },
  todos: [],

  // ✅ set 함수 사용
  updateAge: (age) =>
    set((state) => ({
      user: { ...state.user, age },
    })),

  // ✅ 새 배열 생성
  addTodo: (todo) =>
    set((state) => ({
      todos: [...state.todos, todo],
    })),

  // ✅ filter로 제거
  removeTodo: (id) =>
    set((state) => ({
      todos: state.todos.filter((t) => t.id !== id),
    })),
}));

// 또는 Immer 미들웨어 사용
import { immer } from 'zustand/middleware/immer';

const useStore = create(
  immer((set) => ({
    user: { name: 'John', age: 30 },
    todos: [],

    // Immer를 사용하면 직접 변경 가능
    updateAge: (age) =>
      set((state) => {
        state.user.age = age; // Immer가 불변성 보장
      }),

    addTodo: (todo) =>
      set((state) => {
        state.todos.push(todo); // Immer가 불변성 보장
      }),
  }))
);
```

## 4. 컴포넌트 내부에 스토어 정의

### 실수: 매 렌더링마다 스토어 재생성

#### ❌ 잘못된 예제

```typescript
function MyComponent() {
  // 매 렌더링마다 새로운 스토어 생성!
  const useStore = create((set) => ({
    count: 0,
    increment: () => set((state) => ({ count: state.count + 1 })),
  }));

  const count = useStore((state) => state.count);

  return <div>{count}</div>;
}
```

#### 증상

- 상태가 유지되지 않음
- 매번 초기값으로 리셋
- 메모리 누수

#### ✅ 해결 방법

```typescript
// 방법 1: 파일 레벨에서 정의 (가장 권장)
const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

function MyComponent() {
  const count = useStore((state) => state.count);
  return <div>{count}</div>;
}

// 방법 2: 별도 파일로 분리
// stores/counterStore.ts
export const useCounterStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

// components/Counter.tsx
import { useCounterStore } from '@/stores/counterStore';

function Counter() {
  const count = useCounterStore((state) => state.count);
  return <div>{count}</div>;
}
```

## 5. Computed Values를 상태에 저장

### 실수: 파생 상태를 별도로 저장

#### ❌ 잘못된 예제

```typescript
const useStore = create((set) => ({
  firstName: 'John',
  lastName: 'Doe',
  fullName: 'John Doe', // 중복된 정보!

  setFirstName: (name) =>
    set((state) => ({
      firstName: name,
      fullName: `${name} ${state.lastName}`, // 동기화 문제 발생 가능
    })),

  setLastName: (name) =>
    set((state) => ({
      lastName: name,
      fullName: `${state.firstName} ${name}`, // 동기화 문제 발생 가능
    })),
}));
```

#### 증상

- 데이터 동기화 문제
- 버그 발생 가능성 증가
- 유지보수 어려움

#### ✅ 해결 방법

```typescript
// 방법 1: 컴포넌트에서 계산
const useStore = create((set) => ({
  firstName: 'John',
  lastName: 'Doe',

  setFirstName: (name) => set({ firstName: name }),
  setLastName: (name) => set({ lastName: name }),
}));

function Component() {
  const firstName = useStore((state) => state.firstName);
  const lastName = useStore((state) => state.lastName);
  const fullName = `${firstName} ${lastName}`; // 컴포넌트에서 계산

  return <div>{fullName}</div>;
}

// 방법 2: 커스텀 훅으로 캡슐화
function useFullName() {
  const firstName = useStore((state) => state.firstName);
  const lastName = useStore((state) => state.lastName);
  return `${firstName} ${lastName}`;
}

function Component() {
  const fullName = useFullName();
  return <div>{fullName}</div>;
}

// 방법 3: Getter 함수 (복잡한 계산)
const useStore = create((set, get) => ({
  items: [],
  getTotal: () => {
    return get().items.reduce((sum, item) => sum + item.price, 0);
  },
}));

function Component() {
  const getTotal = useStore((state) => state.getTotal);
  const total = getTotal(); // 필요할 때 계산

  return <div>Total: ${total}</div>;
}
```

## 6. React Server Components에서 사용

### 실수: Next.js App Router에서 전역 스토어 사용

#### ❌ 잘못된 예제

```typescript
// app/page.tsx (Server Component)
import { useCounterStore } from '@/stores/counterStore';

export default function Page() {
  // ❌ Server Component에서 hooks 사용 불가!
  const count = useCounterStore((state) => state.count);

  return <div>{count}</div>;
}
```

#### 증상

- "You're importing a component that needs useState..." 에러
- 데이터 누출 위험 (서버에서 전역 스토어는 요청 간 공유됨)
- 보안 문제

#### ✅ 해결 방법

```typescript
// 방법 1: 'use client' 디렉티브 추가
'use client';

import { useCounterStore } from '@/stores/counterStore';

export default function ClientComponent() {
  const count = useCounterStore((state) => state.count);
  return <div>{count}</div>;
}

// 방법 2: Store Provider 패턴 (권장)
// stores/counter-store-provider.tsx
'use client';

import { createContext, useContext, useRef, type ReactNode } from 'react';
import { createStore, useStore } from 'zustand';

interface CounterStore {
  count: number;
  increment: () => void;
}

const CounterStoreContext = createContext<ReturnType<typeof createStore<CounterStore>> | null>(null);

export function CounterStoreProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<ReturnType<typeof createStore<CounterStore>>>();

  if (!storeRef.current) {
    storeRef.current = createStore<CounterStore>((set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 })),
    }));
  }

  return (
    <CounterStoreContext.Provider value={storeRef.current}>
      {children}
    </CounterStoreContext.Provider>
  );
}

export function useCounterStore<T>(selector: (state: CounterStore) => T): T {
  const store = useContext(CounterStoreContext);
  if (!store) throw new Error('Missing CounterStoreProvider');
  return useStore(store, selector);
}

// app/layout.tsx
import { CounterStoreProvider } from '@/stores/counter-store-provider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <CounterStoreProvider>{children}</CounterStoreProvider>
      </body>
    </html>
  );
}
```

## 7. 비동기 에러 처리 누락

### 실수: try-catch 없이 비동기 작업

#### ❌ 잘못된 예제

```typescript
const useStore = create((set) => ({
  data: null,
  isLoading: false,

  fetchData: async () => {
    set({ isLoading: true });
    const response = await fetch('/api/data'); // 에러 발생 시 처리 안 됨!
    const data = await response.json();
    set({ data, isLoading: false });
  },
}));
```

#### 증상

- 에러 발생 시 `isLoading`이 `true`로 고정
- 사용자에게 에러 표시 불가
- 앱이 멈춘 것처럼 보임

#### ✅ 해결 방법

```typescript
const useStore = create((set) => ({
  data: null,
  isLoading: false,
  error: null,

  fetchData: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch('/api/data');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      set({ data, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false,
      });
    }
  },

  clearError: () => set({ error: null }),
}));

// 컴포넌트에서 사용
function DataComponent() {
  const { data, isLoading, error, fetchData, clearError } = useStore();

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) return <div>Loading...</div>;
  if (error) {
    return (
      <div>
        Error: {error}
        <button onClick={clearError}>Retry</button>
      </div>
    );
  }

  return <div>{JSON.stringify(data)}</div>;
}
```

## 8. 과도한 Shallow 사용

### 실수: 모든 곳에 shallow 적용

#### ❌ 잘못된 예제

```typescript
import { shallow } from 'zustand/shallow';

// 단일 값에는 불필요
const count = useStore((state) => state.count, shallow);

// 기본 타입에는 의미 없음
const name = useStore((state) => state.name, shallow);
```

#### ✅ 올바른 사용

```typescript
// shallow는 객체/배열 비교에만 사용
import { useShallow } from 'zustand/react/shallow';

// ✅ 객체 반환 시
const { firstName, lastName } = useStore(
  useShallow((state) => ({
    firstName: state.firstName,
    lastName: state.lastName,
  }))
);

// ✅ 배열 반환 시
const users = useStore(useShallow((state) => state.users));

// ❌ 단일 기본 타입 - shallow 불필요
const count = useStore((state) => state.count);
```

## 9. Actions 내부의 계산된 값

### 실수: Actions에서 다른 상태 사용

#### ❌ 잘못된 예제

```typescript
const useStore = create((set, get) => ({
  count: 0,
  multiplier: 2,

  // ❌ multiplier 변경은 이 action을 구독하는 컴포넌트를 리렌더링하지 않음
  getMultipliedCount: () => {
    return get().count * get().multiplier;
  },
}));

function Component() {
  const getMultipliedCount = useStore((state) => state.getMultipliedCount);
  const result = getMultipliedCount(); // multiplier 변경 시 업데이트 안 됨!

  return <div>{result}</div>;
}
```

#### ✅ 해결 방법

```typescript
// 방법 1: 컴포넌트에서 계산
function Component() {
  const count = useStore((state) => state.count);
  const multiplier = useStore((state) => state.multiplier);
  const result = count * multiplier; // 자동 업데이트

  return <div>{result}</div>;
}

// 방법 2: 셀렉터 사용
function Component() {
  const result = useStore((state) => state.count * state.multiplier);
  return <div>{result}</div>;
}

// 방법 3: 커스텀 훅
function useMultipliedCount() {
  return useStore((state) => state.count * state.multiplier);
}

function Component() {
  const result = useMultipliedCount();
  return <div>{result}</div>;
}
```

## 10. 너무 많은 작은 스토어

### 실수: 과도한 분할

#### ❌ 잘못된 예제

```typescript
// 너무 세분화됨
export const useCountStore = create((set) => ({ count: 0 }));
export const useNameStore = create((set) => ({ name: '' }));
export const useEmailStore = create((set) => ({ email: '' }));
export const useAgeStore = create((set) => ({ age: 0 }));
// ... 계속

function Component() {
  // 너무 많은 훅 사용
  const count = useCountStore((state) => state.count);
  const name = useNameStore((state) => state.name);
  const email = useEmailStore((state) => state.email);
  const age = useAgeStore((state) => state.age);
}
```

#### ✅ 해결 방법

```typescript
// 관련된 상태는 하나의 스토어로
export const useUserStore = create((set) => ({
  name: '',
  email: '',
  age: 0,
  updateName: (name) => set({ name }),
  updateEmail: (email) => set({ email }),
  updateAge: (age) => set({ age }),
}));

// 도메인별로 분리
export const useAuthStore = create((set) => ({ /* auth state */ }));
export const useUIStore = create((set) => ({ /* UI state */ }));
export const useDataStore = create((set) => ({ /* data state */ }));
```

## 11. 체크리스트

### 상태 관리

- [ ] 전체 스토어 구독 대신 개별 셀렉터 사용
- [ ] 객체 반환 셀렉터에 useShallow 적용
- [ ] set 함수로만 상태 업데이트
- [ ] Computed values는 컴포넌트에서 계산

### 스토어 구조

- [ ] 스토어를 컴포넌트 외부에 정의
- [ ] 관련된 상태는 하나의 스토어로 그룹화
- [ ] Actions를 별도 객체로 분리 (선택적)

### Next.js / RSC

- [ ] Server Components에서 Zustand 사용 금지
- [ ] Client Components에 'use client' 추가
- [ ] Store Provider 패턴 고려

### 에러 처리

- [ ] 비동기 작업에 try-catch 추가
- [ ] 에러 상태를 스토어에 저장
- [ ] 사용자에게 에러 표시

### 성능

- [ ] 불필요한 shallow 사용 제거
- [ ] 복잡한 계산은 메모이제이션
- [ ] React DevTools로 리렌더링 확인

## 12. 디버깅 팁

### 리렌더링 추적

```typescript
function Component() {
  const count = useStore((state) => state.count);

  // 개발 모드에서만
  if (process.env.NODE_ENV === 'development') {
    console.count('Component render');
    console.log('Current count:', count);
  }

  return <div>{count}</div>;
}
```

### 상태 변화 로깅

```typescript
const useStore = create((set) => ({
  count: 0,
  increment: () =>
    set((state) => {
      const newState = { count: state.count + 1 };
      console.log('State changing:', state, '→', newState);
      return newState;
    }),
}));
```

### Redux DevTools 사용

```typescript
import { devtools } from 'zustand/middleware';

const useStore = create(
  devtools((set) => ({
    count: 0,
    increment: () => set((state) => ({ count: state.count + 1 }), false, 'increment'),
  }))
);
```

## 결론

Zustand의 대부분의 문제는 다음에서 발생합니다:

1. **잘못된 셀렉터 사용** - 전체 스토어 구독, 객체 반환
2. **불변성 위반** - 상태 직접 변경
3. **잘못된 스토어 위치** - 컴포넌트 내부 정의
4. **Computed values 중복** - 파생 상태를 별도 저장

이 가이드의 패턴을 따르면 대부분의 문제를 예방할 수 있습니다.

**핵심 체크포인트:**
- 개별 셀렉터 사용
- set 함수로만 업데이트
- 스토어를 파일 레벨에 정의
- 에러 처리 철저히
- Next.js RSC 주의
