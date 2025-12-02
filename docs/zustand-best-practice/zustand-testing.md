# Zustand 테스팅 가이드

## 개요

Zustand 스토어를 효과적으로 테스트하는 방법을 다룹니다. Unit 테스트, Integration 테스트, 그리고 E2E 테스트 전략을 포함합니다.

## 1. 테스트 환경 설정

### 필요한 패키지

```bash
# Vitest 사용
npm install -D vitest @testing-library/react @testing-library/jest-dom

# Jest 사용
npm install -D jest @testing-library/react @testing-library/jest-dom
```

### Vitest 설정

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './test/setup.ts',
  },
});
```

### 테스트 Setup

```typescript
// test/setup.ts
import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// 각 테스트 후 자동 정리
afterEach(() => {
  cleanup();
});
```

## 2. Unit 테스트 - 스토어 직접 테스트

### 기본 스토어 테스트

```typescript
// stores/counterStore.ts
import { create } from 'zustand';

interface CounterState {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}

export const useCounterStore = create<CounterState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}));

// stores/counterStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useCounterStore } from './counterStore';

describe('Counter Store', () => {
  beforeEach(() => {
    // 각 테스트 전 스토어 초기화
    useCounterStore.setState({ count: 0 });
  });

  it('should have initial count of 0', () => {
    const { count } = useCounterStore.getState();
    expect(count).toBe(0);
  });

  it('should increment count', () => {
    useCounterStore.getState().increment();
    expect(useCounterStore.getState().count).toBe(1);
  });

  it('should decrement count', () => {
    useCounterStore.setState({ count: 5 });
    useCounterStore.getState().decrement();
    expect(useCounterStore.getState().count).toBe(4);
  });

  it('should reset count to 0', () => {
    useCounterStore.setState({ count: 10 });
    useCounterStore.getState().reset();
    expect(useCounterStore.getState().count).toBe(0);
  });
});
```

### 비동기 Actions 테스트

```typescript
// stores/userStore.ts
import { create } from 'zustand';

interface User {
  id: number;
  name: string;
}

interface UserState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  fetchUser: (id: number) => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isLoading: false,
  error: null,

  fetchUser: async (id) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`/api/users/${id}`);
      if (!response.ok) throw new Error('Failed to fetch user');

      const user = await response.json();
      set({ user, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false,
      });
    }
  },
}));

// stores/userStore.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useUserStore } from './userStore';

// Fetch Mock
global.fetch = vi.fn();

describe('User Store', () => {
  beforeEach(() => {
    useUserStore.setState({ user: null, isLoading: false, error: null });
    vi.clearAllMocks();
  });

  it('should fetch user successfully', async () => {
    const mockUser = { id: 1, name: 'John Doe' };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUser,
    });

    await useUserStore.getState().fetchUser(1);

    const state = useUserStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should handle fetch error', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
    });

    await useUserStore.getState().fetchUser(1);

    const state = useUserStore.getState();
    expect(state.user).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe('Failed to fetch user');
  });

  it('should set loading state', async () => {
    let resolvePromise: any;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    (global.fetch as any).mockReturnValueOnce(promise);

    const fetchPromise = useUserStore.getState().fetchUser(1);

    // 로딩 중 상태 확인
    expect(useUserStore.getState().isLoading).toBe(true);

    resolvePromise({ ok: true, json: async () => ({ id: 1, name: 'John' }) });
    await fetchPromise;

    // 로딩 완료 상태 확인
    expect(useUserStore.getState().isLoading).toBe(false);
  });
});
```

## 3. React 컴포넌트 테스트

### renderHook 사용

```typescript
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useCounterStore } from './counterStore';

describe('Counter Store with renderHook', () => {
  beforeEach(() => {
    useCounterStore.setState({ count: 0 });
  });

  it('should increment count', () => {
    const { result } = renderHook(() => useCounterStore());

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });

  it('should subscribe to count changes', () => {
    const { result } = renderHook(() =>
      useCounterStore((state) => state.count)
    );

    expect(result.current).toBe(0);

    act(() => {
      useCounterStore.getState().increment();
    });

    expect(result.current).toBe(1);
  });
});
```

### 컴포넌트 통합 테스트

```typescript
// components/Counter.tsx
import { useCounterStore } from '@/stores/counterStore';

