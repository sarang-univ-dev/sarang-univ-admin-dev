# 재사용 가능한 테이블 상세 정보 사이드바 구현 계획

## 개요
여러 페이지의 테이블에서 공통으로 사용할 수 있는 재사용 가능한 상세 정보 사이드바 시스템을 구축합니다. Generic TypeScript 패턴과 Render Props를 활용하여 확장성과 재사용성을 극대화합니다.

## 설계 원칙
- **Single Responsibility**: 구조(Structure)와 표현(Presentation)을 분리
- **Type Safety**: Generic 타입으로 타입 안전성 보장
- **Reusability**: 모든 페이지/테이블에서 재사용 가능
- **Composability**: 작은 컴포넌트들의 조합으로 복잡한 UI 구성
- **DRY**: 중복 코드 최소화

## 아키텍처

### 레이어 구조
```
┌─────────────────────────────────────────┐
│  Feature Layer (페이지별 컨텐츠)         │
│  - UnivGroupRetreatRegistrationDetail   │
│  - StudentDetailContent                 │
│  - StaffDetailContent                   │
└──────────────────┬──────────────────────┘
                   │ uses
┌──────────────────▼──────────────────────┐
│  Common Layer (재사용 가능 컴포넌트)     │
│  - DetailSidebar<T>                     │
│  - InfoSection                          │
│  - InfoItem                             │
│  - useDetailSidebar<T>                  │
└──────────────────┬──────────────────────┘
                   │ uses
┌──────────────────▼──────────────────────┐
│  UI Layer (shadcn/ui)                   │
│  - Sheet, SheetContent, etc.            │
└─────────────────────────────────────────┘
```

## 구현 계획

### 1. 공통 컴포넌트 레이어 (Common Layer)

#### 디렉토리 구조
```
src/components/common/detail-sidebar/
  ├── DetailSidebar.tsx        # Generic Sheet wrapper
  ├── InfoSection.tsx          # 섹션 컴포넌트
  ├── InfoItem.tsx             # 아이템 컴포넌트
  ├── useDetailSidebar.ts      # Custom hook
  └── index.ts                 # Exports
```

#### 1.1 Generic DetailSidebar 컴포넌트

**핵심 설계**:
- Generic 타입 `<T>`로 어떤 데이터 타입이든 지원
- Render Props 패턴으로 컨텐츠 주입
- 상태 관리는 외부에서 제어 (Controlled Component)

```typescript
// DetailSidebar.tsx
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface DetailSidebarProps<T> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: T | null;
  title?: string;
  description?: string | ((data: T) => string);
  side?: "left" | "right" | "top" | "bottom";
  className?: string;
  children: (data: T) => React.ReactNode;
}

export function DetailSidebar<T>({
  open,
  onOpenChange,
  data,
  title = "상세 정보",
  description,
  side = "right",
  className,
  children,
}: DetailSidebarProps<T>) {
  if (!data) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={side}
        className={cn("w-[500px] sm:w-[600px] overflow-y-auto", className)}
      >
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description && (
            <SheetDescription>
              {typeof description === 'function'
                ? description(data)
                : description}
            </SheetDescription>
          )}
        </SheetHeader>
        <div className="mt-6 space-y-6">
          {children(data)}
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

**사용 예시**:
```typescript
<DetailSidebar
  open={isOpen}
  onOpenChange={setIsOpen}
  data={selectedRow}
  title="신청자 상세 정보"
  description={(data) => `${data.name} (${data.department})`}
>
  {(data) => <MyDetailContent data={data} />}
</DetailSidebar>
```

#### 1.2 InfoSection 컴포넌트

재사용 가능한 정보 섹션 컴포넌트

```typescript
// InfoSection.tsx
import { cn } from "@/lib/utils";

interface InfoSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function InfoSection({ title, children, className }: InfoSectionProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="text-base font-semibold text-gray-900 pb-2 border-b">
        {title}
      </h3>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  );
}
```

#### 1.3 InfoItem 컴포넌트

재사용 가능한 Key-Value 표시 컴포넌트

```typescript
// InfoItem.tsx
import { cn } from "@/lib/utils";

interface InfoItemProps {
  label: string;
  value: React.ReactNode;
  labelClassName?: string;
  valueClassName?: string;
}

