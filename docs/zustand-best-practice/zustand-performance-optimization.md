# Zustand 성능 최적화 가이드

## 개요

Zustand는 기본적으로 우수한 성능을 제공하지만, 적절한 최적화 기법을 적용하면 더욱 향상된 성능을 얻을 수 있습니다. 이 가이드는 Zustand 스토어의 성능을 최대화하기 위한 검증된 기법들을 다룹니다.

## 1. 선택적 구독 (Selective Subscription)

### 핵심 원칙

**가장 중요한 최적화:** 필요한 상태만 선택하여 구독하세요.

### ❌ 잘못된 예제

```typescript
// 안티패턴 1: 전체 스토어 구독
function Component() {
  const store = useStore(); // 모든 상태 변경 시 리렌더링!
  return <div>{store.count}</div>;
}

// 안티패턴 2: 객체 반환 (새로운 참조 생성)
function Component() {
  const { count, user } = useStore((state) => ({
    count: state.count,
    user: state.user,
  })); // 매번 새 객체 생성 → 항상 리렌더링!

  return <div>{count}</div>;
}
```

### ✅ 올바른 예제

```typescript
// 방법 1: 개별 셀렉터 (가장 권장)
function Component() {
  const count = useStore((state) => state.count);
  const user = useStore((state) => state.user);

  return <div>{count}</div>;
}

// 방법 2: useShallow 사용
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

// 방법 3: 커스텀 equality 함수
import { shallow } from 'zustand/shallow';

function Component() {
  const { count, user } = useStore(
    (state) => ({ count: state.count, user: state.user }),
    shallow
  );

  return <div>{count}</div>;
}
```

### 성능 비교

```typescript
// 성능 측정 예제
const useStore = create((set) => ({
  count: 0,
  user: { name: 'John' },
  posts: [],
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

// ❌ 나쁨: count 변경 시에도 리렌더링
function BadComponent() {
  const { user, posts } = useStore((state) => ({
    user: state.user,
    posts: state.posts,
  }));
  console.log('Rendered!'); // count 변경 시에도 출력됨
  return <div>{user.name}</div>;
}

// ✅ 좋음: user 변경 시에만 리렌더링
function GoodComponent() {
  const user = useStore((state) => state.user);
  console.log('Rendered!'); // user 변경 시에만 출력됨
  return <div>{user.name}</div>;
}
```

## 2. Actions 분리 패턴

### 문제점

Actions는 절대 변경되지 않지만, 매번 구독하면 불필요한 의존성이 생깁니다.

### ❌ 잘못된 예제

```typescript
function Component() {
  // increment는 절대 변경되지 않는데 매번 선택
  const increment = useStore((state) => state.increment);
  const decrement = useStore((state) => state.decrement);
  const reset = useStore((state) => state.reset);

  return (
    <div>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}
```

### ✅ 올바른 예제

```typescript
// 방법 1: Actions 객체로 분리
const useStore = create((set) => ({
  // State
  count: 0,
  user: null,

  // Actions를 별도 객체로
  actions: {
    increment: () => set((state) => ({ count: state.count + 1 })),
    decrement: () => set((state) => ({ count: state.count - 1 })),
    reset: () => set({ count: 0 }),
    setUser: (user) => set({ user }),
  },
}));

// 컴포넌트에서 사용
function Component() {
  const count = useStore((state) => state.count);
  const actions = useStore((state) => state.actions); // actions 객체는 불변

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={actions.increment}>+</button>
      <button onClick={actions.decrement}>-</button>
    </div>
  );
}

// 방법 2: 커스텀 훅으로 actions 추출
function useStoreActions() {
  return useStore((state) => state.actions);
}

function AnotherComponent() {
  const actions = useStoreActions();
  // actions만 사용하는 컴포넌트는 상태 변경 시 리렌더링 안 됨
  return <button onClick={actions.increment}>+</button>;
}
```

### 성능 향상 효과

```typescript
// 벤치마크 예제
const useStore = create((set) => ({
  count: 0,
  actions: {
    increment: () => set((state) => ({ count: state.count + 1 })),
  },
}));

// ❌ 나쁨: 불필요한 리렌더링
function BadButton() {
  const increment = useStore((state) => state.increment);
  console.log('Button rendered'); // count 변경 시에도 출력 (의존성 때문)
  return <button onClick={increment}>+</button>;
}

// ✅ 좋음: 리렌더링 없음
function GoodButton() {
  const actions = useStore((state) => state.actions);
  console.log('Button rendered'); // 마운트 시에만 출력
  return <button onClick={actions.increment}>+</button>;
}
```

## 3. 셀렉터 메모이제이션

### 복잡한 계산이 포함된 셀렉터

