# TanStack Table 접근성 가이드

## 개요

TanStack Table은 헤드리스 라이브러리로서 접근성 구현의 책임을 개발자에게 맡깁니다. 이 가이드는 모든 사용자가 테이블을 사용할 수 있도록 접근성을 구현하는 방법을 설명합니다.

## 1. 접근성의 중요성

### 웹 접근성이란?

웹 접근성은 장애가 있는 사용자를 포함한 모든 사람이 웹 콘텐츠를 인식하고 이해하며 탐색할 수 있도록 보장하는 것입니다.

### 테이블 접근성의 주요 고려사항

- **스크린 리더 호환성**: 시각 장애인이 콘텐츠를 이해할 수 있어야 함
- **키보드 탐색**: 마우스 없이도 모든 기능 사용 가능해야 함
- **명확한 구조**: 테이블의 구조와 관계를 명확히 전달
- **의미 있는 레이블**: 모든 인터랙티브 요소에 적절한 레이블 제공

## 2. 시맨틱 HTML 사용

### 기본 원칙: 시맨틱 HTML 우선

```typescript
// ✅ 올바른 예제: 시맨틱 HTML
<table>
  <thead>
    <tr>
      <th scope="col">이름</th>
      <th scope="col">나이</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>John</td>
      <td>30</td>
    </tr>
  </tbody>
</table>

// ❌ 잘못된 예제: div 사용
<div className="table">
  <div className="thead">
    <div className="tr">
      <div className="th">이름</div>
      <div className="th">나이</div>
    </div>
  </div>
</div>
```

### 왜 시맨틱 HTML이 중요한가?

1. **내재된 접근성**: 브라우저가 자동으로 적절한 역할과 속성을 제공
2. **스크린 리더 호환성**: 보조 기술이 구조를 쉽게 이해
3. **코드 단순화**: ARIA 속성을 수동으로 추가할 필요가 없음

### 중요: 불필요한 ARIA 역할 피하기

```typescript
// ❌ 잘못된 예제: 중복 ARIA 역할
<table role="table"> {/* 불필요 */}
  <thead role="rowgroup"> {/* 불필요 */}
    <tr role="row"> {/* 불필요 */}
      <th role="columnheader"> {/* 불필요 */}
        이름
      </th>
    </tr>
  </thead>
</table>

// ✅ 올바른 예제: 시맨틱 HTML만 사용
<table>
  <thead>
    <tr>
      <th>이름</th>
    </tr>
  </thead>
</table>
```

**W3C 가이드라인**: 시맨틱 HTML의 암시적 ARIA 역할과 중복되는 ARIA 속성은 불필요하며 오히려 접근성 문제를 일으킬 수 있습니다.

## 3. 테이블 구조 접근성

### 테이블 캡션

```typescript
<table>
  <caption>사용자 목록 (총 {data.length}명)</caption>
  <thead>
    {/* ... */}
  </thead>
  <tbody>
    {/* ... */}
  </tbody>
</table>
```

### 컬럼 헤더의 scope 속성

```typescript
<thead>
  <tr>
    {table.getHeaderGroups().map(headerGroup => (
      <>
        {headerGroup.headers.map(header => (
          <th key={header.id} scope="col">
            {flexRender(header.column.columnDef.header, header.getContext())}
          </th>
        ))}
      </>
    ))}
  </tr>
</thead>
```

### 행 헤더

```typescript
<tbody>
  {table.getRowModel().rows.map(row => (
    <tr key={row.id}>
      {row.getVisibleCells().map((cell, index) => {
        // 첫 번째 셀을 행 헤더로
        if (index === 0) {
          return (
            <th key={cell.id} scope="row">
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </th>
          );
        }
        return (
          <td key={cell.id}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </td>
        );
      })}
    </tr>
  ))}
</tbody>
```

## 4. ARIA 레이블 및 설명

### 정렬 버튼에 ARIA 레이블

