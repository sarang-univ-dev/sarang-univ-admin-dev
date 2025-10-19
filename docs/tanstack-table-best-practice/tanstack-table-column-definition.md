# TanStack Table 컬럼 정의 모범 사례

## 개요

컬럼 정의는 TanStack Table의 핵심입니다. 이 가이드는 TypeScript와 함께 타입 안전하고 유지보수 가능한 컬럼을 정의하는 방법을 다룹니다.

## 1. 데이터 타입 정의하기

### 먼저 타입 정의

테이블 작업을 시작하기 전에 항상 데이터의 형태(shape)를 정의하세요.

```typescript
// ✅ 좋은 예제
type User = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  age: number;
  status: 'active' | 'inactive' | 'pending';
  createdAt: Date;
};
```

### 왜 타입을 먼저 정의해야 하나?

- **타입 안전성**: 컴파일 타임에 오류 검출
- **자동 완성**: IDE가 정확한 속성을 제안
- **리팩토링 용이성**: 타입 변경 시 영향받는 곳을 쉽게 파악
- **문서화**: 타입 자체가 문서 역할

## 2. createColumnHelper 사용하기

`createColumnHelper`는 최고 수준의 타입 안전성을 제공합니다.

### 기본 사용법

```typescript
import { createColumnHelper } from '@tanstack/react-table';

type User = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
};

const columnHelper = createColumnHelper<User>();

const columns = [
  columnHelper.accessor('id', {
    header: 'ID',
    cell: info => info.getValue(),
  }),
  columnHelper.accessor('firstName', {
    header: '이름',
    cell: info => info.getValue(),
  }),
  columnHelper.accessor('email', {
    header: '이메일',
    cell: info => (
      <a href={`mailto:${info.getValue()}`}>
        {info.getValue()}
      </a>
    ),
  }),
];
```

### Accessor 함수 사용

```typescript
// 계산된 값
columnHelper.accessor(row => `${row.firstName} ${row.lastName}`, {
  id: 'fullName',
  header: '전체 이름',
  cell: info => info.getValue(),
}),

// 중첩된 객체
type User = {
  id: number;
  profile: {
    name: string;
    avatar: string;
  };
};

columnHelper.accessor(row => row.profile.name, {
  id: 'profileName',
  header: '프로필 이름',
}),
```

## 3. 컬럼 타입 이해하기

TanStack Table은 세 가지 컬럼 타입을 지원합니다.

### Accessor Columns

데이터 모델과 연결되어 정렬/필터링을 위한 값을 제공합니다.

```typescript
// Object Key Access
columnHelper.accessor('firstName', {
  header: '이름',
}),

// Accessor Function
columnHelper.accessor(row => row.firstName.toUpperCase(), {
  id: 'upperFirstName',
  header: '이름 (대문자)',
}),
```

### Display Columns

데이터 모델이 없고 임의의 콘텐츠를 표시합니다.

```typescript
columnHelper.display({
  id: 'actions',
  header: '작업',
  cell: props => (
    <div>
      <button onClick={() => handleEdit(props.row.original)}>
        수정
      </button>
      <button onClick={() => handleDelete(props.row.original.id)}>
        삭제
      </button>
    </div>
  ),
}),
```

### Grouping Columns

다른 컬럼을 계층적으로 구성합니다.

```typescript
columnHelper.group({
  id: 'userInfo',
  header: '사용자 정보',
  columns: [
    columnHelper.accessor('firstName', { header: '이름' }),
    columnHelper.accessor('lastName', { header: '성' }),
    columnHelper.accessor('email', { header: '이메일' }),
  ],
}),
```

## 4. 컬럼 메타데이터 활용

### 컬럼 메타 정의

```typescript
declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends RowData, TValue> {
    align?: 'left' | 'center' | 'right';
    width?: string;
    sortable?: boolean;
    filterable?: boolean;
  }
}

const columns = [
  columnHelper.accessor('age', {
    header: '나이',
    meta: {
      align: 'right',
      width: '80px',
      sortable: true,
      filterable: true,
    },
  }),
];

// 렌더링 시 메타 사용
<th style={{ textAlign: header.column.columnDef.meta?.align }}>
  {flexRender(header.column.columnDef.header, header.getContext())}
</th>
```

