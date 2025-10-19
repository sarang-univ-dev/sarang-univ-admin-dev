# TanStack Table 기능 구현 가이드

## 개요

TanStack Table의 주요 기능인 정렬(Sorting), 필터링(Filtering), 페이지네이션(Pagination)을 구현하는 방법을 상세히 설명합니다.

## 1. 정렬 (Sorting)

### 클라이언트 사이드 정렬

#### 기본 구현

```typescript
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
} from '@tanstack/react-table';

function SortableTable() {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(), // 필수!
  });

  return (
    <table>
      <thead>
        {table.getHeaderGroups().map(headerGroup => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map(header => (
              <th key={header.id}>
                {header.isPlaceholder ? null : (
                  <div
                    onClick={header.column.getToggleSortingHandler()}
                    style={{ cursor: 'pointer' }}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    {{
                      asc: ' 🔼',
                      desc: ' 🔽',
                    }[header.column.getIsSorted() as string] ?? null}
                  </div>
                )}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {/* 행 렌더링 */}
      </tbody>
    </table>
  );
}
```

#### 컬럼별 정렬 설정

```typescript
const columns = [
  columnHelper.accessor('name', {
    header: '이름',
    enableSorting: true, // 기본값: true
    sortingFn: 'alphanumeric', // 정렬 함수
  }),
  columnHelper.accessor('age', {
    header: '나이',
    enableSorting: true,
    sortingFn: 'basic', // 숫자 정렬
  }),
  columnHelper.accessor('status', {
    header: '상태',
    enableSorting: false, // 정렬 비활성화
  }),
];
```

#### 커스텀 정렬 함수

```typescript
const columns = [
  columnHelper.accessor('createdAt', {
    header: '생성일',
    sortingFn: (rowA, rowB, columnId) => {
      const dateA = rowA.getValue<Date>(columnId);
      const dateB = rowB.getValue<Date>(columnId);
      return dateA.getTime() - dateB.getTime();
    },
  }),
  columnHelper.accessor('priority', {
    header: '우선순위',
    sortingFn: (rowA, rowB, columnId) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const valueA = rowA.getValue<keyof typeof priorityOrder>(columnId);
      const valueB = rowB.getValue<keyof typeof priorityOrder>(columnId);
      return priorityOrder[valueA] - priorityOrder[valueB];
    },
  }),
];
```

#### 다중 컬럼 정렬

```typescript
const table = useReactTable({
  data,
  columns,
  state: { sorting },
  onSortingChange: setSorting,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  enableMultiSort: true, // 다중 정렬 활성화
  maxMultiSortColCount: 3, // 최대 3개 컬럼까지
  isMultiSortEvent: (e) => e.shiftKey, // Shift 키로 다중 정렬
});

// 헤더 렌더링
<th onClick={header.column.getToggleSortingHandler()}>
  {flexRender(header.column.columnDef.header, header.getContext())}
  {header.column.getIsSorted() && (
    <span className="sort-indicator">
      {header.column.getIsSorted() === 'asc' ? '🔼' : '🔽'}
      {header.column.getSortIndex() > -1 && (
        <span className="sort-index">{header.column.getSortIndex() + 1}</span>
      )}
    </span>
  )}
</th>
```

### 서버 사이드 정렬

```typescript
function ServerSideSortedTable() {
  const [sorting, setSorting] = useState<SortingState>([]);

  const { data, isLoading } = useQuery({
    queryKey: ['tableData', sorting],
    queryFn: () =>
      fetchData({
        sortBy: sorting[0]?.id,
        sortOrder: sorting[0]?.desc ? 'desc' : 'asc',
      }),
  });

  const table = useReactTable({
    data: data?.rows ?? [],
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true, // 서버에서 정렬 처리
  });

  return (/* ... */);
}
```

### 정렬 API