```typescript
<button
  onClick={header.column.getToggleSortingHandler()}
  aria-label={
    header.column.getIsSorted()
      ? `${header.column.columnDef.header} (현재 ${
          header.column.getIsSorted() === 'desc' ? '내림차순' : '오름차순'
        } 정렬됨)`
      : `${header.column.columnDef.header} 정렬하기`
  }
  aria-sort={
    header.column.getIsSorted()
      ? header.column.getIsSorted() === 'desc'
        ? 'descending'
        : 'ascending'
      : 'none'
  }
>
  {flexRender(header.column.columnDef.header, header.getContext())}
  <span aria-hidden="true">
    {header.column.getIsSorted() === 'asc' && ' 🔼'}
    {header.column.getIsSorted() === 'desc' && ' 🔽'}
  </span>
</button>
```

### 페이지네이션 컨트롤

```typescript
<nav aria-label="테이블 페이지네이션">
  <button
    onClick={() => table.setPageIndex(0)}
    disabled={!table.getCanPreviousPage()}
    aria-label="첫 페이지로 이동"
  >
    {'<<'}
  </button>
  <button
    onClick={() => table.previousPage()}
    disabled={!table.getCanPreviousPage()}
    aria-label="이전 페이지"
  >
    {'<'}
  </button>
  <span aria-live="polite" aria-atomic="true">
    현재 페이지 {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
  </span>
  <button
    onClick={() => table.nextPage()}
    disabled={!table.getCanNextPage()}
    aria-label="다음 페이지"
  >
    {'>'}
  </button>
  <button
    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
    disabled={!table.getCanNextPage()}
    aria-label="마지막 페이지로 이동"
  >
    {'>>'}
  </button>
</nav>
```

### 필터 입력

```typescript
<input
  type="text"
  value={(column.getFilterValue() ?? '') as string}
  onChange={e => column.setFilterValue(e.target.value)}
  placeholder={`${column.columnDef.header} 검색`}
  aria-label={`${column.columnDef.header} 컬럼 필터`}
  aria-describedby={`${column.id}-filter-description`}
/>
<div id={`${column.id}-filter-description`} className="sr-only">
  {column.columnDef.header} 컬럼의 데이터를 필터링합니다
</div>
```

## 5. 키보드 탐색

### 기본 키보드 지원

```typescript
function AccessibleTable() {
  const handleKeyDown = (e: React.KeyboardEvent, handler: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handler();
    }
  };

  return (
    <table>
      <thead>
        {table.getHeaderGroups().map(headerGroup => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map(header => (
              <th key={header.id}>
                {header.column.getCanSort() ? (
                  <button
                    onClick={header.column.getToggleSortingHandler()}
                    onKeyDown={e =>
                      handleKeyDown(e, header.column.getToggleSortingHandler() ?? (() => {}))
                    }
                    tabIndex={0}
                    aria-label={`${header.column.columnDef.header} 정렬`}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </button>
                ) : (
                  flexRender(header.column.columnDef.header, header.getContext())
                )}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      {/* ... */}
    </table>
  );
}
```

### 행 선택 키보드 지원

```typescript
<tr
  key={row.id}
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
  style={{
    cursor: 'pointer',
    backgroundColor: row.getIsSelected() ? '#e3f2fd' : 'transparent',
  }}
>
  {/* 셀 렌더링 */}
</tr>
```

### 포커스 관리

```typescript
function TableWithFocusManagement() {
  const tableRef = useRef<HTMLTableElement>(null);
  const [focusedCell, setFocusedCell] = useState<{row: number; col: number} | null>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!focusedCell) return;

    const { row, col } = focusedCell;
    const rowCount = table.getRowModel().rows.length;
    const colCount = table.getAllColumns().length;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        if (row > 0) setFocusedCell({ row: row - 1, col });
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (row < rowCount - 1) setFocusedCell({ row: row + 1, col });
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (col > 0) setFocusedCell({ row, col: col - 1 });
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (col < colCount - 1) setFocusedCell({ row, col: col + 1 });
        break;
    }
  };

  return (
    <table ref={tableRef} onKeyDown={handleKeyDown}>
      {/* ... */}
    </table>
  );
}
```

## 6. 컬럼 크기 조정 접근성

### 키보드로 크기 조정

