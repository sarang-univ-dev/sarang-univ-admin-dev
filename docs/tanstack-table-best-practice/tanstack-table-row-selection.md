# TanStack Table 행 선택 및 대량 작업 가이드

## 개요

TanStack Table은 강력한 행 선택 기능을 제공하며, 단일 선택, 다중 선택, 조건부 선택 등 다양한 패턴을 지원합니다. 이 가이드는 행 선택과 대량 작업을 구현하는 방법을 설명합니다.

## 1. 기본 행 선택

### 클라이언트 사이드 행 선택

#### 기본 구현

```typescript
import {
  useReactTable,
  getCoreRowModel,
  RowSelectionState,
} from '@tanstack/react-table';

function SelectableTable() {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const table = useReactTable({
    data,
    columns,
    state: {
      rowSelection,
    },
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: true, // 모든 행 선택 가능 (기본값)
  });

  return (
    <table>
      <thead>
        {/* 헤더 */}
      </thead>
      <tbody>
        {table.getRowModel().rows.map(row => (
          <tr
            key={row.id}
            onClick={() => row.toggleSelected()}
            style={{
              cursor: 'pointer',
              backgroundColor: row.getIsSelected() ? '#e3f2fd' : 'transparent',
            }}
          >
            {row.getVisibleCells().map(cell => (
              <td key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### 체크박스로 선택

```typescript
const columns = [
  // 선택 컬럼
  columnHelper.display({
    id: 'select',
    header: ({ table }) => (
      <input
        type="checkbox"
        checked={table.getIsAllRowsSelected()}
        indeterminate={table.getIsSomeRowsSelected()}
        onChange={table.getToggleAllRowsSelectedHandler()}
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        checked={row.getIsSelected()}
        disabled={!row.getCanSelect()}
        onChange={row.getToggleSelectedHandler()}
      />
    ),
  }),
  // 데이터 컬럼들
  columnHelper.accessor('name', { header: '이름' }),
  columnHelper.accessor('email', { header: '이메일' }),
];
```

### IndeterminateCheckbox 컴포넌트

```typescript
import { HTMLProps, useEffect, useRef } from 'react';

function IndeterminateCheckbox({
  indeterminate,
  className = '',
  ...rest
}: { indeterminate?: boolean } & HTMLProps<HTMLInputElement>) {
  const ref = useRef<HTMLInputElement>(null!);

  useEffect(() => {
    if (typeof indeterminate === 'boolean') {
      ref.current.indeterminate = !rest.checked && indeterminate;
    }
  }, [ref, indeterminate, rest.checked]);

  return (
    <input
      type="checkbox"
      ref={ref}
      className={className}
      {...rest}
    />
  );
}

// 사용
<IndeterminateCheckbox
  checked={table.getIsAllRowsSelected()}
  indeterminate={table.getIsSomeRowsSelected()}
  onChange={table.getToggleAllRowsSelectedHandler()}
/>
```

## 2. 행 선택 상태 관리

### 선택 상태 이해하기

```typescript
// RowSelectionState는 Record<string, boolean>
// 행 ID를 키로, 선택 여부를 값으로 가짐
type RowSelectionState = {
  '0': true,   // 첫 번째 행 선택됨
  '2': true,   // 세 번째 행 선택됨
  // 선택되지 않은 행은 포함되지 않음
};
```

### 선택된 행 접근하기

```typescript
function TableWithActions() {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const table = useReactTable({
    data,
    columns,
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
  });

  // 선택된 행 ID들
  const selectedRowIds = Object.keys(rowSelection);

  // 선택된 행 데이터
  const selectedRows = table.getSelectedRowModel().rows;
  const selectedData = selectedRows.map(row => row.original);

  // 선택된 행 개수
  const selectedCount = selectedRows.length;

  return (
    <>
      <div>
        {selectedCount > 0 && (
          <div>
            {selectedCount}개의 행이 선택되었습니다
            <button onClick={() => handleBulkDelete(selectedData)}>
              선택 항목 삭제
            </button>
          </div>
        )}
      </div>
      <table>{/* ... */}</table>
    </>
  );
}
```

## 3. 조건부 행 선택

### 특정 행만 선택 가능하도록

```typescript
const table = useReactTable({
  data,
  columns,
  state: { rowSelection },
  onRowSelectionChange: setRowSelection,
  getCoreRowModel: getCoreRowModel(),
  enableRowSelection: row => {
    // 활성 상태인 행만 선택 가능
    return row.original.status === 'active';
  },
});

