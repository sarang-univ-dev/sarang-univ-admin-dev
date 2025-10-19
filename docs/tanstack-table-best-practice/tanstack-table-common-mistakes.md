# TanStack Table 흔한 실수와 안티패턴

## 개요

TanStack Table을 사용할 때 개발자들이 자주 범하는 실수와 이를 피하는 방법을 설명합니다.

## 1. 무한 리렌더링 루프

### 가장 흔한 실수: 불안정한 참조

#### ❌ 잘못된 예제

```typescript
function MyTable() {
  // 매 렌더링마다 새로운 배열이 생성됨
  const columns = [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'name', header: '이름' },
  ];

  const data = [
    { id: 1, name: 'John' },
    { id: 2, name: 'Jane' },
  ];

  // 테이블이 리렌더링 → columns/data가 새로 생성 → 무한 루프
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (/* ... */);
}
```

#### 증상

- 브라우저가 멈춤
- 콘솔에 "Maximum update depth exceeded" 에러
- React DevTools에서 계속 리렌더링되는 것이 보임

#### ✅ 해결 방법

```typescript
function MyTable() {
  // 방법 1: useMemo
  const columns = useMemo(
    () => [
      { accessorKey: 'id', header: 'ID' },
      { accessorKey: 'name', header: '이름' },
    ],
    []
  );

  const data = useMemo(
    () => [
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' },
    ],
    []
  );

  // 방법 2: useState
  const [data, setData] = useState(() => [
    { id: 1, name: 'John' },
    { id: 2, name: 'Jane' },
  ]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (/* ... */);
}
```

```typescript
// 방법 3: 컴포넌트 외부에 정의
const columns = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: '이름' },
];

function MyTable() {
  const [data, setData] = useState([
    { id: 1, name: 'John' },
    { id: 2, name: 'Jane' },
  ]);

  const table = useReactTable({
    data,
    columns, // 안정적인 참조
    getCoreRowModel: getCoreRowModel(),
  });

  return (/* ... */);
}
```

### 핵심 원칙

> **데이터와 컬럼 정의는 반드시 안정적인 참조를 가져야 합니다.**

## 2. 제어 상태 관련 실수

### 실수 1: 상태만 제공하고 콜백 누락

#### ❌ 잘못된 예제

```typescript
function MyTable() {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting, // 상태는 제공
    },
    // ❌ onSortingChange가 없음!
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // 정렬 버튼을 클릭해도 아무 일도 일어나지 않음
  return (/* ... */);
}
```

#### 증상

- 정렬/필터링 등의 기능이 작동하지 않음
- 상태가 "동결"된 것처럼 보임
- 에러는 발생하지 않지만 UI가 업데이트되지 않음

#### ✅ 해결 방법

```typescript
function MyTable() {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting, // ✅ 콜백 제공
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (/* ... */);
}
```

### 실수 2: Updater 함수 패턴 무시

#### ❌ 잘못된 예제

```typescript
function MyTable() {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: (updater) => {
      // ❌ updater가 함수일 수 있음을 무시
      setSorting(updater); // TypeScript 에러!
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (/* ... */);
}
```

#### ✅ 해결 방법

```typescript
function MyTable() {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: (updater) => {
      // ✅ updater가 함수인지 확인
      const newSorting =
        typeof updater === 'function' ? updater(sorting) : updater;
      setSorting(newSorting);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (/* ... */);
}

// 더 나은 방법: setState는 updater를 직접 받을 수 있음
const table = useReactTable({
  // ...
  onSortingChange: setSorting, // ✅ React의 setState가 알아서 처리
});
```

## 3. 성능 관련 실수

### 실수 1: 대량 데이터에 클라이언트 사이드 처리

#### ❌ 잘못된 예제

```typescript
function HugeTable() {
  const [data, setData] = useState([]); // 100,000+ 행

  useEffect(() => {
    // 모든 데이터를 한 번에 로드
    fetch('/api/all-data')
      .then(res => res.json())
      .then(setData);
  }, []);

  const table = useReactTable({
    data, // 100,000+ 행을 모두 렌더링하려고 시도
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(), // 클라이언트에서 정렬
  });

  return (/* ... */); // 브라우저가 멈춤
}
```