export function InfoItem({
  label,
  value,
  labelClassName,
  valueClassName,
}: InfoItemProps) {
  return (
    <div className="flex items-start py-2">
      <dt className={cn(
        "text-sm font-medium text-gray-500 w-32 flex-shrink-0",
        labelClassName
      )}>
        {label}
      </dt>
      <dd className={cn("text-sm text-gray-900 flex-1", valueClassName)}>
        {value || "-"}
      </dd>
    </div>
  );
}
```

#### 1.4 useDetailSidebar Custom Hook

상태 관리를 위한 재사용 가능한 Hook

```typescript
// useDetailSidebar.ts
import { useState, useCallback } from "react";

export function useDetailSidebar<T>() {
  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback((item: T) => {
    setSelectedItem(item);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    // 애니메이션 후 데이터 클리어
    setTimeout(() => setSelectedItem(null), 300);
  }, []);

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      close();
    } else {
      setIsOpen(true);
    }
  }, [close]);

  return {
    selectedItem,
    isOpen,
    open,
    close,
    setIsOpen: handleOpenChange,
  };
}
```

**사용 예시**:
```typescript
const sidebar = useDetailSidebar<UnivGroupAdminStaffData>();

// 열기
<Button onClick={() => sidebar.open(rowData)}>상세보기</Button>

// Sheet에 연결
<DetailSidebar
  open={sidebar.isOpen}
  onOpenChange={sidebar.setIsOpen}
  data={sidebar.selectedItem}
>
  {(data) => <Content data={data} />}
</DetailSidebar>
```

#### 1.5 index.ts

```typescript
// index.ts
export { DetailSidebar } from "./DetailSidebar";
export { InfoSection } from "./InfoSection";
export { InfoItem } from "./InfoItem";
export { useDetailSidebar } from "./useDetailSidebar";
```

### 2. Feature 레이어 (페이지별 구현)

#### 2.1 부서 수양회 신청 상세 컨텐츠

```typescript
// src/components/features/univ-group-retreat-registration/UnivGroupRetreatRegistrationDetailContent.tsx

import { InfoSection, InfoItem } from "@/components/common/detail-sidebar";
import { UnivGroupAdminStaffData } from "@/types/univ-group-admin-staff";
import { GenderBadge, StatusBadge, TypeBadge } from "@/components/Badge";
import { ShuttleBusStatusBadge } from "./ShuttleBusStatusBadge";
import { formatDate } from "@/utils/formatDate";

interface UnivGroupRetreatRegistrationDetailContentProps {
  data: UnivGroupAdminStaffData;
}

export function UnivGroupRetreatRegistrationDetailContent({
  data,
}: UnivGroupRetreatRegistrationDetailContentProps) {
  return (
    <>
      {/* 기본 정보 */}
      <InfoSection title="기본 정보">
        <InfoItem label="이름" value={data.name} />
        <InfoItem label="부서" value={data.department} />
        <InfoItem label="학년" value={data.grade} />
        <InfoItem label="성별" value={<GenderBadge gender={data.gender} />} />
        <InfoItem label="전화번호" value={data.phone} />
        <InfoItem label="부서 리더명" value={data.currentLeaderName} />
      </InfoSection>

      {/* 신청 정보 */}
      <InfoSection title="신청 정보">
        <InfoItem
          label="신청시각"
          value={formatDate(data.createdAt)}
        />
        <InfoItem label="타입" value={<TypeBadge type={data.type} />} />
        <InfoItem
          label="금액"
          value={`${data.amount?.toLocaleString()}원`}
        />
        <InfoItem
          label="입금 현황"
          value={<StatusBadge status={data.status} />}
        />
        <InfoItem
          label="셔틀버스"
          value={<ShuttleBusStatusBadge hasRegistered={data.hadRegisteredShuttleBus} />}
        />
      </InfoSection>

      {/* 처리 정보 */}
      <InfoSection title="처리 정보">
        <InfoItem label="처리자명" value={data.confirmedBy} />
        <InfoItem
          label="처리시각"
          value={formatDate(data.paymentConfirmedAt)}
        />
      </InfoSection>

      {/* QR 코드 */}
      {data.qrUrl && (
        <InfoSection title="QR 코드">
          <div className="flex justify-center p-4">
            <img
              src={data.qrUrl}
              alt="QR Code"
              className="w-64 h-64 border rounded-lg"
            />
          </div>
        </InfoSection>
      )}

      {/* 일정 변동 요청 메모 */}
      {data.memo && (
        <InfoSection title="일정 변동 요청 메모">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm whitespace-pre-wrap">{data.memo}</p>
          </div>
        </InfoSection>
      )}

      {/* 행정간사 메모 */}
      {data.staffMemo && (
        <InfoSection title="행정간사 메모">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm whitespace-pre-wrap">{data.staffMemo}</p>
          </div>
        </InfoSection>
      )}
    </>
  );
}
```

#### 2.2 테이블 통합

```typescript
// UnivGroupRetreatRegistrationTable.tsx

