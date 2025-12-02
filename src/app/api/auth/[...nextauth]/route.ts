/**
 * NextAuth.js v5 API Route Handlers
 *
 * 이 파일은 다음 엔드포인트들을 처리합니다:
 * - GET/POST /api/auth/signin
 * - GET/POST /api/auth/signout
 * - GET/POST /api/auth/callback/google
 * - GET /api/auth/session
 * - GET /api/auth/csrf
 * - GET /api/auth/providers
 *
 * @see https://authjs.dev/getting-started/installation
 */
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