// 또는 간단히
enableRowSelection: row => row.original.isSelectable,
```

### UI에 선택 불가 표시

```typescript
<input
  type="checkbox"
  checked={row.getIsSelected()}
  disabled={!row.getCanSelect()}
  onChange={row.getToggleSelectedHandler()}
  title={
    !row.getCanSelect()
      ? '이 항목은 선택할 수 없습니다'
      : undefined
  }
/>
```

## 4. 고급 선택 패턴

### 단일 행만 선택

```typescript
function SingleSelectTable() {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const table = useReactTable({
    data,
    columns,
    state: { rowSelection },
    onRowSelectionChange: updater => {
      const newSelection = typeof updater === 'function'
        ? updater(rowSelection)
        : updater;

      // 하나의 행만 선택되도록 제한
      const selectedIds = Object.keys(newSelection);
      if (selectedIds.length > 1) {
        // 마지막으로 선택된 행만 유지
        const lastId = selectedIds[selectedIds.length - 1];
        setRowSelection({ [lastId]: true });
      } else {
        setRowSelection(newSelection);
      }
    },
    getCoreRowModel: getCoreRowModel(),
    enableMultiRowSelection: false, // 다중 선택 비활성화
  });

  return (/* ... */);
}
```

### Shift 키로 범위 선택

```typescript
function RangeSelectTable() {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

  const handleRowClick = (index: number, shiftKey: boolean) => {
    if (shiftKey && lastSelectedIndex !== null) {
      // 범위 선택
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);

      const newSelection: RowSelectionState = { ...rowSelection };
      for (let i = start; i <= end; i++) {
        newSelection[String(i)] = true;
      }
      setRowSelection(newSelection);
    } else {
      // 단일 선택
      setRowSelection(prev => ({
        ...prev,
        [String(index)]: !prev[String(index)],
      }));
      setLastSelectedIndex(index);
    }
  };

  return (
    <tbody>
      {table.getRowModel().rows.map((row, index) => (
        <tr
          key={row.id}
          onClick={e => handleRowClick(index, e.shiftKey)}
          style={{
            backgroundColor: row.getIsSelected() ? '#e3f2fd' : 'transparent',
          }}
        >
          {/* 셀 렌더링 */}
        </tr>
      ))}
    </tbody>
  );
}
```

### Ctrl/Cmd 키로 다중 선택

```typescript
const handleRowClick = (e: React.MouseEvent, rowId: string) => {
  if (e.ctrlKey || e.metaKey) {
    // Ctrl/Cmd 키가 눌린 경우 토글
    setRowSelection(prev => ({
      ...prev,
      [rowId]: !prev[rowId],
    }));
  } else if (e.shiftKey) {
    // Shift 키 - 범위 선택 (위에서 구현)
  } else {
    // 일반 클릭 - 단일 선택
    setRowSelection({ [rowId]: true });
  }
};
```

## 5. 행 선택 API

### Table 수준 API

```typescript
// 모든 행 선택/해제
table.toggleAllRowsSelected(value?: boolean);
table.getIsAllRowsSelected(); // boolean
table.getIsSomeRowsSelected(); // boolean

// 현재 페이지의 모든 행 선택/해제
table.toggleAllPageRowsSelected(value?: boolean);
table.getIsAllPageRowsSelected(); // boolean
table.getIsSomePageRowsSelected(); // boolean

// 선택된 행 모델
table.getSelectedRowModel(); // { rows, flatRows, rowsById }
table.getFilteredSelectedRowModel(); // 필터링 후 선택된 행
table.getGroupedSelectedRowModel(); // 그룹핑 후 선택된 행

// 상태 접근
table.getState().rowSelection; // RowSelectionState
table.setRowSelection({ '0': true, '2': true });
table.resetRowSelection();
```

### Row 수준 API

```typescript
// 선택 토글
row.toggleSelected(value?: boolean);
row.getToggleSelectedHandler(); // onClick 핸들러

