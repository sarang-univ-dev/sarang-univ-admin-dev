# 새로운 사이드바 구현 계획

## 📋 개요

현재 사이드바를 shadcn/ui 사이드바 컴포넌트로 마이그레이션합니다.

### 주요 개선 사항

1. **Retreat별 그룹화된 사이드바**
   - 사용자가 접근 가능한 여러 retreat을 그룹으로 표시
   - 각 retreat 내부에서 권한별 메뉴 아이템 표시
   - 접을 수 있는(collapsible) UI

2. **동적 경로 처리**
   - 현재 선택된 retreat에 따라 메뉴 동적 변경
   - 여러 retreat 간 빠른 전환

3. **서버 중심 권한 관리**
   - DAL 패턴으로 서버에서 메뉴 계산
   - 클라이언트는 표시만 담당

---

## 🏗️ 시스템 아키텍처

### 핵심 설계 원칙

1. **서버 중심 권한 관리**
   - DAL 패턴으로 모든 권한 계산은 서버에서 수행
   - 클라이언트는 서버가 계산한 메뉴만 표시

2. **Retreat별 그룹화**
   - 사용자가 접근 가능한 모든 retreat을 사이드바에 표시
   - 각 retreat 내에서 권한별 메뉴 아이템 구성

3. **URL 기반 상태 관리**
   - 추가 상태 관리 라이브러리 없이 URL이 single source of truth
   - 북마크 가능, SEO 친화적

---

## 🎯 구현 계획

### 1. Shadcn Sidebar 설치 및 설정

#### 1.1 설치
```bash
pnpm dlx shadcn@latest add sidebar collapsible
```

#### 1.2 핵심 컴포넌트
- `SidebarProvider`: 사이드바 상태 관리
- `Sidebar`: 메인 컨테이너
- `SidebarHeader`: 고정 헤더 영역
- `SidebarContent`: 스크롤 가능한 메뉴 영역
- `SidebarGroup`: 메뉴 그룹 (retreat별)
- `SidebarMenu`: 메뉴 아이템 리스트
- `SidebarFooter`: 고정 푸터 영역

#### 1.3 주요 기능
- 키보드 단축키 지원 (cmd+b / ctrl+b)
- 상태 지속성 (페이지 리로드 시에도 유지)
- 반응형 디자인 (모바일 지원)
- 테마 커스터마이징

---

### 2. 새로운 사이드바 구조 설계

#### 2.1 데이터 구조

```typescript
// lib/types/sidebar.ts
export interface RetreatWithMenus {
  id: string;
  slug: string;
  name: string;
  menuItems: MenuItem[];
}

export interface MenuItem {
  path: string;
  label: string;
  href: string;
  icon?: string; // 아이콘 이름 (선택)
}
```

**핵심 원칙:**
- 권한 계산은 **서버에서** 완료 (DAL 패턴)
- 클라이언트는 받은 메뉴만 표시
- 상태는 URL에 저장 (`/retreat/[slug]/[page]`)
- shadcn `SidebarProvider`가 열림/닫힘 상태 관리

#### 2.2 API 엔드포인트 추가 (서버)

##### `/api/v1/user/retreats-with-menus`
- **목적**: 사용자가 접근 가능한 모든 retreat + 각 retreat의 메뉴 목록
- **응답**:
```typescript
{
  retreats: [
    {
      id: string;
      slug: string;
      name: string;
      menuItems: [
        {
          path: string;        // '/confirm-retreat-payment'
          label: string;       // '수양회 입금 조회'
          href: string;        // '/retreat/2025-winter/confirm-retreat-payment'
          icon?: string;       // 'CreditCard' (선택)
        }
      ]
    }
  ]
}
```

**서버에서 권한 계산:**
- 사용자의 retreat별 역할 기반으로 접근 가능한 메뉴만 포함
- 클라이언트는 권한 로직 불필요
- DAL 패턴으로 구현

#### 2.3 사이드바 컴포넌트 구조

```
components/
├── sidebar/
│   ├── AppSidebar.tsx              # 메인 사이드바 컴포넌트 (Client)
│   └── RetreatGroup.tsx            # Retreat 그룹 (접을 수 있음)
```