```typescript
// ❌ 나쁜 예: 매번 계산
function Component() {
  const expensiveValue = useStore((state) => {
    // 복잡한 계산
    return state.items
      .filter((item) => item.active)
      .map((item) => item.value)
      .reduce((sum, value) => sum + value, 0);
  });

  return <div>{expensiveValue}</div>;
}

// ✅ 좋은 예: 메모이제이션
import { useMemo } from 'react';

function Component() {
  const items = useStore((state) => state.items);

  const expensiveValue = useMemo(() => {
    return items
      .filter((item) => item.active)
      .map((item) => item.value)
      .reduce((sum, value) => sum + value, 0);
  }, [items]);

  return <div>{expensiveValue}</div>;
}

// ✅ 더 좋은 예: 스토어에서 계산
const useStore = create((set, get) => ({
  items: [],

  getActiveSum: () => {
    return get().items
      .filter((item) => item.active)
      .map((item) => item.value)
      .reduce((sum, value) => sum + value, 0);
  },
}));

function Component() {
  const getActiveSum = useStore((state) => state.getActiveSum);
  const activeSum = getActiveSum(); // 스토어 메서드 호출

  return <div>{activeSum}</div>;
}
```

## 4. 커스텀 훅으로 셀렉터 재사용

### 문제점

동일한 셀렉터 로직을 여러 컴포넌트에서 반복 작성하면 유지보수가 어렵습니다.

### ✅ 해결책: 커스텀 훅

```typescript
// hooks/useAuth.ts
export function useAuth() {
  const user = useStore((state) => state.user);
  const isAuthenticated = useStore((state) => !!state.user);
  const isAdmin = useStore((state) => state.user?.role === 'admin');

  return { user, isAuthenticated, isAdmin };
}

// hooks/useCart.ts
export function useCart() {
  const items = useStore((state) => state.cart.items);
  const total = useStore((state) =>
    state.cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  );

  return { items, total, itemCount: items.length };
}

// 컴포넌트에서 사용
function Header() {
  const { user, isAuthenticated } = useAuth();
  const { itemCount } = useCart();

  return (
    <header>
      {isAuthenticated && <span>Welcome, {user.name}</span>}
      <CartIcon count={itemCount} />
    </header>
  );
}
```

## 5. Shallow 비교 최적화

### useShallow 훅 사용

```typescript
import { useShallow } from 'zustand/react/shallow';

interface State {
  user: { name: string; email: string };
  settings: { theme: string; language: string };
}

const useStore = create<State>((set) => ({
  user: { name: 'John', email: 'john@example.com' },
  settings: { theme: 'light', language: 'en' },
}));

// ✅ useShallow로 객체 비교
function Component() {
  const { name, email } = useStore(
    useShallow((state) => ({
      name: state.user.name,
      email: state.user.email,
    }))
  );

  return <div>{name} ({email})</div>;
}

// ✅ 배열 비교에도 유용
function UserList() {
  const users = useStore(useShallow((state) => state.users));

  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

### 커스텀 Equality 함수

```typescript
// 깊은 비교가 필요한 경우
import isEqual from 'lodash/isEqual';

function Component() {
  const complexData = useStore(
    (state) => state.complexData,
    isEqual // 깊은 비교
  );

  return <div>{JSON.stringify(complexData)}</div>;
}

// 특정 필드만 비교
function customEqual(a, b) {
  return a.id === b.id && a.version === b.version;
}

function OptimizedComponent() {
  const data = useStore(
    (state) => state.data,
    customEqual
  );

  return <div>{data.content}</div>;
}
```

## 6. 스토어 분할

### 도메인별 스토어 분리

```typescript
// ❌ 나쁜 예: 하나의 거대한 스토어
const useStore = create((set) => ({
  // Auth
  user: null,
  token: null,
  login: () => {},
  logout: () => {},

  // Products
  products: [],
  fetchProducts: () => {},

  // Cart
  cart: [],
  addToCart: () => {},

  // UI
  theme: 'light',
  modal: null,
  // ... 계속 늘어남
}));

// ✅ 좋은 예: 도메인별 분리
// stores/authStore.ts
export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  login: async (credentials) => { /* ... */ },
  logout: () => set({ user: null, token: null }),
}));

// stores/productStore.ts
export const useProductStore = create((set) => ({
  products: [],
  isLoading: false,
  fetchProducts: async () => { /* ... */ },
}));

// stores/uiStore.ts
export const useUIStore = create((set) => ({
  theme: 'light',
  modal: null,
  toggleTheme: () => set((state) => ({
    theme: state.theme === 'light' ? 'dark' : 'light'
  })),
}));
```

### 성능 이점

- 각 스토어는 독립적으로 업데이트
- 관련 없는 컴포넌트는 리렌더링 안 됨
- 코드 분할(Code Splitting) 용이
- 번들 크기 최적화

## 7. Subscribe API로 외부 구독

### 컴포넌트 외부에서 상태 추적

```typescript
const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

// 컴포넌트가 아닌 곳에서 구독
const unsubscribe = useStore.subscribe(
  (state) => state.count,
  (count, previousCount) => {
    console.log('Count changed from', previousCount, 'to', count);

    // 예: Analytics 전송
    analytics.track('count_changed', { count });
  }
);

// 구독 해제
unsubscribe();
```

### 성능 최적화 활용

```typescript
// 특정 조건에서만 작동하는 side effect
useStore.subscribe(
  (state) => state.user,
  (user) => {
    if (user) {
      // 로그인 시에만 실행
      initializeUserTracking(user);
    }
  }
);

