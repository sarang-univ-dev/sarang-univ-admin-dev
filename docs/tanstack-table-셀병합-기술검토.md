# TanStack Table 셀 병합 기술 검토

## 개요

TanStack Table을 사용하여 같은 열의 여러 셀을 병합하는 기능의 기술적 가능성을 검토한 문서입니다. 특히 정렬 상태에 따라 조건부로 셀 병합을 적용하는 방법을 다룹니다.

## 주요 요구사항

1. **기본 상태**: 정렬이 없을 때 같은 GBS 번호 셀을 병합
2. **정렬 상태**: 정렬이 적용되면 셀 병합을 해제
3. **핵심 기능 유지**: 열 순서 변경, 정렬, 필터링 기능은 계속 제공

## 1. 셀 병합(Row Span) 가능 여부

### ✅ 가능 (커스텀 구현 필요)

TanStack Table은 **네이티브 셀 병합 기능을 제공하지 않지만**, HTML의 `rowspan` 속성을 활용한 커스텀 구현이 가능합니다.

### 구현 방법

#### 1) 데이터 평탄화

```typescript
// 중첩된 데이터를 평탄화
const flattenedData = data.flatMap(item =>
  item.details.map(detail => ({
    gbs: item.gbs,
    ...detail
  }))
);
```

#### 2) rowSpan 계산 로직

```typescript
function calculateRowSpans(rows: any[], columnId: string) {
  const spans = new Map();
  let currentValue = null;
  let startIndex = 0;
  let count = 0;

  rows.forEach((row, index) => {
    const value = row[columnId];

    if (value === currentValue) {
      count++;
      // 병합될 셀은 skip 표시
      spans.set(index, { skip: true });
    } else {
      if (currentValue !== null && count > 0) {
        // 첫 번째 셀에 rowSpan 저장
        spans.set(startIndex, { span: count });
      }
      currentValue = value;
      startIndex = index;
      count = 1;
    }
  });

  // 마지막 그룹 처리
  if (count > 0) {
    spans.set(startIndex, { span: count });
  }

  return spans;
}
```

#### 3) 렌더링 시 적용

```typescript
{table.getRowModel().rows.map((row, rowIndex) => (
  <tr key={row.id}>
    {row.getVisibleCells().map((cell) => {
      const shouldMerge = !isSorted && cell.column.id === 'gbs';
      const rowSpanInfo = shouldMerge ? rowSpans.get(rowIndex) : null;

      // skip이 true인 셀은 렌더링하지 않음
      if (rowSpanInfo?.skip) return null;

      return (
        <td
          key={cell.id}
          rowSpan={rowSpanInfo?.span || 1}
        >
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </td>
      );
    })}
  </tr>
))}
```

## 2. 기본 기능 유지 가능성

### ✅ 모든 기본 기능 유지 가능

TanStack Table의 핵심 기능들은 셀 병합과 독립적으로 동작합니다:

- **열 순서 변경**: `columnOrder` state 활용
- **정렬**: `sorting` state 활용
- **필터링**: `columnFilters` state 활용

```typescript
const table = useReactTable({
  data,
  columns,
  state: {
    sorting,
    columnOrder,
    columnFilters,
  },
  onSortingChange: setSorting,
  onColumnOrderChange: setColumnOrder,
  onColumnFiltersChange: setColumnFilters,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
});
```

## 3. 조건부 셀 병합 (정렬 상태 기반)

### ✅ 완전히 가능

정렬 상태를 감지하여 셀 병합을 조건부로 적용할 수 있습니다.

```typescript
const table = useReactTable({
  data,
  columns,
  state: { sorting },
  onSortingChange: setSorting,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
});

// 정렬 상태 확인
const isSorted = table.getState().sorting.length > 0;

// 정렬이 없을 때만 셀 병합 적용
const shouldMergeCells = !isSorted;
```

### 정렬 상태 접근 방법

```typescript
// 1. 전체 정렬 상태 확인
const sortingState = table.getState().sorting;
const isSorted = sortingState.length > 0;

// 2. 특정 컬럼의 정렬 상태 확인
const isColumnSorted = column.getIsSorted();

// 3. 정렬 변경 감지
const [sorting, setSorting] = useState<SortingState>([]);

useEffect(() => {
  console.log('정렬 상태 변경:', sorting);
  // rowSpan 재계산 등의 로직 실행
}, [sorting]);
```

## 4. 통합 구현 예제

### Custom Hook 구현

```typescript
// hooks/useTableWithMerging.ts
import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
} from '@tanstack/react-table';

export function useTableWithMerging<TData>(
  data: TData[],
  columns: any[],
  mergeColumnId: string
) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // 정렬이 없을 때만 rowSpan 계산
  const rowSpans = useMemo(() => {
    if (sorting.length > 0) return null;

    const rows = table.getRowModel().rows;
    return calculateRowSpans(
      rows.map(r => r.original),
      mergeColumnId
    );
  }, [table.getRowModel().rows, sorting, mergeColumnId]);

  const isSorted = sorting.length > 0;

  return { table, rowSpans, isSorted };
}

function calculateRowSpans<TData>(
  rows: TData[],
  columnId: keyof TData
): Map<number, { span?: number; skip?: boolean }> {
  const spans = new Map();
  let currentValue = null;
  let startIndex = 0;
  let count = 0;

  rows.forEach((row, index) => {
    const value = row[columnId];

    if (value === currentValue) {
      count++;
      spans.set(index, { skip: true });
    } else {
      if (currentValue !== null && count > 0) {
        spans.set(startIndex, { span: count });
      }
      currentValue = value;
      startIndex = index;
      count = 1;
    }
  });

  if (count > 0) {
    spans.set(startIndex, { span: count });
  }

  return spans;
}
```

