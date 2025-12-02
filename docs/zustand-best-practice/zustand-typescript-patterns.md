# Zustand TypeScript 패턴 가이드

## 개요

Zustand는 TypeScript와 함께 사용할 때 강력한 타입 안전성을 제공합니다. 이 가이드는 TypeScript를 활용한 다양한 패턴과 best practices를 다룹니다.

## 1. 기본 타입 정의

### 방법 1: 타입 자동 추론

```typescript
import { create } from 'zustand';

// 타입이 자동으로 추론됨
const useStore = create((set) => ({
  count: 0,
  text: '',
  increment: () => set((state) => ({ count: state.count + 1 })),
  setText: (text: string) => set({ text }),
}));

// 사용 시 타입 자동 완성
const count = useStore((state) => state.count); // number
const text = useStore((state) => state.text); // string
```

### 방법 2: 명시적 타입 정의 (권장)

```typescript
import { create } from 'zustand';

interface BearState {
  bears: number;
  fish: number;
}

interface BearActions {
  increasePopulation: () => void;
  removeAllBears: () => void;
  addFish: (amount: number) => void;
}

type BearStore = BearState & BearActions;

export const useBearStore = create<BearStore>((set) => ({
  bears: 0,
  fish: 0,
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
  removeAllBears: () => set({ bears: 0 }),
  addFish: (amount) => set((state) => ({ fish: state.fish + amount })),
}));
```

### 방법 3: State와 Actions 분리

```typescript
import { create } from 'zustand';

interface CounterState {
  count: number;
  lastUpdated: Date | null;
}

interface CounterActions {
  increment: () => void;
  decrement: () => void;
  reset: () => void;
  setCount: (count: number) => void;
}

type CounterStore = CounterState & CounterActions;

export const useCounterStore = create<CounterStore>((set) => ({
  // State
  count: 0,
  lastUpdated: null,

  // Actions
  increment: () =>
    set((state) => ({
      count: state.count + 1,
      lastUpdated: new Date(),
    })),

  decrement: () =>
    set((state) => ({
      count: state.count - 1,
      lastUpdated: new Date(),
    })),

  reset: () => set({ count: 0, lastUpdated: new Date() }),

  setCount: (count) => set({ count, lastUpdated: new Date() }),
}));
```

## 2. 미들웨어와 함께 사용

### Persist 미들웨어

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  token: string | null;
}

interface AuthActions {
  login: (user: User, token: string) => void;
  logout: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,

