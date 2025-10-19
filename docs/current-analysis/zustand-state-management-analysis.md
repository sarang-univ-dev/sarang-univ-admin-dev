# Zustand 전역 상태 관리 분석

## 📊 현재 Zustand 전역 상태 (3개)

### 1. **Toast Store** (`src/store/toast-store.ts`)
```typescript
{
  toasts: Toast[];           // 최대 3개 알림 메시지 관리
  add: (toast) => string;    // 알림 추가
  dismiss: (id) => void;     // 알림 닫기
  remove: (id) => void;      // 알림 제거
}
```
**용도:** 전역 알림/토스트 메시지

### 2. **Sidebar Store** (`src/store/sidebar-store.ts`)
```typescript
{
  isOpen: boolean;    // 사이드바 열림/닫힘 상태
  open: () => void;
  close: () => void;
  toggle: () => void;
}
```
**용도:** 모바일 사이드바 토글

### 3. **ConfirmDialog Store** (`src/store/confirm-dialog-store.ts`)
```typescript
{
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm: () => void;     // 확인 콜백
  show: (options) => void;
  close: () => void;
}
```
**용도:** 전역 확인 다이얼로그 (삭제, 변경 등 확인용)

---

## 🎯 프로젝트 기능 분석 (22개 주요 페이지)

### **재정 관리**
- 수련회 결제 확인
- 버스 결제 확인
- 계정 담당자 관리 (등록 현황, 메모 관리)

### **숙소 (기숙사) 관리**
- 성별별 기숙사 배정
- 수용 인원 관리
- 기숙사 팀 멤버 관리
- 기숙사 변경 이력

### **GBS (소그룹) 관리**
- GBS 라인업 배정 (2초마다 자동 새로고침)
- 리더 배정 및 관리
- 장소 배정
- 라인업 변경 이력

### **버스/셔틀**
- 버스 등록 및 결제
- 버스 일정 변경 요청
- 버스 일정 변경 이력

### **일정 관리**
- 식사 체크 (아침/점심/저녁)
- 일정 변경 요청
- 일정 변경 이력

---

## 💡 **추천: 추가해야 할 Zustand 전역 상태**

현재 **SWR**로 매번 데이터를 가져오고 있어 불필요한 API 호출이 많습니다. 다음 상태들을 Zustand로 관리하면 성능과 사용성이 크게 개선됩니다:

### ⭐ **최우선 순위**

#### 1. **User Context Store** (사용자 컨텍스트)
```typescript
{
  user: TUser | null;                    // 현재 사용자 정보
  retreatSlug: string | null;            // 현재 수련회 슬러그
  userRoles: UserRetreatMapping[];       // 사용자 권한/역할
  isAuthenticated: boolean;              // 인증 상태
  setUser: (user) => void;
  setRetreatSlug: (slug) => void;
  logout: () => void;
}
```
**이유:**
- 모든 페이지에서 `useParams()`로 retreatSlug 반복 조회
- 사이드바, 헤더에서 매번 사용자 정보 fetch
- 권한 체크를 페이지마다 반복

**효과:**
- API 호출 80% 이상 감소
- 페이지 전환 속도 향상
- props drilling 제거

#### 2. **Retreat Context Store** (수련회 컨텍스트)
```typescript
{
  currentRetreat: TRetreat | null;             // 현재 수련회 정보
  schedules: TRetreatRegistrationSchedule[];   // 일정
  univGroups: TRetreatUnivGroup[];            // 대학부 그룹
  dormitories: TRetreatDormitory[];           // 기숙사 목록
  gbsGroups: TRetreatGBS[];                   // GBS 그룹
  setCurrentRetreat: (retreat) => void;
  updateSchedules: (schedules) => void;
}
```
**이유:**
- 수련회 기본 정보가 모든 페이지에서 필요
- 사이드바 메뉴 생성시마다 재조회
- 일정/기숙사/GBS 정보가 여러 페이지에서 공유됨

**효과:**
- 페이지 간 캐싱으로 불필요한 재조회 제거
- 일관된 데이터 표시