```typescript
// 정렬 상태 확인
column.getIsSorted(); // false | 'asc' | 'desc'
column.getCanSort(); // boolean
column.getSortIndex(); // number

// 정렬 토글
column.getToggleSortingHandler(); // onClick 핸들러
column.toggleSorting(desc?: boolean, isMulti?: boolean);
column.clearSorting();

// 테이블 수준
table.setSorting([{ id: 'name', desc: false }]);
table.resetSorting();
table.getPreSortedRowModel(); // 정렬 전 모델
table.getSortedRowModel(); // 정렬 후 모델
```

## 2. 필터링 (Filtering)

### 컬럼 필터링

#### 기본 구현

```typescript
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  ColumnFiltersState,
} from '@tanstack/react-table';

function FilterableTable() {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    state: {
      columnFilters,
    },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(), // 필수!
  });

  return (
    <>
      {/* 필터 입력 */}
      {table.getHeaderGroups().map(headerGroup => (
        <div key={headerGroup.id}>
          {headerGroup.headers.map(header => (
            <div key={header.id}>
              {header.column.getCanFilter() ? (
                <input
                  type="text"
                  value={(header.column.getFilterValue() ?? '') as string}
                  onChange={e => header.column.setFilterValue(e.target.value)}
                  placeholder={`${header.column.columnDef.header} 검색`}
                />
              ) : null}
            </div>
          ))}
        </div>
      ))}

      {/* 테이블 */}
      <table>{/* ... */}</table>
    </>
  );
}
```

#### 컬럼별 필터 설정

```typescript
const columns = [
  columnHelper.accessor('name', {
    header: '이름',
    enableColumnFilter: true,
    filterFn: 'includesString', // 기본 문자열 포함 검색
  }),
  columnHelper.accessor('age', {
    header: '나이',
    enableColumnFilter: true,
    filterFn: 'inNumberRange', // 숫자 범위 필터
  }),
  columnHelper.accessor('email', {
    header: '이메일',
    enableColumnFilter: false, // 필터 비활성화
  }),
];
```

#### 커스텀 필터 함수

```typescript
// 범위 필터
columnHelper.accessor('age', {
  header: '나이',
  filterFn: (row, columnId, filterValue) => {
    const [min, max] = filterValue as [number, number];
    const age = row.getValue<number>(columnId);
    return age >= min && age <= max;
  },
}),

// 다중 선택 필터
columnHelper.accessor('category', {
  header: '카테고리',
  filterFn: (row, columnId, filterValue) => {
    const selectedCategories = filterValue as string[];
    const category = row.getValue<string>(columnId);
    return selectedCategories.includes(category);
  },
}),

// 날짜 범위 필터
columnHelper.accessor('createdAt', {
  header: '생성일',
  filterFn: (row, columnId, filterValue) => {
    const [startDate, endDate] = filterValue as [Date, Date];
    const date = row.getValue<Date>(columnId);
    return date >= startDate && date <= endDate;
  },
}),
```

#### 커스텀 필터 UI

```typescript
function RangeFilter({ column }: { column: Column<any, unknown> }) {
  const [min, max] = (column.getFilterValue() as [number, number]) ?? [0, 100];

  return (
    <div>
      <input
        type="number"
        value={min}
        onChange={e => column.setFilterValue([Number(e.target.value), max])}
        placeholder="최소"
      />
      <input
        type="number"
        value={max}
        onChange={e => column.setFilterValue([min, Number(e.target.value)])}
        placeholder="최대"
      />
    </div>
  );
}

function SelectFilter({ column, options }: { column: Column<any, unknown>; options: string[] }) {
  const selectedValues = (column.getFilterValue() as string[]) ?? [];

  return (
    <select
      multiple
      value={selectedValues}
      onChange={e => {
        const values = Array.from(e.target.selectedOptions, option => option.value);
        column.setFilterValue(values);
      }}
    >
      {options.map(option => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}
```

### 전역 필터링

