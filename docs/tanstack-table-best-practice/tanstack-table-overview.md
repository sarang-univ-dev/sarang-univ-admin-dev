# TanStack Table 개요 및 시작 가이드

## TanStack Table이란?

TanStack Table(이전 React Table)은 **헤드리스 UI 라이브러리**로, 여러 프레임워크(React, Vue, Svelte, Solid, Angular 등)에서 테이블과 데이터그리드를 구축하기 위한 강력한 도구입니다.

## 핵심 개념

### 헤드리스(Headless) 라이브러리

"헤드리스"란 미리 만들어진 컴포넌트나 스타일을 제공하지 않는다는 의미입니다. 대신 테이블의 핵심 로직만 제공하여 개발자에게 완전한 UI 제어권을 부여합니다.

**장점:**
- 마크업과 디자인에 대한 완전한 제어
- 모든 CSS 전략과의 통합 가능 (Tailwind, CSS-in-JS 등)
- 프레임워크 간 일관된 API
- 최대한의 유연성

### 모듈식 훅 기반 아키텍처

TanStack Table은 훅 기반으로 설계되어 있어 선언적 프로그래밍 스타일을 장려합니다.

```typescript
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
} from '@tanstack/react-table';

const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
});
```

**필요한 기능만 가져오기 (Tree-shaking):**
- `getCoreRowModel` - 기본 테이블 기능
- `getSortedRowModel` - 정렬 기능
- `getFilteredRowModel` - 필터링 기능
- `getPaginationRowModel` - 페이지네이션 기능

## 주요 기능

### 1. 정렬 (Sorting)
클라이언트 및 서버 사이드 정렬을 모두 지원합니다.

### 2. 필터링 (Filtering)
컬럼 기반 필터링과 전역 필터링을 지원합니다.

### 3. 페이지네이션 (Pagination)
수만 개의 행을 처리할 수 있는 강력한 페이지네이션 기능을 제공합니다.

### 4. 행 선택 (Row Selection)
단일 및 다중 행 선택을 지원합니다.

### 5. 컬럼 크기 조정 (Column Sizing)
동적 컬럼 너비 조정을 지원합니다.

### 6. 가상화 (Virtualization)
`@tanstack/react-virtual`과 결합하여 수천 개의 행을 효율적으로 렌더링할 수 있습니다.

### 7. 그룹핑 및 집계 (Grouping & Aggregation)
데이터 그룹화와 집계 기능을 제공합니다.

## 언제 TanStack Table을 사용해야 하나?

### 적합한 경우:
- **최대한의 유연성**이 필요한 경우
- **커스텀 UI**를 구현하고자 하는 경우
- **여러 프레임워크**를 지원해야 하는 경우
- **대량의 데이터**(수만 개 이상의 행)를 처리해야 하는 경우
- **복잡한 테이블 기능**이 필요한 경우

### 부적합한 경우:
- 빠르게 프로토타입을 만들어야 하는 경우 (Material-UI Table 등 고수준 라이브러리 고려)
- 매우 간단한 테이블만 필요한 경우
- 학습 곡선이 부담스러운 경우

## 성능 특성

TanStack Table은 **클라이언트 사이드에서 수만~10만 개의 행**을 필터링, 정렬, 페이지네이션, 그룹핑하는 데 우수한 성능을 보입니다.

**성능 확장을 위한 전략:**
- 클라이언트 사이드: ~10,000-100,000행 (적절한 최적화 필요)
- 서버 사이드: 무제한 (API 기반 페이지네이션/필터링)
- 가상화: 수천 개 이상의 행을 뷰포트에 렌더링

## 접근성 (Accessibility)

TanStack Table은 접근성 모범 사례를 준수하며, 모든 사용자가 테이블을 사용할 수 있도록 보장합니다.

**주요 고려사항:**
- 시맨틱 HTML 사용 (`<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`)
- 적절한 ARIA 속성 추가
- 키보드 내비게이션 지원
- 스크린 리더 호환성

## 버전 8 주요 변경사항

TanStack Table V8은 TypeScript로 완전히 재작성되었으며, 다음과 같은 주요 변경사항이 있습니다:

### 아키텍처 변경:
- **이전 훅 및 플러그인 시스템 제거**
- **트리-셰이킹 가능한 행 모델 임포트**로 대체
- 각 기능별로 독립적인 임포트

### API 개선:
- 더 나은 TypeScript 지원
- 향상된 타입 안전성
- 일관된 명명 규칙

## 기본 사용 예제

```typescript
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';

type Person = {
  firstName: string;
  lastName: string;
  age: number;
};

function MyTable() {
  const data: Person[] = [
    { firstName: 'John', lastName: 'Doe', age: 30 },
    { firstName: 'Jane', lastName: 'Smith', age: 25 },
  ];

  const columns = [
    { accessorKey: 'firstName', header: 'First Name' },
    { accessorKey: 'lastName', header: 'Last Name' },
    { accessorKey: 'age', header: 'Age' },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <table>
      <thead>
        {table.getHeaderGroups().map(headerGroup => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map(header => (
              <th key={header.id}>
                {flexRender(header.column.columnDef.header, header.getContext())}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map(row => (
          <tr key={row.id}>
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

## 추가 리소스

- [공식 문서](https://tanstack.com/table/latest)
- [마이그레이션 가이드](https://tanstack.com/table/v8/docs/guide/migrating)
- [예제 모음](https://tanstack.com/table/latest/docs/framework/react/examples/basic)
- [GitHub 저장소](https://github.com/TanStack/table)

## 다음 단계

이 개요를 읽은 후, 다음 문서들을 참고하여 더 깊이 있는 내용을 학습하세요:

1. **성능 최적화** - `tanstack-table-performance-optimization.md`
2. **컬럼 정의 모범 사례** - `tanstack-table-column-definition.md`
3. **상태 관리 패턴** - `tanstack-table-state-management.md`
4. **흔한 실수와 안티패턴** - `tanstack-table-common-mistakes.md`
5. **기능 구현 가이드** - `tanstack-table-features-implementation.md`
6. **접근성** - `tanstack-table-accessibility.md`
7. **행 선택 패턴** - `tanstack-table-row-selection.md`
