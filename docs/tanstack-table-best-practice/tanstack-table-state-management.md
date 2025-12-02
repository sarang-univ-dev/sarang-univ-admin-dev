# TanStack Table 상태 관리 패턴

## 개요

TanStack Table은 테이블 상태 관리에 대해 세 가지 접근 방식을 제공합니다. 이 가이드는 각 패턴의 사용 시기와 방법을 설명합니다.

## 1. 상태 관리 패턴 개요

### 세 가지 접근 방식

1. **비제어 (Uncontrolled) 상태** - 테이블이 내부적으로 상태 관리
2. **부분 제어 (Partially Controlled) 상태** - 필요한 상태만 제어
3. **완전 제어 (Fully Controlled) 상태** - 모든 상태를 외부에서 제어

### 어떤 것을 선택해야 하나?

| 상황 | 추천 패턴 |
|------|---------|
| 기본 테이블, 상태에 접근 불필요 | 비제어 |
| 특정 상태만 접근 필요 (예: 정렬, 필터) | 부분 제어 |
| 모든 상태를 중앙화하고 싶음 | 완전 제어 (주의!) |
| 서버 사이드 처리 | 부분 제어 |
| URL에 상태 동기화 | 부분 제어 |

## 2. 비제어 (Uncontrolled) 상태

테이블이 모든 상태를 내부적으로 관리합니다. 가장 간단한 접근 방식입니다.

### 기본 사용

```typescript
const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
});

// 테이블이 자동으로 상태 관리
// 별도의 상태 선언 불필요
```

### 초기 상태 설정

```typescript
const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  initialState: {
    sorting: [{ id: 'name', desc: false }],
    pagination: {
      pageIndex: 0,
      pageSize: 20,
    },
    columnVisibility: {
      email: false,
      phone: false,
    },
  },
});
```

### 장점

- 구현이 매우 간단
- 상용구 코드 최소화
- 대부분의 기본 사용 사례에 적합

### 단점

- 상태에 직접 접근하기 어려움
- 다른 컴포넌트와 상태 공유 불가
- 상태를 로컬 스토리지나 URL에 저장 불가

## 3. 부분 제어 (Partially Controlled) 상태

**권장 방식**: 필요한 상태만 제어하고 나머지는 테이블에 맡깁니다.

### 기본 패턴

```typescript
function MyTable() {
  // 제어하려는 상태만 선언
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,        // 제어된 상태 전달
      pagination,     // 제어된 상태 전달
      // columnVisibility는 제어하지 않음 (내부 관리)
    },
    onSortingChange: setSorting,           // 상태 업데이트 콜백
    onPaginationChange: setPagination,     // 상태 업데이트 콜백
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (/* ... */);
}
```

### 중요: 상태와 콜백은 쌍으로

```typescript
// ✅ 올바른 예제: state + on[State]Change
state: {
  sorting,
},
onSortingChange: setSorting,

// ❌ 잘못된 예제: state만 제공하면 상태가 "동결"됨
state: {
  sorting,
},
// onSortingChange 없음 → 정렬이 작동하지 않음!
```

### 실전 예제: 서버 사이드 페이지네이션

```typescript
import { useQuery } from '@tanstack/react-query';

function ServerSideTable() {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 50,
  });

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  // 서버에서 데이터 가져오기
  const { data, isLoading } = useQuery({
    queryKey: ['tableData', pagination, sorting, columnFilters],
    queryFn: () =>
      fetchData({
        page: pagination.pageIndex,
        pageSize: pagination.pageSize,
        sortBy: sorting[0]?.id,
        sortOrder: sorting[0]?.desc ? 'desc' : 'asc',
        filters: columnFilters,
      }),
    keepPreviousData: true,
  });

  const table = useReactTable({
    data: data?.rows ?? [],
    pageCount: data?.pageCount ?? -1,
    columns,
    state: {
      pagination,
      sorting,
      columnFilters,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,   // 서버에서 페이지네이션 처리
    manualSorting: true,       // 서버에서 정렬 처리
    manualFiltering: true,     // 서버에서 필터링 처리
  });

  if (isLoading) return <div>로딩 중...</div>;

  return (/* 테이블 렌더링 */);
}
```