##### AppSidebar.tsx (예시 구조)
```tsx
'use client';

import { Sidebar, SidebarContent, SidebarGroup } from '@/components/ui/sidebar';
import { useParams, usePathname } from 'next/navigation';
import RetreatGroup from './RetreatGroup';
import type { RetreatWithMenus } from '@/lib/types/sidebar';

interface AppSidebarProps {
  retreats: RetreatWithMenus[]; // Server에서 권한 계산 완료된 데이터
}

export function AppSidebar({ retreats }: AppSidebarProps) {
  const params = useParams();
  const pathname = usePathname();

  // URL에서 현재 retreat 파악
  const currentRetreatSlug = params.retreatSlug as string;

  return (
    <Sidebar>
      <SidebarContent>
        {retreats.map(retreat => {
          const isActive = retreat.slug === currentRetreatSlug;

          return (
            <SidebarGroup key={retreat.slug}>
              <RetreatGroup
                retreat={retreat}
                isActive={isActive}
                currentPath={pathname}
              />
            </SidebarGroup>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
}
```

**핵심:**
- 권한 계산 로직 없음 (서버에서 완료)
- 받은 메뉴를 그대로 표시만

##### RetreatGroup.tsx (예시 구조)
```tsx
'use client';

import {
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import Link from 'next/link';
import type { RetreatWithMenus } from '@/lib/types/sidebar';

interface RetreatGroupProps {
  retreat: RetreatWithMenus;
  isActive: boolean;
  currentPath: string;
}

export default function RetreatGroup({
  retreat,
  isActive,
  currentPath,
}: RetreatGroupProps) {
  return (
    <Collapsible defaultOpen={isActive}>
      <CollapsibleTrigger className="w-full">
        <SidebarGroupLabel className="flex items-center">
          {retreat.name}
          <ChevronDown className="ml-auto h-4 w-4" />
        </SidebarGroupLabel>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <SidebarGroupContent>
          <SidebarMenu>
            {retreat.menuItems.map(item => {
              const isCurrentPage = currentPath === item.href;

              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isCurrentPage}>
                    <Link href={item.href}>
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </CollapsibleContent>
    </Collapsible>
  );
}
```

#### 2.4 데이터 페칭 (DAL 패턴)

**DAL (Data Access Layer) 패턴 사용**

##### Server 함수로 데이터 + 권한 계산

```typescript
// lib/dal/retreat.ts (Data Access Layer)
import { cache } from 'react';
import { cookies } from 'next/headers';
import type { RetreatWithMenus } from '@/lib/types/sidebar';

// React cache로 중복 호출 방지
export const getUserSession = cache(async () => {
  const token = cookies().get('accessToken')?.value;
  if (!token) return null;

  // 토큰 검증 + 사용자 정보 가져오기
  const user = await verifyToken(token);
  return user;
});

export const getUserRetreatsWithMenus = cache(async (): Promise<RetreatWithMenus[]> => {
  const user = await getUserSession();
  if (!user) throw new Error('Unauthorized');

  // API 호출
  const res = await fetch(`${process.env.API_URL}/api/v1/user/retreats-with-menus`, {
    headers: {
      Authorization: `Bearer ${user.token}`,
    },
    cache: 'no-store', // 또는 { next: { revalidate: 60 } }
  });

  if (!res.ok) throw new Error('Failed to fetch retreats');

  const data = await res.json();
  return data.retreats;
});
```

**핵심:**
- `cache()` 사용으로 동일 요청 중복 제거
- 인증 + 권한 + 데이터 페칭을 한 곳에서
- 서버에서 메뉴 계산 완료

##### Layout에서 사용
```typescript
// app/(main)/layout.tsx
import { getUserRetreatsWithMenus } from '@/lib/dal/retreat';

export default async function Layout({ children }) {
  const retreats = await getUserRetreatsWithMenus();

  return (
    <SidebarProvider>
      <AppSidebar retreats={retreats} />
      <main>{children}</main>
    </SidebarProvider>
  );
}
```

##### URL 기반 상태 관리
```typescript
// Client Component에서 URL로 상태 파악
const params = useParams();        // { retreatSlug: '2025-winter' }
const pathname = usePathname();    // '/retreat/2025-winter/confirm-payment'

// 상태 변경은 단순히 Link 클릭
<Link href="/retreat/2025-summer/gbs-line-up">
  다른 retreat로 이동
</Link>
```

##### 사이드바 열림/닫힘 상태 (shadcn 내장)
```typescript
// shadcn useSidebar hook 사용
import { useSidebar } from '@/components/ui/sidebar';

function SomeComponent() {
  const { open, setOpen, toggleSidebar } = useSidebar();

  // 상태는 자동으로 cookie에 저장됨
  return <button onClick={toggleSidebar}>Toggle</button>;
}
```

**장점:**
- ✅ 추가 라이브러리 불필요 (번들 사이즈 감소)
- ✅ URL이 single source of truth
- ✅ 북마크 가능, 브라우저 히스토리 지원
- ✅ 서버 사이드 렌더링으로 초기 로딩 빠름

---

### 3. Layout 수정

