# Zustand 미들웨어 가이드

## 개요

Zustand는 다양한 미들웨어를 통해 기능을 확장할 수 있습니다. 이 가이드는 주요 미들웨어의 사용법과 best practices를 다룹니다.

## 1. 미들웨어 기본 개념

### 미들웨어란?

미들웨어는 스토어의 기능을 확장하는 고차 함수입니다. Zustand는 다음과 같은 공식 미들웨어를 제공합니다:

- `persist` - 상태를 로컬 스토리지에 저장
- `devtools` - Redux DevTools 통합
- `immer` - 불변성 관리 간소화
- `subscribeWithSelector` - 선택적 구독 최적화
- `combine` - 여러 스토어 결합

### 미들웨어 적용 순서

**중요:** 미들웨어 순서가 매우 중요합니다!

```typescript
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// ✅ 올바른 순서
const useStore = create(
  devtools(          // 3. 가장 바깥 (마지막)
    persist(         // 2. 중간
      immer(         // 1. 가장 안쪽 (첫번째)
        (set) => ({
          count: 0,
          increment: () => set((state) => { state.count += 1; }),
        })
      ),
      { name: 'store' }
    )
  )
);

// ❌ 잘못된 순서
const useStore = create(
  immer(
    devtools(
      persist(
        (set) => ({ /* ... */ }),
        { name: 'store' }
      )
    )
  )
);
```

**권장 순서:**
1. `immer` - 가장 안쪽
2. `persist` - 중간
3. `devtools` - 가장 바깥

**이유:** `devtools`는 `setState`를 변경하고 타입 파라미터를 추가하므로, 다른 미들웨어가 먼저 `setState`를 변경하면 타입이 손실될 수 있습니다.

## 2. Persist 미들웨어

### 기본 사용법

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,

      login: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
    }),
    {
      name: 'auth-storage', // localStorage 키 이름
    }
  )
);
```

### Partialize - 선택적 저장

일부 상태만 저장하고 싶을 때 사용합니다.

```typescript
interface AppState {
  user: User | null;
  token: string | null;
  temporaryData: any; // 저장하지 않을 임시 데이터
  sessionId: string;  // 저장하지 않을 세션 데이터
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      temporaryData: null,
      sessionId: '',
    }),
    {
      name: 'app-storage',
      // ✅ 필요한 필드만 저장
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        // temporaryData와 sessionId는 제외
      }),
    }
  )
);
```

### 커스텀 Storage

```typescript
import { StateStorage } from 'zustand/middleware';

// 1. SessionStorage 사용
export const useSessionStore = create<State>()(
  persist(
    (set) => ({ /* ... */ }),
    {
      name: 'session-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

// 2. IndexedDB 사용
import { get, set as idbSet, del } from 'idb-keyval';

const indexedDBStorage: StateStorage = {
  getItem: async (name) => {
    return (await get(name)) || null;
  },
  setItem: async (name, value) => {
    await idbSet(name, value);
  },
  removeItem: async (name) => {
    await del(name);
  },
};

export const useLargeDataStore = create<State>()(
  persist(
    (set) => ({ /* ... */ }),
    {
      name: 'large-data',
      storage: indexedDBStorage,
    }
  )
);

// 3. 암호화된 Storage
import CryptoJS from 'crypto-js';

const SECRET_KEY = process.env.NEXT_PUBLIC_STORAGE_KEY || 'secret';

const encryptedStorage: StateStorage = {
  getItem: (name) => {
    const encrypted = localStorage.getItem(name);
    if (!encrypted) return null;

    try {
      const decrypted = CryptoJS.AES.decrypt(encrypted, SECRET_KEY);
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    const encrypted = CryptoJS.AES.encrypt(value, SECRET_KEY).toString();
    localStorage.setItem(name, encrypted);
  },
  removeItem: (name) => {
    localStorage.removeItem(name);
  },
};

export const useSecureStore = create<State>()(
  persist(
    (set) => ({ /* ... */ }),
    {
      name: 'secure-storage',
      storage: encryptedStorage,
    }
  )
);
```

### 마이그레이션 - 버전 관리

```typescript
interface V1State {
  name: string;
}

interface V2State {
  firstName: string;
  lastName: string;
}

export const useStore = create<V2State>()(
  persist(
    (set) => ({
      firstName: '',
      lastName: '',
    }),
    {
      name: 'user-storage',
      version: 2,
      migrate: (persistedState: any, version: number) => {
        if (version === 1) {
          // V1 → V2 마이그레이션
          const [firstName, lastName] = (persistedState as V1State).name.split(' ');
          return {
            firstName: firstName || '',
            lastName: lastName || '',
          };
        }

        return persistedState as V2State;
      },
    }
  )
);
```

### Persist API

```typescript
// 수동으로 저장
useStore.persist.setOptions({ name: 'new-name' });

// 재수화 (Rehydration)
await useStore.persist.rehydrate();

// 저장된 데이터 삭제
useStore.persist.clearStorage();

// 현재 persist 상태 확인
const hasHydrated = useStore.persist.hasHydrated();
```

## 3. DevTools 미들웨어

### 기본 사용법

```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface State {
  count: number;
  increment: () => void;
  decrement: () => void;
}

export const useStore = create<State>()(
  devtools(
    (set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 }), false, 'increment'),
      decrement: () => set((state) => ({ count: state.count - 1 }), false, 'decrement'),
    }),
    {
      name: 'CounterStore', // DevTools에 표시될 이름
    }
  )
);
```

### Action Names

```typescript
export const useTodoStore = create<TodoState>()(
  devtools(
    (set) => ({
      todos: [],

      // Action name 지정
      addTodo: (text) =>
        set(
          (state) => ({
            todos: [...state.todos, { id: Date.now(), text, completed: false }],
          }),
          false,
          'todos/add' // Redux-style action name
        ),

      toggleTodo: (id) =>
        set(
          (state) => ({
            todos: state.todos.map((todo) =>
              todo.id === id ? { ...todo, completed: !todo.completed } : todo
            ),
          }),
          false,
          'todos/toggle'
        ),

      // Action payload도 전달 가능
      removeTodo: (id) =>
        set(
          (state) => ({
            todos: state.todos.filter((todo) => todo.id !== id),
          }),
          false,
          { type: 'todos/remove', id } // Payload 포함
        ),
    }),
    { name: 'TodoStore' }
  )
);
```

### 프로덕션에서 비활성화

```typescript
export const useStore = create<State>()(
  devtools(
    (set) => ({ /* ... */ }),
    {
      name: 'Store',
      enabled: process.env.NODE_ENV === 'development', // 개발 모드에서만 활성화
    }
  )
);
```

### Anonymous Actions

```typescript
export const useStore = create<State>()(
  devtools(
    (set) => ({
      count: 0,

      // Anonymous action은 자동으로 이름 생성
      increment: () => set((state) => ({ count: state.count + 1 })),
    }),
    {
      name: 'Store',
      anonymousActionType: 'action', // 익명 액션의 기본 이름
    }
  )
);
```

## 4. Immer 미들웨어

### 기본 사용법

```typescript
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface State {
  user: {
    profile: {
      name: string;
      email: string;
    };
    settings: {
      theme: string;
      notifications: boolean;
    };
  };
}

