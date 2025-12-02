/**
 * NextAuth.js v5 Configuration
 *
 * ⚠️ 이 파일은 서버 사이드에서만 실행됩니다.
 *
 * 🔐 인증 구조:
 * - OAuth credentials: 환경변수 (AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET)
 * - Admin 검증: Express 서버에서 실시간 확인 (/api/v1/auth/verify-admin)
 *
 * 📝 환경변수 설정:
 * - AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET은 Express 서버의 .env와 동일한 값 사용
 * - AUTH_SECRET은 NextAuth 세션 암호화에 사용 (openssl rand -base64 32)
 *
 * @see https://authjs.dev/getting-started/installation
 */
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";
import config from "./constant/config";

/**
 * ⚠️ INTERNAL - 서버 사이드 전용
 *
 * Express 서버에서 관리자 여부를 확인합니다.
 * signIn 콜백에서 사용됩니다.
 *
 * 🔒 보안: 이 함수는 Next.js 서버에서만 호출됩니다.
 */
async function verifyAdmin(email: string) {
  try {
    const response = await fetch(
      `${config.API_HOST}/api/v1/auth/verify-admin?email=${encodeURIComponent(email)}`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      throw new Error(`Failed to verify admin: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("[Auth] Failed to verify admin:", error);
    return { isAdmin: false };
  }
}

/**
 * NextAuth.js 설정
 *
 * - Google OAuth Provider 사용
 * - credentials: 환경변수에서 로드 (Express 서버와 동일한 값)
 * - 관리자 검증: Express 서버 API로 실시간 확인
 */
const authConfig: NextAuthConfig = {
  providers: [
    Google({
      // NextAuth v5는 AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET 환경변수를 자동으로 사용
      // 또는 명시적으로 지정 가능
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    /**
     * signIn 콜백 - 로그인 허용 여부 결정
     *
     * Express 서버의 admin_user 테이블에서 관리자 여부를 확인합니다.
     * 등록되지 않은 이메일은 로그인을 거부합니다.
     */
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        const result = await verifyAdmin(user.email);

        if (!result.isAdmin) {
          console.log(`[Auth] Login denied for non-admin: ${user.email}`);
          return false;
        }

        console.log(`[Auth] Login approved for admin: ${user.email}`);
        return true;
      }

      return false;
    },

    /**
     * jwt 콜백 - JWT 토큰에 추가 정보 저장
     */
    async jwt({ token, user, account }) {
      if (account && user) {
        // 첫 로그인 시 관리자 정보 가져오기
        if (user.email) {
          const result = await verifyAdmin(user.email);
          if (result.isAdmin && result.user) {
            token.adminId = result.user.id;
            token.adminRoles = result.user.roles;
          }
        }
      }
      return token;
    },

    /**
     * session 콜백 - 세션에 추가 정보 노출
     */
    async session({ session, token }) {
      if (token.adminId) {
        session.user.adminId = token.adminId as number;
      }
      if (token.adminRoles) {
        session.user.adminRoles = token.adminRoles as Array<{
          retreatId: number;
          role: string;
        }>;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 14 * 24 * 60 * 60, // 14 days
  },
  trustHost: true,
};

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);

/**
 * 서버 컴포넌트에서 세션 가져오기
 *
 * @example
 * ```tsx
 * import { auth } from "@/lib/auth";
 *
 * export default async function Page() {
 *   const session = await auth();
 *   if (!session) redirect("/login");
 *   return <div>Hello {session.user.name}</div>;
 * }
 * ```
 */
export { auth as getServerSession };
