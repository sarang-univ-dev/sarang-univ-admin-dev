# Best Practices Guide - Sarang Univ Admin

> 이 문서는 Next.js 14/15, React 18/19, Tailwind CSS v4, ShadCN UI, TanStack Table, SWR, Lodash를 사용하는 프로젝트의 공식 Best Practices 가이드입니다.
>
> **마지막 업데이트**: 2025-10-20
> **기준 버전**: Next.js 14.2.15, React 18, TanStack Table v8, SWR v2, Lodash v4, Tailwind CSS v3.4

---

## 📑 목차

1. [프로젝트 구조](#프로젝트-구조)
2. [Props 관리](#props-관리)
3. [State 관리](#state-관리)
4. [Component 관리](#component-관리)
5. [Table 관리 (TanStack)](#table-관리-tanstack)
6. [Search 최적화 (Lodash)](#search-최적화-lodash)
7. [Cache 관리 (SWR)](#cache-관리-swr)
8. [스타일링 (Tailwind CSS & ShadCN UI)](#스타일링-tailwind-css--shadcn-ui)
9. [성능 최적화](#성능-최적화)
10. [타입 안전성](#타입-안전성)

---

## 프로젝트 구조

### 권장 디렉토리 구조

```
src/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Route Groups
│   ├── api/                 # API Routes
│   └── [slug]/              # Dynamic Routes
├── components/              # 컴포넌트
│   ├── ui/                  # ShadCN UI 컴포넌트
│   ├── common/              # 공통 컴포넌트
│   ├── features/            # 기능별 컴포넌트
│   └── tables/              # TanStack Table 컴포넌트
├── hooks/                   # Custom Hooks
│   ├── swr/                 # SWR 관련 훅
│   └── table/               # Table 관련 훅
├── lib/                     # 유틸리티 & 설정
│   ├── api/                 # API 클라이언트
│   └── utils/               # 헬퍼 함수
├── store/                   # 전역 상태 관리 (Zustand)
└── types/                   # TypeScript 타입 정의
```

---

## Props 관리

### ✅ DO: Server Components vs Client Components 구분

```tsx
// ❌ BAD: 모든 컴포넌트를 Client Component로 만들지 마세요
"use client";

export default function Page() {
  return <div>Static content</div>;
}

// ✅ GOOD: 기본적으로 Server Component 사용
export default async function Page() {
  const data = await fetchData(); // 서버에서 직접 데이터 페칭
  return <ClientInteractiveSection data={data} />;
}
```

### ✅ DO: Props 타입 정의 우선

```tsx
// ✅ GOOD: 명확한 타입 정의
interface UserCardProps {
  user: {
    id: string;
    name: string;
    email: string;
  };
  onEdit?: (id: string) => void;
  variant?: 'default' | 'compact';
}

export function UserCard({ user, onEdit, variant = 'default' }: UserCardProps) {
  // ...
}
```

### ✅ DO: Props Drilling 최소화

```tsx
// ❌ BAD: Props Drilling
<Parent user={user}>
  <Child user={user}>
    <GrandChild user={user} />
  </Child>
</Parent>

// ✅ GOOD: Context API 또는 Composition
// 1. Context API 사용
const UserContext = createContext<User | null>(null);

function Parent({ user }: { user: User }) {
  return (
    <UserContext.Provider value={user}>
      <Child>
        <GrandChild />
      </Child>
    </UserContext.Provider>
  );
}

// 2. Composition Pattern
function Parent({ user }: { user: User }) {
  return <Layout sidebar={<UserInfo user={user} />} />;
}
```

### ✅ DO: Props 기본값 설정

```tsx
// ✅ GOOD: 기본값 활용
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  ...props
}: ButtonProps) {
  // ...
}
```

### ❌ DON'T: 불필요한 Props 전달

```tsx
// ❌ BAD: 모든 props를 전달하지 마세요
<Component {...allProps} /> // 예상치 못한 props가 전달될 수 있음

// ✅ GOOD: 필요한 props만 명시적으로 전달
const { id, name, email } = user;
<UserCard id={id} name={name} email={email} />
```

---

## State 관리

### 🎯 State 관리 전략 선택 가이드

| 상황 | 권장 방법 | 이유 |
|------|----------|------|
| 컴포넌트 로컬 상태 | `useState` | 간단하고 격리됨 |
| 2-3단계 props drilling | `useState` + props | 복잡도가 낮음 |
| 4단계 이상 props drilling | Context API | Props drilling 방지 |
| 전역 UI 상태 (모달, 토스트) | Zustand | 간단하고 가벼움 |
| 서버 상태 (API 데이터) | SWR | 캐싱 & 리페칭 자동 |
| 복잡한 전역 상태 | Zustand + Immer | 불변성 관리 용이 |

### ✅ DO: 상태를 컴포넌트 가까이 유지

```tsx
// ❌ BAD: 전역 상태로 모든 것을 관리
const useGlobalStore = create((set) => ({
  searchTerm: '',
  setSearchTerm: (term) => set({ searchTerm: term }),
}));

// ✅ GOOD: 로컬 상태 우선
function SearchBar() {
  const [searchTerm, setSearchTerm] = useState('');
  // searchTerm은 이 컴포넌트에서만 사용
}
```

### ✅ DO: Zustand Store 패턴

```tsx
// store/toast-store.ts
import { create } from 'zustand';

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'destructive';
}

interface ToastStore {
  toasts: Toast[];
  add: (toast: Omit<Toast, 'id'>) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (toast) =>
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id: crypto.randomUUID() }],
    })),
  remove: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
  clear: () => set({ toasts: [] }),
}));

// 사용
function Component() {
  const addToast = useToastStore((state) => state.add);

  const handleSuccess = () => {
    addToast({
      title: '성공',
      description: '작업이 완료되었습니다.',
      variant: 'success',
    });
  };
}
```

### ✅ DO: Zustand Selector 최적화

```tsx
// ❌ BAD: 전체 store를 구독
const store = useToastStore(); // 모든 변경사항에 리렌더링

// ✅ GOOD: 필요한 부분만 구독
const toasts = useToastStore((state) => state.toasts);
const addToast = useToastStore((state) => state.add);
```

### ✅ DO: Context API 올바른 사용

```tsx
// ✅ GOOD: 별도의 Context로 분리
const AuthContext = createContext<AuthState | null>(null);
const ThemeContext = createContext<ThemeState | null>(null);

// ❌ BAD: 하나의 Context에 모든 상태
const AppContext = createContext<{
  auth: AuthState;
  theme: ThemeState;
  user: UserState;
  // ... 너무 많은 상태
} | null>(null);
```

### ❌ DON'T: 불필요한 상태 생성

```tsx
// ❌ BAD: 계산 가능한 값을 상태로 관리
const [fullName, setFullName] = useState('');
const [firstName, setFirstName] = useState('');
const [lastName, setLastName] = useState('');

useEffect(() => {
  setFullName(`${firstName} ${lastName}`);
}, [firstName, lastName]);

// ✅ GOOD: 계산된 값 사용
const [firstName, setFirstName] = useState('');
const [lastName, setLastName] = useState('');
const fullName = `${firstName} ${lastName}`; // 단순 계산
```

---

## Component 관리

### 🔥 Server Components vs Client Components

#### Server Components 사용 시기

✅ **기본적으로 Server Component 사용**

```tsx
// app/users/page.tsx
// Server Component (기본)
export default async function UsersPage() {
  const users = await fetchUsers(); // 직접 DB/API 접근

  return (
    <div>
      <h1>사용자 목록</h1>
      <UserList users={users} /> {/* Client Component */}
    </div>
  );
}
```

#### Client Components 사용 시기

✅ **인터랙티브한 기능이 필요할 때**

```tsx
"use client";

import { useState } from 'react';

export function UserList({ users }: { users: User[] }) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  return (
    <div>
      {users.map((user) => (
        <button key={user.id} onClick={() => setSelectedUser(user)}>
          {user.name}
        </button>
      ))}
      {selectedUser && <UserDetail user={selectedUser} />}
    </div>
  );
}
```

### ✅ DO: Component Composition Pattern

```tsx
// ✅ GOOD: Composition으로 유연한 구조
interface CardProps {
  children: React.ReactNode;
}

export function Card({ children }: CardProps) {
  return <div className="rounded-lg border bg-card">{children}</div>;
}

Card.Header = function CardHeader({ children }: CardProps) {
  return <div className="border-b p-4">{children}</div>;
};

Card.Content = function CardContent({ children }: CardProps) {
  return <div className="p-4">{children}</div>;
};

// 사용
<Card>
  <Card.Header>
    <h2>제목</h2>
  </Card.Header>
  <Card.Content>
    <p>내용</p>
  </Card.Content>
</Card>
```

### ✅ DO: Custom Hooks로 로직 분리

```tsx
// hooks/use-user-registration.tsx
export function useUserRegistration(retreatSlug: string) {
  const endpoint = `/api/v1/retreat/${retreatSlug}/registrations`;

  const { data, error, isLoading, mutate } = useSWR(endpoint, fetcher);

  const confirmPayment = async (id: string) => {
    await webAxios.post(`${endpoint}/${id}/confirm`);
    await mutate(); // SWR 캐시 갱신
  };

  return {
    registrations: data,
    error,
    isLoading,
    confirmPayment,
  };
}

// 컴포넌트에서 사용
function RegistrationTable({ retreatSlug }: Props) {
  const { registrations, confirmPayment } = useUserRegistration(retreatSlug);

  return (
    // ...
  );
}
```

### ✅ DO: Lazy Loading으로 번들 최적화

```tsx
import dynamic from 'next/dynamic';

// ✅ GOOD: 무거운 컴포넌트는 lazy loading
const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false, // 클라이언트에서만 렌더링
});

export function Dashboard() {
  return (
    <div>
      <h1>대시보드</h1>
      <HeavyChart data={data} />
    </div>
  );
}
```

### ❌ DON'T: 너무 많은 props 전달

```tsx
// ❌ BAD: 10개 이상의 props
<UserCard
  id={id}
  name={name}
  email={email}
  phone={phone}
  address={address}
  city={city}
  // ... 더 많은 props
/>

// ✅ GOOD: 객체로 그룹화
<UserCard user={user} onEdit={handleEdit} />
```

---

## Table 관리 (TanStack)

### 🎯 TanStack Table 기본 설정

```tsx
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  ColumnDef,
} from '@tanstack/react-table';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

function UserTable() {
  // ✅ GOOD: useMemo로 안정적인 참조 유지
  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        accessorKey: 'name',
        header: '이름',
      },
      {
        accessorKey: 'email',
        header: '이메일',
      },
      {
        accessorKey: 'role',
        header: '역할',
      },
    ],
    []
  );

  const data = useMemo(() => users, [users]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    // ...
  );
}
```

### ✅ DO: 안정적인 참조로 무한 리렌더링 방지

```tsx
// ❌ BAD: 매 렌더링마다 새로운 배열/객체 생성
function Table() {
  const table = useReactTable({
    data: users, // users가 매번 새로운 참조면 무한 루프
    columns: [{ ... }], // 매 렌더링마다 새로운 배열
  });
}

// ✅ GOOD: useMemo로 안정적인 참조 유지
function Table() {
  const columns = useMemo(() => [{ ... }], []);
  const data = useMemo(() => users, [users]);

  const table = useReactTable({
    data,
    columns,
  });
}
```

### ✅ DO: Column Helper로 타입 안전성 보장

```tsx
import { createColumnHelper } from '@tanstack/react-table';

const columnHelper = createColumnHelper<User>();

const columns = [
  columnHelper.accessor('name', {
    header: '이름',
    cell: (info) => info.getValue(), // 타입 안전
  }),
  columnHelper.accessor('email', {
    header: '이메일',
    cell: (info) => (
      <a href={`mailto:${info.getValue()}`}>{info.getValue()}</a>
    ),
  }),
  columnHelper.display({
    id: 'actions',
    header: '액션',
    cell: (props) => (
      <Button onClick={() => handleEdit(props.row.original.id)}>
        수정
      </Button>
    ),
  }),
];
```

### ✅ DO: 동적 컬럼 생성

```tsx
// ✅ GOOD: 스케줄 기반 동적 컬럼
function RegistrationTable({ schedules }: Props) {
  const columns = useMemo(() => {
    const staticColumns: ColumnDef<Registration>[] = [
      { accessorKey: 'name', header: '이름' },
      { accessorKey: 'department', header: '부서' },
    ];

    const dynamicColumns: ColumnDef<Registration>[] = schedules.map((schedule) =>
      columnHelper.accessor(
        (row) => row.schedules[schedule.id],
        {
          id: `schedule_${schedule.id}`,
          header: schedule.name,
          cell: (info) => (
            <Checkbox checked={info.getValue()} disabled />
          ),
        }
      )
    );

    return [...staticColumns, ...dynamicColumns, actionColumn];
  }, [schedules]);

  // ...
}
```

### ✅ DO: State 관리 패턴

```tsx
// ✅ GOOD: 필요한 state만 관리
function DataTable() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState('');

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    // ...
  );
}
```

### ✅ DO: 서버 사이드 페이지네이션 with SWR

```tsx
function ServerPaginatedTable() {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // SWR로 서버 사이드 페이지네이션
  const { data } = useSWR(
    `/api/users?page=${pagination.pageIndex}&size=${pagination.pageSize}`,
    fetcher
  );

  const table = useReactTable({
    data: data?.items ?? [],
    columns,
    pageCount: data?.pageCount ?? -1,
    state: {
      pagination,
    },
    onPaginationChange: setPagination,
    manualPagination: true, // 서버 사이드
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    // ...
  );
}
```

### ✅ DO: 컬럼 가시성 토글

```tsx
import { Settings } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function ColumnVisibilityToggle({ table }: { table: Table<any> }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          컬럼 선택
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {table
          .getAllLeafColumns()
          .filter((column) => column.getCanHide())
          .map((column) => (
            <DropdownMenuCheckboxItem
              key={column.id}
              checked={column.getIsVisible()}
              onCheckedChange={(value) => column.toggleVisibility(!!value)}
            >
              {column.columnDef.header as string}
            </DropdownMenuCheckboxItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### ❌ DON'T: 매 렌더링마다 컬럼 재생성

```tsx
// ❌ BAD
function Table() {
  const table = useReactTable({
    columns: [
      { accessorKey: 'name', header: '이름' },
      // 매 렌더링마다 새로운 배열
    ],
  });
}

// ✅ GOOD
function Table() {
  const columns = useMemo(
    () => [
      { accessorKey: 'name', header: '이름' },
    ],
    []
  );
}
```

---

## Search 최적화 (Lodash)

### ✅ DO: useMemo로 Debounce 함수 메모이제이션

```tsx
import { debounce } from 'lodash';
import { useMemo } from 'react';

function SearchBar({ onSearch }: { onSearch: (term: string) => void }) {
  // ✅ GOOD: useMemo로 debounced 함수를 메모이제이션
  const debouncedSearch = useMemo(
    () =>
      debounce((term: string) => {
        onSearch(term);
      }, 300),
    [onSearch]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };

  return (
    <input
      type="text"
      placeholder="검색..."
      onChange={handleChange}
    />
  );
}
```

### ✅ DO: useEffect cleanup으로 메모리 누수 방지

```tsx
import { debounce } from 'lodash';
import { useMemo, useEffect } from 'react';

function SearchBar() {
  const debouncedSearch = useMemo(
    () =>
      debounce((term: string) => {
        // API 호출 또는 검색 로직
        console.log('Searching:', term);
      }, 300),
    []
  );

  // ✅ GOOD: cleanup 함수로 pending된 debounce 취소
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  return (
    <input
      type="text"
      onChange={(e) => debouncedSearch(e.target.value)}
    />
  );
}
```

### ✅ DO: Custom Hook으로 재사용

```tsx
// hooks/use-debounced-value.ts
import { useState, useEffect } from 'react';

export function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

// 사용
function SearchBar() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);

  useEffect(() => {
    if (debouncedSearchTerm) {
      // API 호출
      searchAPI(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]);

  return (
    <input
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
  );
}
```

### ✅ DO: Lodash 최적화된 임포트

```tsx
// ❌ BAD: 전체 라이브러리 임포트
import _ from 'lodash';
_.debounce(fn, 300);

// ✅ GOOD: 필요한 함수만 임포트 (Tree-shaking)
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';
import isEqual from 'lodash/isEqual';
```

### ✅ DO: 적절한 Delay 시간 설정

```tsx
// ✅ GOOD: 사용 사례에 맞는 delay
const searchDebounce = debounce(search, 300);      // 검색: 300ms
const autoSaveDebounce = debounce(save, 1000);     // 자동 저장: 1000ms
const resizeThrottle = throttle(handleResize, 100); // 리사이즈: 100ms (throttle)
```

### ❌ DON'T: useCallback 없이 debounce 사용

```tsx
// ❌ BAD: 매 렌더링마다 새로운 debounce 생성
function SearchBar() {
  const handleSearch = debounce((term: string) => {
    console.log(term);
  }, 300); // 매번 새로 생성됨

  return <input onChange={(e) => handleSearch(e.target.value)} />;
}

// ✅ GOOD: useMemo 또는 useCallback 사용
function SearchBar() {
  const handleSearch = useMemo(
    () =>
      debounce((term: string) => {
        console.log(term);
      }, 300),
    []
  );

  return <input onChange={(e) => handleSearch(e.target.value)} />;
}
```

---

## Cache 관리 (SWR)

### ✅ DO: SWR 기본 설정

```tsx
// app/providers/RootLayoutProvider.tsx
import { SWRConfig } from 'swr';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher: (url: string) => fetch(url).then((res) => res.json()),
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        dedupingInterval: 2000, // 2초 내 중복 요청 제거
        errorRetryCount: 3,
        errorRetryInterval: 5000,
      }}
    >
      {children}
    </SWRConfig>
  );
}
```

### ✅ DO: Custom Hook 패턴

```tsx
// hooks/use-user-retreat-registration.tsx
import useSWR from 'swr';
import { webAxios } from '@/lib/api/axios';

export function useUserRetreatRegistration(retreatSlug: string) {
  const endpoint = `/api/v1/retreat/${retreatSlug}/account/user-retreat-registration`;

  const { data, error, isLoading, mutate } = useSWR(
    retreatSlug ? endpoint : null, // conditional fetching
    async (url) => {
      const response = await webAxios.get(url);
      return response.data;
    },
    {
      revalidateOnFocus: false, // 특정 케이스에서는 비활성화
      dedupingInterval: 5000,
    }
  );

  return {
    registrations: data,
    error,
    isLoading,
    mutate,
  };
}

// 사용
function RegistrationTable({ retreatSlug }: Props) {
  const { registrations, isLoading, mutate } = useUserRetreatRegistration(retreatSlug);

  if (isLoading) return <Skeleton />;

  return (
    // ...
  );
}
```

### ✅ DO: Mutation 패턴

```tsx
import { mutate } from 'swr';

async function handleConfirmPayment(id: string, retreatSlug: string) {
  const endpoint = `/api/v1/retreat/${retreatSlug}/registrations`;

  try {
    // 1. Optimistic Update (즉시 UI 업데이트)
    await mutate(
      endpoint,
      async (currentData) => {
        // 낙관적 업데이트: 즉시 UI 변경
        return {
          ...currentData,
          items: currentData.items.map((item) =>
            item.id === id ? { ...item, status: 'PAID' } : item
          ),
        };
      },
      {
        optimisticData: true, // 즉시 업데이트
        revalidate: false, // 일단 서버 요청 안 함
        rollbackOnError: true, // 에러 시 롤백
      }
    );

    // 2. 실제 API 호출
    await webAxios.post(`${endpoint}/${id}/confirm`);

    // 3. 서버 데이터로 Revalidate
    await mutate(endpoint);
  } catch (error) {
    // 에러 발생 시 자동으로 롤백됨 (rollbackOnError: true)
    console.error(error);
  }
}
```

### ✅ DO: useSWRMutation (SWR 2.0+)

```tsx
import useSWRMutation from 'swr/mutation';

async function sendRequest(url: string, { arg }: { arg: { userId: string } }) {
  return webAxios.post(url, arg);
}

function Component() {
  const { trigger, isMutating } = useSWRMutation(
    '/api/user',
    sendRequest,
    {
      onSuccess: (data) => {
        console.log('Success:', data);
      },
      onError: (error) => {
        console.error('Error:', error);
      },
    }
  );

  return (
    <button
      onClick={() => trigger({ userId: '123' })}
      disabled={isMutating}
    >
      {isMutating ? 'Loading...' : 'Submit'}
    </button>
  );
}
```

### ✅ DO: Key 구조화로 효율적인 캐시 관리

```tsx
// ✅ GOOD: 파라미터를 포함한 키 구조
const { data } = useSWR(
  `/api/users?page=${page}&limit=${limit}&filter=${filter}`,
  fetcher
);

// ✅ GOOD: 배열 형태의 키 (더 명확)
const { data } = useSWR(
  ['api/users', { page, limit, filter }],
  ([url, params]) => fetcher(url, params)
);

// ❌ BAD: 파라미터가 키에 포함되지 않음
const { data } = useSWR('/api/users', () => fetcher(page, limit)); // 잘못된 캐싱
```

### ✅ DO: Conditional Fetching

```tsx
// ✅ GOOD: 조건부 데이터 페칭
function UserProfile({ userId }: { userId: string | null }) {
  const { data } = useSWR(
    userId ? `/api/user/${userId}` : null, // userId가 없으면 요청 안 함
    fetcher
  );

  if (!userId) return <div>로그인이 필요합니다</div>;
  if (!data) return <div>Loading...</div>;

  return <div>{data.name}</div>;
}
```

### ✅ DO: Bound Mutate vs Global Mutate

```tsx
// 1. Bound Mutate (권장)
function Component() {
  const { data, mutate } = useSWR('/api/user', fetcher);

  const updateUser = async () => {
    await mutate(async () => {
      const updated = await updateAPI();
      return updated;
    });
  };
}

// 2. Global Mutate (여러 컴포넌트에서 같은 키를 공유할 때)
import { mutate } from 'swr';

function AnotherComponent() {
  const updateUser = async () => {
    await mutate('/api/user'); // 전역적으로 해당 키 revalidate
  };
}
```

### ❌ DON'T: 직접 캐시 수정

```tsx
// ❌ BAD: 캐시를 직접 수정하지 마세요
import { cache } from 'swr';
cache.set(key, data); // 예상치 못한 동작 발생 가능

// ✅ GOOD: mutate 사용
mutate(key, data, { revalidate: false });
```

### ❌ DON'T: 불필요한 Revalidation

```tsx
// ❌ BAD: 변경이 없는데 계속 revalidate
const { data } = useSWR('/api/static-data', fetcher, {
  revalidateOnFocus: true, // 정적 데이터인데 포커스마다 요청
  revalidateOnReconnect: true,
});

// ✅ GOOD: 정적 데이터는 revalidation 비활성화
const { data } = useSWR('/api/static-data', fetcher, {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  dedupingInterval: 3600000, // 1시간
});
```

---

## 스타일링 (Tailwind CSS & ShadCN UI)

### ✅ DO: Tailwind CSS 유틸리티 클래스 우선

```tsx
// ✅ GOOD: Tailwind 유틸리티 클래스
<div className="flex items-center justify-between p-4 rounded-lg border bg-card">
  <h2 className="text-lg font-semibold">제목</h2>
  <Button variant="outline" size="sm">수정</Button>
</div>

// ❌ BAD: 인라인 스타일 (비권장)
<div style={{ display: 'flex', padding: '16px', borderRadius: '8px' }}>
  // ...
</div>
```

### ✅ DO: cn() 유틸리티로 조건부 클래스

```tsx
import { cn } from '@/lib/utils';

function Button({ variant, className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'px-4 py-2 rounded-md font-medium transition-colors',
        variant === 'primary' && 'bg-primary text-primary-foreground',
        variant === 'secondary' && 'bg-secondary text-secondary-foreground',
        className // 외부에서 전달된 클래스
      )}
      {...props}
    />
  );
}
```

### ✅ DO: ShadCN UI 컴포넌트 커스터마이징

```tsx
// components/ui/button.tsx (ShadCN UI)
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent',
        // 커스텀 variant 추가
        success: 'bg-green-500 text-white hover:bg-green-600',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3',
        lg: 'h-11 px-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ variant, size, className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
```

### ✅ DO: CSS Variables로 테마 관리

```css
/* app/globals.css */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    /* ... */
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    /* ... */
  }
}
```

### ✅ DO: Responsive Design

```tsx
<div className="
  grid
  grid-cols-1      /* 모바일: 1열 */
  md:grid-cols-2   /* 태블릿: 2열 */
  lg:grid-cols-3   /* 데스크톱: 3열 */
  gap-4
">
  {/* ... */}
</div>
```

### ❌ DON'T: 과도한 커스텀 CSS

```tsx
// ❌ BAD: 커스텀 CSS 파일 남발
<div className="custom-card">
  // custom-card는 별도 CSS 파일에 정의
</div>

// ✅ GOOD: Tailwind 클래스 우선 사용
<div className="rounded-lg border bg-card p-4 shadow-sm">
  // Tailwind 유틸리티로 해결
</div>
```

---

## 성능 최적화

### ✅ DO: React.memo로 불필요한 리렌더링 방지

```tsx
import { memo } from 'react';

// ✅ GOOD: 복잡한 컴포넌트는 memo로 감싸기
export const UserCard = memo(function UserCard({ user }: { user: User }) {
  return (
    <div className="p-4 border rounded">
      <h3>{user.name}</h3>
      <p>{user.email}</p>
    </div>
  );
});

// 커스텀 비교 함수
export const UserList = memo(
  function UserList({ users }: { users: User[] }) {
    return (
      <div>
        {users.map((user) => (
          <UserCard key={user.id} user={user} />
        ))}
      </div>
    );
  },
  (prevProps, nextProps) => {
    // users 배열의 길이와 각 ID가 같으면 리렌더링 안 함
    return (
      prevProps.users.length === nextProps.users.length &&
      prevProps.users.every((user, idx) => user.id === nextProps.users[idx].id)
    );
  }
);
```

### ✅ DO: useMemo로 비용이 큰 계산 메모이제이션

```tsx
function DataTable({ data }: { data: User[] }) {
  // ✅ GOOD: 비용이 큰 계산은 useMemo
  const sortedAndFilteredData = useMemo(() => {
    return data
      .filter((user) => user.isActive)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);

  return (
    // ...
  );
}
```

### ✅ DO: useCallback으로 함수 참조 안정화

```tsx
function ParentComponent() {
  const [count, setCount] = useState(0);

  // ❌ BAD: 매 렌더링마다 새로운 함수 생성
  const handleClick = () => {
    console.log('Clicked');
  };

  // ✅ GOOD: useCallback으로 함수 메모이제이션
  const handleClick = useCallback(() => {
    console.log('Clicked');
  }, []);

  return <ChildComponent onClick={handleClick} />;
}
```

### ✅ DO: 이미지 최적화

```tsx
import Image from 'next/image';

// ✅ GOOD: Next.js Image 컴포넌트 사용
<Image
  src="/profile.jpg"
  alt="프로필"
  width={200}
  height={200}
  quality={85}
  priority // LCP 이미지는 priority
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>

// ❌ BAD: 일반 img 태그
<img src="/profile.jpg" alt="프로필" />
```

### ✅ DO: Code Splitting & Lazy Loading

```tsx
import dynamic from 'next/dynamic';

// ✅ GOOD: 무거운 컴포넌트는 동적 임포트
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
  ssr: false,
});

// Chart 라이브러리 같은 무거운 라이브러리도 동적 임포트
const Chart = dynamic(() => import('react-chartjs-2'), { ssr: false });
```

---

## 타입 안전성

### ✅ DO: 명확한 타입 정의

```tsx
// types/user.ts
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
  createdAt: string;
}