export const useStore = create<State>()(
  immer((set) => ({
    user: {
      profile: { name: '', email: '' },
      settings: { theme: 'light', notifications: true },
    },

    // ✅ Immer를 사용하면 직접 변경 가능
    updateName: (name: string) =>
      set((state) => {
        state.user.profile.name = name;
      }),

    toggleNotifications: () =>
      set((state) => {
        state.user.settings.notifications = !state.user.settings.notifications;
      }),
  }))
);

// Immer 없이는:
// updateName: (name) =>
//   set((state) => ({
//     user: {
//       ...state.user,
//       profile: {
//         ...state.user.profile,
//         name,
//       },
//     },
//   }));
```

### 배열 조작

```typescript
interface TodoState {
  todos: Todo[];
}

export const useTodoStore = create<TodoState>()(
  immer((set) => ({
    todos: [],

    // ✅ 배열 메서드 직접 사용 가능
    addTodo: (text: string) =>
      set((state) => {
        state.todos.push({
          id: Date.now(),
          text,
          completed: false,
        });
      }),

    removeTodo: (id: number) =>
      set((state) => {
        const index = state.todos.findIndex((todo) => todo.id === id);
        if (index !== -1) {
          state.todos.splice(index, 1);
        }
      }),

    toggleTodo: (id: number) =>
      set((state) => {
        const todo = state.todos.find((t) => t.id === id);
        if (todo) {
          todo.completed = !todo.completed;
        }
      }),

    reorderTodos: (from: number, to: number) =>
      set((state) => {
        const [removed] = state.todos.splice(from, 1);
        state.todos.splice(to, 0, removed);
      }),
  }))
);
```

### 조건부 업데이트

```typescript
export const useStore = create<State>()(
  immer((set) => ({
    items: [],

    updateItem: (id: number, updates: Partial<Item>) =>
      set((state) => {
        const item = state.items.find((i) => i.id === id);
        if (item) {
          Object.assign(item, updates);
        }
      }),

    // 여러 아이템 한 번에 업데이트
    updateMultipleItems: (ids: number[], updates: Partial<Item>) =>
      set((state) => {
        state.items.forEach((item) => {
          if (ids.includes(item.id)) {
            Object.assign(item, updates);
          }
        });
      }),
  }))
);
```

## 5. SubscribeWithSelector 미들웨어

### 기본 사용법

```typescript
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface State {
  count: number;
  user: User | null;
}

export const useStore = create<State>()(
  subscribeWithSelector((set) => ({
    count: 0,
    user: null,
  }))
);

