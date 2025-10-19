# Zustand Next.js 통합 가이드

## 개요

Next.js 14/15의 App Router와 React Server Components에서 Zustand를 안전하게 사용하는 방법을 다룹니다.

## 1. 핵심 규칙

### React Server Components의 제약사항

**중요:** 다음 규칙을 반드시 준수해야 합니다.

1. **RSC에서 Zustand 사용 금지**
   - Server Components는 hooks를 사용할 수 없음
   - 전역 스토어는 요청 간 공유되어 데이터 누출 위험

2. **전역 스토어를 서버에서 사용하지 말 것**
   - 서버 환경에서 전역 변수는 모든 요청이 공유
   - 사용자 A의 데이터가 사용자 B에게 노출될 수 있음

3. **Store Provider 패턴 사용 (권장)**
   - 요청별로 독립적인 스토어 생성
   - 데이터 격리 보장

## 2. Client Components에서 사용

### 기본 패턴

```typescript
// stores/counterStore.ts
import { create } from 'zustand';

interface CounterState {
  count: number;
  increment: () => void;
  decrement: () => void;
}

export const useCounterStore = create<CounterState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}));

// components/Counter.tsx
'use client'; // ✅ Client Component로 표시

import { useCounterStore } from '@/stores/counterStore';

export function Counter() {
  const { count, increment, decrement } = useCounterStore();

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
    </div>
  );
}

// app/page.tsx (Server Component)
import { Counter } from '@/components/Counter';

export default function Page() {
  return (
    <div>
      <h1>My App</h1>
      <Counter /> {/* Client Component 사용 */}
    </div>
  );
}
```

## 3. Store Provider 패턴 (권장)

### 왜 필요한가?

- Next.js App Router에서 안전한 상태 관리
- 요청별로 독립적인 스토어 인스턴스
- SSR 지원
- 데이터 누출 방지

### 구현 방법

```typescript
// stores/counter-store-provider.tsx
'use client';

import { createContext, useRef, useContext, type ReactNode } from 'react';
import { createStore, useStore } from 'zustand';

// Store 타입 정의
interface CounterStore {
  count: number;
  increment: () => void;
  decrement: () => void;
}

// Store 생성 함수
function createCounterStore(initialCount: number = 0) {
  return createStore<CounterStore>((set) => ({
    count: initialCount,
    increment: () => set((state) => ({ count: state.count + 1 })),
    decrement: () => set((state) => ({ count: state.count - 1 })),
  }));
}

// Context 생성
type CounterStoreApi = ReturnType<typeof createCounterStore>;
const CounterStoreContext = createContext<CounterStoreApi | undefined>(undefined);

// Provider 컴포넌트
interface CounterStoreProviderProps {
  children: ReactNode;
  initialCount?: number;
}

export function CounterStoreProvider({
  children,
  initialCount = 0,
}: CounterStoreProviderProps) {
  const storeRef = useRef<CounterStoreApi>();

  if (!storeRef.current) {
    storeRef.current = createCounterStore(initialCount);
  }

  return (
    <CounterStoreContext.Provider value={storeRef.current}>
      {children}
    </CounterStoreContext.Provider>
  );
}

// Hook
export function useCounterStore<T>(selector: (state: CounterStore) => T): T {
  const store = useContext(CounterStoreContext);

  if (!store) {
    throw new Error('useCounterStore must be used within CounterStoreProvider');
  }

  return useStore(store, selector);
}
```

### Provider 사용

```typescript
// app/layout.tsx
import { CounterStoreProvider } from '@/stores/counter-store-provider';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CounterStoreProvider initialCount={0}>
          {children}
        </CounterStoreProvider>
      </body>
    </html>
  );
}

// components/Counter.tsx
'use client';

import { useCounterStore } from '@/stores/counter-store-provider';

export function Counter() {
  const count = useCounterStore((state) => state.count);
  const increment = useCounterStore((state) => state.increment);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>Increment</button>
    </div>
  );
}
```

## 4. SSR과 Hydration

### 서버에서 초기 상태 설정