export function Counter() {
  const { count, increment, decrement, reset } = useCounterStore();

  return (
    <div>
      <h1>Count: {count}</h1>
      <button onClick={increment}>Increment</button>
      <button onClick={decrement}>Decrement</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}

// components/Counter.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { Counter } from './Counter';
import { useCounterStore } from '@/stores/counterStore';

describe('Counter Component', () => {
  beforeEach(() => {
    useCounterStore.setState({ count: 0 });
  });

  it('should render initial count', () => {
    render(<Counter />);
    expect(screen.getByText('Count: 0')).toBeInTheDocument();
  });

  it('should increment count when button clicked', async () => {
    const user = userEvent.setup();
    render(<Counter />);

    await user.click(screen.getByText('Increment'));

    expect(screen.getByText('Count: 1')).toBeInTheDocument();
  });

  it('should decrement count when button clicked', async () => {
    const user = userEvent.setup();
    useCounterStore.setState({ count: 5 });
    render(<Counter />);

    await user.click(screen.getByText('Decrement'));

    expect(screen.getByText('Count: 4')).toBeInTheDocument();
  });

  it('should reset count when reset button clicked', async () => {
    const user = userEvent.setup();
    useCounterStore.setState({ count: 10 });
    render(<Counter />);

    await user.click(screen.getByText('Reset'));

    expect(screen.getByText('Count: 0')).toBeInTheDocument();
  });
});
```

## 4. 스토어 리셋 패턴

### 자동 리셋 유틸리티

```typescript
// test/utils/resetStores.ts
import { create, StoreApi, UseBoundStore } from 'zustand';

const storesResetFns = new Set<() => void>();

export const createResetStore = <T>(
  createState: Parameters<typeof create<T>>[0]
) => {
  const store = create<T>(createState);
  const initialState = store.getState();

  storesResetFns.add(() => {
    store.setState(initialState, true);
  });

  return store;
};

export const resetAllStores = () => {
  storesResetFns.forEach((resetFn) => {
    resetFn();
  });
};

// test/setup.ts에 추가
import { afterEach } from 'vitest';
import { resetAllStores } from './utils/resetStores';

afterEach(() => {
  resetAllStores();
});

// stores/counterStore.ts
import { createResetStore } from '@/test/utils/resetStores';

export const useCounterStore = createResetStore<CounterState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));
```

### Factory 패턴

```typescript
// stores/counterStore.ts
import { create } from 'zustand';

export const createCounterStore = (initialCount = 0) => {
  return create<CounterState>((set) => ({
    count: initialCount,
    increment: () => set((state) => ({ count: state.count + 1 })),
    decrement: () => set((state) => ({ count: state.count - 1 })),
    reset: () => set({ count: initialCount }),
  }));
};

// 프로덕션에서 사용
export const useCounterStore = createCounterStore(0);

// 테스트에서 사용
import { createCounterStore } from './counterStore';

describe('Counter Store', () => {
  it('should start with custom initial value', () => {
    const store = createCounterStore(10);
    expect(store.getState().count).toBe(10);
  });

  it('should increment from initial value', () => {
    const store = createCounterStore(5);
    store.getState().increment();
    expect(store.getState().count).toBe(6);
  });
});
```

## 5. Mock 스토어

### 테스트용 Mock Store 생성

```typescript
// test/mocks/stores.ts
import { create } from 'zustand';

export const createMockStore = <T extends object>(initialState: T) => {
  return create<T>(() => initialState);
};

// 사용
import { createMockStore } from '@/test/mocks/stores';
import { UserState } from '@/stores/userStore';

describe('Component with User Store', () => {
  it('should render user name', () => {
    const mockUserStore = createMockStore<UserState>({
      user: { id: 1, name: 'John Doe' },
      isLoading: false,
      error: null,
      fetchUser: vi.fn(),
    });

    // mockUserStore를 컴포넌트에 주입하여 테스트
  });
});
```

### Provider 패턴으로 Mock 주입

```typescript
// components/UserProfile.tsx
import { createContext, useContext } from 'react';
import { useUserStore as useUserStoreOriginal } from '@/stores/userStore';

const UserStoreContext = createContext(useUserStoreOriginal);

export const UserStoreProvider = UserStoreContext.Provider;

export function useUserStore() {
  return useContext(UserStoreContext);
}

export function UserProfile() {
  const { user } = useUserStore();
  return <div>{user?.name}</div>;
}

// components/UserProfile.test.tsx
import { render, screen } from '@testing-library/react';
import { UserProfile, UserStoreProvider } from './UserProfile';
import { createMockStore } from '@/test/mocks/stores';

describe('UserProfile', () => {
  it('should render user name from mock store', () => {
    const mockStore = createMockStore({
      user: { id: 1, name: 'Test User' },
      isLoading: false,
      error: null,
      fetchUser: vi.fn(),
    });

    render(
      <UserStoreProvider value={mockStore}>
        <UserProfile />
      </UserStoreProvider>
    );

    expect(screen.getByText('Test User')).toBeInTheDocument();
  });
});
```

## 6. Persist 미들웨어 테스트

### LocalStorage Mock

```typescript
// test/mocks/localStorage.ts
export const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
  };
})();