```typescript
function GlobalFilterTable() {
  const [globalFilter, setGlobalFilter] = useState('');

  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: 'includesString', // 전역 필터 함수
  });

  return (
    <>
      <input
        value={globalFilter ?? ''}
        onChange={e => setGlobalFilter(e.target.value)}
        placeholder="전체 검색..."
      />
      <table>{/* ... */}</table>
    </>
  );
}
```

#### 디바운싱 적용

```typescript
import { useDebouncedCallback } from 'use-debounce';

function DebouncedFilterTable() {
  const [globalFilter, setGlobalFilter] = useState('');
  const [inputValue, setInputValue] = useState('');

  const debouncedSetGlobalFilter = useDebouncedCallback(
    (value: string) => {
      setGlobalFilter(value);
    },
    300
  );

  return (
    <input
      value={inputValue}
      onChange={e => {
        setInputValue(e.target.value);
        debouncedSetGlobalFilter(e.target.value);
      }}
      placeholder="검색..."
    />
  );
}
```

### 서버 사이드 필터링

```typescript
function ServerSideFilteredTable() {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const { data, isLoading } = useQuery({
    queryKey: ['tableData', columnFilters],
    queryFn: () => fetchData({ filters: columnFilters }),
  });

  const table = useReactTable({
    data: data?.rows ?? [],
    columns,
    state: { columnFilters },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    manualFiltering: true, // 서버에서 필터링 처리
  });

  return (/* ... */);
}
```

### 필터 API

```typescript
// 컬럼 필터
column.getFilterValue(); // 현재 필터 값
column.setFilterValue(value: any); // 필터 값 설정
column.getCanFilter(); // 필터링 가능 여부
column.getIsFiltered(); // 필터링 중인지 확인

// 테이블 수준
table.setColumnFilters([{ id: 'name', value: 'John' }]);
table.resetColumnFilters();
table.getPreFilteredRowModel(); // 필터링 전 모델
table.getFilteredRowModel(); // 필터링 후 모델
```

## 3. 페이지네이션 (Pagination)

### 클라이언트 사이드 페이지네이션

#### 기본 구현

```typescript
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  PaginationState,
} from '@tanstack/react-table';

function PaginatedTable() {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const table = useReactTable({
    data,
    columns,
    state: {
      pagination,
    },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(), // 필수!
  });

  return (
    <>
      <table>{/* ... */}</table>

      {/* 페이지네이션 컨트롤 */}
      <div className="pagination">
        <button
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
        >
          {'<<'}
        </button>
        <button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          {'<'}
        </button>
        <span>
          페이지{' '}
          <strong>
            {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
          </strong>
        </span>
        <button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          {'>'}
        </button>
        <button
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
        >
          {'>>'}
        </button>

        {/* 페이지 크기 선택 */}
        <select
          value={table.getState().pagination.pageSize}
          onChange={e => table.setPageSize(Number(e.target.value))}
        >
          {[10, 20, 30, 40, 50].map(pageSize => (
            <option key={pageSize} value={pageSize}>
              {pageSize}개씩 보기
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
```

#### 페이지 번호 입력

```typescript
<input
  type="number"
  defaultValue={table.getState().pagination.pageIndex + 1}
  onChange={e => {
    const page = e.target.value ? Number(e.target.value) - 1 : 0;
    table.setPageIndex(page);
  }}
  min={1}
  max={table.getPageCount()}
/>
```

#### 페이지 목록 렌더링

```typescript
function PageNumbers() {
  const pageCount = table.getPageCount();
  const currentPage = table.getState().pagination.pageIndex;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (pageCount <= maxVisible) {
      return Array.from({ length: pageCount }, (_, i) => i);
    }

    pages.push(0); // 첫 페이지

    if (currentPage > 2) {
      pages.push('...');
    }

    for (
      let i = Math.max(1, currentPage - 1);
      i <= Math.min(pageCount - 2, currentPage + 1);
      i++
    ) {
      pages.push(i);
    }

    if (currentPage < pageCount - 3) {
      pages.push('...');
    }

    if (pageCount > 1) {
      pages.push(pageCount - 1); // 마지막 페이지
    }

    return pages;
  };

  return (
    <div className="page-numbers">
      {getPageNumbers().map((page, index) =>
        typeof page === 'number' ? (
          <button
            key={index}
            onClick={() => table.setPageIndex(page)}
            className={currentPage === page ? 'active' : ''}
          >
            {page + 1}
          </button>
        ) : (
          <span key={index}>...</span>
        )
      )}
    </div>
  );
}
```

