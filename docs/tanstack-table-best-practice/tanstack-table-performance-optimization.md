# TanStack Table 성능 최적화 가이드

## 개요

TanStack Table은 적절한 최적화를 통해 수만 개의 행을 원활하게 처리할 수 있습니다. 이 가이드는 테이블 성능을 최대화하기 위한 검증된 기법들을 다룹니다.

## 1. 메모이제이션 (Memoization)

### 핵심 원칙

데이터와 컬럼 정의는 **반드시 안정적인 참조**를 가져야 합니다. 그렇지 않으면 무한 리렌더링이 발생할 수 있습니다.

### ❌ 잘못된 예제

```typescript
function MyTable() {
  // 매 렌더링마다 새로운 배열이 생성됨
  const data = [
    { id: 1, name: 'John' },
    { id: 2, name: 'Jane' },
  ];

  const columns = [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'name', header: 'Name' },
  ];

  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });
  // ...
}
```

### ✅ 올바른 예제

#### 방법 1: useMemo 사용

```typescript
function MyTable() {
  const data = useMemo(
    () => [
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' },
    ],
    [] // 의존성이 변경될 때만 재계산
  );

  const columns = useMemo(
    () => [
      { accessorKey: 'id', header: 'ID' },
      { accessorKey: 'name', header: 'Name' },
    ],
    []
  );

  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });
  // ...
}
```

#### 방법 2: useState 사용

```typescript
function MyTable() {
  const [data, setData] = useState(() => [
    { id: 1, name: 'John' },
    { id: 2, name: 'Jane' },
  ]);

  const columns = useMemo(
    () => [
      { accessorKey: 'id', header: 'ID' },
      { accessorKey: 'name', header: 'Name' },
    ],
    []
  );

  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });
  // ...
}
```

#### 방법 3: 컴포넌트 외부에 정의

```typescript
const columns = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Name' },
];

function MyTable({ data }: { data: Person[] }) {
  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });
  // ...
}
```

#### 방법 4: 외부 상태 관리 라이브러리 사용

```typescript
// Redux, Zustand, TanStack Query 등
import { useStore } from './store';

function MyTable() {
  const data = useStore(state => state.tableData);
  // data는 이미 안정적인 참조를 가짐
}
```

### 함수 메모이제이션

```typescript
const handleSort = useCallback((column: Column) => {
  // 정렬 로직
}, []);

const renderCell = useCallback((value: any) => {
  // 복잡한 셀 렌더링 로직
}, []);
```

## 2. 가상화 (Virtualization)

대량의 행을 처리할 때는 가상화가 필수입니다.

### 설치

```bash
npm install @tanstack/react-virtual
```

### 구현 예제

```typescript
import { useReactTable, getCoreRowModel } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

function VirtualizedTable() {
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const table = useReactTable({
    data, // 10,000+ rows
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 35, // 예상 행 높이 (px)
    overscan: 10, // 뷰포트 밖에 미리 렌더링할 행 수
  });

  return (
    <div ref={tableContainerRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
        {rowVirtualizer.getVirtualItems().map(virtualRow => {
          const row = rows[virtualRow.index];
          return (
            <div
              key={row.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {/* 행 내용 렌더링 */}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

### 가상화의 이점

- **초기 렌더링 시간 감소**: 뷰포트에 보이는 요소만 렌더링
- **메모리 사용량 감소**: DOM 요소 수를 최소화
- **스크롤 성능 향상**: 부드러운 스크롤 경험

## 3. 페이지네이션 전략

### 클라이언트 사이드 페이지네이션

소규모 데이터셋(~10,000행 이하)에 적합합니다.

```typescript
const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  initialState: {
    pagination: {
      pageSize: 50,
    },
  },
});

// 페이지네이션 컨트롤
<button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
  이전
</button>
<button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
  다음
</button>
```

### 서버 사이드 페이지네이션

대규모 데이터셋에 필수적입니다.

```typescript
const [pagination, setPagination] = useState({
  pageIndex: 0,
  pageSize: 50,
});