// test/setup.ts
import { localStorageMock } from './mocks/localStorage';

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

beforeEach(() => {
  localStorageMock.clear();
});
```

### Persist 테스트

```typescript
// stores/authStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';
import { localStorageMock } from '@/test/mocks/localStorage';

describe('Auth Store with Persist', () => {
  beforeEach(() => {
    localStorageMock.clear();
    useAuthStore.setState({ user: null, token: null });
  });

  it('should persist token to localStorage', () => {
    const user = { id: 1, name: 'John' };
    const token = 'abc123';

    useAuthStore.getState().login(user, token);

    const stored = localStorageMock.getItem('auth-storage');
    expect(stored).toBeTruthy();

    const parsed = JSON.parse(stored!);
    expect(parsed.state.token).toBe(token);
  });

  it('should rehydrate from localStorage', async () => {
    // localStorage에 데이터 미리 저장
    const mockData = {
      state: {
        user: { id: 1, name: 'John' },
        token: 'abc123',
      },
      version: 0,
    };

    localStorageMock.setItem('auth-storage', JSON.stringify(mockData));

    // Rehydrate
    await useAuthStore.persist.rehydrate();

    const state = useAuthStore.getState();
    expect(state.token).toBe('abc123');
    expect(state.user).toEqual({ id: 1, name: 'John' });
  });
});
```

## 7. 테스트 베스트 프랙티스

### AAA 패턴 (Arrange-Act-Assert)

```typescript
describe('Todo Store', () => {
  it('should add todo', () => {
    // Arrange - 테스트 준비
    const todoText = 'Buy milk';
    const initialCount = useTodoStore.getState().todos.length;

    // Act - 동작 실행
    useTodoStore.getState().addTodo(todoText);

    // Assert - 결과 검증
    const state = useTodoStore.getState();
    expect(state.todos).toHaveLength(initialCount + 1);
    expect(state.todos[state.todos.length - 1].text).toBe(todoText);
  });
});
```

### 격리된 테스트

```typescript
// ❌ 나쁜 예: 테스트 간 의존성
describe('Counter Store', () => {
  it('should increment', () => {
    useCounterStore.getState().increment();
    expect(useCounterStore.getState().count).toBe(1);
  });

  it('should increment again', () => {
    // 이전 테스트에 의존!
    useCounterStore.getState().increment();
    expect(useCounterStore.getState().count).toBe(2); // 실패 가능
  });
});

// ✅ 좋은 예: 독립적인 테스트
describe('Counter Store', () => {
  beforeEach(() => {
    useCounterStore.setState({ count: 0 });
  });

  it('should increment from 0', () => {
    useCounterStore.getState().increment();
    expect(useCounterStore.getState().count).toBe(1);
  });

  it('should increment from 0 again', () => {
    useCounterStore.getState().increment();
    expect(useCounterStore.getState().count).toBe(1);
  });
});
```

### 의미 있는 테스트 이름

```typescript
// ❌ 나쁜 예
it('test 1', () => { /* ... */ });
it('works', () => { /* ... */ });

// ✅ 좋은 예
it('should increment count when increment is called', () => { /* ... */ });
it('should set loading to true while fetching data', () => { /* ... */ });
it('should handle network errors gracefully', () => { /* ... */ });
```

## 8. 통합 테스트 예제

### 여러 스토어 상호작용

```typescript
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';

describe('Auth and Cart Integration', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, token: null });
    useCartStore.setState({ items: [] });
  });

  it('should clear cart when user logs out', () => {
    // 장바구니에 아이템 추가
    useCartStore.getState().addItem({ id: 1, name: 'Product' });
    expect(useCartStore.getState().items).toHaveLength(1);

    // 사용자 로그인
    useAuthStore.getState().login({ id: 1, name: 'John' }, 'token');

    // 로그아웃 시 장바구니 초기화
    useAuthStore.getState().logout();

    // 구독이나 이벤트 핸들러로 장바구니가 비워졌는지 확인
    expect(useCartStore.getState().items).toHaveLength(0);
  });
});
```

## 9. Coverage 목표

### 권장 Coverage

- **Statements**: 80% 이상
- **Branches**: 75% 이상
- **Functions**: 80% 이상
- **Lines**: 80% 이상

### Coverage 실행

```bash
# Vitest
vitest --coverage

# Jest
jest --coverage
```

## 결론

Zustand 테스팅의 핵심:

1. **각 테스트 전 스토어 초기화**
2. **비동기 작업은 Mock 활용**
3. **독립적인 테스트 작성**
4. **AAA 패턴 준수**
5. **의미 있는 테스트 이름**

**테스트 계층:**
- Unit Tests: 스토어 로직
- Integration Tests: 컴포넌트 + 스토어
- E2E Tests: 전체 플로우