#### 증상

- 초기 로딩이 매우 느림
- 브라우저가 멈추거나 크래시
- 정렬/필터링 시 수 초 이상 소요
- 메모리 사용량 급증

#### ✅ 해결 방법

**옵션 1: 서버 사이드 처리**

```typescript
function OptimizedTable() {
  const [pagination, setPagination] = useState({
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
  });

  const table = useReactTable({
    data: data?.rows ?? [],
    pageCount: data?.pageCount ?? -1,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true, // ✅ 서버에서 처리
  });

  return (/* ... */);
}
```

**옵션 2: 가상화**

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualizedTable() {
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const table = useReactTable({
    data, // 많은 데이터
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 35,
    overscan: 10,
  });

  return (
    <div ref={tableContainerRef} style={{ height: '600px', overflow: 'auto' }}>
      {/* 뷰포트에 보이는 행만 렌더링 */}
      {rowVirtualizer.getVirtualItems().map(virtualRow => {
        const row = rows[virtualRow.index];
        return <div key={row.id}>{/* ... */}</div>;
      })}
    </div>
  );
}
```

### 실수 2: 컬럼 크기 조정 시 성능 저하

#### ❌ 잘못된 예제

```typescript
const table = useReactTable({
  data,
  columns,
  enableColumnResizing: true,
  columnResizeMode: 'onChange', // 매 픽셀마다 리렌더링
  getCoreRowModel: getCoreRowModel(),
});
```

#### 증상

- 컬럼 크기 조정 시 끊김 현상
- 드래그가 부드럽지 않음

#### ✅ 해결 방법

```typescript
const table = useReactTable({
  data,
  columns,
  enableColumnResizing: true,
  columnResizeMode: 'onEnd', // ✅ 크기 조정이 끝날 때만 업데이트
  getCoreRowModel: getCoreRowModel(),
});
```

### 실수 3: 모든 상태를 불필요하게 제어

#### ❌ 잘못된 예제

```typescript
function OverControlledTable() {
  // 모든 상태를 제어 (불필요)
  const [sorting, setSorting] = useState([]);
  const [pagination, setPagination] = useState({});
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const [columnOrder, setColumnOrder] = useState([]);
  const [columnPinning, setColumnPinning] = useState({});
  const [columnSizingInfo, setColumnSizingInfo] = useState({}); // ❌ 매우 빈번하게 변경됨!

  // 모든 상태를 호이스팅 → 성능 저하
}
```

#### ✅ 해결 방법

```typescript
function WellControlledTable() {
  // 필요한 상태만 제어
  const [sorting, setSorting] = useState([]);
  const [pagination, setPagination] = useState({});

  // 나머지는 테이블이 내부적으로 관리
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      pagination,
      // columnSizingInfo는 제어하지 않음
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
  });
}
```

## 4. TypeScript 관련 실수

### 실수 1: 타입 안전성 무시

#### ❌ 잘못된 예제

```typescript
// 타입 정의 없이 사용
const columns = [
  {
    accessorKey: 'firstName', // 오타 발생 가능
    cell: (info: any) => info.getValue(), // any 사용
  },
];
```

#### ✅ 해결 방법

```typescript
import { createColumnHelper } from '@tanstack/react-table';

type User = {
  id: number;
  firstName: string;
  lastName: string;
};

const columnHelper = createColumnHelper<User>();

const columns = [
  columnHelper.accessor('firstName', {
    // ✅ 자동완성 및 타입 체크
    cell: info => info.getValue(), // ✅ 타입 추론됨
  }),
  // columnHelper.accessor('firstNam', { // ❌ TypeScript 에러!
];
```

### 실수 2: ColumnDef 타입 불일치

#### ❌ 잘못된 예제

```typescript
type User = {
  id: number;
  name: string;
};

type Product = {
  id: string;
  title: string;
};

// ❌ Product 타입으로 컬럼을 정의했지만 User 데이터 전달
const columns: ColumnDef<Product>[] = [
  { accessorKey: 'title', header: 'Title' },
];

