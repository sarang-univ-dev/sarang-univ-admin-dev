/**
 * NextAuth.js TypeScript 타입 확장
 *
 * 세션에 관리자 정보를 추가합니다.
 * @see https://authjs.dev/getting-started/typescript
 */
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      /** Express 서버의 admin_user.id */
      adminId?: number;
      /** 관리자 역할 목록 */
      adminRoles?: Array<{
        retreatId: number;
        role: string;
      }>;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    adminId?: number;
    adminRoles?: Array<{
      retreatId: number;
      role: string;
    }>;
  }
}