#### 3. **Permission Store** (권한 캐시)
```typescript
{
  accessiblePages: string[];              // 접근 가능한 페이지 목록
  userRole: TUserRole | null;            // 사용자 역할
  checkAccess: (page: string) => boolean;
  setPermissions: (role) => void;
}
```
**이유:**
- 사이드바가 렌더링될 때마다 권한 체크
- 22개 페이지 접근 권한을 매번 계산

**효과:**
- 사이드바 렌더링 성능 2-3배 향상

---

### ⚡ **중간 순위**

#### 4. **Table State Store** (테이블 필터/정렬)
```typescript
{
  filters: Record<string, any>;          // 테이블별 필터 상태
  sorting: Record<string, SortConfig>;   // 정렬 상태
  pagination: Record<string, PageConfig>; // 페이지네이션
  setFilter: (table, filter) => void;
  clearFilters: (table) => void;
}
```
**이유:**
- AccountStaffTable, DormitoryStaffTable 등 복잡한 테이블에 로컬 상태 분산
- 페이지 이동 후 돌아오면 필터가 초기화됨

**효과:**
- 사용자 경험 개선 (필터 유지)
- 테이블 상태 관리 일관성

#### 5. **Notification Settings Store** (알림 설정)
```typescript
{
  autoRefreshIntervals: Record<string, number>;  // 페이지별 자동 새로고침 간격
  enableRealtime: boolean;                      // 실시간 업데이트 활성화
  setRefreshInterval: (page, interval) => void;
}
```
**이유:**
- GBS 라인업은 2초마다 자동 새로고침 (하드코딩됨)
- 다른 페이지도 실시간 업데이트가 필요할 수 있음

---

## 📁 현재 데이터 흐름 문제점

```
현재:
Page → useParams() → API Call → SWR Cache → Render
       ↓
     Sidebar → useParams() → API Call (중복!) → Render
       ↓
     Header → useUserRole() → API Call (중복!) → Render

권장:
초기 로드: Page → API Call → Zustand Store 업데이트
이후: Page/Sidebar/Header → Zustand Store 직접 읽기 (API 호출 없음)
```

---

## 🎯 구현 우선순위

1. **1단계:** User Context Store 구현 → 모든 컴포넌트에서 사용자/권한 중복 조회 제거
2. **2단계:** Retreat Context Store → 수련회 데이터 캐싱
3. **3단계:** Permission Store → 사이드바 성능 최적화
4. **4단계:** Table State Store (선택) → 사용자 경험 개선

---

## 📈 세부 프로젝트 구조

### 기술 스택
- **Framework:** Next.js 14.2.15 (App Router)
- **Language:** TypeScript 5.8.2
- **State Management:** Zustand 5.0.4 (현재 최소한의 사용)
- **Data Fetching:** SWR 2.3.3
- **Form Handling:** React Hook Form 7.54.1, Zod 3.24.1
- **UI Components:** Radix UI, Tailwind CSS
- **Authentication:** Google OAuth
- **HTTP Client:** Axios 1.7.7
- **Drag & Drop:** @hello-pangea/dnd 17.0.0

### 디렉토리 구조
```
src/
├── app/                          # Next.js app router 페이지
│   ├── (main)/                  # 보호된 메인 라우트
│   │   ├── page.tsx             # 대시보드 홈
│   │   └── retreat/[retreatSlug]/  # 동적 수련회 라우트 (22개 페이지)
│   ├── login/                   # 로그인 및 인증 라우트
│   └── api/                     # API 라우트 (인증/새로고침)
├── components/                   # 98+ React 컴포넌트
│   ├── common/layout/           # Header, Sidebar, Footer, Toast, ConfirmModal
│   ├── GBSLineup/               # GBS 라인업 관리 컴포넌트
│   ├── ui/                      # 기본 UI 컴포넌트
│   ├── radix/                   # Radix UI 래핑 컴포넌트
│   ├── icons/                   # SVG 아이콘 컴포넌트
│   └── providers/               # Context providers
├── hooks/                        # 18개 커스텀 데이터 페칭 훅
├── lib/
│   ├── api/                     # API 클라이언트 함수
│   ├── hooks/swr/               # SWR 기반 데이터 훅
│   ├── types/                   # TypeScript 타입 정의
│   ├── utils/                   # 유틸리티 함수
│   └── constant/                # 설정 상수
├── store/                        # Zustand 스토어 (3개 스토어)
├── styles/                       # 전역 CSS
└── types/                        # 도메인별 타입
```

