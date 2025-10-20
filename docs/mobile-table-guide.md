# 모바일 친화적인 테이블 구현 가이드

## 개요

150행 이상의 데이터를 다루는 테이블을 모바일에서 효율적으로 표시하는 방법입니다.

### 핵심 전략
- **모바일**: 핵심 컬럼만 표시하는 컴팩트 테이블 + 행 클릭 시 Drawer로 상세 정보
- **데스크톱**: 기존 전체 컬럼 테이블 유지

### 장점
- ✅ 가로 스크롤 없음
- ✅ 한 화면에 많은 행 표시 가능
- ✅ 빠른 스캔 및 검색 가능
- ✅ 상세 정보는 필요할 때만 표시

## 구현 단계

### 1단계: Drawer 상세 컴포넌트 생성

`src/components/RegistrationDetailDrawer.tsx` 파일을 생성합니다:

```tsx
"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { GenderBadge, StatusBadge, TypeBadge } from "@/components/Badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/utils/formatDate";
import { UserRetreatRegistrationPaymentStatus } from "@/types";
import { CheckCircle2, RotateCcw, Send, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface RegistrationDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: any | null;
  scheduleColumns: any[];
  getActionButtons: (row: any) => React.ReactNode;
}

export function RegistrationDetailDrawer({
  open,
  onOpenChange,
  row,
  scheduleColumns,
  getActionButtons,
}: RegistrationDetailDrawerProps) {
  if (!row) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[90vh] overflow-y-auto"
      >
        <SheetHeader>
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-xl">{row.name}</SheetTitle>
              <SheetDescription>{row.department}</SheetDescription>
            </div>
            <StatusBadge status={row.status} />
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* 기본 정보 섹션 */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              기본 정보
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="성별">
                <GenderBadge gender={row.gender} />
              </InfoItem>
              <InfoItem label="학년">
                {row.grade}
              </InfoItem>
              <InfoItem label="타입">
                <TypeBadge type={row.type} />
              </InfoItem>
              <InfoItem label="금액">
                <span className="font-bold text-lg">
                  {row.amount.toLocaleString()}원
                </span>
              </InfoItem>
            </div>
          </section>

          <Separator />

          {/* 신청 일정 섹션 */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              신청 일정
            </h3>
            <div className="space-y-2">
              {scheduleColumns.map((col) => (
                <div
                  key={col.key}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                >
                  <span className="text-sm text-gray-700">{col.label}</span>
                  <Checkbox
                    checked={row.schedule[col.key]}
                    disabled
                    className={row.schedule[col.key] ? col.bgColorClass : ""}
                  />
                </div>
              ))}
            </div>
          </section>

          <Separator />

          {/* 처리 정보 섹션 */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              처리 정보
            </h3>
            <div className="space-y-3">
              <InfoItem label="신청 시각">
                {row.createdAt ? formatDate(row.createdAt) : "-"}
              </InfoItem>
              {row.confirmedBy && (
                <InfoItem label="처리자">
                  {row.confirmedBy}
                </InfoItem>
              )}
              {row.paymentConfirmedAt && (
                <InfoItem label="처리 시각">
                  {formatDate(row.paymentConfirmedAt)}
                </InfoItem>
              )}
            </div>
          </section>

          {/* 액션 버튼 섹션 */}
          {getActionButtons(row) && (
            <>
              <Separator />
              <section>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  작업
                </h3>
                <div className="space-y-2">
                  {getActionButtons(row)}
                </div>
              </section>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// 정보 항목 헬퍼 컴포넌트
function InfoItem({
  label,
  children
}: {
  label: string;
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-gray-500">{label}</span>
      <div className="text-sm font-medium text-gray-900">
        {children}
      </div>
    </div>
  );
}
```

### 2단계: 모바일 컴팩트 테이블 컴포넌트 생성

`src/components/MobileCompactTable.tsx` 파일을 생성합니다:

```tsx
"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/Badge";
import { ChevronRight } from "lucide-react";
import { RegistrationDetailDrawer } from "./RegistrationDetailDrawer";

interface MobileCompactTableProps {
  data: any[];
  scheduleColumns: any[];
  getActionButtons: (row: any) => React.ReactNode;
}

export function MobileCompactTable({
  data,
  scheduleColumns,
  getActionButtons,
}: MobileCompactTableProps) {
  const [selectedRow, setSelectedRow] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleRowClick = (row: any) => {
    setSelectedRow(row);
    setDrawerOpen(true);
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-[50%] font-semibold">이름</TableHead>
              <TableHead className="w-[35%] text-center font-semibold">
                상태
              </TableHead>
              <TableHead className="w-[15%] text-center font-semibold">
                <span className="sr-only">자세히</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length > 0 ? (
              data.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={() => handleRowClick(row)}
                  className="cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  <TableCell className="py-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-sm">{row.name}</span>
                      <span className="text-xs text-gray-500">
                        {row.department}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 text-center">
                    <StatusBadge status={row.status} />
                  </TableCell>
                  <TableCell className="py-3 text-center">
                    <ChevronRight className="h-4 w-4 text-gray-400 mx-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-10 text-gray-500">
                  데이터가 없습니다
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <RegistrationDetailDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        row={selectedRow}
        scheduleColumns={scheduleColumns}
        getActionButtons={getActionButtons}
      />
    </>
  );
}
```

