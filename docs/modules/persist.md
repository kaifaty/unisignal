## Persist — руководство

Устойчивое хранение состояния в браузерных стораджах с namespace/TTL/версионированием/синхронизацией.

### Обзор

Модуль `persist` добавляет устойчивое хранение состояния в браузерных стораджах с поддержкой namespace, TTL, версионирования/миграций, синхронизации между вкладками и диагностического логирования. Поддерживаются `localStorage`, `sessionStorage`, `IndexedDB`, а также куки и произвольные KV‑хранилища через адаптеры.

Ключевые возможности:

- хранение и восстановление значения с учётом `serialize`/`deserialize`/`validate`
- TTL устаревания и хук `onExpire`
- версии и миграции значений
- синхронизация между вкладками (`storage`/`BroadcastChannel`)
- события жизненного цикла: `onRestore`/`onPersist`/`onClear`/`onError`
- ограничения и безопасность: `encrypt`/`decrypt`, `maxSizeKb`
- утилиты: `keys({namespace})`, `clearAll({namespace})`, `refreshFromStorage()`

### Quick Start

```ts
import {createLitSignalsAdapter} from './src/modules/adapter/lit-signals'
import {persist} from './src/modules/persist'

// базовый адаптер сигналов (можно использовать любой совместимый)
const base = createLitSignalsAdapter({
  signal: (v: any) => ({
    _v: v,
    get() { return this._v },
    set(n: any) { this._v = n },
  }),
  computed: (fn: () => any) => ({ get: fn }),
  effect: (fn: () => void) => { fn(); return () => {} },
})

// создаём персистентное состояние
const user = persist.state(base, {id: '0', name: ''}, {
  name: 'user',           // ключ (в dev при отсутствии — автогенерация с предупреждением)
  storage: 'local',       // 'local' | 'session' | 'idb' | кастомный адаптер
  namespace: 'app:',      // необязательный префикс ключей
  version: 1,             // текущая версия данных
  migrations: {
    1: (old: any) => ({id: String(old?.id ?? '0'), name: String(old?.name ?? '')}),
  },
})

// чтение/запись как у обычного состояния
user.set({id: '42', name: 'Alice'})
console.log(user.get())

// дополнительные возможности
user.refreshFromStorage() // перечитать из стораджа (учтёт TTL/миграции/валидацию)
user.clear()              // очистить значение и запись в сторадже

// операции над группой ключей
await persist.keys(base, {namespace: 'app:'})
await persist.clearAll(base, {namespace: 'app:'})
```

Шорткат с предустановленными параметрами:

```ts
const p = persist.with({storage: 'local', namespace: 'app:'})
const settings = p.state(base, {theme: 'light'}, {name: 'settings'})
```

### Опции (основные)

- `name: string` — обязательный ключ
- `storage: 'local' | 'session' | 'idb' | PersistAdapter`
- `namespace?: string | ((name: string) => string)`
- `throttle?: number`
- `restoreFn?: (raw) => T`
- `debug?: boolean | {logger?: (msg, ctx) => void}`
- `version?: number`, `migrations?: Record<number, (old) => any>`
- `ttlMs?: number`, `onExpire?: () => void`
- `serialize?: (value: T) => any`, `deserialize?: (raw: any) => T`
- `validate?: (value: T) => boolean`
- `onRestore?: (v: T) => void`, `onPersist?: (v: T) => void`, `onClear?: (init: T) => void`, `onError?: (e, ctx) => void`
- `sync?: 'storage' | 'broadcast' | false`, `broadcastChannelName?: string`
- `encrypt?/decrypt?: (string) => string`
- `maxSizeKb?: number`

### Сериализация/валидация

```ts
import {persist} from './src/modules/persist'

type User = {id: string; name: string}

const s = persist.state(adapter, {id: '0', name: ''}, {
  storage: 'local',
  name: 'user',
  serialize: (u: User) => ({id: u.id}),
  deserialize: (raw: any) => ({id: String(raw?.id ?? ''), name: ''} as User),
  validate: (u: User) => typeof u.id === 'string' && u.id.length > 0,
})
```

Поведение при невалидных данных:

- sync‑восстановление: возврат к дефолту
- async‑восстановление: игнор обновления
- событие storage/broadcast: игнор

### Миграции и версии

```ts
const profile = persist.state(base, {id: '0', tags: [] as string[]}, {
  name: 'profile',
  version: 2,
  migrations: {
    1: (v: any) => ({...v, tags: Array.isArray(v.tags) ? v.tags : []}),
    2: (v: any) => ({...v, id: String(v.id)}),
  },
})
```

### TTL и протухание

```ts
const session = persist.state(base, {token: ''}, {
  name: 'session',
  storage: 'session',
  ttlMs: 1000 * 60 * 60, // 1 час
  onExpire: () => console.warn('session expired'),
})
```

### Синхронизация между вкладками

```ts
const cart = persist.state(base, [], {
  name: 'cart',
  storage: 'local',
  sync: 'storage', // или 'broadcast'
  broadcastChannelName: 'statx-persist',
})
```

### Debug и безопасность

```ts
const secret = persist.state(base, 'plain', {
  name: 'secret',
  debug: true,
  encrypt: (plaintext) => btoa(plaintext),
  decrypt: (ciphertext) => atob(ciphertext),
  maxSizeKb: 16,
  onError: (e, ctx) => console.warn('persist error', ctx.phase, e),
})
```

### Примеры стораджей

```ts
persist.state(base, 0, {name: 'cnt-local', storage: 'local'})
persist.state(base, 0, {name: 'cnt-session', storage: 'session'})
persist.state(base, {items: []}, {name: 'idb-cache', storage: 'idb'})
```

Куки:

```ts
import {createCookieAdapter} from './src/modules/persist'
const cookie = createCookieAdapter({prefix: 'app-', ttlMs: 7 * 24 * 3600 * 1000})
persist.state(base, {accepted: false}, {name: 'consent', storage: cookie})
```

KV‑хранилище:

```ts
import {createKVAdapter} from './src/modules/persist'

const kv = {
  get: (k: string) => localStorage.getItem(k) ?? undefined,
  set: (k: string, v: string) => localStorage.setItem(k, v),
  delete: (k: string) => localStorage.removeItem(k),
  list: () => Object.keys(localStorage),
}
const kvAdapter = createKVAdapter(kv, 'app:')
persist.state(base, {n: 0}, {name: 'kv-counter', storage: kvAdapter})
```

### Интеграция с i18n

```ts
import {createI18n} from './src/modules/i18n'

const lang = persist.state(base, 'en', {name: 'lang', storage: 'local', namespace: 'app:'})
const i18n = createI18n(base, data, lang.get())

function setLanguage(next: string) {
  lang.set(next)
  i18n.setLangFrom(next)
}
```