// API 호출
const { data: apiData, isLoading } = useQuery({
  queryKey: ['tableData', pagination],
  queryFn: () => fetchData(pagination.pageIndex, pagination.pageSize),
});

const table = useReactTable({
  data: apiData?.rows ?? [],
  pageCount: apiData?.pageCount ?? -1,
  columns,
  state: {
    pagination,
  },
  onPaginationChange: setPagination,
  getCoreRowModel: getCoreRowModel(),
  manualPagination: true, // 서버에서 페이지네이션 처리
});
```

### 페이지네이션 vs 가상화

| 기준 | 페이지네이션 | 가상화 |
|------|------------|--------|
| 데이터 크기 | 모든 크기 | 대량 데이터 |
| UX | 페이지 단위 탐색 | 무한 스크롤 |
| 구현 복잡도 | 낮음 | 중간 |
| 성능 | 중간 | 높음 |
| 서버 부하 | 낮음 (서버 사이드) | 높음 (클라이언트 사이드) |

## 4. 데이터 페칭 최적화

### TanStack Query와 함께 사용

```typescript
import { useQuery } from '@tanstack/react-query';

function OptimizedTable() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['tableData'],
    queryFn: fetchTableData,
    staleTime: 5 * 60 * 1000, // 5분
    cacheTime: 10 * 60 * 1000, // 10분
  });

  const columns = useMemo(() => [/* ... */], []);

  const table = useReactTable({
    data: data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) return <div>로딩 중...</div>;
  if (error) return <div>에러 발생</div>;

  // 테이블 렌더링
}
```

### 지연 로딩 (Lazy Loading)

```typescript
const [visibleData, setVisibleData] = useState(initialData);

const loadMore = useCallback(() => {
  // 스크롤이 끝에 도달했을 때 더 많은 데이터 로드
  fetchMoreData().then(newData => {
    setVisibleData(prev => [...prev, ...newData]);
  });
}, []);
```

## 5. 컬럼 크기 조정 최적화

### 성능 문제

컬럼 크기 조정 중 발생하는 빈번한 리렌더링은 성능 저하를 일으킬 수 있습니다.

### 해결책 1: "onEnd" 모드 사용

```typescript
const table = useReactTable({
  data,
  columns,
  columnResizeMode: 'onEnd', // 크기 조정이 끝날 때만 업데이트
  getCoreRowModel: getCoreRowModel(),
});
```

### 해결책 2: CSS 변수 사용

```typescript
// 헤더 스타일
<th
  style={{
    width: `calc(var(--header-${header.id}-size) * 1px)`,
  }}
>

// CSS에서
:root {
  --header-name-size: 200;
  --header-age-size: 100;
}
```

### 해결책 3: 테이블 바디 메모이제이션

```typescript
const TableBody = memo(({ rows }) => {
  return (
    <tbody>
      {rows.map(row => (
        <TableRow key={row.id} row={row} />
      ))}
    </tbody>
  );
});
```

## 6. 이벤트 핸들러 최적화

### 디바운싱 (Debouncing)

```typescript
import { useDebouncedCallback } from 'use-debounce';