```typescript
<div
  onMouseDown={header.getResizeHandler()}
  onKeyDown={e => {
    const step = 10; // 픽셀 단위
    if (e.key === 'ArrowLeft') {
      header.column.setSize(header.column.getSize() - step);
    } else if (e.key === 'ArrowRight') {
      header.column.setSize(header.column.getSize() + step);
    }
  }}
  tabIndex={0}
  role="separator"
  aria-orientation="vertical"
  aria-label={`${header.column.columnDef.header} 컬럼 크기 조정`}
  aria-valuenow={header.column.getSize()}
  aria-valuemin={header.column.columnDef.minSize ?? 50}
  aria-valuemax={header.column.columnDef.maxSize ?? 500}
  className="resizer"
/>
```

## 7. 동적 콘텐츠 알림

### 라이브 리전 사용

```typescript
function AccessiblePaginatedTable() {
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    const pageInfo = `${table.getState().pagination.pageIndex + 1} 페이지, 총 ${table.getPageCount()} 페이지 중`;
    setAnnouncement(pageInfo);
  }, [table.getState().pagination.pageIndex]);

  return (
    <>
      {/* 스크린 리더용 라이브 리전 */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>

      <table>{/* ... */}</table>
    </>
  );
}
```

### 정렬/필터 변경 알림

```typescript
useEffect(() => {
  if (sorting.length > 0) {
    const sortInfo = sorting
      .map(s => `${s.id} ${s.desc ? '내림차순' : '오름차순'}`)
      .join(', ');
    setAnnouncement(`테이블이 ${sortInfo}으로 정렬되었습니다`);
  }
}, [sorting]);

useEffect(() => {
  if (columnFilters.length > 0) {
    setAnnouncement(
      `${columnFilters.length}개의 필터가 적용되었습니다. ${table.getRowModel().rows.length}개의 결과가 표시됩니다.`
    );
  }
}, [columnFilters]);
```

## 8. 행 선택 접근성

### 체크박스 레이블

```typescript
columnHelper.display({
  id: 'select',
  header: ({ table }) => (
    <label>
      <input
        type="checkbox"
        checked={table.getIsAllRowsSelected()}
        indeterminate={table.getIsSomeRowsSelected()}
        onChange={table.getToggleAllRowsSelectedHandler()}
      />
      <span className="sr-only">모든 행 선택</span>
    </label>
  ),
  cell: ({ row }) => (
    <label>
      <input
        type="checkbox"
        checked={row.getIsSelected()}
        disabled={!row.getCanSelect()}
        onChange={row.getToggleSelectedHandler()}
      />
      <span className="sr-only">
        {row.original.name} 행 선택
      </span>
    </label>
  ),
}),
```

### 선택 상태 알림

```typescript
useEffect(() => {
  const selectedCount = table.getSelectedRowModel().rows.length;
  if (selectedCount > 0) {
    setAnnouncement(`${selectedCount}개의 행이 선택되었습니다`);
  }
}, [table.getState().rowSelection]);
```

## 9. 색상 및 대비

### WCAG 기준 준수

```css
/* 충분한 색상 대비 (최소 4.5:1) */
.table {
  color: #333; /* 충분한 대비 */
  background-color: #fff;
}

.table-header {
  color: #fff;
  background-color: #1976d2; /* 대비율: 4.6:1 */
}

/* 선택된 행 */
.row-selected {
  background-color: #e3f2fd; /* 시각적 구분 */
  border-left: 3px solid #1976d2; /* 색상에만 의존하지 않음 */
}
```

### 포커스 표시

```css
/* 명확한 포커스 인디케이터 */
button:focus,
input:focus {
  outline: 2px solid #1976d2;
  outline-offset: 2px;
}

/* 포커스된 행 */
tr:focus {
  outline: 2px solid #1976d2;
  outline-offset: -2px;
}
```

## 10. 스크린 리더 전용 텍스트

### sr-only 유틸리티 클래스

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

### 사용 예제

```typescript
<button onClick={handleEdit}>
  <EditIcon aria-hidden="true" />
  <span className="sr-only">수정</span>
</button>

<th>
  나이
  <span className="sr-only">(숫자로 정렬 가능)</span>
</th>
```