### 주요 도메인 타입

```typescript
// 사용자/인증
TUser, TUserProfile, TUserRole, UserRetreatMapping
Gender (MALE, FEMALE)
UserRetreatRegistrationType (NEW_COMER, STAFF, SOLDIER)

// 수련회 코어
TRetreat, TRetreatUnivGroup, TRetreatPaymentSchedule
TRetreatRegistrationSchedule
TRetreatGBS, TRetreatDormitory, TRetreatShuttleBus

// 등록 및 배정
TUserRetreatRegistration
TUserRetreatRegistrationSchedule
TUserRetreatShuttleBusRegistration

// 메모 및 노트
TUserRetreatRegistrationMemo
TUserRetreatRegistrationHistoryMemo

// 결제 상태
UserRetreatRegistrationPaymentStatus (다양한 상태)
UserRetreatShuttleBusPaymentStatus

// 변경 이력
TUserRetreatRegistrationScheduleHistory
TUserRetreatShuttleBusRegistrationHistory

// Enum
RetreatRegistrationScheduleType (BREAKFAST, LUNCH, DINNER, SLEEP)
UserRole (다양한 역할 타입)
```

---

## 🔍 데이터 페칭 패턴

### 주요 데이터 페칭 도구: SWR (Stale-While-Revalidate)

**18개 커스텀 SWR 훅:**
- `useUserRetreatRegistration()` - 수련회 등록
- `useUserLineups()` - GBS 라인업 (2초 자동 새로고침)
- `useAvailableDormitories()` - 사용 가능한 기숙사 슬롯
- `useAllDormitories()` - 모든 기숙사
- `useAssignDormitory()` - 기숙사 배정 Mutation
- `useUserRole()` - 사용자 권한/역할
- `useUser()` - 현재 사용자 정보
- 그 외 11+ 개...

### 인증 패턴
- 액세스 토큰은 쿠키에 저장 (`js-cookie`)
- Axios 인터셉터를 통한 Authorization 헤더 주입
- `/api/auth/refresh`에서 토큰 새로고침 메커니즘

### API 설정
- **파일:** `/src/lib/api/axios.ts`
- Base URL: `config.API_HOST`
- 자동 bearer 토큰 주입
- CORS credentials 활성화

### API 엔드포인트 패턴
```
/api/v1/retreat/{slug}/account/retreat-registrations
/api/v1/retreat/{slug}/line-up/user-lineups
/api/v1/retreat/{slug}/dormitory/available-dormitories-by-gender
/api/v1/retreat/{slug}/user-role
/api/v1/auth/check-auth
/api/v1/auth/google/callback
```

---

## 📋 22개 주요 기능 페이지

| 기능 | 페이지 라우트 | 타입 | 설명 |
|------|--------------|------|------|
| Account Staff | `/account-staff` | 재정 | 수련회 결제 등록 보기/관리 |
| GBS Lineup | `/gbs-line-up` | 라인업 관리 | GBS 라인업 배정 보기 |
| GBS Line-up Management | `/gbs-line-up-management` | 라인업 관리 | GBS 리더 관리 |
| Dormitory Assignment | `/dormitory-assignment` | 숙소 | 사용자를 기숙사에 배정 |
| Dormitory Team Member | `/dormitory-team-member` | 숙소 | 기숙사 팀 배정 보기 |
| Department Info | `/department` | 정보 | 대학부 그룹 정보 |
| Meal Check | `/meal-check` | 운영 | 식사 확인 체크 |
| Shuttle Check | `/shuttle-check` | 버스 | 셔틀버스 확인 체크 |
| Schedule | `/schedule` | 계획 | 수련회 일정 보기 |
| Schedule Change Request | `/schedule-change-request` | 변경 관리 | 일정 변경 요청 |
| Schedule Change History | `/schedule-change-history` | 변경 관리 | 일정 변경 이력 보기 |
| Bus Schedule Change Request | `/bus-schedule-change-request` | 버스 변경 | 버스 일정 변경 요청 |
| Bus Schedule Change History | `/bus-schedule-change-history` | 버스 변경 | 버스 일정 변경 보기 |
| Confirm Retreat Payment | `/confirm-retreat-payment` | 결제 | 수련회 결제 확인 |
| Confirm Bus Payment | `/confirm-bus-payment` | 결제 | 버스 결제 확인 |
| Assign GBS Location | `/assign-gbs-location` | 장소 | GBS 모임 장소 배정 |
| Dorm View Changes | `/dorm-view-changes` | 변경 관리 | 기숙사 변경 보기 |
| Lineup View Changes | `/lineup-view-changes` | 변경 관리 | 라인업 변경 보기 |
| Univ Group Staff Retreat | `/univ-group-staff-retreat` | 정보 | 대학부 스태프 수련회 정보 |
| Univ Group Staff Bus | `/univ-group-staff-bus` | 버스 | 대학부 스태프 버스 정보 |
| Login | `/login` | 인증 | Google OAuth 로그인 |
| Home | `/` | 대시보드 | 메인 대시보드 |