## 5. 기본 컬럼 옵션

모든 컬럼에 공통으로 적용할 옵션을 설정할 수 있습니다.

```typescript
const table = useReactTable({
  data,
  columns,
  defaultColumn: {
    size: 150,
    minSize: 50,
    maxSize: 500,
    cell: ({ getValue }) => {
      const value = getValue();
      return value ?? '-'; // null/undefined 처리
    },
  },
  getCoreRowModel: getCoreRowModel(),
});
```

## 6. 컬럼 정의 패턴

### 패턴 1: 재사용 가능한 셀 컴포넌트

```typescript
// 공통 셀 컴포넌트
const DateCell = ({ value }: { value: Date }) => {
  return <span>{format(value, 'yyyy-MM-dd')}</span>;
};

const StatusBadge = ({ value }: { value: string }) => {
  const colors = {
    active: 'green',
    inactive: 'gray',
    pending: 'yellow',
  };

  return (
    <span style={{ color: colors[value] }}>
      {value}
    </span>
  );
};

// 컬럼 정의에서 사용
const columns = [
  columnHelper.accessor('createdAt', {
    header: '생성일',
    cell: info => <DateCell value={info.getValue()} />,
  }),
  columnHelper.accessor('status', {
    header: '상태',
    cell: info => <StatusBadge value={info.getValue()} />,
  }),
];
```

### 패턴 2: 컬럼 팩토리 함수

```typescript
function createActionColumn<T>(
  onEdit: (row: T) => void,
  onDelete: (row: T) => void
) {
  return columnHelper.display({
    id: 'actions',
    header: '작업',
    cell: props => (
      <div className="action-buttons">
        <button onClick={() => onEdit(props.row.original)}>
          수정
        </button>
        <button onClick={() => onDelete(props.row.original)}>
          삭제
        </button>
      </div>
    ),
  });
}

// 사용
const columns = [
  // ... 다른 컬럼들
  createActionColumn(handleEdit, handleDelete),
];
```

### 패턴 3: 조건부 컬럼

```typescript
const createColumns = (permissions: UserPermissions) => {
  const baseColumns = [
    columnHelper.accessor('id', { header: 'ID' }),
    columnHelper.accessor('name', { header: '이름' }),
  ];

  const adminColumns = permissions.isAdmin
    ? [
        columnHelper.accessor('email', { header: '이메일' }),
        columnHelper.display({
          id: 'admin-actions',
          header: '관리자 작업',
          cell: () => <AdminActions />,
        }),
      ]
    : [];

  return [...baseColumns, ...adminColumns];
};
```

## 7. 컬럼 메모이제이션

### 필수: 컬럼 정의 메모이제이션

```typescript
function MyTable() {
  // ✅ 좋은 예제: useMemo 사용
  const columns = useMemo(
    () => [
      columnHelper.accessor('id', { header: 'ID' }),
      columnHelper.accessor('name', { header: '이름' }),
    ],
    [] // 의존성이 없으면 한 번만 생성
  );

  // ✅ 의존성이 있는 경우
  const columnsWithCallback = useMemo(
    () => [
      columnHelper.accessor('id', { header: 'ID' }),
      columnHelper.display({
        id: 'actions',
        cell: props => (
          <button onClick={() => handleAction(props.row.id)}>
            작업
          </button>
        ),
      }),
    ],
    [handleAction] // handleAction이 변경될 때만 재생성
  );

  // ...
}
```

## 8. 컬럼 정렬 및 필터링 설정

### 정렬 설정

```typescript
const columns = [
  columnHelper.accessor('age', {
    header: '나이',
    enableSorting: true,
    sortingFn: 'alphanumeric', // 기본 정렬 함수
  }),
  columnHelper.accessor('createdAt', {
    header: '생성일',
    enableSorting: true,
    sortingFn: (rowA, rowB, columnId) => {
      const dateA = rowA.getValue(columnId) as Date;
      const dateB = rowB.getValue(columnId) as Date;
      return dateA.getTime() - dateB.getTime();
    },
  }),
];
```

### 필터링 설정