### URL에 상태 동기화

```typescript
import { useSearchParams } from 'react-router-dom';

function TableWithURLSync() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [pagination, setPagination] = useState<PaginationState>(() => ({
    pageIndex: Number(searchParams.get('page')) || 0,
    pageSize: Number(searchParams.get('pageSize')) || 10,
  }));

  const [sorting, setSorting] = useState<SortingState>(() => {
    const sortBy = searchParams.get('sortBy');
    const sortOrder = searchParams.get('sortOrder');
    return sortBy
      ? [{ id: sortBy, desc: sortOrder === 'desc' }]
      : [];
  });

  // 상태 변경 시 URL 업데이트
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('page', String(pagination.pageIndex));
    params.set('pageSize', String(pagination.pageSize));

    if (sorting.length > 0) {
      params.set('sortBy', sorting[0].id);
      params.set('sortOrder', sorting[0].desc ? 'desc' : 'asc');
    }

    setSearchParams(params);
  }, [pagination, sorting, setSearchParams]);

  const table = useReactTable({
    data,
    columns,
    state: {
      pagination,
      sorting,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (/* ... */);
}
```

### 로컬 스토리지와 동기화

```typescript
function TableWithLocalStorage() {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    const saved = localStorage.getItem('tableColumnVisibility');
    return saved ? JSON.parse(saved) : {};
  });

  // 상태 변경 시 로컬 스토리지에 저장
  useEffect(() => {
    localStorage.setItem('tableColumnVisibility', JSON.stringify(columnVisibility));
  }, [columnVisibility]);

  const table = useReactTable({
    data,
    columns,
    state: {
      columnVisibility,
    },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
  });

  return (/* ... */);
}
```

## 4. 완전 제어 (Fully Controlled) 상태

**주의**: 성능 문제를 일으킬 수 있으므로 신중하게 사용하세요.

### 기본 패턴

```typescript
function FullyControlledTable() {
  const [tableState, setTableState] = useState<TableState>({
    sorting: [],
    pagination: { pageIndex: 0, pageSize: 10 },
    columnFilters: [],
    columnVisibility: {},
    rowSelection: {},
    // ... 모든 테이블 상태
  });

  const table = useReactTable({
    data,
    columns,
    state: tableState,
    onStateChange: setTableState,  // 단일 콜백으로 모든 상태 관리
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (/* ... */);
}
```

### 장점

- 중앙화된 상태 관리
- Redux/Zustand 등과 쉬운 통합
- 모든 상태에 쉽게 접근

### 단점

- **성능 문제**: 빈번하게 변경되는 상태(예: `columnSizingInfo`)를 호이스팅하면 전체 컴포넌트 트리가 리렌더링될 수 있음
- 복잡성 증가
- 불필요한 상용구 코드

### 성능 최적화가 필요한 경우

```typescript
// ❌ 모든 상태를 호이스팅하면 columnSizingInfo로 인해 성능 저하
function FullyControlledTable() {
  const [tableState, setTableState] = useState<TableState>({
    // ... 모든 상태
    columnSizingInfo: {}, // 이것이 빠르게 변경되면 문제 발생
  });

  // 해결책: columnSizingInfo만 제외하고 나머지는 제어
}
```

## 5. 상태 타입 이해하기

### 주요 상태 타입

```typescript
import type {
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  ColumnOrderState,
  ColumnPinningState,
  RowSelectionState,
  ExpandedState,
  PaginationState,
} from '@tanstack/react-table';

// 정렬 상태
type SortingState = Array<{
  id: string;
  desc: boolean;
}>;

// 컬럼 필터 상태
type ColumnFiltersState = Array<{
  id: string;
  value: unknown;
}>;

// 컬럼 가시성
type VisibilityState = Record<string, boolean>;

// 행 선택
type RowSelectionState = Record<string, boolean>;

// 페이지네이션
type PaginationState = {
  pageIndex: number;
  pageSize: number;
};
```

