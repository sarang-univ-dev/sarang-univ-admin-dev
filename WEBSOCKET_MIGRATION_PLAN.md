# WebSocket 마이그레이션 계획서

> **작성일**: 2025-11-11
> **대상 페이지**: GBS Line-Up 실시간 협업 페이지
> **목표**: Polling → WebSocket 전환으로 성능 개선 및 실시간성 향상

---

## 📊 현재 문제점 분석

### 1. 성능 문제

**Polling 방식의 한계**:
```
┌─────────────────────────────────────────────────────────┐
│ Timeline (초 단위)                                       │
├─────────────────────────────────────────────────────────┤
│ 0s    2s    4s    6s    8s    10s   12s   14s   16s    │
│ ├─────┤     ├─────┤     ├─────┤     ├─────┤            │
│ │ API │     │ API │     │ API │     │ API │            │
│ │2.87s│     │2.87s│     │2.87s│     │2.87s│            │
│ └─────┘     └─────┘     └─────┘     └─────┘            │
│   ▲ 겹침 발생 가능 ▲                                     │
└─────────────────────────────────────────────────────────┘
```

**측정된 성능 지표** (네트워크 탭 분석):
- **user-lineups API 응답 시간**: 2.87초 (평균)
- **Polling 간격**: 2초
- **데이터 크기**: 42.6 KB
- **문제**: Polling 간격(2초) < API 응답 시간(2.87초) → **요청 중복 가능**

**비효율성**:
1. **불필요한 요청**: 변경사항이 없어도 2초마다 42.6 KB 전송
2. **서버 부하**: 10명이 페이지를 열면 10 × (42.6 KB / 2초) = 213 KB/s
3. **응답 지연**: 2.87초 걸리는 API를 2초마다 호출 → 요청 대기열 쌓임
4. **배터리 소모**: 모바일 환경에서 지속적인 HTTP 요청

---

## 🎯 WebSocket 전환 목표

### 기대 효과

| 항목 | Polling (현재) | WebSocket (목표) | 개선율 |
|------|---------------|-----------------|--------|
| **데이터 전송량** | 42.6 KB × 30회/분 = **1.28 MB/분** | 초기 1회 + 변경분만 | **~95% 감소** |
| **응답 속도** | 2.87초 (평균) | **<100ms** (즉시 push) | **96% 향상** |
| **서버 부하** | 초당 0.5회 API 호출 | 변경 시에만 push | **~90% 감소** |
| **배터리 소모** | 지속적인 HTTP 요청 | 단일 WebSocket 연결 | **~70% 감소** |

---

## 🏗️ 아키텍처 설계

### 전체 구조

```
┌─────────────────────────────────────────────────────────┐
│                  Client (Next.js)                        │
│  ┌────────────────────────────────────────────────┐    │
│  │ GBS Line-Up Page (React Component)              │    │
│  │  ↓                                               │    │
│  │ useWebSocketGbsLineup() Hook                    │    │
│  │  ↓                                               │    │
│  │ Socket.io Client                                │    │
│  └────────────────────────────────────────────────┘    │
└──────────────────┬──────────────────────────────────────┘
                   │ WebSocket (Socket.io)
                   │ wss://api.example.com
                   ↓
┌─────────────────────────────────────────────────────────┐
│              Server (Express.js)                         │
│  ┌────────────────────────────────────────────────┐    │
│  │ Socket.io Server                                │    │
│  │  ↓                                               │    │
│  │ GBS Lineup Namespace (/gbs-lineup)              │    │
│  │  ↓                                               │    │
│  │ Room Management (retreatSlug별 격리)             │    │
│  │  ↓                                               │    │
│  │ Database (PostgreSQL)                           │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### Socket.io Namespace 설계

```typescript
// Namespace: /gbs-lineup
// Room: retreat-{retreatSlug}

Namespace: /gbs-lineup
├── Room: retreat-2024-winter
│   ├── Client 1 (User A)
│   ├── Client 2 (User B)
│   └── Client 3 (User C)
│
└── Room: retreat-2024-summer
    ├── Client 4 (User D)
    └── Client 5 (User E)