function SearchableTable() {
  const [globalFilter, setGlobalFilter] = useState('');

  const debouncedSetGlobalFilter = useDebouncedCallback(
    (value: string) => {
      setGlobalFilter(value);
    },
    300 // 300ms 지연
  );

  return (
    <input
      onChange={e => debouncedSetGlobalFilter(e.target.value)}
      placeholder="검색..."
    />
  );
}
```

### 윈도우 리사이즈 최적화

```typescript
useEffect(() => {
  const handleResize = debounce(() => {
    // 리사이즈 로직
  }, 300);

  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

## 7. Tree-Shaking 최적화

필요한 기능만 임포트하여 번들 크기를 줄입니다.

### ❌ 잘못된 예제

```typescript
import * as ReactTable from '@tanstack/react-table';
```

### ✅ 올바른 예제

```typescript
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  // 필요한 것만 임포트
} from '@tanstack/react-table';
```

## 8. 프로파일링 및 디버깅

### React DevTools 프로파일러 사용

1. React DevTools 설치
2. Profiler 탭 열기
3. 녹화 시작
4. 테이블 상호작용
5. 녹화 중지 및 분석

### 리렌더링 추적

```typescript
import { useEffect } from 'react';

function TableRow({ row }) {
  useEffect(() => {
    console.log('Row re-rendered:', row.id);
  });

  return <tr>{/* ... */}</tr>;
}
```

### 성능 측정

```typescript
console.time('Table Render');
const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
});
console.timeEnd('Table Render');
```

## 9. 실제 성능 개선 사례

### 사례: 1000배 성능 향상

한 개발자가 그룹핑 기능에서 `concat` 사용 방식을 최적화하여 극적인 성능 향상을 달성했습니다.

**문제:**
- 그룹핑 활성화 시 수천 개의 행에서 렌더링이 30-40초 소요

**해결:**
- 스프레드 연산자 대신 `concat`에 배열을 직접 전달
- V8 엔진에서 `concat`이 스프레드보다 2배 빠름

**교훈:**
- 작은 최적화도 큰 영향을 미칠 수 있음
- 프로파일링으로 병목 지점 식별
- JavaScript 엔진의 동작 이해

## 10. 성능 체크리스트

### 필수 사항

- [ ] 데이터와 컬럼을 `useMemo` 또는 `useState`로 메모이제이션
- [ ] 10,000개 이상의 행에는 가상화 사용
- [ ] 대량 데이터에 서버 사이드 페이지네이션 구현
- [ ] 필요한 row model만 임포트 (tree-shaking)
- [ ] 이벤트 핸들러 디바운싱

### 권장 사항

- [ ] TanStack Query로 데이터 페칭 최적화
- [ ] 컬럼 크기 조정에 "onEnd" 모드 사용
- [ ] 복잡한 컴포넌트 메모이제이션 (`React.memo`)
- [ ] 무거운 계산에 `useMemo` 사용
- [ ] React DevTools로 프로파일링

### 고급 최적화

- [ ] Web Workers로 데이터 처리 분리
- [ ] 가상 스크롤과 지연 로딩 결합
- [ ] CSS 변수로 컬럼 크기 관리
- [ ] 테이블 바디 메모이제이션
- [ ] 커스텀 동등성 함수 사용

## 11. 안티패턴

### 피해야 할 것들

```typescript
// ❌ 인라인 객체/배열
<Table data={[...]} columns={[...]} />

// ❌ 컴포넌트 내부에서 매번 새로운 함수 생성
const columns = [
  {
    cell: info => <button onClick={() => alert(info.getValue())}>Click</button>
  }
];

// ❌ 불필요한 전체 테이블 리렌더링
const [sorting, setSorting] = useState([]);
// 모든 상태 변경 시 전체 테이블 리렌더링

// ❌ 과도한 상태 호이스팅
const [tableState, setTableState] = useState({});
// 모든 테이블 상태를 제어하면 성능 저하
```

## 12. 측정 및 모니터링

### 성능 지표

- **초기 렌더링 시간**: < 100ms (1,000행 기준)
- **정렬 시간**: < 50ms
- **필터링 시간**: < 50ms
- **스크롤 FPS**: 60fps 유지
- **메모리 사용량**: 적절한 수준 유지

### 모니터링 도구

- React DevTools Profiler
- Chrome DevTools Performance 탭
- Lighthouse 성능 측정
- Web Vitals (LCP, FID, CLS)

## 결론

TanStack Table의 성능 최적화는 **메모이제이션**, **가상화**, **적절한 페이지네이션 전략**의 조합으로 이루어집니다. 각 프로젝트의 특성에 맞게 이러한 기법들을 적용하여 최적의 사용자 경험을 제공하세요.

**핵심 원칙:**
1. 안정적인 참조 유지
2. 필요한 것만 렌더링
3. 무거운 작업은 지연/분산 처리
4. 지속적인 측정과 개선