const table = useReactTable({
  data: userData, // User[] 타입
  columns, // ColumnDef<Product>[] 타입
  getCoreRowModel: getCoreRowModel(),
});
```

#### ✅ 해결 방법

```typescript
type User = {
  id: number;
  name: string;
};

const columns: ColumnDef<User>[] = [
  { accessorKey: 'name', header: 'Name' },
];

const table = useReactTable({
  data: userData, // User[] 타입
  columns, // ColumnDef<User>[] 타입 - 일치!
  getCoreRowModel: getCoreRowModel(),
});
```

## 5. 기능 구현 관련 실수

### 실수 1: Row Model 누락

#### ❌ 잘못된 예제

```typescript
const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  // ❌ getSortedRowModel이 없음
});

// 정렬 버튼 클릭 시 상태는 변경되지만 실제로 정렬되지 않음
```

#### 증상

- 정렬 상태는 변경되지만 데이터가 정렬되지 않음
- 필터 상태는 변경되지만 데이터가 필터링되지 않음

#### ✅ 해결 방법

```typescript
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel, // ✅ 추가
  getFilteredRowModel, // ✅ 필터링 사용 시
  getPaginationRowModel, // ✅ 페이지네이션 사용 시
} from '@tanstack/react-table';

const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(), // ✅
  getFilteredRowModel: getFilteredRowModel(), // ✅
  getPaginationRowModel: getPaginationRowModel(), // ✅
});
```

### 실수 2: 서버 사이드 처리 시 manual 옵션 누락

#### ❌ 잘못된 예제

```typescript
function ServerSideTable() {
  const { data } = useQuery({
    queryKey: ['tableData', pagination, sorting],
    queryFn: () => fetchData(pagination, sorting),
  });

  const table = useReactTable({
    data: data?.rows ?? [],
    columns,
    state: { pagination, sorting },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(), // ❌ 클라이언트에서 다시 정렬
    // manualSorting이 없음
  });
}
```

#### 증상

- 데이터가 이중으로 정렬됨 (서버 + 클라이언트)
- 페이지네이션이 제대로 작동하지 않음
- 성능 저하

#### ✅ 해결 방법

```typescript
function ServerSideTable() {
  const { data } = useQuery({
    queryKey: ['tableData', pagination, sorting],
    queryFn: () => fetchData(pagination, sorting),
  });

  const table = useReactTable({
    data: data?.rows ?? [],
    pageCount: data?.pageCount ?? -1, // ✅ 총 페이지 수 제공
    columns,
    state: { pagination, sorting },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true, // ✅ 서버에서 페이지네이션 처리
    manualSorting: true, // ✅ 서버에서 정렬 처리
    manualFiltering: true, // ✅ 필터링도 서버에서 처리한다면
  });
}
```

## 6. 렌더링 관련 실수

### 실수 1: 컴포넌트 내부에서 매번 함수 생성

#### ❌ 잘못된 예제

```typescript
const columns = useMemo(
  () => [
    {
      id: 'actions',
      cell: (props) => (
        // ❌ 매 렌더링마다 새로운 함수 생성
        <button onClick={() => {
          console.log(props.row.id);
          handleEdit(props.row.original);
        }}>
          수정
        </button>
      ),
    },
  ],
  [] // handleEdit가 의존성에 없음!
);
```

#### ✅ 해결 방법

```typescript
// 방법 1: useCallback 사용
const handleEditClick = useCallback((row: User) => {
  console.log(row.id);
  handleEdit(row);
}, [handleEdit]);

const columns = useMemo(
  () => [
    {
      id: 'actions',
      cell: (props) => (
        <button onClick={() => handleEditClick(props.row.original)}>
          수정
        </button>
      ),
    },
  ],
  [handleEditClick]
);

// 방법 2: 재사용 가능한 컴포넌트
const ActionCell = memo(({ row }: { row: User }) => {
  return (
    <button onClick={() => handleEdit(row)}>
      수정
    </button>
  );
});