### 3단계: 기존 테이블 컴포넌트 수정

`src/components/registration-table.tsx` 파일을 수정합니다:

```tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { MobileCompactTable } from "@/components/MobileCompactTable";
// ... 기존 imports

export function RegistrationTable({
  registrations = [],
  schedules = [],
  retreatSlug,
}: {
  registrations: IUserRetreatRegistration[];
  schedules: TRetreatRegistrationSchedule[];
  retreatSlug: string;
}) {
  // ... 기존 상태 및 함수들 유지 ...

  const scheduleColumns = generateScheduleColumns(schedules);

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between bg-gray-50 border-b">
        <div className="whitespace-nowrap">
          <CardTitle>신청 현황 및 입금 조회</CardTitle>
          <CardDescription>
            전체 {filteredData.length}명
          </CardDescription>
        </div>
        <div className="flex items-center gap-2 whitespace-nowrap">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              // 엑셀 다운로드 로직
            }}
            disabled={loadingStates.exportExcel}
            className="flex items-center gap-1.5"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">엑셀로 내보내기</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <div className="space-y-4">
          <SearchBar onSearch={handleSearchResults} data={data} />

          {/* 모바일: 컴팩트 테이블 + Drawer */}
          <div className="md:hidden">
            <MobileCompactTable
              data={filteredData}
              scheduleColumns={scheduleColumns}
              getActionButtons={getActionButtons}
            />
          </div>

          {/* 데스크톱: 전체 테이블 */}
          <div className="hidden md:block rounded-md border overflow-x-auto">
            <div className="min-w-max">
              <div className="max-h-[80vh] overflow-y-auto">
                <Table className="w-full whitespace-nowrap relative">
                  {/* 기존 테이블 코드 유지 */}
                  <TableHeader className="bg-gray-50 sticky top-0 z-10">
                    {/* ... */}
                  </TableHeader>
                  <TableBody>
                    {filteredData.map(row => (
                      <TableRow key={row.id}>
                        {/* ... */}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### 4단계: shadcn/ui Separator 컴포넌트 추가 (없는 경우)

```bash
npx shadcn-ui@latest add separator
```

## 주요 특징

### 1. 모바일 컴팩트 테이블 구조

```
┌─────────────────────────────────────┐
│ 이름              │ 상태   │ >      │
├─────────────────────────────────────┤
│ 홍길동            │ [대기] │ >      │
│ 대학부                              │
├─────────────────────────────────────┤
│ 김철수            │ [확인] │ >      │
│ 청년부                              │
└─────────────────────────────────────┘
```

**최소 3개 컬럼만 표시:**
1. **이름 + 부서** (2줄)
2. **상태 Badge**
3. **화살표 아이콘** (클릭 가능 표시)

### 2. Drawer 상세 정보 구조

```
┌─────────────────────────────────────┐
│ [× 닫기]                            │
│                                     │
│ 홍길동                    [대기]    │
│ 대학부                              │
│                                     │
├─────────────────────────────────────┤
│ 기본 정보                           │
│ ┌──────────┬──────────┐            │
│ │ 성별: 남 │ 학년: 1  │            │
│ │ 타입: 일반│ 금액: 5만│            │
│ └──────────┴──────────┘            │
├─────────────────────────────────────┤
│ 신청 일정                           │
│ [✓ 금요일 저녁]                     │
│ [✓ 토요일 전체]                     │
│ [ ] 일요일 오전]                    │
├─────────────────────────────────────┤
│ 처리 정보                           │
│ 신청 시각: 2025-01-15               │
│ 처리자: 관리자                      │
├─────────────────────────────────────┤
│ 작업                                │
│ [입금 확인]                         │
│ [입금 요청]                         │
└─────────────────────────────────────┘
```

### 3. 사용자 경험 흐름

1. **스캔**: 테이블에서 이름/상태 빠르게 확인
2. **검색/필터**: SearchBar로 원하는 사람 찾기
3. **상세**: 행 클릭 → Drawer 열림
4. **작업**: Drawer에서 입금 확인 등 액션 수행
5. **닫기**: Drawer 닫으면 테이블로 복귀

## 스타일링 세부사항

### 1. 모바일 테이블 최적화

```tsx
// 컴팩트한 패딩
<TableCell className="py-3">  // 상하 12px