```typescript
// stores/user-store-provider.tsx
'use client';

import { createContext, useRef, useContext, type ReactNode } from 'react';
import { createStore, useStore } from 'zustand';

interface User {
  id: number;
  name: string;
}

interface UserStore {
  user: User | null;
  setUser: (user: User | null) => void;
}

function createUserStore(initialUser: User | null = null) {
  return createStore<UserStore>((set) => ({
    user: initialUser,
    setUser: (user) => set({ user }),
  }));
}

type UserStoreApi = ReturnType<typeof createUserStore>;
const UserStoreContext = createContext<UserStoreApi | undefined>(undefined);

interface UserStoreProviderProps {
  children: ReactNode;
  initialUser?: User | null;
}

export function UserStoreProvider({
  children,
  initialUser = null,
}: UserStoreProviderProps) {
  const storeRef = useRef<UserStoreApi>();

  if (!storeRef.current) {
    storeRef.current = createUserStore(initialUser);
  }

  return (
    <UserStoreContext.Provider value={storeRef.current}>
      {children}
    </UserStoreContext.Provider>
  );
}

export function useUserStore<T>(selector: (state: UserStore) => T): T {
  const store = useContext(UserStoreContext);
  if (!store) throw new Error('Missing UserStoreProvider');
  return useStore(store, selector);
}

// app/layout.tsx
import { cookies } from 'next/headers';
import { UserStoreProvider } from '@/stores/user-store-provider';

async function getUser() {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) return null;

  // 서버에서 사용자 정보 가져오기
  const res = await fetch('https://api.example.com/user', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return null;

  return res.json();
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const user = await getUser();

  return (
    <html>
      <body>
        <UserStoreProvider initialUser={user}>
          {children}
        </UserStoreProvider>
      </body>
    </html>
  );
}
```

## 5. Persist 미들웨어와 SSR

### Hydration Mismatch 방지

```typescript
// stores/theme-store.ts
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useEffect, useState } from 'react';

interface ThemeState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'light',
      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === 'light' ? 'dark' : 'light',
        })),
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Hydration-safe Hook
export function useHydratedThemeStore() {
  const [hydrated, setHydrated] = useState(false);
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return {
    theme: hydrated ? theme : 'light', // SSR에서는 기본값 사용
    hydrated,
  };
}

// components/ThemeToggle.tsx
'use client';

import { useHydratedThemeStore, useThemeStore } from '@/stores/theme-store';

export function ThemeToggle() {
  const { theme, hydrated } = useHydratedThemeStore();
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  if (!hydrated) {
    // Hydration 중에는 기본 UI 표시
    return <button disabled>Loading...</button>;
  }

  return (
    <button onClick={toggleTheme}>
      Current theme: {theme}
    </button>
  );
}
```

### SSR-friendly Persist

```typescript
// lib/createPersistStore.ts
'use client';

import { create, StateCreator } from 'zustand';
import { persist, PersistOptions } from 'zustand/middleware';

export function createPersistStore<T>(
  stateCreator: StateCreator<T>,
  persistOptions: PersistOptions<T>
) {
  return create<T>()(
    persist(stateCreator, {
      ...persistOptions,
      storage: typeof window !== 'undefined'
        ? persistOptions.storage
        : undefined, // SSR에서는 storage 비활성화
    })
  );
}

// 사용
export const useAuthStore = createPersistStore<AuthState>(
  (set) => ({
    user: null,
    login: (user) => set({ user }),
    logout: () => set({ user: null }),
  }),
  {
    name: 'auth-storage',
    storage: createJSONStorage(() => localStorage),
  }
);
```

## 6. Server Actions와 통합

### Server Actions에서 데이터 가져오기

```typescript
// app/actions.ts
'use server';

import { revalidatePath } from 'next/cache';

export async function updateUserProfile(userId: number, data: any) {
  await fetch(`https://api.example.com/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

  revalidatePath('/profile');
  return { success: true };
}

// components/ProfileForm.tsx
'use client';

import { useUserStore } from '@/stores/user-store-provider';
import { updateUserProfile } from '@/app/actions';