// 특정 필드만 구독
const unsubscribe = useStore.subscribe(
  (state) => state.count,
  (count, previousCount) => {
    console.log('Count changed from', previousCount, 'to', count);
  }
);

// 구독 해제
unsubscribe();
```

### 여러 필드 구독

```typescript
// Shallow 비교로 여러 필드 구독
import { shallow } from 'zustand/shallow';

const unsubscribe = useStore.subscribe(
  (state) => ({ count: state.count, user: state.user }),
  (current, previous) => {
    console.log('State changed:', previous, '→', current);
  },
  {
    equalityFn: shallow,
  }
);
```

### Side Effects

```typescript
// Analytics 전송
useStore.subscribe(
  (state) => state.user,
  (user) => {
    if (user) {
      analytics.identify(user.id, {
        name: user.name,
        email: user.email,
      });
    }
  }
);

// Local Storage 동기화 (persist 대신)
useStore.subscribe(
  (state) => state.preferences,
  (preferences) => {
    localStorage.setItem('preferences', JSON.stringify(preferences));
  }
);

// WebSocket 업데이트
useStore.subscribe(
  (state) => state.document,
  (document) => {
    websocket.send(JSON.stringify({ type: 'document:update', document }));
  }
);
```

## 6. Combine 유틸리티

### 기본 사용법

```typescript
import { create } from 'zustand';
import { combine } from 'zustand/middleware';

// State와 Actions 분리
export const useStore = create(
  combine(
    // State
    {
      count: 0,
      text: '',
    },
    // Actions
    (set) => ({
      increment: () => set((state) => ({ count: state.count + 1 })),
      setText: (text: string) => set({ text }),
    })
  )
);
```

### TypeScript 타입 추론

```typescript
// combine을 사용하면 타입이 자동으로 추론됨
export const useStore = create(
  combine(
    {
      count: 0, // number로 추론
      items: [] as Item[], // Item[]로 추론
      user: null as User | null, // User | null로 추론
    },
    (set, get) => ({
      // set, get도 올바른 타입을 가짐
      increment: () => set((state) => ({ count: state.count + 1 })),
      addItem: (item: Item) =>
        set((state) => ({ items: [...state.items, item] })),
    })
  )
);
```

## 7. 커스텀 미들웨어

### Logger 미들웨어

```typescript
import { StateCreator, StoreMutatorIdentifier } from 'zustand';

type Logger = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = []
>(
  f: StateCreator<T, Mps, Mcs>,
  name?: string
) => StateCreator<T, Mps, Mcs>;

type LoggerImpl = <T>(
  f: StateCreator<T, [], []>,
  name?: string
) => StateCreator<T, [], []>;

const loggerImpl: LoggerImpl = (f, name) => (set, get, store) => {
  const loggedSet: typeof set = (...args) => {
    console.log(`[${name || 'Store'}] Before:`, get());
    set(...args);
    console.log(`[${name || 'Store'}] After:`, get());
  };

  return f(loggedSet, get, store);
};

export const logger = loggerImpl as unknown as Logger;

// 사용
import { logger } from './middleware/logger';

export const useStore = create(
  logger(
    (set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 })),
    }),
    'CounterStore'
  )
);
```

### Performance 미들웨어

```typescript
const performance = (f) => (set, get, store) => {
  const performanceSet = (...args) => {
    const start = performance.now();
    set(...args);
    const end = performance.now();

    console.log(`State update took ${(end - start).toFixed(2)}ms`);
  };

  return f(performanceSet, get, store);
};

export const useStore = create(
  performance((set) => ({
    // ...
  }))
);
```

## 8. 미들웨어 조합 best practices

### 완전한 예제

```typescript
import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface State {
  user: User | null;
  preferences: Preferences;
  updatePreferences: (prefs: Partial<Preferences>) => void;
  login: (user: User) => void;
  logout: () => void;
}

export const useStore = create<State>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set) => ({
          user: null,
          preferences: { theme: 'light', language: 'en' },

          updatePreferences: (prefs) =>
            set((state) => {
              Object.assign(state.preferences, prefs);
            }),

          login: (user) =>
            set((state) => {
              state.user = user;
            }),

          logout: () =>
            set((state) => {
              state.user = null;
            }),
        }))
      ),
      {
        name: 'app-storage',
        partialize: (state) => ({ preferences: state.preferences }),
      }
    ),
    { name: 'AppStore', enabled: process.env.NODE_ENV === 'development' }
  )
);
```

## 결론

Zustand 미들웨어 사용의 핵심:

1. **올바른 순서** - immer → persist → devtools
2. **Partialize** - 필요한 상태만 저장
3. **DevTools Actions** - 의미 있는 이름 지정
4. **Immer** - 복잡한 중첩 구조에 사용
5. **Custom Middleware** - 특정 요구사항에 맞게 확장

**권장 조합:**
- 개발: devtools + immer
- 프로덕션: persist + subscribeWithSelector
- 완전: devtools + persist + immer