import { DetailSidebar, useDetailSidebar } from "@/components/common/detail-sidebar";
import { UnivGroupRetreatRegistrationDetailContent } from "./UnivGroupRetreatRegistrationDetailContent";

export function UnivGroupRetreatRegistrationTable({ ... }) {
  // 사이드바 상태 관리
  const sidebar = useDetailSidebar<UnivGroupAdminStaffData>();

  // ... 기존 테이블 로직

  return (
    <>
      <div className="space-y-4">
        {/* 테이블 */}
        <table>
          {/* ... */}
        </table>
      </div>

      {/* 상세 정보 사이드바 */}
      <DetailSidebar
        open={sidebar.isOpen}
        onOpenChange={sidebar.setIsOpen}
        data={sidebar.selectedItem}
        title="신청자 상세 정보"
        description={(data) => `${data.name} (${data.department}) 신청 내역`}
      >
        {(data) => <UnivGroupRetreatRegistrationDetailContent data={data} />}
      </DetailSidebar>
    </>
  );
}
```

#### 2.3 테이블 컬럼 수정

```typescript
// use-univ-group-retreat-registration-columns.tsx

import { Info } from "lucide-react";

// "추가 정보" 컬럼 추가 (액션 컬럼 앞에 위치)
columnHelper.display({
  id: "detailInfo",
  header: () => <div className="text-center text-sm">상세</div>,
  cell: props => (
    <div className="flex justify-center">
      <Button
        size="sm"
        variant="outline"
        onClick={() => onRowClick?.(props.row.original)}
        className="h-7 text-xs"
      >
        <Info className="h-3 w-3 mr-1" />
        보기
      </Button>
    </div>
  ),
  size: 80,
}),

// 제거할 컬럼들 (rightColumns에서 삭제)
// ❌ createdAt (신청시각)
// ❌ confirmedBy (처리자명)
// ❌ paymentConfirmedAt (처리시각)
```

컬럼 훅에 `onRowClick` 콜백 추가:

```typescript
export function useUnivGroupRetreatRegistrationColumns(
  schedules: TRetreatRegistrationSchedule[],
  retreatSlug: string,
  onRowClick?: (row: UnivGroupAdminStaffData) => void  // 추가
) {
  // ...
}
```

테이블에서 사용:

```typescript
const columns = useUnivGroupRetreatRegistrationColumns(
  schedules,
  retreatSlug,
  sidebar.open  // 사이드바 open 함수 전달
);
```

## 다른 페이지 적용 예시

### 학생 관리 페이지
```typescript
// StudentDetailContent.tsx
export function StudentDetailContent({ data }: { data: StudentData }) {
  return (
    <>
      <InfoSection title="학생 정보">
        <InfoItem label="학번" value={data.studentId} />
        <InfoItem label="이름" value={data.name} />
        <InfoItem label="학과" value={data.major} />
      </InfoSection>
      {/* ... */}
    </>
  );
}

// StudentTable.tsx
const sidebar = useDetailSidebar<StudentData>();

<DetailSidebar
  open={sidebar.isOpen}
  onOpenChange={sidebar.setIsOpen}
  data={sidebar.selectedItem}
  title="학생 상세 정보"
>
  {(data) => <StudentDetailContent data={data} />}