export function ProfileForm() {
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);

    // Server Action 호출
    const result = await updateUserProfile(user!.id, {
      name: formData.get('name'),
    });

    if (result.success) {
      // 클라이언트 상태 업데이트
      setUser({ ...user!, name: formData.get('name') as string });
    }
  };

  return <form onSubmit={handleSubmit}>{/* ... */}</form>;
}
```

## 7. Route Handlers와 통합

### API Routes에서 데이터 동기화

```typescript
// app/api/cart/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();

  // DB에 장바구니 저장
  await saveCartToDatabase(body);

  return NextResponse.json({ success: true });
}

// components/Cart.tsx
'use client';

import { useCartStore } from '@/stores/cart-store';
import { useEffect } from 'react';

export function Cart() {
  const items = useCartStore((state) => state.items);

  // 장바구니 변경 시 서버 동기화
  useEffect(() => {
    const syncCart = async () => {
      await fetch('/api/cart', {
        method: 'POST',
        body: JSON.stringify({ items }),
      });
    };

    if (items.length > 0) {
      syncCart();
    }
  }, [items]);

  return <div>{/* Cart UI */}</div>;
}
```

## 8. 미들웨어와 Next.js

### Next.js Middleware에서 쿠키 기반 초기화

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/dashboard/:path*',
};

// app/dashboard/layout.tsx
import { cookies } from 'next/headers';
import { AuthStoreProvider } from '@/stores/auth-store-provider';

async function getAuthState() {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) return { user: null, token: null };

  // Verify token and get user
  const user = await verifyToken(token);

  return { user, token };
}

export default async function DashboardLayout({ children }) {
  const authState = await getAuthState();

  return (
    <AuthStoreProvider initialState={authState}>
      {children}
    </AuthStoreProvider>
  );
}
```

## 9. 성능 최적화

### Dynamic Import로 번들 크기 줄이기

```typescript
// components/HeavyComponent.tsx
'use client';

import dynamic from 'next/dynamic';

// 스토어를 동적 import
const DynamicCounter = dynamic(
  () => import('./Counter').then((mod) => mod.Counter),
  {
    loading: () => <p>Loading...</p>,
    ssr: false, // SSR 비활성화
  }
);

export function HeavyComponent() {
  return <DynamicCounter />;
}
```

### Code Splitting

```typescript
// stores/index.ts
export { useAuthStore } from './authStore';
export { useCartStore } from './cartStore';
export { useProductStore } from './productStore';

// 필요한 스토어만 import
import { useAuthStore } from '@/stores'; // 다른 스토어는 로드 안 됨
```

## 10. 안티패턴

### ❌ 하지 말아야 할 것

```typescript
// ❌ Server Component에서 직접 사용
export default function Page() {
  const count = useCounterStore((state) => state.count); // 에러!
  return <div>{count}</div>;
}

// ❌ 전역 스토어를 서버에서 초기화
// layout.tsx (Server Component)
useAuthStore.setState({ user: await getUser() }); // 위험!

// ❌ Hydration mismatch
export function Theme() {
  const theme = useThemeStore((state) => state.theme); // localStorage
  return <div className={theme}>{/* ... */}</div>; // Mismatch!
}
```

### ✅ 올바른 방법

```typescript
// ✅ Client Component로 분리
'use client';
export function Counter() {
  const count = useCounterStore((state) => state.count);
  return <div>{count}</div>;
}

// ✅ Provider로 초기 상태 전달
export default async function Layout({ children }) {
  const user = await getUser();
  return (
    <AuthStoreProvider initialUser={user}>
      {children}
    </AuthStoreProvider>
  );
}

// ✅ Hydration 처리
export function Theme() {
  const [mounted, setMounted] = useState(false);
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return <div className={theme}>{/* ... */}</div>;
}
```

## 결론

Next.js와 Zustand 통합의 핵심:

1. **'use client' 디렉티브** - Client Components에서만 사용
2. **Store Provider 패턴** - 요청별 독립 스토어
3. **SSR 초기 상태** - 서버에서 데이터 전달
4. **Hydration 처리** - Persist와 SSR 조합 시 주의
5. **Server Actions** - 서버 데이터와 동기화

**권장 패턴:**
- 클라이언트 상태 (UI): Zustand
- 서버 상태 (DB): TanStack Query
- URL 상태: Next.js Router
- 폼 상태: React Hook Form