export interface UserCreatePayload {
  name: string;
  email: string;
  role: User['role'];
}

export type UserUpdatePayload = Partial<UserCreatePayload>;
```

### ✅ DO: Generic Types 활용

```tsx
// types/api.ts
export interface ApiResponse<T> {
  data: T;
  message: string;
  status: 'success' | 'error';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// 사용
const response: ApiResponse<User[]> = await fetchUsers();
const paginatedUsers: PaginatedResponse<User> = await fetchPaginatedUsers();
```

### ✅ DO: as const로 리터럴 타입 추론

```tsx
// ✅ GOOD: as const로 정확한 타입 추론
const ROUTES = {
  HOME: '/',
  USERS: '/users',
  SETTINGS: '/settings',
} as const;

type Route = typeof ROUTES[keyof typeof ROUTES]; // '/' | '/users' | '/settings'
```

### ✅ DO: Zod로 런타임 검증

```tsx
import { z } from 'zod';

// ✅ GOOD: Zod 스키마로 타입과 검증 동시에
const userSchema = z.object({
  id: z.string(),
  name: z.string().min(2).max(50),
  email: z.string().email(),
  age: z.number().int().positive().optional(),
});

type User = z.infer<typeof userSchema>;

// 런타임 검증
function createUser(data: unknown): User {
  return userSchema.parse(data); // 실패 시 에러 throw
}
```

### ❌ DON'T: any 타입 남발

```tsx
// ❌ BAD
function processData(data: any) {
  return data.items.map((item: any) => item.name);
}

// ✅ GOOD
interface DataItem {
  name: string;
  // ...
}

function processData(data: { items: DataItem[] }) {
  return data.items.map((item) => item.name);
}
```

---

## 추가 Best Practices

### ✅ DO: Error Boundary

```tsx
// components/ErrorBoundary.tsx
'use client';

import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-4 border border-red-500 rounded">
            <h2>문제가 발생했습니다</h2>
            <p>{this.state.error?.message}</p>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

// 사용
<ErrorBoundary>
  <SomeComponent />
</ErrorBoundary>
```

### ✅ DO: Loading & Suspense

```tsx
// app/users/loading.tsx
export default function Loading() {
  return <UsersSkeleton />;
}

// app/users/page.tsx
import { Suspense } from 'react';

export default function UsersPage() {
  return (
    <Suspense fallback={<UsersSkeleton />}>
      <UsersList />
    </Suspense>
  );
}
```

### ✅ DO: 접근성 (Accessibility)

```tsx
// ✅ GOOD: 의미 있는 HTML 사용
<nav aria-label="메인 네비게이션">
  <ul>
    <li><a href="/">홈</a></li>
    <li><a href="/about">소개</a></li>
  </ul>
</nav>

<button
  aria-label="메뉴 열기"
  aria-expanded={isOpen}
  onClick={toggleMenu}
>
  <MenuIcon />
</button>
```

---

## 📚 참고 자료

### 공식 문서
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TanStack Table Documentation](https://tanstack.com/table/latest)
- [SWR Documentation](https://swr.vercel.app)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [ShadCN UI Documentation](https://ui.shadcn.com)
- [Lodash Documentation](https://lodash.com/docs)

### 관련 아티클 (2025)
- [React & Next.js in 2025 - Modern Best Practices](https://strapi.io/blog/react-and-nextjs-in-2025-modern-best-practices)
- [React State Management in 2025](https://www.developerway.com/posts/react-state-management-2025)
- [Server and Client Components - Next.js](https://nextjs.org/docs/app/getting-started/server-and-client-components)

---

**작성일**: 2025-10-20
**버전**: 1.0.0
**작성자**: Claude Code Analysis