```tsx
// app/(main)/layout.tsx
import { cookies } from 'next/headers';
import { getUserRetreatsWithMenus } from '@/lib/dal/retreat';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/sidebar/AppSidebar';
import Header from '@/components/common/layout/Header';
import Footer from '@/components/common/layout/Footer';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. DAL에서 데이터 + 권한 계산 완료된 데이터 fetch
  const retreats = await getUserRetreatsWithMenus();

  // 2. Cookie에서 사이드바 상태 읽기
  const sidebarState = cookies().get('sidebar:state')?.value;
  const defaultOpen = sidebarState === 'true';

  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <SidebarProvider defaultOpen={defaultOpen}>
          <Header />
          <div className="flex min-h-screen">
            {/* 권한 계산 완료된 데이터를 Client Component로 전달 */}
            <AppSidebar retreats={retreats} />
            <main className="flex-1 overflow-x-hidden p-6">
              {children}
            </main>
          </div>
          <Footer />
        </SidebarProvider>
      </body>
    </html>
  );
}
```

---

### 4. 권한 처리 (DAL 패턴)

**DAL (Data Access Layer) 중심 아키텍처**

#### 4.1 Middleware (기본 인증만)

Middleware는 토큰 검증만 수행하고, 세부 권한은 서버에서 처리:

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 정적 자산 제외
  if (STATIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // 토큰 검증만 수행
  const token = request.cookies.get("accessToken")?.value;
  if (!token && pathname !== '/login') {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}
```

**핵심 변경:**
- 복잡한 권한 로직 제거
- 토큰 유무만 확인
- 세부 권한은 DAL에서 처리

#### 4.2 DAL에서 권한 검증

서버 컴포넌트나 API에서 직접 권한 확인:

```typescript
// lib/dal/auth.ts
import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const verifyPageAccess = cache(async (slug: string, pagePath: string) => {
  const user = await getUserSession();
  if (!user) redirect('/login');

  // API에서 권한 확인
  const hasAccess = await checkUserPageAccess(user.id, slug, pagePath);

  if (!hasAccess) redirect('/unauthorized');

  return true;
});

// 페이지에서 사용
export default async function SomePage({ params }) {
  await verifyPageAccess(params.slug, '/confirm-retreat-payment');

  // 권한 통과 후 페이지 렌더링
  return <div>...</div>;
}
```

**장점:**
- ✅ 서버에서 최신 권한 정보 확인
- ✅ 복잡한 비즈니스 로직 처리 가능
- ✅ React `cache()`로 중복 호출 방지
- ✅ Middleware 보안 취약점 회피 (CVE-2025-29927)

#### 4.3 서버 API에서 메뉴 계산

권한은 서버에서만 계산:

```typescript
// 서버 API: /api/v1/user/retreats-with-menus
export async function GET(request: Request) {
  const user = await authenticateRequest(request);

  // 사용자의 retreat별 역할 조회
  const userRetreats = await db.getUserRetreats(user.id);

  // 각 retreat의 메뉴 계산
  const retreatsWithMenus = userRetreats.map(retreat => ({
    id: retreat.id,
    slug: retreat.slug,
    name: retreat.name,
    menuItems: calculateMenuItems(retreat.roles), // 서버에서 계산
  }));

  return Response.json({ retreats: retreatsWithMenus });
}

function calculateMenuItems(roles: UserRole[]): MenuItem[] {
  // 역할 기반으로 메뉴 계산
  const menuMap = {
    [UserRole.ACCOUNT_STAFF]: [
      { path: '/confirm-retreat-payment', label: '입금 조회', href: '...' },
      { path: '/schedule-change-history', label: '일정 변동 내역', href: '...' },
    ],
    [UserRole.LINEUP_STAFF]: [
      { path: '/gbs-line-up', label: 'GBS 라인업', href: '...' },
    ],
    // ...
  };

  const items = new Set<MenuItem>();
  roles.forEach(role => {
    menuMap[role]?.forEach(item => items.add(item));
  });

  return Array.from(items);
}
```

**핵심:**
- 클라이언트는 권한 로직 없음
- 서버가 single source of truth
- 보안 강화

---

## 📝 구현 단계

### Phase 1: 기반 작업
- [x] 브랜치 생성
- [ ] shadcn sidebar, collapsible 컴포넌트 설치
  ```bash
  pnpm dlx shadcn@latest add sidebar collapsible
  ```
- [ ] 서버 API 엔드포인트 구현
  - `/api/v1/user/retreats-with-menus` - Retreat 목록 + 메뉴 (권한 계산 포함)

### Phase 2: DAL 구현
- [ ] DAL 함수 작성
  - `lib/dal/retreat.ts` - `getUserRetreatsWithMenus()`, `getUserSession()`
  - `lib/dal/auth.ts` - `verifyPageAccess()`
- [ ] 서버 API 권한 로직 구현
  - 역할 기반 메뉴 계산
  - 페이지 접근 권한 확인

### Phase 3: 사이드바 구현
- [ ] 사이드바 컴포넌트 작성
  - `components/sidebar/AppSidebar.tsx` (Client)
  - `components/sidebar/RetreatGroup.tsx` (Client)
- [ ] Layout을 async Server Component로 변경
  - DAL에서 데이터 fetch
  - Props로 Client에 전달

### Phase 4: Middleware 간소화
- [ ] Middleware 업데이트
  - 권한 로직 제거
  - 토큰 검증만 유지

### Phase 5: 테스트 및 정리
- [ ] 기능 테스트
  - 여러 retreat 전환
  - 권한별 메뉴 표시 확인
  - 사이드바 collapsible 동작
- [ ] 반응형 테스트 (모바일)
- [ ] 권한별 접근 테스트
- [ ] 기존 파일 정리
  - `components/common/layout/Sidebar.tsx` 제거
  - `utils/sidebar.ts` 제거

---

## 🎨 디자인 고려사항

### 사이드바
- 최소 너비: 280px
- 접은 상태 너비: 64px (아이콘만)
- 모바일: 전체 화면 오버레이
- 애니메이션: 부드러운 전환 (300ms)
- Retreat 그룹: 현재 활성화된 그룹은 기본으로 펼쳐짐
- 메뉴 아이템: 현재 페이지는 active 스타일 표시

---

## 🔧 기술 스택

- **UI 컴포넌트**: shadcn/ui (Sidebar, Collapsible)
- **데이터 페칭**: Next.js Server Components (native fetch)
- **상태 관리**: URL 기반 (useParams, usePathname) + shadcn SidebarProvider
- **권한 관리**: DAL (Data Access Layer) 패턴
- **라우팅**: Next.js App Router
- **스타일링**: Tailwind CSS

---

## 📚 참고 자료

### UI 컴포넌트
- [shadcn/ui Sidebar Documentation](https://ui.shadcn.com/docs/components/sidebar)
- [shadcn/ui Collapsible Documentation](https://ui.shadcn.com/docs/components/collapsible)

### Next.js 인증 및 권한
- [Next.js Authentication Guide](https://nextjs.org/docs/app/guides/authentication)

### 권한 관리
- [Next.js Authentication Best Practices 2025](https://www.franciscomoretti.com/blog/modern-nextjs-authentication-best-practices)
- [Implementing RBAC in Next.js](https://www.permit.io/blog/how-to-add-rbac-in-nextjs)
- [Next.js Authorization Guide](https://www.cerbos.dev/blog/a-complete-guide-to-next-js-authorization)

---

## ⚠️ 주의사항

1. **성능**:
   - Server Component fetch는 Next.js가 자동 캐싱
   - `cache: 'no-store'` 또는 `revalidate` 옵션 적절히 사용
   - Layout에서 fetch하므로 모든 페이지에서 재사용됨

2. **권한**:
   - DAL 패턴으로 서버에서 권한 계산
   - Middleware는 기본 토큰 검증만
   - Client는 서버에서 계산된 메뉴만 표시

3. **접근성**:
   - shadcn 컴포넌트는 ARIA 라벨 내장
   - 키보드 네비게이션 지원 (Cmd+B)

4. **모바일**:
   - shadcn sidebar는 반응형 지원
   - 모바일에서는 오버레이 모드

5. **Server Component 제약**:
   - Layout에서 데이터를 fetch하므로 에러 처리 필요
   - `loading.tsx`, `error.tsx` 활용

---

## 🚀 다음 단계

1. ✅ 계획서 작성 완료
2. 서버 API 우선 구현 (`/api/v1/user/retreats-with-menus`)
3. shadcn 컴포넌트 설치
4. DAL 함수 구현 (retreat.ts, auth.ts)
5. Server Component 기반 Layout 구현
6. 사이드바 컴포넌트 개발 (Client Component)
7. Middleware 간소화 (토큰 검증만)
8. 단계별 테스트 및 배포

---

## 💡 핵심 아키텍처

### 간단한 구조
- **상태 관리**: URL 기반 (useParams, usePathname)
- **데이터 페칭**: Server Component의 native fetch
- **사이드바 토글**: shadcn SidebarProvider (cookie 기반)
- **권한 관리**: DAL 패턴 (서버에서 메뉴 계산)

### 장점
- ✅ 최소한의 의존성
- ✅ 작은 번들 사이즈
- ✅ SEO 친화적
- ✅ Next.js 14+ 권장 패턴 준수
- ✅ URL이 single source of truth