```

**격리 전략**:
- 각 수양회별로 독립된 room 사용
- 같은 room의 클라이언트만 업데이트 수신
- 불필요한 데이터 전송 방지

---

## 🔧 구현 계획

### Phase 1: 서버 구현 (Express.js + Socket.io)

#### 1.1. 패키지 설치

```bash
cd sarang-univ-server

# Socket.io 설치
npm install socket.io@^4.7.0
npm install -D @types/socket.io@^3.0.0

# CORS 설정 (이미 있을 수 있음)
npm install cors
npm install -D @types/cors
```

#### 1.2. 디렉토리 구조

```
sarang-univ-server/
├── src/
│   ├── socket/
│   │   ├── index.ts                    # Socket.io 서버 초기화
│   │   ├── namespaces/
│   │   │   └── gbs-lineup.ts           # GBS Lineup namespace
│   │   ├── middleware/
│   │   │   ├── auth.ts                 # WebSocket 인증 미들웨어
│   │   │   └── error-handler.ts        # 에러 핸들링
│   │   └── types/
│   │       └── socket-events.ts        # 이벤트 타입 정의
│   ├── services/
│   │   └── gbs-lineup-service.ts       # 기존 비즈니스 로직 재사용
│   └── server.ts                        # Express + Socket.io 통합
```

#### 1.3. 코드 구현

##### `src/socket/index.ts` (Socket.io 서버 초기화)

```typescript
import { Server as HTTPServer } from "http";
import { Server, ServerOptions } from "socket.io";
import { registerGbsLineupNamespace } from "./namespaces/gbs-lineup";
import { socketAuthMiddleware } from "./middleware/auth";
import { socketErrorHandler } from "./middleware/error-handler";

export function initializeSocketIO(httpServer: HTTPServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.ADMIN_URL || "https://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
    // 연결 옵션
    pingTimeout: 60000, // 60초
    pingInterval: 25000, // 25초
    // 최대 페이로드 크기
    maxHttpBufferSize: 1e6, // 1MB
  });

  // 전역 미들웨어
  io.use(socketAuthMiddleware);
  io.use(socketErrorHandler);

  // Namespace 등록
  registerGbsLineupNamespace(io);

  return io;
}
```

##### `src/socket/middleware/auth.ts` (인증 미들웨어)

```typescript
import { Socket } from "socket.io";
import { ExtendedError } from "socket.io/dist/namespace";
import { verifyJWT } from "@/utils/jwt"; // 기존 JWT 유틸 재사용

export interface AuthenticatedSocket extends Socket {
  user?: {
    id: number;
    email: string;
    role: string;
  };
  // ASK: 우리가 user_profile이 있고 admin user가 있어서 adminUserId로 할 수 없는가?
}

/**
 * WebSocket 연결 시 JWT 인증
 *
 * 클라이언트에서 다음과 같이 토큰 전달:
 * ```ts
 * io.connect(url, {
 *   auth: { token: 'jwt-token' }
 * });
 * ```
 */
export async function socketAuthMiddleware(
  socket: AuthenticatedSocket,
  next: (err?: ExtendedError) => void
) {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      // ASK: 소켓에서는 Http paramserror를 사용할 수 없는지? 소켓에서 에러 처리에 대한 best practice가 필요할거 같아.
      return next(new Error("Authentication required"));
    }

    // JWT 검증
    const payload = await verifyJWT(token);

    // Socket에 사용자 정보 첨부
    socket.user = {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch (error) {
    // ASK: next 함수 안에 new Error를 두는 것이 express의 best practice인가?
    next(new Error("Invalid token"));
  }
}
```

##### `src/socket/types/socket-events.ts` (이벤트 타입 정의)

```typescript
import { IUserRetreatGBSLineup } from "@/types/gbs-lineup";

/**
 * Client → Server 이벤트
 */
export interface ClientToServerEvents {
  // 특정 수양회 room 참여
  "join-retreat": (retreatSlug: string) => void;

  // GBS 번호 수정
  "update-gbs-number": (data: {
    lineupId: number;
    gbsNumber: number;
  }) => void;

