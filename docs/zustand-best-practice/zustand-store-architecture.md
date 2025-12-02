# Zustand 스토어 아키텍처 가이드

## 개요

효과적인 스토어 아키텍처는 확장 가능하고 유지보수가 쉬운 애플리케이션을 만드는 핵심입니다. 이 가이드는 Zustand 스토어를 구조화하는 다양한 패턴과 best practices를 다룹니다.

## 1. 단일 스토어 vs 다중 스토어

### 공식 권장사항

Zustand는 Redux와 달리 **여러 개의 작은 스토어**를 권장합니다.

### 다중 스토어 패턴 (권장)

#### ✅ 도메인별 분리

```typescript
// stores/authStore.ts
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: async (credentials) => {
    const { user, token } = await authAPI.login(credentials);
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    set({ user: null, token: null, isAuthenticated: false });
  },
}));

// stores/productStore.ts
export const useProductStore = create<ProductState>((set) => ({
  products: [],
  isLoading: false,
  error: null,

  fetchProducts: async () => {
    set({ isLoading: true, error: null });
    try {
      const products = await productAPI.getAll();
      set({ products, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },
}));

// stores/cartStore.ts
export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItem: (product) => {
    const items = get().items;
    const existingItem = items.find((item) => item.id === product.id);

    if (existingItem) {
      set({
        items: items.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ),
      });
    } else {
      set({ items: [...items, { ...product, quantity: 1 }] });
    }
  },

  removeItem: (productId) => {
    set({ items: get().items.filter((item) => item.id !== productId) });
  },

  getTotal: () => {
    return get().items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  },
}));

// stores/uiStore.ts
export const useUIStore = create<UIState>((set) => ({
  theme: 'light',
  sidebarOpen: false,
  modal: null,

  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === 'light' ? 'dark' : 'light',
    })),

  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  openModal: (modal) => set({ modal }),
  closeModal: () => set({ modal: null }),
}));
```

#### 장점

- 관심사의 분리 (Separation of Concerns)
- 독립적인 업데이트 (성능 최적화)
- 코드 분할 용이
- 테스트 용이성
- 재사용성

#### 사용 예제

```typescript
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { useUIStore } from '@/stores/uiStore';

function Header() {
  const user = useAuthStore((state) => state.user);
  const cartItems = useCartStore((state) => state.items);
  const theme = useUIStore((state) => state.theme);

  return (
    <header className={theme}>
      <span>Welcome, {user?.name}</span>
      <CartIcon count={cartItems.length} />
    </header>
  );
}
```

### 단일 스토어 패턴 (Slices)

대규모 애플리케이션에서 관련된 상태를 하나의 스토어로 관리하되, 슬라이스로 분할할 수 있습니다.

#### 슬라이스 정의

```typescript
// stores/slices/authSlice.ts
import { StateCreator } from 'zustand';

export interface AuthSlice {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => void;
}

export const createAuthSlice: StateCreator<
  AuthSlice & ProductSlice & CartSlice,
  [],
  [],
  AuthSlice
> = (set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: async (credentials) => {
    const { user, token } = await authAPI.login(credentials);
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    set({ user: null, token: null, isAuthenticated: false });
  },
});

// stores/slices/productSlice.ts
export interface ProductSlice {
  products: Product[];
  isLoading: boolean;
  fetchProducts: () => Promise<void>;
}

export const createProductSlice: StateCreator<
  AuthSlice & ProductSlice & CartSlice,
  [],
  [],
  ProductSlice
> = (set) => ({
  products: [],
  isLoading: false,

  fetchProducts: async () => {
    set({ isLoading: true });
    const products = await productAPI.getAll();
    set({ products, isLoading: false });
  },
});

// stores/slices/cartSlice.ts
export interface CartSlice {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (id: string) => void;
}

export const createCartSlice: StateCreator<
  AuthSlice & ProductSlice & CartSlice,
  [],
  [],
  CartSlice
> = (set, get) => ({
  items: [],

  addItem: (product) => {
    const items = get().items;
    const existingItem = items.find((item) => item.id === product.id);

    if (existingItem) {
      set({
        items: items.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ),
      });
    } else {
      set({ items: [...items, { ...product, quantity: 1 }] });
    }
  },

  removeItem: (id) => {
    set({ items: get().items.filter((item) => item.id !== id) });
  },
});

// stores/index.ts
import { create } from 'zustand';
import { createAuthSlice, AuthSlice } from './slices/authSlice';
import { createProductSlice, ProductSlice } from './slices/productSlice';
import { createCartSlice, CartSlice } from './slices/cartSlice';

type StoreState = AuthSlice & ProductSlice & CartSlice;

export const useStore = create<StoreState>()((...a) => ({
  ...createAuthSlice(...a),
  ...createProductSlice(...a),
  ...createCartSlice(...a),
}));
```