const columns = useMemo(
  () => [
    {
      id: 'actions',
      cell: (props) => <ActionCell row={props.row.original} />,
    },
  ],
  []
);
```

### 실수 2: flexRender 사용하지 않음

#### ❌ 잘못된 예제

```typescript
<th>
  {header.column.columnDef.header} {/* 함수형 헤더가 작동하지 않음 */}
</th>
```

#### ✅ 해결 방법

```typescript
import { flexRender } from '@tanstack/react-table';

<th>
  {flexRender(
    header.column.columnDef.header,
    header.getContext()
  )}
</th>
```

## 7. 데이터 관련 실수

### 실수 1: 고유 ID 없음

#### ❌ 잘못된 예제

```typescript
const data = [
  { name: 'John', age: 30 }, // id 필드 없음
  { name: 'Jane', age: 25 },
];

const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
});

// React key 경고 발생
```

#### ✅ 해결 방법

```typescript
// 방법 1: 데이터에 id 추가
const data = [
  { id: 1, name: 'John', age: 30 },
  { id: 2, name: 'Jane', age: 25 },
];

// 방법 2: getRowId 옵션 사용
const table = useReactTable({
  data,
  columns,
  getRowId: (row, index) => row.name, // 또는 다른 고유 값
  getCoreRowModel: getCoreRowModel(),
});
```

### 실수 2: 데이터 불변성 위반

#### ❌ 잘못된 예제

```typescript
const handleUpdate = (id: number, newValue: string) => {
  const item = data.find(d => d.id === id);
  item.name = newValue; // ❌ 직접 수정
  setData(data); // 참조가 동일하므로 리렌더링 안 됨
};
```

#### ✅ 해결 방법

```typescript
const handleUpdate = (id: number, newValue: string) => {
  setData(prevData =>
    prevData.map(item =>
      item.id === id ? { ...item, name: newValue } : item
    )
  );
};
```

## 8. 체크리스트

### 데이터 & 컬럼

- [ ] 데이터와 컬럼이 안정적인 참조를 가지는가? (useMemo/useState/외부 정의)
- [ ] TypeScript를 사용한다면 타입이 올바르게 정의되었는가?
- [ ] 각 행에 고유 ID가 있는가?

### 상태 관리

- [ ] 제어 상태의 경우 state와 on[State]Change를 쌍으로 제공했는가?
- [ ] Updater 함수 패턴을 올바르게 처리하고 있는가?
- [ ] 불필요한 상태를 제어하고 있지 않은가?

### 성능

- [ ] 대량 데이터에 서버 사이드 처리 또는 가상화를 적용했는가?
- [ ] 컬럼 크기 조정 모드를 적절히 설정했는가? (onEnd)
- [ ] 빈번하게 변경되는 상태를 호이스팅하지 않았는가?

### 기능 구현

- [ ] 사용하는 기능에 맞는 Row Model을 임포트했는가?
- [ ] 서버 사이드 처리 시 manual* 옵션을 설정했는가?
- [ ] flexRender를 사용하여 헤더/셀을 렌더링하고 있는가?

## 9. 디버깅 팁

### 무한 루프 확인

```typescript
useEffect(() => {
  console.log('Table rendered', { data, columns });
}, [data, columns]);

// 콘솔이 계속 출력된다면 참조가 불안정함
```

### 상태 변경 추적

```typescript
const table = useReactTable({
  data,
  columns,
  onStateChange: (updater) => {
    console.log('State changing:', updater);
  },
  getCoreRowModel: getCoreRowModel(),
});
```

### React DevTools Profiler 사용

1. React DevTools 설치
2. Profiler 탭 열기
3. 녹화 시작
4. 테이블 상호작용
5. 불필요한 리렌더링 확인

## 결론

TanStack Table의 대부분의 문제는 **불안정한 참조**, **잘못된 상태 관리**, **성능 최적화 부족**에서 발생합니다. 이 가이드의 패턴을 따르면 대부분의 일반적인 문제를 피할 수 있습니다.

**핵심 체크포인트:**
1. 데이터/컬럼은 항상 메모이제이션
2. 제어 상태는 state + callback 쌍으로
3. 대량 데이터는 서버 사이드 또는 가상화
4. 필요한 Row Model만 임포트
5. TypeScript로 타입 안전성 확보
