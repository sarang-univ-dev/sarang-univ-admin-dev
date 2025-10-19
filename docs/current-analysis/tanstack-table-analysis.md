# TanStack Table 도입 분석 보고서

## 📋 목차
1. [현재 구조 분석](#현재-구조-분석)
2. [TanStack Table 개요](#tanstack-table-개요)
3. [기능별 구현 가능성 분석](#기능별-구현-가능성-분석)
4. [SWR 연동 방법](#swr-연동-방법)
5. [마이그레이션 전략](#마이그레이션-전략)
6. [결론 및 권장사항](#결론-및-권장사항)

---

## 현재 구조 분석

### 사용 중인 기술 스택
- **UI 컴포넌트**: ShadCN UI의 기본 Table 컴포넌트
- **데이터 페칭**: SWR (v2.3.3)
- **상태 관리**: React useState + Zustand
- **스타일링**: Tailwind CSS

### 현재 구현된 기능

#### ✅ 구현된 기능
1. **검색/필터링**: 클라이언트 사이드 검색 (SearchBar 컴포넌트)
   - 이름, 부서, 전화번호 등으로 검색
   - `filteredData` state로 관리

2. **동적 컬럼 생성**: 스케줄 기반 동적 컬럼
   ```typescript
   // registration-table.tsx:301
   const scheduleColumns = generateScheduleColumns(schedules);
   ```

3. **SWR 연동**: 데이터 페칭 및 캐시 관리
   ```typescript
   // bus-registration-table.tsx:36
   import useSWR, { mutate } from "swr";

   // registration-table.tsx:110
   await mutate(registrationsEndpoint);
   ```

4. **액션 버튼**: 입금 확인, 환불 처리 등
5. **로딩 상태 관리**: 개별 행별 로딩 상태
6. **메모 기능**: 회계 메모 CRUD (AccountStaffTable)

#### ❌ 미구현 기능
1. **정렬 (Sorting)**: 컬럼 헤더 클릭으로 정렬 불가
2. **열 순서 변경 (Column Ordering)**: 드래그 앤 드롭으로 컬럼 순서 변경 불가
3. **열 숨김 (Column Visibility)**: 사용자가 원하는 컬럼만 표시 불가
4. **페이지네이션**: 모든 데이터를 한 번에 표시
5. **컬럼 리사이징**: 컬럼 너비 조정 불가
6. **행 선택 (Row Selection)**: 다중 선택 기능 없음

### 현재 테이블 구조의 문제점

1. **확장성 부족**: 새로운 기능 추가 시 많은 보일러플레이트 코드 필요
2. **성능 문제**: 대량 데이터 처리 시 최적화 어려움
3. **코드 중복**: 유사한 테이블 컴포넌트가 23개 존재
4. **유지보수 어려움**: 각 테이블마다 수동으로 기능 구현 필요

---

## TanStack Table 개요

### TanStack Table이란?

TanStack Table (구 React Table)은 **헤드리스(Headless) 테이블 라이브러리**입니다. 즉, UI는 제공하지 않고 테이블 로직만 제공합니다.

#### 주요 특징
- ✅ **프레임워크 독립적**: React, Vue, Solid, Svelte 등 모든 프레임워크 지원
- ✅ **헤드리스 아키텍처**: 기존 UI 컴포넌트(ShadCN UI)와 함께 사용 가능
- ✅ **TypeScript 완벽 지원**: 타입 안전성 보장
- ✅ **번들 크기**: 약 13-14KB (gzipped)
- ✅ **트리 쉐이킹**: 사용하는 기능만 번들에 포함

### 아키텍처

```
┌─────────────────────────────────────┐
│      TanStack Table Core            │
│  (로직, 상태 관리, 계산)              │
└─────────────────────────────────────┘
              ▼
┌─────────────────────────────────────┐
│      UI Layer (개발자 구현)          │
│  (ShadCN UI, Material UI 등)        │
└─────────────────────────────────────┘
```

---

## 기능별 구현 가능성 분석

### 1. 필터링 (Filtering) ✅

#### 가능한 기능
- **컬럼 필터링**: 각 컬럼별 개별 필터
- **글로벌 필터링**: 전체 컬럼 검색 (현재 구현된 SearchBar 기능)
- **커스텀 필터 함수**: 복잡한 필터링 로직 구현 가능

#### 구현 방법
```typescript
import { useReactTable, getCoreRowModel, getFilteredRowModel } from '@tanstack/react-table';

const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  state: {
    globalFilter, // 글로벌 검색어
    columnFilters, // 컬럼별 필터
  },
  onGlobalFilterChange: setGlobalFilter,
  onColumnFiltersChange: setColumnFilters,
});
```

#### 현재 코드와 비교
```typescript
// 현재 (registration-table.tsx:80-82)
const handleSearchResults = (results: any[], searchTerm: string) => {
  setFilteredData(results);
};

// TanStack Table 사용 시
// SearchBar에서 setGlobalFilter(searchTerm) 호출하면 자동 필터링
```

#### 서버 사이드 필터링
TanStack Table은 서버 사이드 필터링도 지원합니다:
```typescript
const table = useReactTable({
  data,
  columns,
  manualFiltering: true, // 서버 사이드 필터링 활성화
  onColumnFiltersChange: (filters) => {
    // SWR에 필터 파라미터 전달
    mutate(`/api/data?filters=${JSON.stringify(filters)}`);
  },
});
```

### 2. 정렬 (Sorting) ✅

#### 가능한 기능
- **단일 컬럼 정렬**: 한 컬럼씩 정렬
- **다중 컬럼 정렬**: Shift + 클릭으로 여러 컬럼 정렬
- **커스텀 정렬 함수**: 날짜, 숫자, 한글 등 커스텀 정렬
- **정렬 상태 유지**: localStorage에 저장 가능

#### 구현 방법
```typescript
import { getSortedRowModel } from '@tanstack/react-table';

const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  state: {
    sorting,
  },
  onSortingChange: setSorting,
});

// 컬럼 정의 시
const columns = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <button onClick={() => column.toggleSorting()}>
        이름 {column.getIsSorted() === 'asc' ? '↑' : column.getIsSorted() === 'desc' ? '↓' : ''}
      </button>
    ),
    sortingFn: 'alphanumeric', // 기본 정렬 함수
  },
  {
    accessorKey: 'amount',
    header: '금액',
    sortingFn: 'basic', // 숫자 정렬
  },
];
```

#### 현재 코드에 적용
현재는 정렬 기능이 없지만, TanStack Table을 사용하면 각 `TableHead`에 정렬 버튼을 쉽게 추가할 수 있습니다.

### 3. 열 순서 변경 (Column Ordering) ✅

#### 가능한 기능
- **드래그 앤 드롭**: DnD Kit, react-beautiful-dnd 등과 연동
- **프로그래매틱 변경**: 코드로 열 순서 변경
- **순서 저장**: localStorage에 사용자 설정 저장

#### 구현 방법
```typescript
const [columnOrder, setColumnOrder] = useState<string[]>([]);

const table = useReactTable({
  data,
  columns,
  state: {
    columnOrder,
  },
  onColumnOrderChange: setColumnOrder,
});

// DnD Kit과 연동
<DndContext onDragEnd={handleDragEnd}>
  <SortableContext items={table.getAllLeafColumns()}>
    {table.getHeaderGroups().map(headerGroup => (
      <TableRow key={headerGroup.id}>
        {headerGroup.headers.map(header => (
          <SortableTableHead key={header.id} header={header}>
            {flexRender(header.column.columnDef.header, header.getContext())}
          </SortableTableHead>
        ))}
      </TableRow>
    ))}
  </SortableContext>
</DndContext>
```

#### 현재 프로젝트와의 호환성
현재 프로젝트는 이미 `@hello-pangea/dnd` (v17.0.0)를 사용하고 있으므로, 이를 활용하여 컬럼 순서 변경을 구현할 수 있습니다.

### 4. 열 숨김 (Column Visibility) ✅

#### 가능한 기능
- **개별 컬럼 숨김/표시**: 체크박스로 컬럼 토글
- **기본 숨김 설정**: 특정 컬럼을 기본적으로 숨김
- **숨김 방지**: 중요한 컬럼은 숨김 불가
- **설정 저장**: 사용자 선호도 저장

#### 구현 방법
```typescript
const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
  phoneNumber: false, // 전화번호 컬럼 기본 숨김
});

const table = useReactTable({
  data,
  columns,
  state: {
    columnVisibility,
  },
  onColumnVisibilityChange: setColumnVisibility,
});

// 컬럼 정의 시 숨김 방지
const columns = [
  {
    accessorKey: 'name',
    header: '이름',
    enableHiding: false, // 이름 컬럼은 숨길 수 없음
  },
];

// UI: 컬럼 선택 드롭다운
<DropdownMenu>
  <DropdownMenuTrigger>컬럼 선택</DropdownMenuTrigger>
  <DropdownMenuContent>
    {table.getAllLeafColumns().map(column => (
      <DropdownMenuCheckboxItem
        key={column.id}
        checked={column.getIsVisible()}
        onCheckedChange={(value) => column.toggleVisibility(!!value)}
        disabled={!column.getCanHide()}
      >
        {column.columnDef.header}
      </DropdownMenuCheckboxItem>
    ))}
  </DropdownMenuContent>
</DropdownMenu>
```

#### 현재 테이블에 적용 시나리오
registration-table.tsx의 경우, 다음과 같은 컬럼을 숨김 가능하도록 설정할 수 있습니다:
- 전화번호 (기본 숨김)
- 처리자명 (선택적 숨김)
- 처리 시각 (선택적 숨김)
- 회계 메모 (선택적 숨김)

필수 컬럼 (항상 표시):
- 이름
- 부서
- 입금 현황
- 액션

### 5. SWR 연동 ✅

#### TanStack Table과 SWR의 호환성

TanStack Table은 헤드리스 라이브러리이므로, **어떤 데이터 페칭 라이브러리와도 함께 사용 가능**합니다.

#### 연동 방법

##### 기본 패턴
```typescript
import useSWR from 'swr';
import { useReactTable } from '@tanstack/react-table';

function RegistrationTable({ retreatSlug }: { retreatSlug: string }) {
  // SWR로 데이터 페칭
  const { data: registrations, mutate, isLoading } = useSWR(
    `/api/v1/retreat/${retreatSlug}/account/user-retreat-registration`,
    fetcher
  );

  // TanStack Table 초기화
  const table = useReactTable({
    data: registrations ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // 데이터 변경 후 SWR 캐시 갱신
  const handleConfirmPayment = async (id: string) => {
    await webAxios.post('/api/confirm-payment', { id });
    await mutate(); // SWR 캐시 갱신
  };

  return <Table table={table} />;
}
```

##### 서버 사이드 페이지네이션 + SWR
```typescript
const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

const { data } = useSWR(
  `/api/data?page=${pagination.pageIndex}&size=${pagination.pageSize}`,
  fetcher
);

const table = useReactTable({
  data: data?.items ?? [],
  pageCount: data?.pageCount ?? -1,
  state: {
    pagination,
  },
  onPaginationChange: setPagination,
  manualPagination: true, // 서버 사이드 페이지네이션
});
```

##### 현재 코드와 비교

**현재 (registration-table.tsx:63-77)**
```typescript
useEffect(() => {
  if (registrations.length > 0 && schedules.length > 0) {
    try {
      const transformedData = transformRegistrationsForTable(
        registrations,
        schedules
      );
      setData(transformedData);
      setFilteredData(transformedData);
    } catch (error) {
      console.error("데이터 변환 중 오류 발생:", error);
    }
  }
}, [registrations, schedules]);
```

**TanStack Table 사용 시**
```typescript
// useEffect와 state 관리 불필요
const table = useReactTable({
  data: useMemo(() =>
    transformRegistrationsForTable(registrations, schedules),
    [registrations, schedules]
  ),
  columns,
  // ...
});
```

#### SWR vs TanStack Query

검색 결과에 따르면, TanStack Table은 TanStack Query와 함께 사용되는 경우가 많지만, **SWR도 완벽하게 호환**됩니다.

**SWR 장점**:
- 번들 크기가 작음 (4.2KB vs 11.4KB)
- 현재 프로젝트에 이미 사용 중
- 단순한 API

**TanStack Query 장점**:
- 더 많은 기능 (쿼리 무효화, 낙관적 업데이트 등)
- TanStack 생태계와의 통합

현재 프로젝트는 이미 SWR을 사용하고 있으므로, **SWR을 그대로 유지하는 것을 권장**합니다.

### 6. 열 동적 생성 (Dynamic Columns) ✅

#### 가능한 기능
- **런타임 컬럼 생성**: API 응답에 따라 컬럼 생성
- **조건부 컬럼**: 사용자 권한에 따라 컬럼 표시/숨김
- **타입 안전 컬럼**: createColumnHelper로 타입 안전성 보장

#### 구현 방법

##### 현재 코드 (registration-table.tsx:301)
```typescript
const scheduleColumns = generateScheduleColumns(schedules);

// TableHeader에서 수동으로 매핑
{scheduleColumns.map(scheduleCol => (
  <TableHead key={scheduleCol.key}>
    <span className="text-xs">{scheduleCol.label}</span>
  </TableHead>
))}
```

##### TanStack Table 사용 시
```typescript
import { createColumnHelper } from '@tanstack/react-table';

const columnHelper = createColumnHelper<RegistrationData>();

// 스케줄 컬럼 동적 생성
const scheduleColumns = useMemo(
  () => schedules.map(schedule =>
    columnHelper.accessor(
      row => row.schedule[`schedule_${schedule.id}`],
      {
        id: `schedule_${schedule.id}`,
        header: schedule.name,
        cell: info => (
          <Checkbox
            checked={info.getValue()}
            disabled
            className={info.getValue() ? 'bg-green-500' : ''}
          />
        ),
      }
    )
  ),
  [schedules]
);

// 정적 컬럼과 동적 컬럼 결합
const columns = useMemo(
  () => [
    columnHelper.accessor('department', { header: '부서' }),
    columnHelper.accessor('gender', { header: '성별' }),
    ...scheduleColumns, // 동적 컬럼
    columnHelper.accessor('amount', { header: '금액' }),
  ],
  [scheduleColumns]
);

const table = useReactTable({
  data,
  columns,
  // ...
});
```

#### 장점
- **타입 안전성**: TypeScript 자동 완성 및 타입 체크
- **재사용성**: 컬럼 정의를 여러 테이블에서 재사용 가능
- **유지보수성**: 컬럼 로직이 한 곳에 집중

---

## 마이그레이션 전략

### 1단계: 패키지 설치
```bash
npm install @tanstack/react-table
```

### 2단계: 기존 테이블 분석 및 우선순위 결정

#### 우선순위 1 (핵심 테이블)
1. `registration-table.tsx` - 수양회 신청 현황
2. `AccountStaffTable.tsx` - 재정 간사 조회
3. `bus-registration-table.tsx` - 버스 신청 현황

#### 우선순위 2 (관리 테이블)
4. `GBSLineupManagementTable.tsx`
5. `DormitoryStaffTable.tsx`
6. `UnivGroupStaffRetreatTable.tsx`

#### 우선순위 3 (기타 테이블)
나머지 17개 테이블

### 3단계: 공통 컴포넌트 및 훅 개발

#### 3-1. 공통 훅 생성
```typescript
// src/hooks/useTableState.ts
export function useTableState() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  return {
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    columnVisibility,
    setColumnVisibility,
    columnOrder,
    setColumnOrder,
    globalFilter,
    setGlobalFilter,
  };
}
```

#### 3-2. 재사용 가능한 컬럼 헤더 컴포넌트
```typescript
// src/components/table/SortableHeader.tsx
export function SortableHeader({ column, title }: { column: Column<any>; title: string }) {
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting()}
      className="flex items-center gap-1"
    >
      {title}
      {column.getIsSorted() === 'asc' && <ArrowUp className="h-4 w-4" />}
      {column.getIsSorted() === 'desc' && <ArrowDown className="h-4 w-4" />}
    </Button>
  );
}
```

#### 3-3. 컬럼 가시성 토글 컴포넌트
```typescript
// src/components/table/ColumnVisibilityToggle.tsx
export function ColumnVisibilityToggle({ table }: { table: Table<any> }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          컬럼 선택
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {table.getAllLeafColumns().map(column => (
          <DropdownMenuCheckboxItem
            key={column.id}
            checked={column.getIsVisible()}
            onCheckedChange={value => column.toggleVisibility(!!value)}
            disabled={!column.getCanHide()}
          >
            {column.columnDef.header as string}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### 4단계: 점진적 마이그레이션

#### 기존 코드 유지하면서 새로운 컴포넌트 개발
```typescript
// 기존: registration-table.tsx
export function RegistrationTable({ ... }) { ... }

// 새로운: registration-table-v2.tsx (TanStack Table 사용)
export function RegistrationTableV2({ ... }) { ... }
```

#### A/B 테스트 또는 기능 플래그
```typescript
const USE_TANSTACK_TABLE = process.env.NEXT_PUBLIC_USE_TANSTACK_TABLE === 'true';

export function RegistrationTableWrapper(props) {
  return USE_TANSTACK_TABLE
    ? <RegistrationTableV2 {...props} />
    : <RegistrationTable {...props} />;
}
```

### 5단계: 성능 최적화

#### 메모이제이션
```typescript
const columns = useMemo(() => [...], [dependencies]);
const data = useMemo(() => transformData(rawData), [rawData]);
```

#### 가상화 (대량 데이터 처리)
```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

const rowVirtualizer = useVirtualizer({
  count: table.getRowModel().rows.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 50,
  overscan: 10,
});
```

---

## 결론 및 권장사항

### ✅ TanStack Table 도입이 적합한 이유

1. **현재 SWR과 완벽 호환**: 기존 데이터 페칭 로직을 그대로 유지 가능
2. **ShadCN UI와 함께 사용 가능**: 헤드리스 아키텍처로 UI 변경 없이 기능 추가
3. **확장성**: 정렬, 필터링, 컬럼 관리 등 모든 요구 기능 지원
4. **타입 안전성**: TypeScript 완벽 지원
5. **번들 크기**: 작은 번들 크기 (~13KB)로 성능 영향 최소화
6. **유지보수성**: 23개 테이블의 코드 중복 제거 가능

### 📊 기능별 구현 가능성 요약

| 기능 | 구현 가능 | 난이도 | 예상 시간 |
|------|----------|--------|----------|
| 필터/정렬 | ✅ | 낮음 | 2-3일 |
| 열 순서 변경 | ✅ | 중간 | 3-5일 |
| 열 숨김 | ✅ | 낮음 | 1-2일 |
| SWR 연동 | ✅ | 낮음 | 1일 |
| 열 동적 생성 | ✅ | 낮음 | 1-2일 |

### 🚀 단계별 도입 로드맵

#### Phase 1: 기반 작업 (1주)
- [ ] TanStack Table 설치
- [ ] 공통 훅 및 컴포넌트 개발
- [ ] 1개 테이블로 POC (Proof of Concept)

#### Phase 2: 핵심 테이블 마이그레이션 (2-3주)
- [ ] registration-table.tsx 마이그레이션
- [ ] AccountStaffTable.tsx 마이그레이션
- [ ] bus-registration-table.tsx 마이그레이션

#### Phase 3: 추가 기능 개발 (1-2주)
- [ ] 컬럼 정렬 기능
- [ ] 컬럼 가시성 토글
- [ ] 컬럼 순서 변경 (드래그 앤 드롭)

#### Phase 4: 나머지 테이블 마이그레이션 (3-4주)
- [ ] 우선순위 2 테이블 (6개)
- [ ] 우선순위 3 테이블 (17개)

#### Phase 5: 최적화 및 정리 (1주)
- [ ] 성능 최적화
- [ ] 기존 코드 제거
- [ ] 문서화

**총 예상 기간: 8-11주**

### ⚠️ 주의사항

1. **점진적 마이그레이션**: 한 번에 모든 테이블을 변경하지 말고, 하나씩 테스트하며 진행
2. **타입 안전성 유지**: `any` 타입 사용 최소화, 제네릭 활용
3. **성능 모니터링**: 대량 데이터 테이블은 가상화 적용 고려
4. **사용자 설정 저장**: localStorage 또는 서버에 컬럼 설정 저장
5. **접근성**: 키보드 네비게이션, 스크린 리더 지원

### 💡 추가 제안

1. **테이블 템플릿 컴포넌트 개발**
   ```typescript
   <DataTable
     data={data}
     columns={columns}
     enableSorting
     enableFiltering
     enableColumnVisibility
     enableRowSelection
   />
   ```

2. **컬럼 프리셋 관리**
   - 사용자가 자주 사용하는 컬럼 조합을 프리셋으로 저장
   - "기본 보기", "상세 보기", "간단 보기" 등

3. **엑셀 내보내기 개선**
   - 현재 표시된 컬럼과 필터된 데이터만 내보내기
   - TanStack Table의 상태를 활용

4. **키보드 단축키**
   - `Cmd/Ctrl + F`: 검색
   - `Cmd/Ctrl + H`: 컬럼 숨김 토글
   - 화살표 키: 셀 네비게이션

---

## 참고 자료

### 공식 문서
- [TanStack Table 공식 문서](https://tanstack.com/table/latest)
- [TanStack Table React 예제](https://tanstack.com/table/latest/docs/framework/react/examples)
- [SWR 공식 문서](https://swr.vercel.app/)

### 관련 아티클 (2025년 기준)
- [Server-side Pagination and Sorting with TanStack Table](https://medium.com/@aylo.srd/server-side-pagination-and-sorting-with-tanstack-table-and-react-bd493170125e)
- [TanStack Table in React: Everything You Need to Know](https://agilitycms.com/blog/tanstack-table-in-react-everything-you-need-to-know)
- [Column Management with TanStack Table](https://deepwiki.com/tanstack/table/4.5-column-management)

### GitHub 토론
- [Remote Filtering & Sorting Discussion](https://github.com/TanStack/table/discussions/4371)
- [Table data not refreshing with SWR](https://github.com/TanStack/table/discussions/3116)
- [Dynamic Columns from Asynchronous Data](https://github.com/TanStack/table/discussions/3405)

---

**작성일**: 2025-10-20
**버전**: 1.0
**작성자**: Claude Code Analysis