  // 라인업 메모 작성
  "create-lineup-memo": (data: {
    lineupId: number;
    memo: string;
    color?: string;
  }) => void;

  // 라인업 메모 수정
  "update-lineup-memo": (data: {
    memoId: string;
    memo: string;
    color?: string;
  }) => void;
  // ASK: 응답은 void가 web socket에서 best practice인가? updated line up data를 반환해서 클라이언트에서 사용할 수 없는가?

  // 라인업 메모 삭제
  "delete-lineup-memo": (data: { memoId: string }) => void;

  // Room 나가기
  "leave-retreat": (retreatSlug: string) => void;
}

/**
 * Server → Client 이벤트
 */
export interface ServerToClientEvents {
  // 초기 데이터 전송 (room 참여 시)
  "initial-data": (data: IUserRetreatGBSLineup[]) => void;

  // 단일 라인업 업데이트
  "lineup-updated": (data: IUserRetreatGBSLineup) => void;

  // 에러 발생
  error: (data: { message: string; code?: string }) => void;

  // 다른 사용자가 편집 중
  "user-editing": (data: {
    lineupId: number;
    userId: number;
    userName: string;
  }) => void;
}

/**
 * Server-Side 이벤트 (내부용)
 */
export interface InterServerEvents {
  // 클러스터링 시 서버 간 통신용 (선택 사항)
}

/**
 * Socket Data
 */
export interface SocketData {
  user?: {
    id: number;
    email: string;
    role: string;
  };
  currentRetreat?: string;
}
```

##### `src/socket/namespaces/gbs-lineup.ts` (핵심 로직)

```typescript
import { Server, Namespace } from "socket.io";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from "../types/socket-events";
import { AuthenticatedSocket } from "../middleware/auth";
import { GbsLineupService } from "@/services/gbs-lineup-service";

type GbsLineupSocket = AuthenticatedSocket &
  Socket<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >;

