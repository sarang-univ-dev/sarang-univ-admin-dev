import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from './socket-events';

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

/**
 * Socket.io 클라이언트 초기화 (Singleton)
 *
 * @returns Socket 인스턴스
 */
export function getSocketClient(): Socket<ServerToClientEvents, ClientToServerEvents> {
  // ✅ 이미 연결된 소켓이 있으면 재사용
  if (socket) {
    if (socket.connected) {
      console.log('🔄 [Socket Client] Reusing existing connection:', socket.id);
      return socket;
    }
    // 연결이 끊긴 경우 재연결 시도
    console.log('🔄 [Socket Client] Reconnecting existing socket...');
    socket.connect();
    return socket;
  }

  const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  console.log('🚀 [Socket Client] Initializing connection to:', `${serverUrl}/gbs-lineup`);
  console.log('🚀 [Socket Client] withCredentials: true (httpOnly 쿠키 자동 전송)');

  socket = io(`${serverUrl}/gbs-lineup`, {
    // httpOnly 쿠키를 자동으로 전송
    withCredentials: true,
    // 재연결 설정 (빠른 재연결)
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 200, // 200ms (빠른 재연결)
    reconnectionDelayMax: 2000, // 최대 2초
    // 타임아웃 단축
    timeout: 5000, // 5초로 단축
    // Transport (WebSocket only)
    transports: ['websocket'],
    // 추가 최적화
    forceNew: false, // 기존 연결 재사용
  });

  // 연결 이벤트 로깅
  socket.on('connect', () => {
    console.log('✅ [Socket Client] WebSocket connected:', socket!.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ [Socket Client] WebSocket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('🔴 [Socket Client] Connection error:', error.message);
    console.error('🔴 [Socket Client] Error details:', error);
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