```typescript
const columns = [
  columnHelper.accessor('name', {
    header: '이름',
    enableColumnFilter: true,
    filterFn: 'includesString', // 기본 필터 함수
  }),
  columnHelper.accessor('age', {
    header: '나이',
    enableColumnFilter: true,
    filterFn: (row, columnId, filterValue) => {
      const age = row.getValue(columnId) as number;
      const [min, max] = filterValue as [number, number];
      return age >= min && age <= max;
    },
  }),
];
```

## 9. 컬럼 크기 조정

### 기본 크기 설정

```typescript
const columns = [
  columnHelper.accessor('id', {
    header: 'ID',
    size: 80,
    minSize: 50,
    maxSize: 150,
  }),
  columnHelper.accessor('description', {
    header: '설명',
    size: 300,
    minSize: 200,
    maxSize: 600,
  }),
];

const table = useReactTable({
  data,
  columns,
  enableColumnResizing: true,
  columnResizeMode: 'onChange', // 또는 'onEnd'
  getCoreRowModel: getCoreRowModel(),
});
```

### 크기 조정 핸들 렌더링

```typescript
<th
  style={{
    width: header.getSize(),
    position: 'relative',
  }}
>
  {flexRender(header.column.columnDef.header, header.getContext())}

  {header.column.getCanResize() && (
    <div
      onMouseDown={header.getResizeHandler()}
      onTouchStart={header.getResizeHandler()}
      className="resizer"
    />
  )}
</th>
```

## 10. 고급 패턴

### 동적 컬럼 가시성

```typescript
const [columnVisibility, setColumnVisibility] = useState({
  email: false,
  age: false,
});

const table = useReactTable({
  data,
  columns,
  state: {
    columnVisibility,
  },
  onColumnVisibilityChange: setColumnVisibility,
  getCoreRowModel: getCoreRowModel(),
});

// 컬럼 토글 UI
{table.getAllLeafColumns().map(column => (
  <label key={column.id}>
    <input
      type="checkbox"
      checked={column.getIsVisible()}
      onChange={column.getToggleVisibilityHandler()}
    />
    {column.id}
  </label>
))}
```

### 컬럼 순서 변경

```typescript
const [columnOrder, setColumnOrder] = useState<string[]>([]);

const table = useReactTable({
  data,
  columns,
  state: {
    columnOrder,
  },
  onColumnOrderChange: setColumnOrder,
  getCoreRowModel: getCoreRowModel(),
});
```

### 컬럼 고정 (Pinning)

```typescript
const [columnPinning, setColumnPinning] = useState({
  left: ['id'],
  right: ['actions'],
});

const table = useReactTable({
  data,
  columns,
  state: {
    columnPinning,
  },
  onColumnPinningChange: setColumnPinning,
  getCoreRowModel: getCoreRowModel(),
});
```

## 11. 타입 안전성 강화

### ColumnDef 타입 명시

```typescript
import type { ColumnDef } from '@tanstack/react-table';

type User = {
  id: number;
  name: string;
};

// ✅ 타입 안전한 컬럼 정의
const columns: ColumnDef<User>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
  },
  {
    accessorKey: 'name',
    header: '이름',
  },
];
```

### 제네릭 컬럼 헬퍼 함수

```typescript
function createColumn<TData, TValue = unknown>(
  columnDef: ColumnDef<TData, TValue>
): ColumnDef<TData, TValue> {
  return columnDef;
}

// 사용
const idColumn = createColumn<User>({
  accessorKey: 'id',
  header: 'ID',
});
```

## 12. 모범 사례 체크리스트

### 필수 사항

- [ ] 데이터 타입을 먼저 정의 (`type` 또는 `interface`)
- [ ] `createColumnHelper<T>()` 사용하여 타입 안전성 확보
- [ ] 컬럼 정의를 `useMemo`로 메모이제이션
- [ ] 적절한 컬럼 타입 선택 (Accessor, Display, Grouping)

### 권장 사항

- [ ] 재사용 가능한 셀 컴포넌트 생성
- [ ] 컬럼 메타데이터 활용
- [ ] 기본 컬럼 옵션으로 공통 설정 정의
- [ ] 조건부 컬럼 로직 분리
- [ ] 정렬/필터링 함수 명시적으로 정의