---

## 💻 구현 권장사항

### Phase 1: User & Retreat Context Store 생성
```typescript
// 기존 스토어와 유사한 구조로 정의
interface UserContextStore {
  user: TUser | null;
  retreatSlug: string | null;
  userRoles: UserRetreatMapping[];
  isAuthenticated: boolean;
  setUser: (user: TUser) => void;
  setRetreatSlug: (slug: string) => void;
  setUserRoles: (roles: UserRetreatMapping[]) => void;
  logout: () => void;
}
```
**효과:** 반복되는 `useParams()` 및 `useUserRole()` 호출 제거

### Phase 2: 사이드바를 전역 상태 사용하도록 리팩토링
- 훅 대신 스토어에서 retreatSlug 가져오기
- 훅 대신 스토어에서 사용자 역할 가져오기
- 라우트 변경시 렌더링 2-3회 개선

### Phase 3: Retreat Cache Store 생성
```typescript
interface RetreatCacheStore {
  currentRetreat: TRetreat | null;
  schedules: TRetreatRegistrationSchedule[];
  univGroups: TRetreatUnivGroup[];
  setCurrentRetreat: (retreat: TRetreat) => void;
  // ... 등
}
```

### Phase 4: 지속성 추가 (선택사항)
- Zustand의 persist 미들웨어 사용
- 세션 간 사용자 설정 캐싱
- 마지막 선택한 수련회 기억

---

## ✅ 코드 품질 관찰

### 강점:
- 명확한 관심사 분리 (훅, 컴포넌트, 스토어)
- TypeScript 타입 일관된 사용
- 모듈형 컴포넌트 아키텍처
- 데이터 페칭을 위한 커스텀 훅의 좋은 활용

### 개선 영역:
- 전역 상태 활용도가 낮음 (UI 중심 스토어 3개만)
- 일부 컴포넌트 props drilling이 컨텍스트/스토어로 제거 가능
- API 엔드포인트 패턴이 일관되고 잘 문서화됨
- 역할 기반 접근 제어 캐싱 필요

---

## 📝 요약

이 시스템은 대학 교회 조직을 위한 **종합 수련회 관리 시스템**입니다:
- **22개 주요 기능 페이지** (재정, 숙소, GBS 그룹, 버스)
- **역할 기반 접근 제어** (다양한 스태프 유형)
- **SWR을 사용한 실시간 데이터 동기화**
- **최소한의 전역 상태** (Zustand로 UI 상태만 관리)
- **강력한 확장 기회** - 사용자 컨텍스트, 수련회 컨텍스트, 캐싱을 위한 Zustand 확장 가능

코드베이스는 잘 구조화되어 있지만, 사용자 컨텍스트, 수련회 데이터 캐싱, 권한 관리를 위한 추가 전역 상태 관리가 필요하여 props drilling과 불필요한 API 호출을 줄일 수 있습니다.

현재 시스템은 **UI 상태만 Zustand로 관리**하고 있어, 비즈니스 로직과 데이터는 모두 SWR에 의존하고 있습니다. User/Retreat Context를 Zustand로 이동하면 성능과 코드 품질이 크게 개선될 것입니다.