## 11. div 사용 시 ARIA 역할

시맨틱 HTML을 사용할 수 없는 경우에만 ARIA 역할을 추가하세요.

```typescript
// 불가피하게 div를 사용해야 하는 경우
<div role="table" aria-label="사용자 목록">
  <div role="rowgroup">
    <div role="row">
      <div role="columnheader">이름</div>
      <div role="columnheader">나이</div>
    </div>
  </div>
  <div role="rowgroup">
    <div role="row">
      <div role="cell">John</div>
      <div role="cell">30</div>
    </div>
  </div>
</div>
```

**주의**: 가능하면 항상 시맨틱 HTML(`<table>`, `<thead>`, `<tbody>` 등)을 사용하세요.

## 12. React Aria Components 통합

고급 접근성이 필요한 경우 React Aria와 통합할 수 있습니다.

```typescript
import { useTable } from 'react-aria';
import { useTableState } from 'react-stately';

// React Aria Components와 TanStack Table을 함께 사용하는 예제는
// GitHub: clemensheithecker/react-aria-components-tanstack-table 참고
```

## 13. 접근성 체크리스트

### 필수 사항

- [ ] 시맨틱 HTML 요소 사용 (`<table>`, `<thead>`, `<tbody>`, `<th>`, `<td>`)
- [ ] 테이블에 `<caption>` 또는 `aria-label` 제공
- [ ] 컬럼 헤더에 `scope="col"` 속성
- [ ] 모든 인터랙티브 요소에 키보드 접근 가능
- [ ] 충분한 색상 대비 (최소 4.5:1)
- [ ] 명확한 포커스 인디케이터

### 권장 사항

- [ ] 정렬 버튼에 `aria-sort` 속성
- [ ] 페이지네이션에 `aria-label` 및 `aria-live`
- [ ] 필터 입력에 `aria-describedby`
- [ ] 동적 변경에 라이브 리전 사용
- [ ] 체크박스에 의미 있는 레이블
- [ ] 아이콘에 `aria-hidden="true"` 또는 스크린 리더 텍스트

### 고급 기능

- [ ] 화살표 키로 셀 간 탐색
- [ ] 키보드로 컬럼 크기 조정
- [ ] 행 선택 상태 알림
- [ ] 커스텀 ARIA 역할 및 속성 (필요 시)

## 14. 테스트 도구

### 자동화 도구

- **axe DevTools**: Chrome/Firefox 확장 프로그램
- **Lighthouse**: Chrome DevTools 내장
- **WAVE**: 웹 접근성 평가 도구
- **Pa11y**: CLI 접근성 테스트 도구

### 수동 테스트

- **키보드만 사용**: Tab, Enter, Space, 화살표 키로 모든 기능 테스트
- **스크린 리더**: NVDA (Windows), JAWS (Windows), VoiceOver (Mac)
- **확대/축소**: 200% 확대 시에도 사용 가능해야 함

### 테스트 예제

```typescript
// Jest + Testing Library
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('테이블이 접근성 위반이 없어야 함', async () => {
  const { container } = render(<MyTable />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});

test('키보드로 정렬 가능해야 함', () => {
  render(<MyTable />);
  const sortButton = screen.getByLabelText('이름 정렬');
  sortButton.focus();
  fireEvent.keyDown(sortButton, { key: 'Enter' });
  // 정렬 상태 확인
});
```

## 결론

TanStack Table의 접근성은 시맨틱 HTML, 적절한 ARIA 속성, 키보드 탐색, 스크린 리더 지원의 조합으로 달성됩니다. 항상 시맨틱 HTML을 우선하고, 필요한 경우에만 ARIA 속성을 추가하세요.

**핵심 원칙:**
1. 시맨틱 HTML 우선 사용
2. 불필요한 ARIA 역할 피하기
3. 모든 기능에 키보드 접근 제공
4. 동적 변경 사항 알림
5. 충분한 색상 대비 및 포커스 표시
6. 정기적인 접근성 테스트