// 디바운싱된 저장
import { debounce } from 'lodash';

const debouncedSave = debounce((state) => {
  localStorage.setItem('draft', JSON.stringify(state.draft));
}, 1000);

useStore.subscribe(
  (state) => state.draft,
  debouncedSave
);
```

## 8. 리렌더링 디버깅

### React DevTools Profiler

```typescript
// 리렌더링 추적
function Component() {
  const count = useStore((state) => state.count);

  // 개발 모드에서만 실행
  if (process.env.NODE_ENV === 'development') {
    console.log('Component rendered with count:', count);
  }

  return <div>{count}</div>;
}
```

### 커스텀 디버깅 훅

```typescript
import { useEffect, useRef } from 'react';

function useWhyDidYouUpdate(name: string, props: any) {
  const previousProps = useRef<any>();

  useEffect(() => {
    if (previousProps.current) {
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      const changedProps: any = {};

      allKeys.forEach((key) => {
        if (previousProps.current[key] !== props[key]) {
          changedProps[key] = {
            from: previousProps.current[key],
            to: props[key],
          };
        }
      });

      if (Object.keys(changedProps).length > 0) {
        console.log('[why-did-you-update]', name, changedProps);
      }
    }

    previousProps.current = props;
  });
}

// 사용
function Component() {
  const count = useStore((state) => state.count);
  const user = useStore((state) => state.user);

  useWhyDidYouUpdate('Component', { count, user });

  return <div>{count}</div>;
}
```

## 9. 성능 측정

### 벤치마크 작성

```typescript
// 성능 측정 유틸리티
function measurePerformance(fn: () => void, label: string) {
  const start = performance.now();
  fn();
  const end = performance.now();
  console.log(`${label}: ${end - start}ms`);
}

// 스토어 업데이트 성능 측정
measurePerformance(() => {
  useStore.getState().updateManyItems(1000);
}, 'Update 1000 items');

// 셀렉터 성능 측정
measurePerformance(() => {
  const result = useStore.getState().getFilteredItems();
}, 'Filter items');
```

### React DevTools Profiler 통합

```typescript
import { Profiler } from 'react';

function App() {
  const onRenderCallback = (
    id,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime
  ) => {
    console.log(`${id} (${phase}) took ${actualDuration}ms`);
  };

  return (
    <Profiler id="App" onRender={onRenderCallback}>
      <YourComponents />
    </Profiler>
  );
}
```

## 10. 성능 체크리스트

### 필수 사항

- [ ] 전체 스토어 구독 대신 개별 셀렉터 사용
- [ ] 객체 반환 셀렉터에 `useShallow` 적용
- [ ] Actions를 별도 객체로 분리
- [ ] 도메인별로 스토어 분할
- [ ] 복잡한 계산은 메모이제이션

### 권장 사항

- [ ] 커스텀 훅으로 셀렉터 재사용
- [ ] 커스텀 equality 함수 적용 (필요시)
- [ ] React DevTools로 리렌더링 프로파일링
- [ ] 서버 상태는 TanStack Query로 분리
- [ ] Subscribe API로 side effect 최적화

### 고급 최적화

- [ ] 가상화(Virtualization)로 대량 리스트 렌더링
- [ ] Code Splitting으로 스토어 지연 로딩
- [ ] Web Workers로 무거운 계산 분리
- [ ] Debounce/Throttle로 빈번한 업데이트 제어

## 11. 성능 안티패턴

### 피해야 할 패턴

```typescript
// ❌ 1. 인라인 셀렉터에서 새 객체 생성
const data = useStore((state) => ({
  ...state.user,
  fullName: `${state.user.firstName} ${state.user.lastName}`,
}));

// ❌ 2. 셀렉터 내부에서 filter/map 남용
const filtered = useStore((state) =>
  state.items.filter(item => item.active) // 매번 새 배열
);

// ❌ 3. 모든 actions를 개별 구독
const increment = useStore((state) => state.increment);
const decrement = useStore((state) => state.decrement);
const reset = useStore((state) => state.reset);
// ... 계속

// ❌ 4. 거대한 단일 스토어
const useGlobalStore = create((set) => ({
  // 100개 이상의 상태와 액션
}));

// ❌ 5. Computed value를 상태에 저장
const useStore = create((set) => ({
  items: [],
  total: 0, // items에서 계산 가능한데 별도 저장
  addItem: (item) => set((state) => ({
    items: [...state.items, item],
    total: state.total + item.price, // 동기화 문제 발생 가능
  })),
}));
```

## 결론

Zustand의 성능 최적화는 **선택적 구독**, **Actions 분리**, **스토어 분할**의 조합으로 이루어집니다.

**핵심 원칙:**
1. 필요한 것만 선택
2. 불필요한 리렌더링 방지
3. 스토어를 논리적으로 분할
4. 지속적인 측정과 개선

적절한 최적화를 통해 수천 개의 업데이트와 복잡한 상태 관리도 원활하게 처리할 수 있습니다.