### 고급 기능

- [ ] 컬럼 가시성 토글 구현
- [ ] 컬럼 순서 변경 기능
- [ ] 컬럼 고정 (좌/우)
- [ ] 커스텀 헤더/푸터 컴포넌트
- [ ] 동적 컬럼 생성 로직

## 13. 안티패턴

### 피해야 할 것들

```typescript
// ❌ 인라인 컬럼 정의 (매 렌더링마다 새로 생성)
<Table columns={[{ accessorKey: 'id', header: 'ID' }]} />

// ❌ 컬럼 내부에서 직접 함수 정의
{
  id: 'actions',
  cell: (info) => (
    <button onClick={() => {
      // 매 렌더링마다 새로운 함수 생성
      console.log(info.row.id);
    }}>
      클릭
    </button>
  )
}

// ❌ 타입 단언 남용
const value = info.getValue() as string; // any 대신 제네릭 사용

// ❌ 중복된 컬럼 정의
// 재사용 가능한 팩토리 함수나 컴포넌트 사용
```

## 14. 실전 예제

### 완전한 컬럼 정의 예제

```typescript
import { createColumnHelper } from '@tanstack/react-table';
import { format } from 'date-fns';

type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  createdAt: Date;
  isActive: boolean;
};

const columnHelper = createColumnHelper<Product>();

const columns = [
  columnHelper.accessor('id', {
    header: 'ID',
    size: 80,
    enableSorting: true,
  }),

  columnHelper.accessor('name', {
    header: '상품명',
    size: 200,
    cell: info => (
      <div className="font-semibold">
        {info.getValue()}
      </div>
    ),
    enableColumnFilter: true,
    filterFn: 'includesString',
  }),

  columnHelper.accessor('category', {
    header: '카테고리',
    size: 120,
    enableColumnFilter: true,
    filterFn: 'equals',
  }),

  columnHelper.accessor('price', {
    header: '가격',
    size: 100,
    cell: info => (
      <span className="text-right">
        {info.getValue().toLocaleString('ko-KR')}원
      </span>
    ),
    meta: {
      align: 'right',
    },
    enableSorting: true,
    sortingFn: 'alphanumeric',
  }),

  columnHelper.accessor('stock', {
    header: '재고',
    size: 80,
    cell: info => {
      const stock = info.getValue();
      const color = stock > 10 ? 'green' : stock > 0 ? 'orange' : 'red';
      return <span style={{ color }}>{stock}</span>;
    },
    meta: {
      align: 'center',
    },
  }),

  columnHelper.accessor('createdAt', {
    header: '등록일',
    size: 120,
    cell: info => format(info.getValue(), 'yyyy-MM-dd'),
    enableSorting: true,
    sortingFn: (rowA, rowB, columnId) => {
      const dateA = rowA.getValue<Date>(columnId);
      const dateB = rowB.getValue<Date>(columnId);
      return dateA.getTime() - dateB.getTime();
    },
  }),

  columnHelper.accessor('isActive', {
    header: '활성',
    size: 80,
    cell: info => (
      <span className={info.getValue() ? 'badge-success' : 'badge-inactive'}>
        {info.getValue() ? '활성' : '비활성'}
      </span>
    ),
  }),

  columnHelper.display({
    id: 'actions',
    header: '작업',
    size: 150,
    cell: props => (
      <div className="action-buttons">
        <button onClick={() => handleEdit(props.row.original)}>
          수정
        </button>
        <button onClick={() => handleDelete(props.row.original.id)}>
          삭제
        </button>
      </div>
    ),
  }),
];

export default columns;
```

## 결론

좋은 컬럼 정의는 타입 안전성, 재사용성, 유지보수성을 모두 고려해야 합니다. `createColumnHelper`를 활용하고, 컬럼을 메모이제이션하며, 재사용 가능한 패턴을 적용하여 견고한 테이블을 구축하세요.

**핵심 원칙:**
1. 타입을 먼저 정의하고 `createColumnHelper` 사용
2. 컬럼을 항상 메모이제이션
3. 재사용 가능한 셀 컴포넌트 생성
4. 메타데이터로 추가 정보 전달
5. 적절한 컬럼 타입 선택