### 서버 사이드 페이지네이션

```typescript
function ServerSidePaginatedTable() {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['tableData', pagination],
    queryFn: () =>
      fetchData({
        page: pagination.pageIndex,
        pageSize: pagination.pageSize,
      }),
    keepPreviousData: true, // 페이지 전환 시 이전 데이터 유지
  });

  const table = useReactTable({
    data: data?.rows ?? [],
    pageCount: data?.pageCount ?? -1, // 서버에서 받은 총 페이지 수
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true, // 서버에서 페이지네이션 처리
  });

  if (isLoading) return <div>로딩 중...</div>;

  return (/* ... */);
}
```

### 페이지네이션 API

```typescript
// 페이지 이동
table.setPageIndex(index: number);
table.setPageSize(size: number);
table.nextPage();
table.previousPage();

// 페이지 정보
table.getPageCount(); // 총 페이지 수
table.getCanPreviousPage(); // 이전 페이지 가능 여부
table.getCanNextPage(); // 다음 페이지 가능 여부
table.getRowModel().rows; // 현재 페이지의 행들

// 상태 접근
table.getState().pagination.pageIndex;
table.getState().pagination.pageSize;
```

## 4. 기능 조합

### 정렬 + 필터링 + 페이지네이션

```typescript
function FullFeaturedTable() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // 필터링 후 페이지를 0으로 리셋
  useEffect(() => {
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  }, [columnFilters]);

  return (/* ... */);
}
```

### 서버 사이드 통합

```typescript
function ServerSideFullFeaturedTable() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['tableData', sorting, columnFilters, pagination],
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
      sorting,
      columnFilters,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualFiltering: true,
    manualPagination: true,
  });

  return (/* ... */);
}
```

## 5. 모범 사례

### 정렬

- [ ] 기본 정렬 순서 설정 (`initialState.sorting`)
- [ ] 커스텀 데이터 타입에 적절한 정렬 함수 제공
- [ ] 다중 정렬 시 시각적 피드백 제공
- [ ] 서버 사이드 정렬 시 `manualSorting: true` 설정

### 필터링

- [ ] 필터 입력에 디바운싱 적용 (300ms)
- [ ] 커스텀 필터 UI로 UX 개선
- [ ] 필터 초기화 버튼 제공
- [ ] 필터 상태를 URL에 동기화 (선택 사항)

### 페이지네이션

- [ ] 적절한 기본 페이지 크기 설정 (10-50)
- [ ] 페이지 크기 옵션 제공
- [ ] 서버 사이드 시 `keepPreviousData: true` 사용
- [ ] 로딩 상태 표시
- [ ] 필터/정렬 변경 시 첫 페이지로 리셋

## 결론

TanStack Table의 정렬, 필터링, 페이지네이션 기능은 클라이언트 및 서버 사이드 모두를 지원하며, 필요에 따라 조합하여 사용할 수 있습니다. 각 기능의 Row Model을 올바르게 임포트하고, 서버 사이드 처리 시 `manual*` 옵션을 설정하는 것이 핵심입니다.

**핵심 원칙:**
1. 필요한 Row Model 임포트 (get*RowModel)
2. 상태와 콜백을 쌍으로 제공
3. 서버 사이드는 manual* 옵션 설정
4. 사용자 경험을 위한 디바운싱과 로딩 상태
5. 기능 조합 시 상호작용 고려 (예: 필터 변경 시 페이지 리셋)