// 작은 폰트 사이즈
<span className="text-sm">    // 주요 텍스트
<span className="text-xs">    // 부가 정보

// 2줄 레이아웃 (이름 + 부서)
<div className="flex flex-col gap-0.5">
  <span className="font-medium text-sm">{row.name}</span>
  <span className="text-xs text-gray-500">{row.department}</span>
</div>
```

### 2. 터치 최적화

```tsx
// 충분한 터치 영역 (최소 44px 높이)
<TableRow className="cursor-pointer">  // py-3 = 12px * 2 = 24px + content

// 시각적 피드백
className="hover:bg-gray-50 active:bg-gray-100 transition-colors"

// 명확한 클릭 가능 표시
<ChevronRight className="h-4 w-4 text-gray-400" />
```

### 3. Drawer 스타일링

```tsx
// 화면 90% 높이로 충분한 공간
<SheetContent side="bottom" className="h-[90vh] overflow-y-auto">

// 섹션 구분
<Separator />  // 시각적 구분선

// 읽기 쉬운 간격
<div className="space-y-6">  // 섹션 간 24px
<div className="space-y-3">  // 항목 간 12px
```

## 고급 기능

### 1. Drawer에서 직접 다음/이전 행으로 이동

```tsx
export function RegistrationDetailDrawer({
  open,
  onOpenChange,
  row,
  allRows,  // 전체 데이터 추가
  onNavigate,  // 네비게이션 콜백 추가
  // ...
}: RegistrationDetailDrawerProps) {
  const currentIndex = allRows.findIndex(r => r.id === row?.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allRows.length - 1;

  const handlePrev = () => {
    if (hasPrev) onNavigate(allRows[currentIndex - 1]);
  };

  const handleNext = () => {
    if (hasNext) onNavigate(allRows[currentIndex + 1]);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh]">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrev}
                disabled={!hasPrev}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div>
                <SheetTitle>{row?.name}</SheetTitle>
                <SheetDescription>
                  {currentIndex + 1} / {allRows.length}
                </SheetDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNext}
                disabled={!hasNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <StatusBadge status={row?.status} />
          </div>
        </SheetHeader>
        {/* ... 나머지 내용 */}
      </SheetContent>
    </Sheet>
  );
}
```

### 2. 빠른 필터 칩

```tsx
// SearchBar 아래에 빠른 필터 추가
<div className="flex gap-2 overflow-x-auto pb-2 md:hidden">
  <Button
    variant={filter === 'all' ? 'default' : 'outline'}
    size="sm"
    onClick={() => setFilter('all')}
  >
    전체 ({data.length})
  </Button>
  <Button
    variant={filter === 'pending' ? 'default' : 'outline'}
    size="sm"
    onClick={() => setFilter('pending')}
  >
    대기 ({pendingCount})
  </Button>
  <Button
    variant={filter === 'confirmed' ? 'default' : 'outline'}
    size="sm"
    onClick={() => setFilter('confirmed')}
  >
    확인 ({confirmedCount})
  </Button>
</div>
```

### 3. 가상 스크롤 (선택사항, 500+ 행일 때)

150행 정도는 괜찮지만, 더 많은 데이터를 다룬다면:

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

export function MobileCompactTable({ data, ... }: Props) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // 예상 행 높이
    overscan: 5, // 버퍼링
  });

  return (
    <div ref={parentRef} className="h-[600px] overflow-auto rounded-md border">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        <Table>
          <TableHeader className="sticky top-0 bg-gray-50 z-10">
            {/* ... */}
          </TableHeader>
          <TableBody>
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const row = data[virtualRow.index];
              return (
                <TableRow
                  key={row.id}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {/* ... */}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
```

## 접근성

### 1. 키보드 네비게이션

```tsx
<TableRow
  onClick={() => handleRowClick(row)}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleRowClick(row);
    }
  }}
  tabIndex={0}
  role="button"
  aria-label={`${row.name} 상세 정보 보기`}
>
```

### 2. 스크린 리더 지원

```tsx
<TableHead className="w-[15%]">
  <span className="sr-only">자세히 보기</span>
</TableHead>

<SheetTitle className="sr-only">
  {row?.name} 신청 상세 정보
</SheetTitle>
```

## 성능 최적화

### 1. 메모이제이션

```tsx
import { memo, useMemo } from "react";

export const MobileCompactTable = memo(function MobileCompactTable({
  data,
  ...
}: Props) {
  // 필터링/정렬된 데이터 메모이제이션
  const processedData = useMemo(() => {
    return data.filter(/* ... */).sort(/* ... */);
  }, [data]);

  return (/* ... */);
});
```

### 2. Drawer 지연 로딩

