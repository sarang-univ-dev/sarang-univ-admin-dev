# 모바일 반응형 테이블 구현 가이드: univ-group-admin-staff 페이지

## 목차
1. [개요](#개요)
2. [Best Practice 분석](#best-practice-분석)
3. [현재 테이블 구조 분석](#현재-테이블-구조-분석)
4. [모바일 레이아웃 설계](#모바일-레이아웃-설계)
5. [구현 방법](#구현-방법)
6. [상세 구현 가이드](#상세-구현-가이드)
7. [테스트 체크리스트](#테스트-체크리스트)

---

## 개요

### 목표
univ-group-admin-staff 페이지의 복잡한 데이터 테이블을 모바일 환경에서 **가로 스크롤 없이** 사용자 친화적으로 표시하고, 검색 및 필터 기능을 그대로 유지합니다.

### 주요 요구사항
- ✅ 가로 스크롤 제거
- ✅ 필수 열만 표시 (학년, 이름, 상태, 자세히보기)
- ✅ 자세히보기를 통한 전체 정보 접근
- ✅ 검색 및 필터 기능 유지
- ✅ TanStack Table 기반 일관성 유지

---

## Best Practice 분석

### 1. 업계 표준 패턴 (2024-2025)

#### 📱 모바일 테이블 디자인 원칙
1. **Simplicity First**: 핵심 데이터만 표시
2. **Progressive Disclosure**: 상세 정보는 요청 시 표시
3. **Touch-Optimized**: 최소 44px 터치 영역
4. **Context Preservation**: 사용자를 현재 컨텍스트에서 벗어나지 않게 함

#### 🔄 변환 패턴 비교

| 패턴 | 장점 | 단점 | 적합성 |
|------|------|------|--------|
| **Card View** | 직관적, 모바일 친화적 | 많은 공간 차지, 스캔 어려움 | ❌ 150+ 행에 부적합 |
| **Horizontal Scroll** | 모든 데이터 접근 가능 | UX 저하, 실수 유발 | ❌ 요구사항 위배 |
| **Expandable Rows** | 컨텍스트 유지, 비교 가능 | 개발 복잡도 증가 | ✅ **최적** |
| **Modal/Drawer Detail** | 충분한 공간, 명확한 구분 | 컨텍스트 이탈 가능 | ✅ 추천 |

#### 🎯 선택된 패턴: **Hybrid Approach**
- **컴팩트 테이블** (필수 열만) + **Drawer 상세 뷰**
- 이유:
  - 빠른 스캔 및 검색 가능 (컴팩트 테이블)
  - 상세 정보 접근 용이 (Drawer)
  - 검색/필터와 자연스럽게 통합
  - TanStack Table API와 호환

---

## 현재 테이블 구조 분석

### 📊 기존 컬럼 목록 (21개)

#### 왼쪽 고정 컬럼 (4개)
```typescript
{
  department: string;     // 부서 (80px)
  gender: Gender;         // 성별 (70px)
  grade: string;          // 학년 (70px)
  name: string;           // 이름 (100px) - enableHiding: false
}
```

#### 중앙 컬럼 (6개)
```typescript
{
  phone: string;                // 전화번호 (120px)
  currentLeaderName: string;    // 부서 리더명 (100px)
  // schedule_${id}: boolean    // 동적 스케줄 컬럼들 (각 80px)
  type: UserRetreatRegistrationType;  // 타입 (100px)
  amount: number;               // 금액 (100px)
  createdAt: string;            // 신청시각 (140px)
}
```

#### 오른쪽 컬럼 (11개)
```typescript
{
  status: PaymentStatus;            // 입금 현황 (120px)
  actions: DisplayColumn;           // 액션 버튼 (150px)
  confirmedBy: string;              // 처리자명 (100px)
  paymentConfirmedAt: string;       // 처리시각 (140px)
  gbs: string;                      // GBS (120px)
  accommodation: string;            // 숙소 (120px)
  shuttleBus: boolean;              // 셔틀버스 (110px)
  scheduleMemo: string;             // 일정 변동 메모 (150px)
  memoActions: DisplayColumn;       // 메모 관리 (100px)
  adminMemo: string;                // 행정간사 메모 (250px)
  qr: DisplayColumn;                // QR (80px)
}
```

### 📈 컬럼 우선순위 분석

| 우선순위 | 컬럼 | 이유 | 모바일 표시 |
|---------|------|------|------------|
| **P0 (필수)** | 학년, 이름 | 신원 식별 | ✅ 항상 표시 |
| **P0 (필수)** | 상태 | 입금 확인 핵심 업무 | ✅ 항상 표시 |
| **P1 (중요)** | 부서, 성별 | 검색/필터 자주 사용 | 📱 Drawer에 상단 |
| **P1 (중요)** | 전화번호, 금액 | 연락 및 결제 정보 | 📱 Drawer에 상단 |
| **P2 (보통)** | 스케줄, 타입 | 부가 정보 | 📱 Drawer 중단 |
| **P3 (액션)** | 액션, 메모 관리 | 업무 수행 | 📱 Drawer 하단 |
| **P4 (참고)** | 나머지 | 드물게 사용 | 📱 Drawer 하단 |

---

## 모바일 레이아웃 설계

### 📱 모바일 컴팩트 테이블

#### 선택된 필수 열 (4개)
1. **학년** (50px) - 정렬 가능
2. **이름** (45% 너비) - 정렬 가능, 부서는 서브텍스트로
3. **상태** (30% 너비) - Badge 표시
4. **자세히** (버튼, 25% 너비) - Drawer 트리거

#### 레이아웃 구조
```
┌────────────────────────────────────────┐
│ 검색바: [🔍 이름, 부서, 전화번호...]  │
├────────────────────────────────────────┤
│ 학년 │ 이름           │ 상태   │ 상세 │
├──────┼────────────────┼────────┼──────┤
│ 1학년│ 홍길동         │ [대기] │ [>]  │
│      │ 대학부         │        │      │
├──────┼────────────────┼────────┼──────┤
│ 2학년│ 김철수         │ [확인] │ [>]  │
│      │ 청년부         │        │      │
└────────────────────────────────────────┘
```

#### 디자인 결정사항
- **학년**: 짧은 텍스트로 열 너비 최소화
- **이름 + 부서**: 2줄 레이아웃으로 공간 효율성 극대화
  - 1줄: 이름 (font-medium, text-sm)
  - 2줄: 부서 (text-gray-500, text-xs)
- **상태**: Badge 컴포넌트로 시각적 구분
- **자세히**: ChevronRight 아이콘으로 클릭 가능 표시

### 🗂️ Drawer 상세 뷰

#### 구조
```
┌──────────────────────────────────────────┐
│ [← 뒤로]  홍길동 (1학년, 대학부)  [확인] │
├──────────────────────────────────────────┤
│                                          │
│ 📋 기본 정보                             │
│ ┌────────────┬────────────┐             │
│ │ 성별: 남   │ 전화번호:  │             │
│ │ 타입: 일반 │ 010-1234   │             │
│ │ 금액: 50,000원          │             │
│ └────────────┴────────────┘             │
│                                          │
│ 📅 신청 일정                             │
│ ☑ 금요일 저녁 (19:00)                   │
│ ☑ 토요일 전체 (09:00)                   │
│ ☐ 일요일 오전 (09:00)                   │
│                                          │
│ 🚌 기타 정보                             │
│ 부서 리더: 이리더                        │
│ GBS: 새가족                              │
│ 숙소: A동 101호                          │
│ 셔틀버스: 신청함                         │
│                                          │
│ 📝 메모                                  │
│ 일정 변동 요청: (내용)                   │
│ 행정간사 메모: (편집 가능)               │
│                                          │
│ ⚙️ 작업                                  │
│ [입금 확인] [환불 처리] [새가족 등록]    │
│ [QR 코드 보기]                           │
│                                          │
└──────────────────────────────────────────┘
```

#### 섹션 구성
1. **헤더**: 이름 + 학년/부서 + 상태 Badge
2. **기본 정보**: 성별, 전화번호, 타입, 금액
3. **신청 일정**: 동적 스케줄 체크박스 (색상 구분)
4. **기타 정보**: 부서 리더, GBS, 숙소, 셔틀버스
5. **메모**: 일정 변동 요청 메모, 행정간사 메모
6. **작업**: 액션 버튼들 (UnivGroupAdminStaffTableActions)

---

## 구현 방법

### 🛠️ 기술 스택 및 접근 방식

#### 선택 1: **반응형 CSS + Drawer** (✅ 추천)
- **장점**:
  - 기존 TanStack Table 구조 유지
  - 구현 복잡도 낮음
  - 유지보수 용이
  - 검색/필터 로직 공유
- **단점**:
  - 두 개의 렌더링 경로
- **구현**:
  ```tsx
  // 데스크톱: 전체 테이블
  <div className="hidden md:block">
    <UnivGroupAdminStaffTable />
  </div>

  // 모바일: 컴팩트 테이블 + Drawer
  <div className="md:hidden">
    <UnivGroupAdminStaffMobileTable />
  </div>
  ```

#### 선택 2: TanStack Table Expanding Rows
- **장점**:
  - 단일 테이블 인스턴스
  - 일관된 상태 관리
- **단점**:
  - 복잡한 구현
  - 커스터마이징 어려움
- **구현**: 확장 행에 숨겨진 컬럼 표시

#### ✅ **선택: 반응형 CSS + Drawer**
- 이유: 간단하고 유지보수 용이, UX도 우수

---

## 상세 구현 가이드

### 1단계: 타입 확장

#### `src/types/univ-group-admin-staff.ts`
```typescript
// 기존 타입 유지, 필요시 확장
export interface UnivGroupAdminStaffData {
  // ... 기존 필드들
}

// Drawer props 타입
export interface MobileDrawerData extends UnivGroupAdminStaffData {
  scheduleLabels: Array<{
    id: number;
    label: string;
    checked: boolean;
  }>;
}
```

---

### 2단계: Drawer 컴포넌트 생성

#### `src/components/features/univ-group-admin-staff/UnivGroupAdminStaffDetailDrawer.tsx`

```tsx
"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { GenderBadge, StatusBadge, TypeBadge } from "@/components/Badge";
import { ShuttleBusStatusBadge } from "./ShuttleBusStatusBadge";
import { UnivGroupAdminStaffTableActions } from "./UnivGroupAdminStaffTableActions";
import { UnivGroupAdminStaffMemoEditor } from "./UnivGroupAdminStaffMemoEditor";
import { formatDate } from "@/utils/formatDate";
import { UnivGroupAdminStaffData } from "@/types/univ-group-admin-staff";
import { TRetreatRegistrationSchedule, RetreatRegistrationScheduleType } from "@/types";
import { getScheduleLabel } from "@/utils/retreat-utils";
import { QrCode, X } from "lucide-react";

interface UnivGroupAdminStaffDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: UnivGroupAdminStaffData | null;
  schedules: TRetreatRegistrationSchedule[];
  retreatSlug: string;
}

export function UnivGroupAdminStaffDetailDrawer({
  open,
  onOpenChange,
  row,
  schedules,
  retreatSlug,
}: UnivGroupAdminStaffDetailDrawerProps) {
  if (!row) return null;

  // 스케줄 데이터 변환
  const scheduleItems = schedules.map((schedule) => ({
    id: schedule.id,
    label: getScheduleLabel(
      new Date(schedule.time),
      schedule.type as RetreatRegistrationScheduleType
    ),
    checked: row.schedules[`schedule_${schedule.id}`] || false,
  }));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[90vh] overflow-y-auto"
      >
        {/* 헤더 */}
        <SheetHeader>
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <SheetTitle className="text-xl font-bold">
                {row.name}
              </SheetTitle>
              <SheetDescription className="text-sm mt-1">
                {row.grade} · {row.department}
              </SheetDescription>
            </div>
            <StatusBadge status={row.status} />
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* 기본 정보 섹션 */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              📋 기본 정보
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="성별">
                <GenderBadge gender={row.gender} />
              </InfoItem>
              <InfoItem label="전화번호">
                <a
                  href={`tel:${row.phone}`}
                  className="text-blue-600 hover:underline"
                >
                  {row.phone || "-"}
                </a>
              </InfoItem>
              <InfoItem label="타입">
                {row.type ? <TypeBadge type={row.type} /> : "-"}
              </InfoItem>
              <InfoItem label="금액">
                <span className="font-bold text-lg text-gray-900">
                  {row.amount?.toLocaleString()}원
                </span>
              </InfoItem>
            </div>
          </section>

          <Separator />

          {/* 신청 일정 섹션 */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              📅 신청 일정
            </h3>
            <div className="space-y-2">
              {scheduleItems.length > 0 ? (
                scheduleItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                  >
                    <span className="text-sm text-gray-700">
                      {item.label}
                    </span>
                    <Checkbox checked={item.checked} disabled />
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">신청된 일정이 없습니다.</p>
              )}
            </div>
          </section>

          <Separator />

          {/* 기타 정보 섹션 */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              🚌 기타 정보
            </h3>
            <div className="space-y-3">
              <InfoItem label="부서 리더">
                {row.currentLeaderName || "-"}
              </InfoItem>
              <InfoItem label="GBS">
                {row.gbs || "-"}
              </InfoItem>
              <InfoItem label="숙소">
                {row.accommodation || "-"}
              </InfoItem>
              <InfoItem label="셔틀버스 신청">
                <ShuttleBusStatusBadge hasRegistered={row.hadRegisteredShuttleBus} />
              </InfoItem>
            </div>
          </section>

          <Separator />

          {/* 처리 정보 섹션 */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              ℹ️ 처리 정보
            </h3>
            <div className="space-y-3">
              <InfoItem label="신청 시각">
                {formatDate(row.createdAt)}
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

          <Separator />

          {/* 메모 섹션 */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              📝 메모
            </h3>
            <div className="space-y-3">
              <InfoItem label="일정 변동 요청 메모">
                <div className="text-sm bg-gray-50 p-3 rounded-lg">
                  {row.memo || "없음"}
                </div>
              </InfoItem>
              <InfoItem label="행정간사 메모">
                <UnivGroupAdminStaffMemoEditor
                  row={row}
                  retreatSlug={retreatSlug}
                />
              </InfoItem>
            </div>
          </section>

          <Separator />

          {/* 작업 섹션 */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              ⚙️ 작업
            </h3>
            <div className="flex flex-col gap-2">
              <UnivGroupAdminStaffTableActions
                row={row}
                retreatSlug={retreatSlug}
              />

              {/* QR 버튼 */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (row.qrUrl) {
                    window.open(row.qrUrl, "_blank");
                  }
                }}
                disabled={!row.qrUrl}
                className="w-full justify-center gap-2"
              >
                <QrCode className="h-4 w-4" />
                QR 코드 보기
              </Button>

              {/* 메모 작성 버튼 (입금 완료 상태이고 메모 없을 때) */}
              {!row.memo && row.status === "PAID" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const event = new CustomEvent("open-memo-dialog", {
                      detail: { id: row.id },
                    });
                    window.dispatchEvent(event);
                  }}
                  className="w-full"
                >
                  일정 변동 메모 작성
                </Button>
              )}
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// 정보 항목 헬퍼 컴포넌트
function InfoItem({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-gray-500 font-medium">{label}</span>
      <div className="text-sm text-gray-900">
        {children}
      </div>
    </div>
  );
}
```

---

### 3단계: 모바일 컴팩트 테이블 생성

#### `src/components/features/univ-group-admin-staff/UnivGroupAdminStaffMobileTable.tsx`

```tsx
"use client";

import { useState, useMemo } from "react";
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
import { UnivGroupAdminStaffDetailDrawer } from "./UnivGroupAdminStaffDetailDrawer";
import { UnivGroupAdminStaffData } from "@/types/univ-group-admin-staff";
import { TRetreatRegistrationSchedule } from "@/types";

interface UnivGroupAdminStaffMobileTableProps {
  data: UnivGroupAdminStaffData[];
  schedules: TRetreatRegistrationSchedule[];
  retreatSlug: string;
}

export function UnivGroupAdminStaffMobileTable({
  data,
  schedules,
  retreatSlug,
}: UnivGroupAdminStaffMobileTableProps) {
  const [selectedRow, setSelectedRow] = useState<UnivGroupAdminStaffData | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleRowClick = (row: UnivGroupAdminStaffData) => {
    setSelectedRow(row);
    setDrawerOpen(true);
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-[60px] font-semibold text-center">
                학년
              </TableHead>
              <TableHead className="w-[45%] font-semibold">
                이름
              </TableHead>
              <TableHead className="w-[30%] text-center font-semibold">
                상태
              </TableHead>
              <TableHead className="w-[25%] text-center font-semibold">
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
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleRowClick(row);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`${row.name} 상세 정보 보기`}
                  className="cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  <TableCell className="py-3 text-center text-sm">
                    {row.grade}
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-sm">{row.name}</span>
                      <span className="text-xs text-gray-500">
                        {row.department}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex justify-center">
                      <StatusBadge status={row.status} />
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex justify-center">
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-10 text-gray-500"
                >
                  표시할 데이터가 없습니다
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <UnivGroupAdminStaffDetailDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        row={selectedRow}
        schedules={schedules}
        retreatSlug={retreatSlug}
      />
    </>
  );
}
```

---

### 4단계: 메인 테이블 컴포넌트 수정

#### `src/components/features/univ-group-admin-staff/UnivGroupAdminStaffTable.tsx`

기존 코드를 수정하여 반응형 지원:

```tsx
"use client";

import { useMemo, useState, CSSProperties } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  ColumnPinningState,
  Column,
  flexRender,
} from "@tanstack/react-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createUnivGroupAdminStaffColumns } from "./univ-group-admin-staff-columns";
import { UnivGroupAdminStaffTableToolbar } from "./UnivGroupAdminStaffTableToolbar";
import { UnivGroupAdminStaffMemoDialog } from "./UnivGroupAdminStaffMemoDialog";
import { UnivGroupAdminStaffMobileTable } from "./UnivGroupAdminStaffMobileTable"; // ✅ 추가
import { transformUnivGroupAdminStaffData } from "./utils";
import { useUnivGroupAdminStaffData } from "@/hooks/univ-group-admin-staff/use-univ-group-admin-staff-data";
import {
  IUnivGroupAdminStaffRetreat,
  UnivGroupAdminStaffData,
} from "@/types/univ-group-admin-staff";
import { TRetreatRegistrationSchedule } from "@/types";

// ... getCommonPinningStyles 함수는 동일 ...

export function UnivGroupAdminStaffTable({
  initialData,
  schedules,
  retreatSlug,
}: UnivGroupAdminStaffTableProps) {
  // ✅ SWR로 실시간 데이터 동기화
  const { data: registrations } = useUnivGroupAdminStaffData(retreatSlug, {
    fallbackData: initialData,
  });

  // ✅ TanStack Table State
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({
    left: ["department", "gender", "grade", "name"],
    right: [],
  });

  // ✅ useMemo로 columns 메모이제이션
  const columns = useMemo(
    () => createUnivGroupAdminStaffColumns(schedules, retreatSlug),
    [schedules, retreatSlug]
  );

  // ✅ useMemo로 data 메모이제이션
  const data = useMemo(
    () => transformUnivGroupAdminStaffData(registrations || [], schedules),
    [registrations, schedules]
  );

  // ✅ TanStack Table 초기화
  const table = useReactTable<UnivGroupAdminStaffData>({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
      columnPinning,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onColumnPinningChange: setColumnPinning,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: (row, columnId, filterValue) => {
      const searchableFields = [
        row.original.name,
        row.original.department,
        row.original.grade,
        row.original.type?.toString(),
        row.original.phone,
        row.original.currentLeaderName,
        row.original.gbs,
        row.original.accommodation,
        row.original.hadRegisteredShuttleBus ? "신청함" : "신청 안함",
      ];

      return searchableFields.some((field) =>
        field?.toLowerCase().includes(filterValue.toLowerCase())
      );
    },
  });

  // ✅ 필터링된 데이터 (모바일 테이블과 공유)
  const filteredData = table.getRowModel().rows.map((row) => row.original);

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader className="bg-gray-50 border-b px-4 py-3">
          <CardTitle className="text-lg">부서 현황 및 입금 조회</CardTitle>
          <CardDescription className="text-sm">
            부서 신청자 목록 ({filteredData.length}명)
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 py-4">
          {/* 툴바 */}
          <UnivGroupAdminStaffTableToolbar
            table={table}
            globalFilter={globalFilter}
            setGlobalFilter={setGlobalFilter}
            retreatSlug={retreatSlug}
          />

          {/* ✅ 모바일: 컴팩트 테이블 + Drawer */}
          <div className="md:hidden mt-4">
            <UnivGroupAdminStaffMobileTable
              data={filteredData}
              schedules={schedules}
              retreatSlug={retreatSlug}
            />
          </div>

          {/* ✅ 데스크톱: 전체 테이블 */}
          <div className="hidden md:block rounded-md border overflow-x-auto mt-4">
            <div className="max-h-[80vh] overflow-y-auto">
              <Table className="relative">
                <TableHeader className="bg-gray-100 sticky top-0 z-10">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        const pinningStyles = getCommonPinningStyles(
                          header.column
                        );
                        return (
                          <TableHead
                            key={header.id}
                            className="px-2 py-2 text-center"
                            style={{
                              ...pinningStyles,
                              width: header.column.columnDef.size,
                            }}
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody className="divide-y divide-gray-200">
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                        className="group hover:bg-gray-50 transition-colors duration-150"
                      >
                        {row.getVisibleCells().map((cell) => {
                          const pinningStyles = getCommonPinningStyles(
                            cell.column
                          );
                          return (
                            <TableCell
                              key={cell.id}
                              className="px-2 py-2"
                              style={{
                                ...pinningStyles,
                                width: cell.column.columnDef.size,
                              }}
                            >
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                      >
                        {globalFilter
                          ? "검색 결과가 없습니다."
                          : "표시할 데이터가 없습니다."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 일정 변경 요청 메모 다이얼로그 */}
      <UnivGroupAdminStaffMemoDialog retreatSlug={retreatSlug} />
    </>
  );
}
```

---

### 5단계: Separator 컴포넌트 추가 (필요시)

```bash
npx shadcn-ui@latest add separator
```

---

## 주요 기능 상세

### 1. 검색 및 필터 유지

#### 동작 원리
1. **TanStack Table의 globalFilter 사용**
   - 데스크톱과 모바일 모두 동일한 `table` 인스턴스 공유
   - `table.getRowModel().rows`로 필터링된 데이터 추출
   - 모바일 테이블에 `filteredData` prop으로 전달

2. **검색 범위**
   ```typescript
   globalFilterFn: (row, columnId, filterValue) => {
     const searchableFields = [
       row.original.name,
       row.original.department,
       row.original.grade,
       row.original.type?.toString(),
       row.original.phone,
       row.original.currentLeaderName,
       row.original.gbs,
       row.original.accommodation,
       row.original.hadRegisteredShuttleBus ? "신청함" : "신청 안함",
     ];

     return searchableFields.some((field) =>
       field?.toLowerCase().includes(filterValue.toLowerCase())
     );
   }
   ```

3. **필터 동기화**
   - SearchBar의 검색어 → `setGlobalFilter` → TanStack Table → 모바일 테이블
   - 상태 관리 없이 자동 동기화

### 2. 상태 Badge 일관성

모든 Badge 컴포넌트는 기존 것을 재사용:
- `StatusBadge`: 입금 현황
- `GenderBadge`: 성별
- `TypeBadge`: 타입
- `ShuttleBusStatusBadge`: 셔틀버스 신청 여부

### 3. 액션 버튼 통합

`UnivGroupAdminStaffTableActions` 컴포넌트를 Drawer에서도 사용:
- 입금 확인
- 환불 처리
- 새가족 등록
- 군지체 처리

Drawer에서는 버튼들이 세로로 배치되도록 스타일 조정 가능:
```tsx
// UnivGroupAdminStaffTableActions.tsx
<div className="flex md:flex-row flex-col gap-2">
  {/* 버튼들 */}
</div>
```

### 4. 메모 편집

`UnivGroupAdminStaffMemoEditor` 컴포넌트를 Drawer에서도 동일하게 사용:
- 실시간 저장
- SWR 자동 재검증

### 5. 접근성 (Accessibility)

#### 키보드 네비게이션
```tsx
<TableRow
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleRowClick(row);
    }
  }}
  tabIndex={0}
  role="button"
  aria-label={`${row.name} 상세 정보 보기`}
>
```

#### 스크린 리더 지원
```tsx
<TableHead>
  <span className="sr-only">자세히 보기</span>
</TableHead>
```

---

## 성능 최적화

### 1. 메모이제이션
```tsx
// 데이터 메모이제이션
const data = useMemo(
  () => transformUnivGroupAdminStaffData(registrations || [], schedules),
  [registrations, schedules]
);

// 필터링된 데이터 메모이제이션
const filteredData = table.getRowModel().rows.map((row) => row.original);
```

### 2. Drawer 지연 로딩
- Drawer는 `open` 상태일 때만 내부 컨텐츠 렌더링
- Sheet 컴포넌트가 이미 최적화되어 있음

### 3. 이벤트 핸들러 최적화
```tsx
// 불필요한 재렌더링 방지
const handleRowClick = useCallback((row: UnivGroupAdminStaffData) => {
  setSelectedRow(row);
  setDrawerOpen(true);
}, []);
```

---

## 스타일링 세부사항

### 1. 터치 최적화

```tsx
// 최소 44px 터치 영역
<TableCell className="py-3">  // py-3 = 12px * 2 = 24px + content height

// 시각적 피드백
className="hover:bg-gray-50 active:bg-gray-100 transition-colors"

// 명확한 클릭 표시
<ChevronRight className="h-4 w-4 text-gray-400" />
```

### 2. Drawer 스타일링

```tsx
// 화면 90% 높이
<SheetContent side="bottom" className="h-[90vh] overflow-y-auto">

// 섹션 간 간격
<div className="space-y-6">  // 24px

// 항목 간 간격
<div className="space-y-3">  // 12px
```

### 3. 반응형 브레이크포인트

Tailwind CSS의 `md` 브레이크포인트 사용 (768px):
```tsx
<div className="md:hidden">     // 모바일 (< 768px)
<div className="hidden md:block"> // 데스크톱 (>= 768px)
```

---

## 고급 기능 (선택사항)

### 1. Drawer에서 다음/이전 탐색

```tsx
export function UnivGroupAdminStaffDetailDrawer({
  // ... 기존 props
  allRows,  // ✅ 추가
}: UnivGroupAdminStaffDetailDrawerProps & {
  allRows: UnivGroupAdminStaffData[];
}) {
  const currentIndex = allRows.findIndex((r) => r.id === row?.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allRows.length - 1;

  const handlePrev = () => {
    if (hasPrev) {
      setSelectedRow(allRows[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      setSelectedRow(allRows[currentIndex + 1]);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
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
          </div>
        </SheetHeader>
        {/* ... */}
      </SheetContent>
    </Sheet>
  );
}
```

### 2. 빠른 필터 칩

```tsx
// UnivGroupAdminStaffTable.tsx
<CardContent>
  <UnivGroupAdminStaffTableToolbar ... />

  {/* ✅ 모바일 전용 빠른 필터 */}
  <div className="md:hidden flex gap-2 overflow-x-auto pb-2 mt-2">
    <Button
      variant={statusFilter === "all" ? "default" : "outline"}
      size="sm"
      onClick={() => setStatusFilter("all")}
    >
      전체 ({data.length})
    </Button>
    <Button
      variant={statusFilter === "PENDING" ? "default" : "outline"}
      size="sm"
      onClick={() => {
        table.getColumn("status")?.setFilterValue("PENDING");
        setStatusFilter("PENDING");
      }}
    >
      대기 ({pendingCount})
    </Button>
    <Button
      variant={statusFilter === "PAID" ? "default" : "outline"}
      size="sm"
      onClick={() => {
        table.getColumn("status")?.setFilterValue("PAID");
        setStatusFilter("PAID");
      }}
    >
      확인 ({paidCount})
    </Button>
  </div>

  {/* 테이블들 */}
</CardContent>
```

### 3. 상태별 시각적 구분

```tsx
<TableRow
  className={cn(
    "cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors",
    row.status === "PENDING" && "border-l-4 border-l-yellow-400",
    row.status === "PAID" && "border-l-4 border-l-green-400",
    row.status === "REFUND" && "border-l-4 border-l-red-400"
  )}
>
```

---

## 테스트 체크리스트

### 기능 테스트
- [ ] 모바일(<768px)에서 컴팩트 테이블만 표시
- [ ] 데스크톱(≥768px)에서 전체 테이블만 표시
- [ ] 행 클릭 시 Drawer 정상 오픈
- [ ] Drawer에 모든 정보 정확히 표시
- [ ] Drawer 내 액션 버튼 정상 작동
- [ ] 검색 바 필터링이 모바일 테이블에도 적용
- [ ] 스케줄 체크박스 정확히 표시
- [ ] 메모 편집 기능 정상 작동
- [ ] QR 버튼 정상 작동
- [ ] Drawer 닫기 (배경 클릭, X 버튼) 정상

### UX 테스트
- [ ] 터치 영역 충분 (최소 44px)
- [ ] 스크롤 부드러움
- [ ] 시각적 피드백 (hover, active) 적절
- [ ] 로딩 상태 적절히 표시
- [ ] 에러 상태 적절히 처리

### 접근성 테스트
- [ ] 키보드로 행 선택 가능 (Enter, Space)
- [ ] 포커스 표시 명확
- [ ] 스크린 리더로 정보 읽기 가능
- [ ] ARIA 라벨 적절

### 성능 테스트
- [ ] 150+ 행 스크롤 부드러움
- [ ] Drawer 오픈/닫기 지연 없음
- [ ] 검색 입력 시 렉 없음
- [ ] 메모리 누수 없음

---

## 트러블슈팅

### 문제 1: Drawer가 화면 하단에 나타나지 않음
**해결책**: Sheet의 `side="bottom"` 확인, z-index 확인

### 문제 2: 검색이 모바일 테이블에 반영 안됨
**해결책**: `table.getRowModel().rows`로 필터링된 데이터 전달 확인

### 문제 3: 액션 버튼이 Drawer에서 작동 안함
**해결책**: `UnivGroupAdminStaffTableActions`가 `row` prop을 올바르게 받는지 확인

### 문제 4: 스케줄 체크박스가 표시 안됨
**해결책**: `schedules` prop이 올바르게 전달되는지, `getScheduleLabel` 함수 확인

---

## 결론

### 이 구현의 장점
1. **UX 우수**: 가로 스크롤 없이 핵심 정보 빠르게 스캔
2. **일관성**: 기존 컴포넌트 재사용으로 디자인 통일
3. **유지보수**: 로직 중복 최소화, TanStack Table 기반 일관성
4. **확장성**: Drawer 내 추가 기능 구현 용이
5. **성능**: 메모이제이션 및 지연 로딩으로 최적화
6. **접근성**: 키보드 네비게이션, 스크린 리더 지원

### 다음 단계
1. **Drawer 네비게이션**: 다음/이전 버튼 추가
2. **빠른 필터**: 상태별 필터 칩 추가
3. **오프라인 지원**: SWR 캐시 전략 강화
4. **애니메이션**: Drawer 오픈/닫기 애니메이션 커스터마이즈

이 가이드를 따라 구현하면 모바일 사용자에게 최적화된 UX를 제공할 수 있습니다.