      login: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

### DevTools 미들웨어

```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface TodoState {
  todos: Todo[];
}

interface TodoActions {
  addTodo: (text: string) => void;
  toggleTodo: (id: string) => void;
  removeTodo: (id: string) => void;
}

type TodoStore = TodoState & TodoActions;

export const useTodoStore = create<TodoStore>()(
  devtools(
    (set) => ({
      todos: [],

      addTodo: (text) =>
        set(
          (state) => ({
            todos: [
              ...state.todos,
              { id: Date.now().toString(), text, completed: false },
            ],
          }),
          false,
          'addTodo' // Action name for DevTools
        ),

      toggleTodo: (id) =>
        set(
          (state) => ({
            todos: state.todos.map((todo) =>
              todo.id === id ? { ...todo, completed: !todo.completed } : todo
            ),
          }),
          false,
          'toggleTodo'
        ),

      removeTodo: (id) =>
        set(
          (state) => ({
            todos: state.todos.filter((todo) => todo.id !== id),
          }),
          false,
          'removeTodo'
        ),
    }),
    { name: 'TodoStore' }
  )
);
```

### 여러 미들웨어 조합

```typescript
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface State {
  user: User | null;
  settings: Settings;
}

interface Actions {
  login: (user: User) => void;
  updateSettings: (settings: Partial<Settings>) => void;
}

type Store = State & Actions;

export const useStore = create<Store>()(
  devtools(
    persist(
      immer((set) => ({
        user: null,
        settings: { theme: 'light', language: 'en' },

        login: (user) =>
          set((state) => {
            state.user = user;
          }),

        updateSettings: (settings) =>
          set((state) => {
            Object.assign(state.settings, settings);
          }),
      })),
      { name: 'app-storage' }
    ),
    { name: 'AppStore' }
  )
);
```

## 3. Slices 패턴 타입 정의

### StateCreator 타입 사용

```typescript
import { StateCreator } from 'zustand';

// User Slice
interface UserSlice {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

export const createUserSlice: StateCreator<
  UserSlice & CartSlice & UISlice,
  [],
  [],
  UserSlice
> = (set) => ({
  user: null,
  login: (user) => set({ user }),
  logout: () => set({ user: null }),
});

// Cart Slice
interface CartSlice {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
}

export const createCartSlice: StateCreator<
  UserSlice & CartSlice & UISlice,
  [],
  [],
  CartSlice
> = (set, get) => ({
  items: [],
  addItem: (item) => set({ items: [...get().items, item] }),
  removeItem: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
});

// UI Slice
interface UISlice {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const createUISlice: StateCreator<
  UserSlice & CartSlice & UISlice,
  [],
  [],
  UISlice
> = (set, get) => ({
  theme: 'light',
  toggleTheme: () =>
    set({ theme: get().theme === 'light' ? 'dark' : 'light' }),
});

// Store
import { create } from 'zustand';

type StoreState = UserSlice & CartSlice & UISlice;

export const useStore = create<StoreState>()((...a) => ({
  ...createUserSlice(...a),
  ...createCartSlice(...a),
  ...createUISlice(...a),
}));
```

### 미들웨어와 함께 Slices

```typescript
import { StateCreator } from 'zustand';

// Middleware를 포함한 타입 정의
type Mutators = [['zustand/devtools', never], ['zustand/persist', unknown]];

interface AuthSlice {
  user: User | null;
  login: (user: User) => void;
}

export const createAuthSlice: StateCreator<
  AuthSlice & ProductSlice,
  Mutators,
  [],
  AuthSlice
> = (set) => ({
  user: null,
  login: (user) => set({ user }, false, 'auth/login'),
});

interface ProductSlice {
  products: Product[];
  fetchProducts: () => Promise<void>;
}

export const createProductSlice: StateCreator<
  AuthSlice & ProductSlice,
  Mutators,
  [],
  ProductSlice
> = (set) => ({
  products: [],
  fetchProducts: async () => {
    const products = await api.getProducts();
    set({ products }, false, 'products/fetch');
  },
});

// Store with middleware
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

type StoreState = AuthSlice & ProductSlice;

export const useStore = create<StoreState>()(
  devtools(
    persist(
      (...a) => ({
        ...createAuthSlice(...a),
        ...createProductSlice(...a),
      }),
      { name: 'app-storage' }
    ),
    { name: 'AppStore' }
  )
);
```

## 4. 고급 타입 패턴

### Generic Store

```typescript
interface ListState<T> {
  items: T[];
  isLoading: boolean;
  error: string | null;
}

interface ListActions<T> {
  setItems: (items: T[]) => void;
  addItem: (item: T) => void;
  removeItem: (predicate: (item: T) => boolean) => void;
  clear: () => void;
}

type ListStore<T> = ListState<T> & ListActions<T>;

function createListStore<T>() {
  return create<ListStore<T>>((set) => ({
    items: [],
    isLoading: false,
    error: null,

    setItems: (items) => set({ items }),
    addItem: (item) => set((state) => ({ items: [...state.items, item] })),
    removeItem: (predicate) =>
      set((state) => ({
        items: state.items.filter((item) => !predicate(item)),
      })),
    clear: () => set({ items: [] }),
  }));
}

// 사용
interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

export const useTodoStore = createListStore<Todo>();

interface User {
  id: number;
  name: string;
  email: string;
}

export const useUserStore = createListStore<User>();
```

### Conditional Types

```typescript
import { create } from 'zustand';

type Status = 'idle' | 'loading' | 'success' | 'error';

interface BaseState {
  status: Status;
}

interface IdleState extends BaseState {
  status: 'idle';
  data: null;
  error: null;
}

interface LoadingState extends BaseState {
  status: 'loading';
  data: null;
  error: null;
}

interface SuccessState<T> extends BaseState {
  status: 'success';
  data: T;
  error: null;
}

interface ErrorState extends BaseState {
  status: 'error';
  data: null;
  error: string;
}

type AsyncState<T> = IdleState | LoadingState | SuccessState<T> | ErrorState;

interface AsyncActions<T> {
  fetch: () => Promise<void>;
  reset: () => void;
}

type AsyncStore<T> = AsyncState<T> & AsyncActions<T>;

function createAsyncStore<T>(fetcher: () => Promise<T>) {
  return create<AsyncStore<T>>((set) => ({
    status: 'idle',
    data: null,
    error: null,

    fetch: async () => {
      set({ status: 'loading', data: null, error: null });

      try {
        const data = await fetcher();
        set({ status: 'success', data, error: null });
      } catch (error) {
        set({
          status: 'error',
          data: null,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },

    reset: () => set({ status: 'idle', data: null, error: null }),
  }));
}

// 사용
interface UserData {
  id: number;
  name: string;
}

export const useUserDataStore = createAsyncStore<UserData>(() =>
  fetch('/api/user').then((res) => res.json())
);
```

### Readonly State

```typescript
import { create } from 'zustand';

interface State {
  count: number;
  user: User | null;
}

interface Actions {
  increment: () => void;
  setUser: (user: User) => void;
}

// State는 읽기 전용으로
type Store = Readonly<State> & Actions;

export const useStore = create<Store>((set) => ({
  count: 0,
  user: null,

  increment: () => set((state) => ({ count: state.count + 1 })),
  setUser: (user) => set({ user }),
}));

// 사용 시 직접 수정 불가
function Component() {
  const store = useStore();

  // ✅ OK
  store.increment();

  // ❌ TypeScript Error: Cannot assign to 'count' because it is a read-only property
  // store.count = 10;
}
```

## 5. Selector 타입 안전성

### Typed Selectors

```typescript
import { create } from 'zustand';

interface User {
  id: number;
  name: string;
  email: string;
}

interface State {
  users: User[];
  currentUser: User | null;
}

interface Actions {
  addUser: (user: User) => void;
  setCurrentUser: (userId: number) => void;
}

type Store = State & Actions;

export const useStore = create<Store>((set, get) => ({
  users: [],
  currentUser: null,

  addUser: (user) => set((state) => ({ users: [...state.users, user] })),
  setCurrentUser: (userId) => {
    const user = get().users.find((u) => u.id === userId);
    set({ currentUser: user || null });
  },
}));

// Typed selector helpers
export const selectUsers = (state: Store) => state.users;
export const selectCurrentUser = (state: Store) => state.currentUser;
export const selectUserById = (userId: number) => (state: Store) =>
  state.users.find((u) => u.id === userId);

// 사용
function Component() {
  const users = useStore(selectUsers); // User[]
  const currentUser = useStore(selectCurrentUser); // User | null
  const specificUser = useStore(selectUserById(1)); // User | undefined
}
```

### Custom Hook with Selectors

```typescript
import { useStore } from '@/stores/userStore';

// 커스텀 훅으로 셀렉터 캡슐화
export function useCurrentUser() {
  return useStore((state) => state.currentUser);
}

export function useUserById(userId: number) {
  return useStore((state) => state.users.find((u) => u.id === userId));
}

export function useUserActions() {
  return useStore((state) => ({
    addUser: state.addUser,
    setCurrentUser: state.setCurrentUser,
  }));
}

// 사용
function Component() {
  const currentUser = useCurrentUser(); // User | null
  const user = useUserById(1); // User | undefined
  const { addUser } = useUserActions();
}
```

## 6. 에러 처리 타입

### Result Type

```typescript
import { create } from 'zustand';

type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

interface State {
  userData: Result<User, string> | null;
}

interface Actions {
  fetchUser: (userId: number) => Promise<void>;
}

type Store = State & Actions;

export const useStore = create<Store>((set) => ({
  userData: null,

  fetchUser: async (userId) => {
    try {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }

      const data = await response.json();
      set({ userData: { success: true, data } });
    } catch (error) {
      set({
        userData: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  },
}));

// 사용
function Component() {
  const userData = useStore((state) => state.userData);

  if (!userData) return <div>No data</div>;

  if (userData.success) {
    return <div>{userData.data.name}</div>; // Type: User
  } else {
    return <div>Error: {userData.error}</div>; // Type: string
  }
}
```

## 7. 유틸리티 타입

### Store Type Helpers

```typescript
import { StoreApi, UseBoundStore } from 'zustand';

// Store에서 State만 추출
type ExtractState<S> = S extends {
  getState: () => infer T;
}
  ? T
  : never;

// 사용
type UserStoreState = ExtractState<typeof useUserStore>;

// Store에서 Actions만 추출
type ExtractActions<S> = {
  [K in keyof S]: S[K] extends (...args: any[]) => any ? S[K] : never;
};

// 사용
type UserStoreActions = ExtractActions<UserStoreState>;
```

## 8. 테스트를 위한 타입

### Mock Store

```typescript
import { create, StoreApi, UseBoundStore } from 'zustand';

type StoreType<T> = UseBoundStore<StoreApi<T>>;

export function createMockStore<T>(initialState: T): StoreType<T> {
  return create<T>(() => initialState);
}

// 테스트에서 사용
import { createMockStore } from './test-utils';

describe('Component', () => {
  it('should render user name', () => {
    const mockStore = createMockStore<UserStore>({
      user: { id: 1, name: 'John' },
      login: vi.fn(),
      logout: vi.fn(),
    });

    // 테스트...
  });
});
```

## 결론

Zustand의 TypeScript 패턴 핵심:

1. **명시적 타입 정의** - State와 Actions 분리
2. **StateCreator** - Slices 패턴에 활용
3. **Generic Types** - 재사용 가능한 스토어
4. **Type Helpers** - 유틸리티 타입 활용
5. **Type Safety** - 런타임 에러 방지

**권장사항:**
- 작은 프로젝트: 타입 자동 추론
- 중형 프로젝트: 명시적 타입 정의
- 대형 프로젝트: Slices + StateCreator