#### 사용 예제

```typescript
import { useStore } from '@/stores';

function Component() {
  // 단일 스토어에서 여러 슬라이스 사용
  const user = useStore((state) => state.user);
  const products = useStore((state) => state.products);
  const cartItems = useStore((state) => state.items);

  return <div>...</div>;
}
```

### 선택 기준

| 기준 | 다중 스토어 | 슬라이스 패턴 |
|------|-----------|-------------|
| 프로젝트 크기 | 소~중형 | 중~대형 |
| 복잡도 | 낮음 | 중간 |
| 코드 분할 | 쉬움 | 어려움 |
| 타입 안전성 | 우수 | 복잡 |
| 재사용성 | 높음 | 중간 |
| 스토어 간 통신 | 명시적 | 쉬움 |

## 2. Actions 패턴

### 옵션 1: Inline Actions

```typescript
const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}));
```

### 옵션 2: Actions 객체 분리 (권장)

```typescript
const useStore = create((set) => ({
  // State
  count: 0,
  user: null,

  // Actions
  actions: {
    increment: () => set((state) => ({ count: state.count + 1 })),
    decrement: () => set((state) => ({ count: state.count - 1 })),
    setUser: (user) => set({ user }),
  },
}));

// 사용
function Component() {
  const count = useStore((state) => state.count);
  const actions = useStore((state) => state.actions);

  return <button onClick={actions.increment}>{count}</button>;
}
```

### 옵션 3: Separate Actions File

```typescript
// stores/counterStore.ts
export interface CounterState {
  count: number;
}

export const initialState: CounterState = {
  count: 0,
};

// stores/counterActions.ts
import { StoreApi } from 'zustand';
import { CounterState } from './counterStore';

export const createActions = (
  set: StoreApi<CounterState>['setState'],
  get: StoreApi<CounterState>['getState']
) => ({
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
});

// stores/index.ts
import { create } from 'zustand';
import { initialState } from './counterStore';
import { createActions } from './counterActions';

export const useCounterStore = create((set, get) => ({
  ...initialState,
  ...createActions(set, get),
}));
```

## 3. 스토어 간 통신

### 패턴 1: 직접 참조

```typescript
// stores/authStore.ts
export const useAuthStore = create((set) => ({
  user: null,
  logout: () => {
    set({ user: null });

    // 다른 스토어 초기화
    useCartStore.getState().clearCart();
    useUIStore.getState().closeModal();
  },
}));

// stores/cartStore.ts
export const useCartStore = create((set) => ({
  items: [],
  clearCart: () => set({ items: [] }),
}));
```

### 패턴 2: Subscribe API

```typescript
// stores/authStore.ts
export const useAuthStore = create((set) => ({
  user: null,
  logout: () => set({ user: null }),
}));

// stores/cartStore.ts
export const useCartStore = create((set) => ({
  items: [],
  clearCart: () => set({ items: [] }),
}));

// 초기화 코드
useAuthStore.subscribe(
  (state) => state.user,
  (user) => {
    if (!user) {
      // 로그아웃 시 장바구니 초기화
      useCartStore.getState().clearCart();
    }
  }
);
```

### 패턴 3: Event Bus

```typescript
// lib/eventBus.ts
type EventCallback = (data?: any) => void;

class EventBus {
  private events: Map<string, EventCallback[]> = new Map();

  on(event: string, callback: EventCallback) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(callback);
  }

  off(event: string, callback: EventCallback) {
    const callbacks = this.events.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event: string, data?: any) {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }
}

export const eventBus = new EventBus();

// stores/authStore.ts
import { eventBus } from '@/lib/eventBus';

export const useAuthStore = create((set) => ({
  user: null,
  logout: () => {
    set({ user: null });
    eventBus.emit('user:logout');
  },
}));

// stores/cartStore.ts
import { eventBus } from '@/lib/eventBus';

export const useCartStore = create((set) => ({
  items: [],
  clearCart: () => set({ items: [] }),
}));

// 초기화
eventBus.on('user:logout', () => {
  useCartStore.getState().clearCart();
});
```

## 4. 폴더 구조

### 옵션 1: Flat Structure (소규모)