### 컴포넌트에서 사용

```typescript
// components/MergedTable.tsx
import { flexRender } from '@tanstack/react-table';
import { useTableWithMerging } from '@/hooks/useTableWithMerging';

export function MergedTable({ data, columns }) {
  const { table, rowSpans, isSorted } = useTableWithMerging(
    data,
    columns,
    'gbs' // 병합할 컬럼 ID
  );

  return (
    <table>
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
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
        {table.getRowModel().rows.map((row, rowIndex) => (
          <tr key={row.id}>
            {row.getVisibleCells().map((cell) => {
              const shouldMerge = !isSorted && cell.column.id === 'gbs';
              const rowSpanInfo = shouldMerge ? rowSpans?.get(rowIndex) : null;

              // skip된 셀은 렌더링하지 않음
              if (rowSpanInfo?.skip) return null;

              return (
                <td
                  key={cell.id}
                  rowSpan={rowSpanInfo?.span || 1}
                  className={shouldMerge && rowSpanInfo?.span ? 'merged-cell' : ''}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### 스타일링

```css
/* 병합된 셀 스타일 */
.merged-cell {
  vertical-align: middle;
  background-color: #f9fafb;
  border-right: 2px solid #e5e7eb;
}
```

## 5. 주의사항 및 고려사항

### 성능 최적화

1. **메모이제이션 필수**
   - `useMemo`를 사용하여 rowSpan 계산을 캐싱
   - 정렬 상태와 데이터가 변경될 때만 재계산

2. **대량 데이터 처리**
   - 가상화(Virtualization) 라이브러리 고려
   - `@tanstack/react-virtual`과 함께 사용 가능

### 정렬 후 상태 관리

```typescript
// 초기 정렬 상태 설정
const table = useReactTable({
  initialState: {
    sorting: [], // 기본값: 정렬 없음
  },
  // ...
});

// 정렬 초기화 버튼
<button onClick={() => table.resetSorting()}>
  정렬 초기화
</button>
```

### 필터링과의 호환성

```typescript
// 필터링 적용 시에도 rowSpan 재계산
const rowSpans = useMemo(() => {
  if (sorting.length > 0) return null;

  // 필터링된 행 기준으로 계산
  const rows = table.getRowModel().rows;
  return calculateRowSpans(
    rows.map(r => r.original),
    'gbs'
  );
}, [
  table.getRowModel().rows,
  sorting,
  columnFilters // 필터링 상태도 의존성에 추가
]);
```

### 접근성 고려사항

```typescript
// rowSpan이 적용된 셀에 aria 속성 추가
<td
  rowSpan={rowSpanInfo?.span || 1}
  aria-rowspan={rowSpanInfo?.span || 1}
  role="cell"
>
  {content}
</td>
```

## 6. 대안 및 추가 고려사항

### Grouping 기능 활용

TanStack Table의 네이티브 Grouping 기능을 활용하는 방법도 고려할 수 있습니다:

```typescript
import { getGroupedRowModel } from '@tanstack/react-table';

const table = useReactTable({
  data,
  columns,
  getGroupedRowModel: getGroupedRowModel(),
  groupedColumnMode: 'remove', // 그룹화된 컬럼 제거
});
```

단, Grouping은 시각적 셀 병합과는 다른 개념이므로 요구사항에 따라 선택해야 합니다.

### 서드파티 라이브러리

커뮤니티에서 만든 rowSpan 관련 npm 패키지들이 존재하나, 유지보수 상태와 호환성을 확인해야 합니다.

## 7. 결론

### ✅ 모든 요구사항 구현 가능

| 요구사항 | 가능 여부 | 비고 |
|---------|----------|------|
| GBS 번호 셀 병합 | ✅ 가능 | HTML rowspan 활용 |
| 정렬 시 병합 해제 | ✅ 가능 | 정렬 상태 기반 조건부 렌더링 |
| 열 순서 변경 | ✅ 가능 | TanStack 네이티브 기능 |
| 정렬 기능 | ✅ 가능 | TanStack 네이티브 기능 |
| 필터링 기능 | ✅ 가능 | TanStack 네이티브 기능 |

### 구현 방식

- **TanStack Table**: 데이터 관리, 정렬, 필터링 등 핵심 기능
- **커스텀 로직**: rowSpan 계산 및 조건부 렌더링
- **HTML rowspan**: 실제 셀 병합 표현

### 개발 우선순위

1. 기본 TanStack Table 구현 (정렬, 필터링)
2. rowSpan 계산 로직 구현
3. 정렬 상태 기반 조건부 병합 적용
4. 성능 최적화 및 엣지 케이스 처리

## 참고 자료

- [TanStack Table 공식 문서](https://tanstack.com/table/v8)
- [GitHub Discussion #2233 - rowSpan 구현 예제](https://github.com/TanStack/table/discussions/2233)
- [Stack Overflow - TanStack Table 셀 병합](https://stackoverflow.com/questions/76179941/how-to-merge-row-cells-in-tanstack-react-table-v7-to-v8)
- [TanStack Table Sorting Guide](https://tanstack.com/table/v8/docs/guide/sorting)
- [TanStack Table State Management](https://tanstack.com/table/latest/docs/framework/react/guide/table-state)

---

**작성일**: 2025-10-10
**검토자**: Claude Code