## 6. 상태 업데이트 패턴

### Updater 함수 패턴

TanStack Table의 상태 업데이트 콜백은 **Updater 함수**를 받습니다.

```typescript
type Updater<T> = T | ((old: T) => T);

// 예제
const [sorting, setSorting] = useState<SortingState>([]);

// TanStack Table은 이렇게 호출합니다:
setSorting(old => [...old, { id: 'name', desc: false }]);
// 또는
setSorting([{ id: 'name', desc: false }]);
```

### 커스텀 상태 핸들러

```typescript
function TableWithCustomHandler() {
  const [sorting, setSorting] = useState<SortingState>([]);

  const handleSortingChange = (updaterOrValue: Updater<SortingState>) => {
    const newSorting =
      typeof updaterOrValue === 'function'
        ? updaterOrValue(sorting)
        : updaterOrValue;

    setSorting(newSorting);

    // 추가 로직 (로깅, 분석 등)
    console.log('정렬 변경:', newSorting);
    analytics.track('table_sorted', { columns: newSorting });
  };

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: handleSortingChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (/* ... */);
}
```

## 7. 외부 상태 관리 라이브러리와 통합

### Zustand와 함께 사용

```typescript
import { create } from 'zustand';

type TableStore = {
  sorting: SortingState;
  pagination: PaginationState;
  columnFilters: ColumnFiltersState;
  setSorting: (sorting: SortingState) => void;
  setPagination: (pagination: PaginationState) => void;
  setColumnFilters: (filters: ColumnFiltersState) => void;
};

const useTableStore = create<TableStore>((set) => ({
  sorting: [],
  pagination: { pageIndex: 0, pageSize: 10 },
  columnFilters: [],
  setSorting: (sorting) => set({ sorting }),
  setPagination: (pagination) => set({ pagination }),
  setColumnFilters: (columnFilters) => set({ columnFilters }),
}));

function TableWithZustand() {
  const sorting = useTableStore((state) => state.sorting);
  const pagination = useTableStore((state) => state.pagination);
  const columnFilters = useTableStore((state) => state.columnFilters);
  const setSorting = useTableStore((state) => state.setSorting);
  const setPagination = useTableStore((state) => state.setPagination);
  const setColumnFilters = useTableStore((state) => state.setColumnFilters);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      pagination,
      columnFilters,
    },
    onSortingChange: (updater) => {
      const newSorting =
        typeof updater === 'function' ? updater(sorting) : updater;
      setSorting(newSorting);
    },
    onPaginationChange: (updater) => {
      const newPagination =
        typeof updater === 'function' ? updater(pagination) : updater;
      setPagination(newPagination);
    },
    onColumnFiltersChange: (updater) => {
      const newFilters =
        typeof updater === 'function' ? updater(columnFilters) : updater;
      setColumnFilters(newFilters);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (/* ... */);
}
```

### Redux Toolkit과 함께 사용

```typescript
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

const tableSlice = createSlice({
  name: 'table',
  initialState: {
    sorting: [] as SortingState,
    pagination: { pageIndex: 0, pageSize: 10 } as PaginationState,
  },
  reducers: {
    setSorting: (state, action: PayloadAction<SortingState>) => {
      state.sorting = action.payload;
    },
    setPagination: (state, action: PayloadAction<PaginationState>) => {
      state.pagination = action.payload;
    },
  },
});

export const { setSorting, setPagination } = tableSlice.actions;
export default tableSlice.reducer;

// 컴포넌트에서 사용
function TableWithRedux() {
  const dispatch = useDispatch();
  const sorting = useSelector((state: RootState) => state.table.sorting);
  const pagination = useSelector((state: RootState) => state.table.pagination);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      pagination,
    },
    onSortingChange: (updater) => {
      const newSorting =
        typeof updater === 'function' ? updater(sorting) : updater;
      dispatch(setSorting(newSorting));
    },
    onPaginationChange: (updater) => {
      const newPagination =
        typeof updater === 'function' ? updater(pagination) : updater;
      dispatch(setPagination(newPagination));
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (/* ... */);
}
```