```
src/
├── stores/
│   ├── authStore.ts
│   ├── productStore.ts
│   ├── cartStore.ts
│   └── uiStore.ts
├── components/
└── pages/
```

### 옵션 2: Feature-based (중규모)

```
src/
├── features/
│   ├── auth/
│   │   ├── stores/
│   │   │   └── authStore.ts
│   │   ├── components/
│   │   └── hooks/
│   ├── products/
│   │   ├── stores/
│   │   │   └── productStore.ts
│   │   ├── components/
│   │   └── hooks/
│   └── cart/
│       ├── stores/
│       │   └── cartStore.ts
│       ├── components/
│       └── hooks/
```

### 옵션 3: Layered (대규모)

```
src/
├── stores/
│   ├── slices/
│   │   ├── authSlice.ts
│   │   ├── productSlice.ts
│   │   ├── cartSlice.ts
│   │   └── uiSlice.ts
│   ├── middleware/
│   │   ├── logger.ts
│   │   └── analytics.ts
│   ├── types/
│   │   └── index.ts
│   └── index.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useCart.ts
│   └── useProducts.ts
├── components/
└── pages/
```

### 옵션 4: Domain-Driven Design

```
src/
├── domains/
│   ├── auth/
│   │   ├── store.ts
│   │   ├── types.ts
│   │   ├── api.ts
│   │   ├── hooks.ts
│   │   └── components/
│   ├── products/
│   │   ├── store.ts
│   │   ├── types.ts
│   │   ├── api.ts
│   │   ├── hooks.ts
│   │   └── components/
│   └── cart/
│       ├── store.ts
│       ├── types.ts
│       ├── hooks.ts
│       └── components/
└── shared/
    ├── stores/
    │   └── uiStore.ts
    ├── components/
    └── hooks/
```

## 5. 상태 정규화 (Normalization)

### 문제: 중첩된 데이터

```typescript
// ❌ 나쁜 예: 비정규화된 데이터
const useStore = create((set) => ({
  posts: [
    {
      id: 1,
      title: 'Post 1',
      author: { id: 1, name: 'John' },
      comments: [
        { id: 1, text: 'Comment 1', author: { id: 2, name: 'Jane' } },
      ],
    },
  ],
}));
```

### ✅ 해결: 정규화된 구조

```typescript
interface NormalizedState {
  users: Record<string, User>;
  posts: Record<string, Post>;
  comments: Record<string, Comment>;
}

const useStore = create<NormalizedState>((set, get) => ({
  users: {
    '1': { id: '1', name: 'John' },
    '2': { id: '2', name: 'Jane' },
  },
  posts: {
    '1': {
      id: '1',
      title: 'Post 1',
      authorId: '1',
      commentIds: ['1'],
    },
  },
  comments: {
    '1': {
      id: '1',
      text: 'Comment 1',
      authorId: '2',
    },
  },

  // Selectors
  getPostWithAuthor: (postId: string) => {
    const state = get();
    const post = state.posts[postId];
    if (!post) return null;

    return {
      ...post,
      author: state.users[post.authorId],
    };
  },
}));
```

## 6. 초기화 패턴

### 비동기 초기화

```typescript
const useStore = create((set) => ({
  isInitialized: false,
  config: null,

  initialize: async () => {
    const config = await fetchConfig();
    const userData = await fetchUserData();

    set({
      config,
      user: userData,
      isInitialized: true,
    });
  },
}));

// App.tsx
function App() {
  const { isInitialized, initialize } = useStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!isInitialized) return <LoadingScreen />;

  return <MainApp />;
}
```

### 조건부 초기화

```typescript
const useStore = create((set, get) => ({
  data: null,
  lastFetch: null,

  fetchIfNeeded: async () => {
    const { lastFetch } = get();
    const now = Date.now();
    const CACHE_TIME = 5 * 60 * 1000; // 5분

    if (lastFetch && now - lastFetch < CACHE_TIME) {
      return; // 캐시 사용
    }

    const data = await fetchData();
    set({ data, lastFetch: now });
  },
}));
```

## 결론

효과적인 Zustand 스토어 아키텍처의 핵심:

1. **도메인별 분리** - 관련된 상태를 그룹화
2. **Actions 패턴** - 일관된 업데이트 방식
3. **정규화** - 복잡한 데이터 구조 단순화
4. **명확한 폴더 구조** - 프로젝트 규모에 맞게

**선택 가이드:**
- 소규모: 다중 스토어 + Flat Structure
- 중규모: 다중 스토어 + Feature-based
- 대규모: 슬라이스 패턴 + DDD Structure