export function registerGbsLineupNamespace(io: Server) {
  const gbsLineupNamespace = io.of("/gbs-lineup");

  gbsLineupNamespace.on("connection", (socket: GbsLineupSocket) => {
    console.log(`✅ GBS Lineup connected: ${socket.id} (User: ${socket.user?.email})`);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 1. Room 참여 (특정 수양회)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    socket.on("join-retreat", async (retreatSlug: string) => {
      try {
        const roomName = `retreat-${retreatSlug}`;

        // 기존 room 나가기 (있다면)
        if (socket.data.currentRetreat) {
          socket.leave(`retreat-${socket.data.currentRetreat}`);
        }

        // 새 room 참여
        await socket.join(roomName);
        socket.data.currentRetreat = retreatSlug;

        console.log(`👥 User ${socket.user?.email} joined ${roomName}`);

        // 초기 데이터 전송 (해당 클라이언트에게만)
        const lineups = await GbsLineupService.getLineups(retreatSlug);
        socket.emit("initial-data", lineups);

        console.log(`📊 Sent initial data to ${socket.id} (${lineups.length} lineups)`);
      } catch (error) {
        console.error("Error joining retreat:", error);
        socket.emit("error", {
          message: "Failed to join retreat room",
          code: "JOIN_FAILED",
        });
      }
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 2. GBS 번호 수정
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    socket.on("update-gbs-number", async (data) => {
      try {
        const { lineupId, gbsNumber } = data;
        const retreatSlug = socket.data.currentRetreat;

        if (!retreatSlug) {
          throw new Error("Not in a retreat room");
        }

        // 비즈니스 로직 실행 (기존 서비스 재사용)
        const updated = await GbsLineupService.updateGbsNumber(
          lineupId,
          gbsNumber,
          socket.user!.id
        );

        // 같은 room의 모든 클라이언트에게 브로드캐스트
        gbsLineupNamespace
          .to(`retreat-${retreatSlug}`)
          .emit("lineup-updated", updated);

        console.log(`📢 GBS number updated: lineup ${lineupId} → GBS ${gbsNumber}`);
      } catch (error) {
        console.error("Error updating GBS number:", error);
        socket.emit("error", {
          message: error.message || "Failed to update GBS number",
          code: "UPDATE_FAILED",
        });
      }
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 3. 라인업 메모 작성
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    socket.on("create-lineup-memo", async (data) => {
      try {
        const { lineupId, memo, color } = data;
        const retreatSlug = socket.data.currentRetreat;

        if (!retreatSlug) {
          throw new Error("Not in a retreat room");
        }

        const updated = await GbsLineupService.createLineupMemo(
          retreatSlug,
          lineupId,
          memo,
          color,
          socket.user!.id
        );

        gbsLineupNamespace
          .to(`retreat-${retreatSlug}`)
          .emit("lineup-updated", updated);

        console.log(`📝 Lineup memo created: lineup ${lineupId}`);
      } catch (error) {
        console.error("Error creating lineup memo:", error);
        socket.emit("error", {
          message: error.message || "Failed to create memo",
          code: "CREATE_MEMO_FAILED",
        });
      }
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 4. 라인업 메모 수정
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    socket.on("update-lineup-memo", async (data) => {
      try {
        const { memoId, memo, color } = data;
        const retreatSlug = socket.data.currentRetreat;

        if (!retreatSlug) {
          throw new Error("Not in a retreat room");
        }

        const updated = await GbsLineupService.updateLineupMemo(
          retreatSlug,
          memoId,
          memo,
          color,
          socket.user!.id
        );

        gbsLineupNamespace
          .to(`retreat-${retreatSlug}`)
          .emit("lineup-updated", updated);

        console.log(`✏️ Lineup memo updated: memo ${memoId}`);
      } catch (error) {
        console.error("Error updating lineup memo:", error);
        socket.emit("error", {
          message: error.message || "Failed to update memo",
          code: "UPDATE_MEMO_FAILED",
        });
      }
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 5. 라인업 메모 삭제
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    socket.on("delete-lineup-memo", async (data) => {
      try {
        const { memoId } = data;
        const retreatSlug = socket.data.currentRetreat;

        if (!retreatSlug) {
          throw new Error("Not in a retreat room");
        }

        const updated = await GbsLineupService.deleteLineupMemo(
          retreatSlug,
          memoId,
          socket.user!.id
        );

        gbsLineupNamespace
          .to(`retreat-${retreatSlug}`)
          .emit("lineup-updated", updated);

        console.log(`🗑️ Lineup memo deleted: memo ${memoId}`);
      } catch (error) {
        console.error("Error deleting lineup memo:", error);
        socket.emit("error", {
          message: error.message || "Failed to delete memo",
          code: "DELETE_MEMO_FAILED",
        });
      }
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 6. Room 나가기
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    socket.on("leave-retreat", (retreatSlug: string) => {
      const roomName = `retreat-${retreatSlug}`;
      socket.leave(roomName);
      socket.data.currentRetreat = undefined;
      console.log(`👋 User ${socket.user?.email} left ${roomName}`);
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 7. 연결 해제
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    socket.on("disconnect", (reason) => {
      console.log(`❌ GBS Lineup disconnected: ${socket.id} (Reason: ${reason})`);
    });
  });

  console.log("✅ GBS Lineup namespace registered: /gbs-lineup");
}
```

##### `src/server.ts` (Express + Socket.io 통합)

```typescript
import express from "express";
import http from "http";
import { initializeSocketIO } from "./socket";

const app = express();
const server = http.createServer(app);

// Express 미들웨어 설정
app.use(express.json());
// ... 기존 미들웨어들

// REST API 라우트
// ... 기존 라우트들

// ✅ Socket.io 초기화
const io = initializeSocketIO(server);

// 서버 시작
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready`);
});

export { app, server, io };
```

---

### Phase 2: 클라이언트 구현 (Next.js)

#### 2.1. 패키지 설치

```bash
cd sarang-univ-admin

# Socket.io 클라이언트 설치
npm install socket.io-client@^4.7.0
```

#### 2.2. 디렉토리 구조

```
sarang-univ-admin/
├── src/
│   ├── lib/
│   │   ├── socket/
│   │   │   ├── socket-client.ts         # Socket.io 클라이언트 초기화
│   │   │   └── socket-events.ts         # 이벤트 타입 (서버와 동일)
│   ├── hooks/
│   │   └── gbs-line-up/
│   │       ├── use-websocket-gbs-lineup.ts   # WebSocket 훅
│   │       └── use-retreat-gbs-lineup-data.tsx (기존 - 점진적 교체)
```

#### 2.3. 코드 구현

##### `src/lib/socket/socket-client.ts` (클라이언트 초기화)

```typescript
import { io, Socket } from "socket.io-client";
import { ClientToServerEvents, ServerToClientEvents } from "./socket-events";

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

/**
 * Socket.io 클라이언트 초기화 (Singleton)
 *
 * @param token - JWT 토큰
 * @returns Socket 인스턴스
 */
export function getSocketClient(token: string): Socket<ServerToClientEvents, ClientToServerEvents> {
  if (socket && socket.connected) {
    return socket;
  }

  const serverUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  socket = io(`${serverUrl}/gbs-lineup`, {
    auth: {
      token, // JWT 토큰 전달
    },
    // 재연결 설정
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    // 타임아웃
    timeout: 10000,
    // Transport (WebSocket 우선)
    transports: ["websocket", "polling"],
  });

  // 연결 이벤트 로깅
  socket.on("connect", () => {
    console.log("✅ WebSocket connected:", socket!.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("❌ WebSocket disconnected:", reason);
  });

  socket.on("connect_error", (error) => {
    console.error("🔴 WebSocket connection error:", error);
  });

  return socket;
}

/**
 * Socket 연결 해제
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
```

##### `src/hooks/gbs-line-up/use-websocket-gbs-lineup.ts` (WebSocket 훅)

```typescript
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getSocketClient, disconnectSocket } from "@/lib/socket/socket-client";
import { useToastStore } from "@/store/toast-store";
import { useConfirmDialogStore } from "@/store/confirm-dialog-store";
import type { IUserRetreatGBSLineup } from "@/types/gbs-lineup";
import type { Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@/lib/socket/socket-events";

/**
 * WebSocket 기반 GBS 라인업 데이터 훅
 *
 * @description
 * - Socket.io로 실시간 데이터 동기화
 * - SWR 대신 WebSocket 이벤트 기반
 * - 변경사항이 있을 때만 서버에서 push
 *
 * @param retreatSlug - 수양회 슬러그
 * @param token - JWT 인증 토큰
 */
export function useWebSocketGbsLineup(retreatSlug: string, token: string) {
  const [data, setData] = useState<IUserRetreatGBSLineup[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);

  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);

  const addToast = useToastStore((state) => state.add);
  const confirmDialog = useConfirmDialogStore();

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 1. Socket 연결 & 초기 데이터 수신
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    if (!token || !retreatSlug) return;

    const socket = getSocketClient(token);
    socketRef.current = socket;

    // 연결 성공
    socket.on("connect", () => {
      setIsConnected(true);
      console.log("✅ Connected to GBS Lineup WebSocket");

      // Room 참여 요청
      socket.emit("join-retreat", retreatSlug);
    });

    // 초기 데이터 수신
    socket.on("initial-data", (lineups: IUserRetreatGBSLineup[]) => {
      setData(lineups);
      setIsLoading(false);
      console.log(`📊 Received ${lineups.length} lineups`);
    });

    // 실시간 업데이트 수신
    socket.on("lineup-updated", (updated: IUserRetreatGBSLineup) => {
      setData((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
      console.log(`🔄 Lineup updated: ${updated.id}`);
    });

    // 에러 처리
    socket.on("error", ({ message, code }) => {
      console.error(`🔴 WebSocket error [${code}]:`, message);
      addToast({
        title: "오류 발생",
        description: message,
        variant: "destructive",
      });
    });

    // 연결 해제
    socket.on("disconnect", (reason) => {
      setIsConnected(false);
      console.log("❌ Disconnected:", reason);
    });

    // Cleanup: 컴포넌트 언마운트 시 room 나가기
    return () => {
      if (socket.connected) {
        socket.emit("leave-retreat", retreatSlug);
      }
      // 전역 연결은 유지 (다른 페이지에서 재사용 가능)
    };
  }, [retreatSlug, token, addToast]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 2. Mutation 함수들
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * GBS 번호 저장
   */
  const saveGbsNumber = useCallback(
    async (lineupId: number, gbsNumber: number) => {
      if (!socketRef.current?.connected) {
        addToast({
          title: "연결 오류",
          description: "WebSocket 연결이 끊어졌습니다.",
          variant: "destructive",
        });
        return;
      }

      setIsMutating(true);

      try {
        socketRef.current.emit("update-gbs-number", {
          lineupId,
          gbsNumber,
        });

        // 서버에서 "lineup-updated" 이벤트로 응답 (위에서 이미 구독 중)

        addToast({
          title: "성공",
          description: "GBS 번호가 저장되었습니다.",
          variant: "success",
        });
      } catch (error) {
        console.error("Error saving GBS number:", error);
      } finally {
        setIsMutating(false);
      }
    },
    [addToast]
  );

  /**
   * 라인업 메모 저장
   */
  const saveLineupMemo = useCallback(
    async (lineupId: number, memo: string, color?: string) => {
      if (!socketRef.current?.connected) {
        addToast({
          title: "연결 오류",
          description: "WebSocket 연결이 끊어졌습니다.",
          variant: "destructive",
        });
        return;
      }

      setIsMutating(true);

      try {
        socketRef.current.emit("create-lineup-memo", {
          lineupId,
          memo: memo.trim(),
          color,
        });

        addToast({
          title: "성공",
          description: "메모가 저장되었습니다.",
          variant: "success",
        });
      } catch (error) {
        console.error("Error saving memo:", error);
      } finally {
        setIsMutating(false);
      }
    },
    [addToast]
  );

  /**
   * 라인업 메모 수정
   */
  const updateLineupMemo = useCallback(
    async (memoId: string, memo: string, color?: string) => {
      if (!socketRef.current?.connected) {
        addToast({
          title: "연결 오류",
          description: "WebSocket 연결이 끊어졌습니다.",
          variant: "destructive",
        });
        return;
      }

      setIsMutating(true);

      try {
        socketRef.current.emit("update-lineup-memo", {
          memoId,
          memo: memo.trim(),
          color,
        });

        addToast({
          title: "성공",
          description: "메모가 수정되었습니다.",
          variant: "success",
        });
      } catch (error) {
        console.error("Error updating memo:", error);
      } finally {
        setIsMutating(false);
      }
    },
    [addToast]
  );

  /**
   * 라인업 메모 삭제
   */
  const deleteLineupMemo = useCallback(
    async (memoId: string) => {
      confirmDialog.show({
        title: "메모 삭제",
        description: "정말로 메모를 삭제하시겠습니까?",
        onConfirm: async () => {
          if (!socketRef.current?.connected) {
            addToast({
              title: "연결 오류",
              description: "WebSocket 연결이 끊어졌습니다.",
              variant: "destructive",
            });
            return;
          }

          setIsMutating(true);

          try {
            socketRef.current.emit("delete-lineup-memo", { memoId });

            addToast({
              title: "성공",
              description: "메모가 삭제되었습니다.",
              variant: "success",
            });
          } catch (error) {
            console.error("Error deleting memo:", error);
          } finally {
            setIsMutating(false);
          }
        },
      });
    },
    [addToast, confirmDialog]
  );

  return {
    // 데이터
    data,
    isConnected,
    isLoading,
    isMutating,

    // 액션
    saveGbsNumber,
    saveLineupMemo,
    updateLineupMemo,
    deleteLineupMemo,
  };
}
```

##### `src/components/features/gbs-line-up/GbsLineUpTableNew.tsx` (수정)

```typescript
"use client";

import { useWebSocketGbsLineup } from "@/hooks/gbs-line-up/use-websocket-gbs-lineup";
import { useAuth } from "@/hooks/use-auth"; // JWT 토큰 가져오기 (가정)

export const GbsLineUpTable = React.memo(function GbsLineUpTable({
  initialData,
  schedules,
  retreatSlug,
}: GbsLineUpTableProps) {
  const { token } = useAuth(); // JWT 토큰

  // ✅ WebSocket 훅으로 교체
  const {
    data: wsData,
    isConnected,
    isLoading,
    saveGbsNumber,
    saveLineupMemo,
    updateLineupMemo,
    deleteLineupMemo,
    isMutating,
  } = useWebSocketGbsLineup(retreatSlug, token);

  // 초기 데이터 fallback
  const data = useMemo<GBSLineupRow[]>(() => {
    const registrations = wsData.length > 0 ? wsData : initialData;
    // ... 기존 데이터 변환 로직
  }, [wsData, initialData, schedules]);

  // ... 나머지 로직 동일 (handlers 등)

  return (
    <div className="space-y-4">
      {/* ✅ 연결 상태 표시 (선택 사항) */}
      <div className="flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-xs text-muted-foreground">
          {isConnected ? '실시간 연결됨' : '연결 끊김'}
        </span>
      </div>

      {/* 기존 테이블 */}
      <GbsLineUpTableToolbar table={table} retreatSlug={retreatSlug} />
      <VirtualizedTable ... />
    </div>
  );
});
```

---

## ⚠️ 리스크 및 고려사항

### 1. WebSocket 연결 안정성

**문제**: 네트워크 불안정 시 연결 끊김
**해결**:
- 자동 재연결 (Socket.io 내장 기능)
- 재연결 시 초기 데이터 자동 요청
- Fallback: 연결 실패 시 HTTP polling으로 자동 전환

### 2. 서버 리소스 (동시 연결 수)

**문제**: 동시 접속자 많으면 서버 부하 증가
**해결**:
- Socket.io는 10,000+ 동시 연결 지원
- 현재 예상 사용자: ~50명 (여유 있음)
- 필요시 Redis Adapter로 수평 확장 가능

### 3. 방화벽/Proxy 문제

**문제**: 일부 기업 방화벽이 WebSocket 차단
**해결**:
- Socket.io는 자동으로 polling으로 fallback
- `transports: ['websocket', 'polling']` 설정

### 4. 배터리 소모 (모바일)

**문제**: WebSocket 연결 유지로 배터리 소모
**해결**:
- Admin 페이지는 주로 데스크톱 환경
- 모바일에서는 Page Visibility API로 백그라운드 시 연결 해제

### 5. 데이터 일관성

**문제**: 여러 사용자가 동시 수정 시 충돌
**해결**:
- Optimistic UI 업데이트 (즉시 반영)
- 서버에서 최종 상태 브로드캐스트
- 선택 사항: Operational Transform (OT) 또는 CRDT 적용

---

## 📈 모니터링 계획

### 서버 메트릭

```typescript
// Prometheus 메트릭 예시
const socketMetrics = {
  connections: {
    total: 45,      // 현재 연결 수
    perRoom: {
      "retreat-2024-winter": 12,
      "retreat-2024-summer": 8,
    },
  },
  messages: {
    received: 1250, // 수신 메시지 수
    sent: 1300,     // 발신 메시지 수
    errors: 3,      // 에러 수
  },
  latency: {
    avg: 45,        // 평균 응답 시간 (ms)
    p95: 120,       // 95번째 백분위수
    p99: 250,
  },
};
```

### 클라이언트 메트릭

- 연결 성공률: `connected_count / total_attempts`
- 재연결 빈도: `reconnect_count / hour`
- 메시지 처리 시간: `time_from_emit_to_receive`

---

## 📚 참고 자료

### 공식 문서
- [Socket.io Documentation](https://socket.io/docs/v4/)
- [Socket.io with Next.js](https://socket.io/how-to/use-with-nextjs)
- [Socket.io Performance Tuning](https://socket.io/docs/v4/performance-tuning/)

### Best Practices
- [Real-time Collaboration Best Practices](https://liveblocks.io/blog/realtime-collaboration-best-practices)
- [Scaling WebSocket Applications](https://socket.io/docs/v4/using-multiple-nodes/)

---