## 8. 상태 초기화 및 리셋

### 상태 리셋

```typescript
function ResettableTable() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const resetTableState = () => {
    setSorting([]);
    setPagination({ pageIndex: 0, pageSize: 10 });
    setColumnFilters([]);
  };

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      pagination,
      columnFilters,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <>
      <button onClick={resetTableState}>
        테이블 리셋
      </button>
      {/* 테이블 렌더링 */}
    </>
  );
}
```

### 조건부 상태 초기화

```typescript
function TableWithConditionalReset() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [filters, setFilters] = useState<ColumnFiltersState>([]);

  // 데이터가 변경되면 페이지를 0으로 리셋
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  useEffect(() => {
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  }, [data]); // data가 변경될 때마다 첫 페이지로

  // ...
}
```

## 9. 모범 사례 체크리스트

### 상태 제어 수준 결정

- [ ] 기본적으로 **비제어** 상태 사용
- [ ] 상태 접근이 필요하면 **부분 제어** 사용
- [ ] **완전 제어**는 특별한 이유가 있을 때만 사용

### 부분 제어 상태 사용 시

- [ ] 상태(`state`)와 콜백(`on[State]Change`)을 쌍으로 제공
- [ ] 필요한 상태만 제어 (나머지는 내부 관리)
- [ ] Updater 함수 패턴 올바르게 처리
- [ ] 서버 사이드 처리 시 `manual*` 옵션 설정

### 성능 고려사항

- [ ] 빈번하게 변경되는 상태는 제어하지 않음 (`columnSizingInfo` 등)
- [ ] 상태 변경 시 불필요한 리렌더링 최소화
- [ ] 큰 컴포넌트 트리에서는 상태 호이스팅 주의

### 외부 통합

- [ ] URL/로컬 스토리지 동기화 시 초기 상태 올바르게 설정
- [ ] 상태 관리 라이브러리 사용 시 Updater 함수 패턴 준수
- [ ] 상태 변경 시 부수 효과(로깅, 분석) 처리

## 10. 안티패턴

```typescript
// ❌ state만 제공하고 callback 없음 (상태가 동결됨)
const table = useReactTable({
  state: { sorting },
  // onSortingChange 없음!
});

// ❌ 모든 상태를 불필요하게 제어
const [allState, setAllState] = useState<TableState>({/* ... */});

// ❌ Updater 함수 패턴을 무시
onSortingChange: (updater) => {
  // updater가 함수일 수 있음을 무시
  setSorting(updater); // 잘못됨!
};

// ✅ 올바른 처리
onSortingChange: (updater) => {
  const newSorting = typeof updater === 'function' ? updater(sorting) : updater;
  setSorting(newSorting);
};

// ❌ 빈번하게 변경되는 상태를 상위로 호이스팅
const [columnSizingInfo, setColumnSizingInfo] = useState({});
// 크기 조정 중 매우 빈번하게 업데이트 → 성능 저하
```

## 결론

TanStack Table의 상태 관리는 유연성과 성능의 균형을 찾는 것이 중요합니다. 대부분의 경우 **부분 제어 상태**가 가장 적절하며, 필요한 상태만 제어하고 나머지는 테이블이 관리하도록 하는 것이 좋습니다.

**핵심 원칙:**
1. 기본적으로 비제어 상태 사용
2. 필요한 상태만 제어 (부분 제어)
3. 상태와 콜백을 쌍으로 제공
4. Updater 함수 패턴 올바르게 처리
5. 성능 저하를 일으킬 수 있는 완전 제어는 피하기