```tsx
// Drawer는 열릴 때만 렌더링
{drawerOpen && (
  <RegistrationDetailDrawer
    open={drawerOpen}
    onOpenChange={setDrawerOpen}
    row={selectedRow}
    scheduleColumns={scheduleColumns}
    getActionButtons={getActionButtons}
  />
)}
```

## 다른 테이블에 적용하기

### 재사용 가능한 제네릭 컴포넌트

```tsx
// GenericMobileTable.tsx
interface GenericMobileTableProps<T> {
  data: T[];
  renderRow: (item: T) => {
    primary: React.ReactNode;
    secondary?: React.ReactNode;
    badge: React.ReactNode;
  };
  renderDetail: (item: T) => React.ReactNode;
}

export function GenericMobileTable<T extends { id: string }>({
  data,
  renderRow,
  renderDetail,
}: GenericMobileTableProps<T>) {
  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <Table>
        <TableBody>
          {data.map((item) => {
            const { primary, secondary, badge } = renderRow(item);
            return (
              <TableRow
                key={item.id}
                onClick={() => {
                  setSelectedItem(item);
                  setDrawerOpen(true);
                }}
              >
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">{primary}</span>
                    {secondary && (
                      <span className="text-xs text-gray-500">{secondary}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center">{badge}</TableCell>
                <TableCell className="text-center">
                  <ChevronRight className="h-4 w-4 text-gray-400 mx-auto" />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
          {selectedItem && renderDetail(selectedItem)}
        </SheetContent>
      </Sheet>
    </>
  );
}

// 사용 예시
<GenericMobileTable
  data={busRegistrations}
  renderRow={(bus) => ({
    primary: bus.name,
    secondary: bus.routeName,
    badge: <StatusBadge status={bus.status} />,
  })}
  renderDetail={(bus) => (
    <div>
      <h2>{bus.name}</h2>
      <p>노선: {bus.routeName}</p>
      {/* ... 상세 정보 */}
    </div>
  )}
/>
```

## 테스트 체크리스트

- [ ] 모바일에서 컴팩트 테이블만 표시되는가?
- [ ] 데스크톱에서 전체 테이블만 표시되는가?
- [ ] 행 클릭 시 Drawer가 열리는가?
- [ ] Drawer에 모든 정보가 표시되는가?
- [ ] Drawer에서 액션 버튼이 작동하는가?
- [ ] 150행을 스크롤할 때 부드러운가?
- [ ] SearchBar 필터링이 정상 작동하는가?
- [ ] Drawer 닫기가 정상 작동하는가?
- [ ] 터치 영역이 충분히 큰가? (최소 44px)
- [ ] 로딩 상태가 정상 표시되는가?

## 추가 개선 아이디어

### 1. 스와이프 제스처

```tsx
// react-swipeable 사용
import { useSwipeable } from 'react-swipeable';

const handlers = useSwipeable({
  onSwipedLeft: () => handleNext(),
  onSwipedRight: () => handlePrev(),
});

<SheetContent {...handlers}>
  {/* Drawer 내용 */}
</SheetContent>
```

### 2. 빠른 액션 (Drawer 열지 않고)

```tsx
<TableRow>
  <TableCell onClick={() => handleRowClick(row)}>
    {/* 이름 */}
  </TableCell>
  <TableCell onClick={() => handleRowClick(row)}>
    {/* 상태 */}
  </TableCell>
  <TableCell>
    {/* 빠른 액션 버튼 (이벤트 전파 방지) */}
    <DropdownMenu>
      <DropdownMenuTrigger onClick={(e) => e.stopPropagation()}>
        <MoreVertical className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={(e) => {
          e.stopPropagation();
          handleConfirmPayment(row.id);
        }}>
          입금 확인
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </TableCell>
</TableRow>
```

### 3. 상태별 색상 구분

```tsx
<TableRow
  className={cn(
    "cursor-pointer hover:bg-gray-50 active:bg-gray-100",
    row.status === 'pending' && "border-l-4 border-l-yellow-400",
    row.status === 'confirmed' && "border-l-4 border-l-green-400",
    row.status === 'refund' && "border-l-4 border-l-red-400"
  )}
>
```

## 결론

이 방식의 장점:

1. **효율적**: 핵심 정보만 표시하여 한 화면에 많은 행 표시
2. **직관적**: 행 클릭 → 상세 정보는 자연스러운 UX 패턴
3. **유지보수**: 데스크톱 테이블은 그대로, 모바일만 별도 처리
4. **확장 가능**: Drawer에서 다음/이전 네비게이션 등 추가 기능 구현 용이
5. **성능**: 150행도 부드럽게 스크롤 가능

150행 이상의 복잡한 데이터를 모바일에서 다루는 최적의 방법입니다.