</DetailSidebar>
```

## 구현 순서

### Phase 1: 공통 컴포넌트 구축
1. ✅ Sheet 컴포넌트 확인 (이미 존재)
2. **InfoSection.tsx** 생성
3. **InfoItem.tsx** 생성
4. **useDetailSidebar.ts** 생성
5. **DetailSidebar.tsx** 생성
6. **index.ts** 생성

### Phase 2: Feature 구현
7. **UnivGroupRetreatRegistrationDetailContent.tsx** 생성
8. **use-univ-group-retreat-registration-columns.tsx** 수정
   - onRowClick 콜백 추가
   - 3개 컬럼 제거 (신청시각, 처리자명, 처리시각)
   - "상세" 버튼 컬럼 추가
9. **UnivGroupRetreatRegistrationTable.tsx** 수정
   - useDetailSidebar 사용
   - DetailSidebar 렌더링
10. **index.ts** 업데이트

### Phase 3: 테스트 및 검증
11. 기능 테스트 (열기/닫기, 데이터 표시)
12. 반응형 테스트 (모바일/태블릿)
13. 접근성 테스트 (키보드 네비게이션)
14. 성능 테스트 (리렌더링 최적화)

## Best Practices 적용

### 1. StackOverflow 권장 패턴 ✅
- Sheet를 테이블 외부에 배치
- State 기반으로 관리 (DOM 중첩 방지)
- Controlled Component 패턴

### 2. Generic TypeScript 패턴 ✅
- 타입 안전성 보장
- 재사용성 극대화
- any 타입 사용 제거

### 3. Render Props 패턴 ✅
- 구조와 표현 분리
- 유연한 컨텐츠 주입
- 조합 가능한 컴포넌트

### 4. Custom Hook ✅
- 상태 관리 로직 재사용
- 컴포넌트 간결화
- 테스트 가능성 향상

### 5. Single Responsibility ✅
- DetailSidebar: 구조만 제공
- Feature Content: 표현만 담당
- InfoSection/InfoItem: 재사용 가능한 블록

## 예상 효과

### 재사용성
- 모든 페이지에서 동일한 DetailSidebar 사용 가능
- InfoSection, InfoItem 어디서든 재사용
- 새로운 페이지 추가 시 Content만 작성

### 유지보수성
- 수정 사항이 한 곳에 집중
- 타입 안전성으로 에러 조기 발견
- 명확한 책임 분리

### 확장성
- 새로운 섹션 추가 용이
- 다양한 레이아웃 구성 가능
- 커스터마이징 옵션 제공

### 성능
- useMemo/useCallback 활용
- 불필요한 리렌더링 방지
- 애니메이션 최적화

## 파일 구조 요약

```
src/
├── components/
│   ├── common/
│   │   └── detail-sidebar/          # 🆕 공통 레이어
│   │       ├── DetailSidebar.tsx
│   │       ├── InfoSection.tsx
│   │       ├── InfoItem.tsx
│   │       ├── useDetailSidebar.ts
│   │       └── index.ts
│   └── features/
│       └── univ-group-retreat-registration/
│           ├── UnivGroupRetreatRegistrationDetailContent.tsx  # 🆕
│           ├── UnivGroupRetreatRegistrationTable.tsx          # 수정
│           └── ...
└── hooks/
    └── univ-group-retreat-registration/
        └── use-univ-group-retreat-registration-columns.tsx    # 수정
```

## 완료 기준

### Common Layer
- [ ] InfoSection 컴포넌트 구현 완료
- [ ] InfoItem 컴포넌트 구현 완료
- [ ] useDetailSidebar Hook 구현 완료
- [ ] DetailSidebar Generic 컴포넌트 구현 완료
- [ ] 타입 정의 및 export 완료

### Feature Layer
- [ ] UnivGroupRetreatRegistrationDetailContent 구현 완료
- [ ] 테이블 컬럼 3개 제거 완료
- [ ] "상세" 버튼 추가 완료
- [ ] 테이블에 사이드바 통합 완료

### 품질 검증
- [ ] TypeScript 타입 에러 없음
- [ ] 기존 기능 정상 작동 (필터링, 정렬)
- [ ] 사이드바 애니메이션 자연스러움
- [ ] 모바일/태블릿 반응형 확인
- [ ] ESC 키로 닫기 동작
- [ ] 데이터 null 처리 확인

## 참고 자료

- [shadcn/ui Sheet Documentation](https://ui.shadcn.com/docs/components/sheet)
- [StackOverflow: Mixing data-table and sheet](https://stackoverflow.com/questions/77355722/)
- [Generic React Components with TypeScript](https://brockherion.dev/blog/posts/building-reusable-components-in-react-with-typescript-and-generics/)
- [React Render Props Pattern](https://reactjs.org/docs/render-props.html)
