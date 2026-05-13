import { io, Socket } from "socket.io-client";

import config from "@/lib/constant/config";

import { ClientToServerEvents, ServerToClientEvents } from "./socket-events";

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

/**
 * Socket.io 클라이언트 초기화 (Singleton)
 *
 * @returns Socket 인스턴스
 */
export function getSocketClient(): Socket<
  ServerToClientEvents,
  ClientToServerEvents
> {
  // ✅ 이미 연결된 소켓이 있으면 재사용
  if (socket) {
    if (socket.connected) {
      console.log("🔄 [Socket Client] Reusing existing connection:", socket.id);
      return socket;
    }
    // 연결이 끊긴 경우 재연결 시도
    console.log("🔄 [Socket Client] Reconnecting existing socket...");
    socket.connect();
    return socket;
  }

  // ✅ config에서 API_HOST 가져오기 (axios와 동일한 설정 사용)
  const serverUrl = config.API_HOST;
  console.log(
    "🚀 [Socket Client] Initializing connection to:",
    `${serverUrl}/gbs-lineup`
  );
  console.log(
    "🚀 [Socket Client] withCredentials: true (httpOnly 쿠키 자동 전송)"
  );

  socket = io(`${serverUrl}/gbs-lineup`, {
    // httpOnly 쿠키를 자동으로 전송
    withCredentials: true,
    // ✅ Exponential Backoff 재연결 설정
    reconnection: true,
    reconnectionAttempts: 10, // 최대 10회 시도
    reconnectionDelay: 1000, // 초기 지연 1초
    reconnectionDelayMax: 30000, // 최대 30초 (1→2→4→8→16→30초)
    // 타임아웃
    timeout: 10000, // 10초 타임아웃
    // Transport (WebSocket only)
    transports: ["websocket"],
    // 추가 최적화
    forceNew: false, // 기존 연결 재사용
  });

  // 연결 이벤트 로깅
  socket.on("connect", () => {
    console.log("✅ [Socket Client] WebSocket connected:", socket!.id);
  });

  socket.on("disconnect", reason => {
    console.log("❌ [Socket Client] WebSocket disconnected:", reason);
  });

  socket.on("connect_error", error => {
    console.error("🔴 [Socket Client] Connection error:", error.message);
    console.error("🔴 [Socket Client] Error details:", error);
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