// 선택 상태 확인
row.getIsSelected(); // boolean
row.getCanSelect(); // boolean
row.getCanMultiSelect(); // boolean
row.getIsSomeSelected(); // boolean (하위 행이 있는 경우)
```

## 6. 대량 작업 (Bulk Operations)

### 기본 패턴

```typescript
function TableWithBulkActions() {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const table = useReactTable({
    data,
    columns,
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
  });

  const selectedRows = table.getSelectedRowModel().rows;
  const selectedData = selectedRows.map(row => row.original);

  const handleBulkDelete = async () => {
    if (!confirm(`${selectedData.length}개의 항목을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await Promise.all(
        selectedData.map(item => deleteItem(item.id))
      );
      // 선택 초기화
      setRowSelection({});
      // 데이터 새로고침
      refetch();
    } catch (error) {
      console.error('삭제 실패:', error);
    }
  };

  const handleBulkUpdate = async (status: string) => {
    try {
      await Promise.all(
        selectedData.map(item => updateItem(item.id, { status }))
      );
      setRowSelection({});
      refetch();
    } catch (error) {
      console.error('업데이트 실패:', error);
    }
  };

  const handleBulkExport = () => {
    const csvContent = convertToCSV(selectedData);
    downloadCSV(csvContent, 'export.csv');
  };

  return (
    <>
      {selectedRows.length > 0 && (
        <div className="bulk-actions">
          <span>{selectedRows.length}개 선택됨</span>
          <button onClick={handleBulkDelete}>삭제</button>
          <button onClick={() => handleBulkUpdate('active')}>
            활성화
          </button>
          <button onClick={() => handleBulkUpdate('inactive')}>
            비활성화
          </button>
          <button onClick={handleBulkExport}>내보내기</button>
          <button onClick={() => setRowSelection({})}>
            선택 해제
          </button>
        </div>
      )}
      <table>{/* ... */}</table>
    </>
  );
}
```

### 대량 작업 UI 패턴

#### 플로팅 액션 바

```typescript
function FloatingActionBar({ selectedCount, onActions }: Props) {
  if (selectedCount === 0) return null;

  return (
    <div className="floating-action-bar">
      <span>{selectedCount}개 선택됨</span>
      <div className="actions">
        <button onClick={onActions.delete}>
          <DeleteIcon /> 삭제
        </button>
        <button onClick={onActions.export}>
          <ExportIcon /> 내보내기
        </button>
        <button onClick={onActions.clear}>
          선택 해제
        </button>
      </div>
    </div>
  );
}

// 스타일
.floating-action-bar {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  padding: 12px 24px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 16px;
  z-index: 1000;
}
```

#### 테이블 헤더 통합

```typescript
<thead>
  {selectedRows.length > 0 ? (
    // 선택 모드 헤더
    <tr>
      <th colSpan={columns.length}>
        <div className="selection-header">
          <button onClick={() => setRowSelection({})}>
            ✕
          </button>
          <span>{selectedRows.length}개 선택됨</span>
          <button onClick={handleBulkDelete}>삭제</button>
          <button onClick={handleBulkExport}>내보내기</button>
        </div>
      </th>
    </tr>
  ) : (
    // 일반 헤더
    table.getHeaderGroups().map(headerGroup => (
      <tr key={headerGroup.id}>
        {headerGroup.headers.map(header => (
          <th key={header.id}>
            {flexRender(header.column.columnDef.header, header.getContext())}
          </th>
        ))}
      </tr>
    ))
  )}
</thead>
```

## 7. 서버 사이드 선택

### 페이지 간 선택 유지

```typescript
function ServerSideSelectTable() {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 50 });

  // 선택된 실제 ID들을 별도로 관리
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const { data } = useQuery({
    queryKey: ['tableData', pagination],
    queryFn: () => fetchData(pagination),
  });

  const table = useReactTable({
    data: data?.rows ?? [],
    pageCount: data?.pageCount ?? -1,
    columns,
    state: { rowSelection, pagination },
    onRowSelectionChange: updater => {
      const newSelection = typeof updater === 'function'
        ? updater(rowSelection)
        : updater;

      setRowSelection(newSelection);

      // 실제 ID로 변환하여 저장
      const currentPageIds = data?.rows.map(row => row.id) ?? [];
      const newSelectedIds = new Set(selectedIds);

      Object.keys(newSelection).forEach(indexStr => {
        const index = parseInt(indexStr);
        const id = currentPageIds[index];
        if (newSelection[indexStr]) {
          newSelectedIds.add(id);
        } else {
          newSelectedIds.delete(id);
        }
      });

      setSelectedIds(newSelectedIds);
    },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  // 페이지 변경 시 선택 상태 복원
  useEffect(() => {
    const currentPageIds = data?.rows.map(row => row.id) ?? [];
    const newSelection: RowSelectionState = {};

    currentPageIds.forEach((id, index) => {
      if (selectedIds.has(id)) {
        newSelection[String(index)] = true;
      }
    });

    setRowSelection(newSelection);
  }, [data, selectedIds]);

  // 실제 선택된 데이터 접근
  const getSelectedData = () => {
    return Array.from(selectedIds);
  };

  return (/* ... */);
}
```

## 8. 행 선택과 다른 기능 통합

### 정렬/필터링과 함께

```typescript
function IntegratedTable() {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    state: {
      rowSelection,
      sorting,
      columnFilters,
    },
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  // 필터링된 행만 선택
  const selectFilteredRows = () => {
    const filteredRowIds = table.getFilteredRowModel().rows.reduce(
      (acc, row) => {
        acc[row.id] = true;
        return acc;
      },
      {} as RowSelectionState
    );
    setRowSelection(filteredRowIds);
  };

  return (
    <>
      <button onClick={selectFilteredRows}>
        필터링된 행 모두 선택
      </button>
      <table>{/* ... */}</table>
    </>
  );
}
```

### 확장 가능한 행과 함께

```typescript
columnHelper.display({
  id: 'select',
  header: ({ table }) => (
    <IndeterminateCheckbox
      checked={table.getIsAllRowsSelected()}
      indeterminate={table.getIsSomeRowsSelected()}
      onChange={table.getToggleAllRowsSelectedHandler()}
    />
  ),
  cell: ({ row }) => (
    <div style={{ paddingLeft: `${row.depth * 20}px` }}>
      {row.getCanExpand() && (
        <button onClick={row.getToggleExpandedHandler()}>
          {row.getIsExpanded() ? '▼' : '▶'}
        </button>
      )}
      <IndeterminateCheckbox
        checked={row.getIsSelected()}
        indeterminate={row.getIsSomeSelected()}
        onChange={row.getToggleSelectedHandler()}
      />
    </div>
  ),
}),
```

## 9. 성능 최적화

### 대량 선택 최적화

```typescript
// ❌ 느린 방법
const handleSelectAll = () => {
  const allIds = data.reduce((acc, row, index) => {
    acc[String(index)] = true;
    return acc;
  }, {} as RowSelectionState);
  setRowSelection(allIds);
};

// ✅ 더 나은 방법
const handleSelectAll = () => {
  table.toggleAllRowsSelected(true); // 내부적으로 최적화됨
};
```

### 메모이제이션

```typescript
const selectedData = useMemo(
  () => table.getSelectedRowModel().rows.map(row => row.original),
  [table.getState().rowSelection]
);

const bulkActions = useMemo(
  () => ({
    delete: () => handleBulkDelete(selectedData),
    export: () => handleBulkExport(selectedData),
  }),
  [selectedData]
);
```

## 10. 접근성

### 키보드 지원

```typescript
<tr
  onClick={() => row.toggleSelected()}
  onKeyDown={e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      row.toggleSelected();
    }
  }}
  tabIndex={0}
  role="row"
  aria-selected={row.getIsSelected()}
>
  {/* 셀 렌더링 */}
</tr>
```

### 스크린 리더 레이블

```typescript
<input
  type="checkbox"
  checked={row.getIsSelected()}
  onChange={row.getToggleSelectedHandler()}
  aria-label={`${row.original.name} 행 선택`}
/>

// 헤더
<input
  type="checkbox"
  checked={table.getIsAllRowsSelected()}
  onChange={table.getToggleAllRowsSelectedHandler()}
  aria-label="모든 행 선택"
/>
```

## 11. 모범 사례 체크리스트

### 기본 기능

- [ ] 체크박스 또는 행 클릭으로 선택 가능
- [ ] "모두 선택" 기능 제공
- [ ] Indeterminate 상태 표시 (일부 선택)
- [ ] 선택된 행 수 표시

### 사용자 경험

- [ ] 선택된 행 시각적으로 구분 (배경색, 테두리 등)
- [ ] 대량 작업 UI 제공 (삭제, 내보내기 등)
- [ ] 선택 해제 버튼 제공
- [ ] 작업 확인 다이얼로그 표시

### 고급 기능

- [ ] Shift 키로 범위 선택
- [ ] Ctrl/Cmd 키로 다중 선택
- [ ] 조건부 선택 가능 여부
- [ ] 서버 사이드에서 페이지 간 선택 유지

### 접근성

- [ ] 키보드로 선택 가능
- [ ] 체크박스에 의미 있는 레이블
- [ ] 선택 상태 변경 시 알림 (aria-live)
- [ ] 적절한 ARIA 속성

## 결론

TanStack Table의 행 선택 기능은 유연하고 강력하며, 다양한 사용 사례를 지원합니다. 기본 선택부터 고급 범위 선택, 대량 작업까지 모든 것을 구현할 수 있습니다.

**핵심 원칙:**
1. `RowSelectionState`로 선택 상태 관리
2. `getSelectedRowModel()`로 선택된 데이터 접근
3. 조건부 선택에 `enableRowSelection` 사용
4. 대량 작업 시 사용자 확인 요청
5. 서버 사이드에서는 실제 ID 별도 관리
6. 접근성을 위한 키보드 및 ARIA 지원
