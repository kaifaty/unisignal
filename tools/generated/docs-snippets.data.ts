export const snippets = [
  {
    "file": "/workspace/docs/how-to/i18n-lang-switch.md",
    "lang": "ts",
    "code": "import {createI18n} from './src/modules/i18n'\nimport {persist} from './src/modules/persist'\n\nconst lang = persist.state(adapter, 'en', {name: 'lang', storage: 'local', namespace: 'app:'})\nconst i18n = createI18n(adapter, data, lang.get())\n\nfunction setLanguage(next: string) {\n  lang.set(next)\n  i18n.setLangFrom(next)\n}\n"
  },
  {
    "file": "/workspace/docs/how-to/persist-auth-session.md",
    "lang": "ts",
    "code": "import {persist} from './src/modules/persist'\n\nconst session = persist.state(adapter, {token: ''}, {\n  name: 'session',\n  storage: 'session',\n  ttlMs: 1000 * 60 * 60, // 1 час\n  onExpire: () => console.warn('session expired'),\n  serialize: (s) => ({t: s.token}),\n  deserialize: (raw) => ({token: String(raw?.t ?? '')}),\n  validate: (s) => s.token.length > 0,\n})\n\nfunction login(token: string) { session.set({token}) }\nfunction logout() { session.clear() }\n"
  },
  {
    "file": "/workspace/docs/how-to/query-invalidate-after-mutation.md",
    "lang": "ts",
    "code": "import {QueryClient, createQuery, createMutation} from 'unisignal/modules/query'\n\nconst client = new QueryClient(({} as any))\n\nconst list = createQuery(client, {\n  key: ['list'],\n  queryFn: async () => fetch('/api/list').then((r) => r.json()),\n  refetchOnMount: false,\n  staleTime: 0,\n})\n\nconst m = createMutation(client, {\n  mutationFn: async (v: any) => v,\n  onSuccess: () => client.invalidate(['list']),\n})\n"
  },
  {
    "file": "/workspace/docs/how-to/query-restore-with-ttl.md",
    "lang": "ts",
    "code": "import {QueryClient, createQuery} from 'unisignal/modules/query'\n\nconst client = new QueryClient(({} as any), {\n  persistNamespace: 'ns:',\n  persistStorage: ({} as any),\n})\n\nconst q = createQuery(client, {\n  key: ['profile'],\n  queryFn: async () => ({id: 1}),\n  refetchOnMount: false,\n  staleTime: 5_000,\n  persist: {ttlMs: 10_000},\n})\n"
  },
  {
    "file": "/workspace/docs/how-to/query-select-keepPreviousData.md",
    "lang": "ts",
    "code": "import {QueryClient, createQuery} from 'unisignal/modules/query'\n\nconst client = new QueryClient(({} as any))\n\nconst q = createQuery(client, {\n  key: ['detail', 1],\n  queryFn: async () => ({id: 1, name: 'A'}),\n  refetchOnMount: false,\n  staleTime: 0,\n  keepPreviousData: true,\n  select: (d) => d.name,\n})\n\n// q.selected.get() будет строкой имени и не сбросится на undefined при повторной загрузке\n"
  },
  {
    "file": "/workspace/docs/how-to/routing-guards.md",
    "lang": "ts",
    "code": "import {Router} from './src/modules/router'\n\n// примитивный guard\nasync function requireAuth(): Promise<boolean> {\n  const isLoggedIn = Boolean(localStorage.getItem('token'))\n  if (!isLoggedIn) {\n    await Router.goto('/login', true)\n    return false\n  }\n  return true\n}\n\nRouter.configure(adapter)\nRouter.start()\n\n// при входе на защищённый маршрут\nRouter.beforeEach(async (to) => {\n  if (to.path.startsWith('/app')) return requireAuth()\n  return true\n})\n"
  },
  {
    "file": "/workspace/docs/how-to/routing-guards.md",
    "lang": "ts",
    "code": "import {Router} from './src/modules/router'\n\nRouter.configure(adapter)\nRouter.start()\n\n// переходим на тот же путь и query → переход не выполнится (false)\nconst didNavigate = await Router.goto('/a?x=1')\nif (didNavigate === false) {\n  // уже на месте — можно пропустить перерисовку\n}\n"
  },
  {
    "file": "/workspace/docs/how-to/url-sync-state.md",
    "lang": "ts",
    "code": "import {url} from './src/modules/url'\n\n// sync: состояние <-> query\nfunction setFilters(next: {page?: number; tags?: string[]}) {\n  url.setQuery(next)\n}\n\nurl.onQueryChange((q) => {\n  // обновить локальное состояние из q\n})\n"
  },
  {
    "file": "/workspace/docs/modules/machine.md",
    "lang": "ts",
    "code": "import {adapter} from '../../'\nimport * as Signals from '@preact/signals-core'\n\nconst signals = adapter.createPreactSignalsAdapter({\n  signal: Signals.signal,\n  computed: Signals.computed,\n  effect: Signals.effect,\n})\n"
  },
  {
    "file": "/workspace/docs/modules/machine.md",
    "lang": "ts",
    "code": "type Ctx = { user: { name: string; age: number }; items: string[] }\n\nconst m = machine.createMachine<Ctx, {type: 'RENAME' | 'PUSH' | 'xstate.init'}, 'idle'>({\n  initial: 'idle',\n  context: { user: { name: 'Ann', age: 30 }, items: [] },\n  states: {\n    idle: {\n      on: machine.on({\n        RENAME: {\n          actions: (ctx) => {\n            // создаём новый объект вместо мутации полей по месту\n            ctx.user = { ...ctx.user, name: 'Kate' }\n          },\n        },\n        PUSH: {\n          actions: (ctx) => {\n            // создаём новый массив вместо push по месту\n            ctx.items = [...ctx.items, 'new']\n          },\n        },\n      }),\n    },\n  },\n})\n"
  },
  {
    "file": "/workspace/docs/modules/machine.md",
    "lang": "ts",
    "code": "// Универсальная утилита для безопасного частичного обновления\nconst assign = <T extends object>(patch: Partial<T>) => (target: T) => Object.assign(target, patch)\n\n// Использование\nconst inc = (delta: number) => (ctx: {count: number}) => assign({ count: ctx.count + delta })(ctx)\n\nconst m = machine.createMachine<{count: number}, {type: 'INC'} | {type: 'xstate.init'}, 'idle'>({\n  initial: 'idle',\n  context: {count: 0},\n  states: {\n    idle: {\n      on: machine.on({\n        INC: { actions: [ (ctx) => inc(1)(ctx) ] },\n      }),\n    },\n  },\n})\n"
  },
  {
    "file": "/workspace/docs/modules/machine.md",
    "lang": "ts",
    "code": "// Мини-produce: передаём мутирующую функцию, изменения применяются к целевому объекту\nfunction produce<T extends object>(target: T, recipe: (draft: T) => void): void {\n  const draft = target as T\n  recipe(draft)\n}\n\nconst m = machine.createMachine<{ items: string[] }, {type: 'ADD'} | {type: 'xstate.init'}, 'idle'>({\n  initial: 'idle',\n  context: { items: [] },\n  states: {\n    idle: {\n      on: machine.on({\n        ADD: {\n          actions: (ctx) => produce(ctx, (d) => {\n            d.items = [...d.items, 'x']\n          }),\n        },\n      }),\n    },\n  },\n})\n"
  },
  {
    "file": "/workspace/docs/modules/machine.md",
    "lang": "ts",
    "code": "import {adapter} from '../../'\nimport {signal, computed, effect} from '@lit-labs/signals'\n\nconst signals = adapter.createLitSignalsAdapter({\n  signal,\n  computed,\n  effect,\n})\n"
  },
  {
    "file": "/workspace/docs/modules/machine.md",
    "lang": "ts",
    "code": "import {machine} from '../../'\n\ntype Ctx = {count: number}\ntype E =\n  | {type: 'INC'}\n  | {type: 'DEC'}\n  | {type: 'RESET'}\n  | {type: 'xstate.init'}\n\nconst counter = machine.createMachine<Ctx, E, 'idle' | 'active'>({\n  initial: 'idle',\n  context: {count: 0},\n  states: {\n    idle: {\n      entry: (ctx) => {\n        // Выполняется при входе в состояние\n      },\n      on: machine.on<Ctx, E>({\n        INC: {target: 'active', actions: (ctx) => { ctx.count++ }},\n      }),\n    },\n    active: {\n      on: machine.on<Ctx, E>({\n        DEC: {target: 'idle', actions: (ctx) => { ctx.count-- }},\n        RESET: {actions: (ctx) => { ctx.count = 0 }},\n      }),\n    },\n  },\n})\n\nconst service = machine.interpret(counter, signals).start()\n\n// Подписка на изменения состояния\nconst sub = service.subscribe((state) => {\n  console.log(state.value, state.context.count)\n})\n\nservice.send({type: 'INC'})\nservice.send({type: 'DEC'})\n\nsub.unsubscribe()\n"
  },
  {
    "file": "/workspace/docs/modules/machine.md",
    "lang": "ts",
    "code": "import {LitElement, html} from 'lit'\nimport {signal, computed, effect} from '@lit-labs/signals'\nimport {adapter, machine} from '../../'\n\nconst signals = adapter.createLitSignalsAdapter({signal, computed, effect})\n\nclass CounterElement extends LitElement {\n  private service = machine\n    .interpret(\n      machine.createMachine({\n        initial: 'idle',\n        context: {count: 0},\n        states: {\n          idle: { on: machine.on({ INC: {target: 'idle', actions: (ctx) => { ctx.count++ }}}) },\n        },\n      }),\n      signals,\n    )\n    .start()\n\n  render() {\n    const state = this.service.state.get()\n    return html`\n      <div>value: ${state.value}</div>\n      <div>count: ${state.context.count}</div>\n      <button @click=${() => this.service.send({type: 'INC'})}>inc</button>\n    `\n  }\n}\n\ncustomElements.define('counter-element', CounterElement)\n"
  },
  {
    "file": "/workspace/docs/modules/machine.md",
    "lang": "ts",
    "code": "import {useEffect, useState} from 'react'\nimport {signal, computed, effect} from '@preact/signals-core'\nimport {adapter, machine} from '../../'\n\nconst signals = adapter.createPreactSignalsAdapter({signal, computed, effect})\n\nexport function Counter() {\n  const [service] = useState(() =>\n    machine.interpret(\n      machine.createMachine({\n        initial: 'idle',\n        context: {count: 0},\n        states: {\n          idle: { on: machine.on({ INC: {actions: (ctx) => { ctx.count++ }}}) },\n        },\n      }),\n      signals,\n    ).start(),\n  )\n\n  const [, setTick] = useState(0)\n  useEffect(() => service.subscribe(() => setTick((x) => x + 1)).unsubscribe, [service])\n\n  const state = service.state.get()\n  return (\n    <div>\n      <div>value: {state.value}</div>\n      <div>count: {state.context.count}</div>\n      <button onClick={() => service.send({type: 'INC'})}>inc</button>\n    </div>\n  )\n}\n"
  },
  {
    "file": "/workspace/docs/modules/machine.md",
    "lang": "ts",
    "code": "type MachineConfig<Ctx, E extends {type: string}, S extends string> = {\n  id?: string\n  initial: S\n  context: Ctx\n  states: Record<S, StateNodeConfig<Ctx, E>>\n}\n\ntype StateNodeConfig<Ctx, E> = {\n  on?: Partial<Record<E['type'], TransitionConfig<Ctx, E>>>\n  entry?: Action<Ctx, E> | Action<Ctx, E>[]\n  exit?: Action<Ctx, E> | Action<Ctx, E>[]\n}\n\ntype TransitionConfig<Ctx, E> = {\n  target?: string\n  guard?: (ctx: Ctx, event: E) => boolean\n  actions?: Action<Ctx, E> | Action<Ctx, E>[]\n}\n\ntype Action<Ctx, E> = (ctx: Ctx, event: E) => void\n"
  },
  {
    "file": "/workspace/docs/modules/machine.md",
    "lang": "ts",
    "code": "type Interpreter<Ctx, E, S extends string> = {\n  start(): Interpreter<Ctx, E, S>\n  stop(): Interpreter<Ctx, E, S>\n  send(event: E): void\n  subscribe(listener: (state: State<Ctx, S>) => void): {unsubscribe(): void}\n  getSnapshot(): State<Ctx, S>\n  state: SignalReadable<State<Ctx, S>>\n}\n"
  },
  {
    "file": "/workspace/docs/modules/machine.md",
    "lang": "ts",
    "code": "// Было (@xstate/fsm)\nimport {createMachine, interpret} from '@xstate/fsm'\n\nconst m = createMachine({\n  initial: 'idle',\n  context: {count: 0},\n  states: {\n    idle: { on: { INC: {target: 'idle', actions: (ctx) => { ctx.count++ }} } },\n  },\n})\n\nconst service = interpret(m).start()\nservice.subscribe((state) => console.log(state.value, state.context.count))\nservice.send({type: 'INC'})\n"
  },
  {
    "file": "/workspace/docs/modules/machine.md",
    "lang": "ts",
    "code": "// Стало (наш FSM с SignalAdapter)\nimport {machine, adapter} from '../../'\nimport {signal, computed, effect} from '@preact/signals-core' // или @lit-labs/signals\n\nconst signals = adapter.createPreactSignalsAdapter({signal, computed, effect})\n\nconst m = machine.createMachine({\n  initial: 'idle',\n  context: {count: 0},\n  states: {\n    idle: { on: machine.on({ INC: {target: 'idle', actions: (ctx) => { ctx.count++ }} }) },\n  },\n})\n\nconst service = machine.interpret(m, signals).start()\nservice.subscribe((state) => console.log(state.value, state.context.count))\n\n// Дополнительно доступен реактивный сигнал состояния\nservice.state.subscribe((s) => console.log('signal', s.value, s.context.count))\nservice.send({type: 'INC'})\n"
  },
  {
    "file": "/workspace/docs/modules/machine.md",
    "lang": "ts",
    "code": "type Ctx = {count: number}\ntype E = {type: 'DEC'} | {type: 'INC'} | {type: 'xstate.init'}\n\nconst canDec = (ctx: Ctx) => ctx.count > 0\n\nconst m = machine.createMachine<Ctx, E, 'idle'>({\n  initial: 'idle',\n  context: {count: 0},\n  states: {\n    idle: {\n      on: machine.on<Ctx, E>({\n        DEC: {guard: canDec, actions: (ctx) => { ctx.count-- }},\n        INC: {actions: (ctx) => { ctx.count++ }},\n      }),\n    },\n  },\n})\n"
  },
  {
    "file": "/workspace/docs/modules/machine.md",
    "lang": "ts",
    "code": "const log = (_: Ctx, e: E) => console.log('event', e.type)\nconst update = (ctx: Ctx) => { ctx.count++ }\nconst after = (_: Ctx) => console.log('updated')\n\nconst m2 = machine.createMachine<Ctx, E, 'idle'>({\n  initial: 'idle',\n  context: {count: 0},\n  states: {\n    idle: {\n      on: machine.on<Ctx, E>({\n        INC: {actions: [log, update, after]},\n      }),\n    },\n  },\n})\n"
  },
  {
    "file": "/workspace/docs/modules/persist.md",
    "lang": "ts",
    "code": "import {createLitSignalsAdapter} from './src/modules/adapter/lit-signals'\nimport {persist} from './src/modules/persist'\n\n// базовый адаптер сигналов (можно использовать любой совместимый)\nconst base = createLitSignalsAdapter({\n  signal: (v: any) => ({\n    _v: v,\n    get() { return this._v },\n    set(n: any) { this._v = n },\n  }),\n  computed: (fn: () => any) => ({ get: fn }),\n  effect: (fn: () => void) => { fn(); return () => {} },\n})\n\n// создаём персистентное состояние\nconst user = persist.state(base, {id: '0', name: ''}, {\n  name: 'user',           // ключ (в dev при отсутствии — автогенерация с предупреждением)\n  storage: 'local',       // 'local' | 'session' | 'idb' | кастомный адаптер\n  namespace: 'app:',      // необязательный префикс ключей\n  version: 1,             // текущая версия данных\n  migrations: {\n    1: (old: any) => ({id: String(old?.id ?? '0'), name: String(old?.name ?? '')}),\n  },\n})\n\n// чтение/запись как у обычного состояния\nuser.set({id: '42', name: 'Alice'})\nconsole.log(user.get())\n\n// дополнительные возможности\nuser.refreshFromStorage() // перечитать из стораджа (учтёт TTL/миграции/валидацию)\nuser.clear()              // очистить значение и запись в сторадже\n\n// операции над группой ключей\nawait persist.keys(base, {namespace: 'app:'})\nawait persist.clearAll(base, {namespace: 'app:'})\n"
  },
  {
    "file": "/workspace/docs/modules/persist.md",
    "lang": "ts",
    "code": "const p = persist.with({storage: 'local', namespace: 'app:'})\nconst settings = p.state(base, {theme: 'light'}, {name: 'settings'})\n"
  },
  {
    "file": "/workspace/docs/modules/persist.md",
    "lang": "ts",
    "code": "import {persist} from './src/modules/persist'\n\ntype User = {id: string; name: string}\n\nconst s = persist.state(adapter, {id: '0', name: ''}, {\n  storage: 'local',\n  name: 'user',\n  serialize: (u: User) => ({id: u.id}),\n  deserialize: (raw: any) => ({id: String(raw?.id ?? ''), name: ''} as User),\n  validate: (u: User) => typeof u.id === 'string' && u.id.length > 0,\n})\n"
  },
  {
    "file": "/workspace/docs/modules/persist.md",
    "lang": "ts",
    "code": "const profile = persist.state(base, {id: '0', tags: [] as string[]}, {\n  name: 'profile',\n  version: 2,\n  migrations: {\n    1: (v: any) => ({...v, tags: Array.isArray(v.tags) ? v.tags : []}),\n    2: (v: any) => ({...v, id: String(v.id)}),\n  },\n})\n"
  },
  {
    "file": "/workspace/docs/modules/persist.md",
    "lang": "ts",
    "code": "const session = persist.state(base, {token: ''}, {\n  name: 'session',\n  storage: 'session',\n  ttlMs: 1000 * 60 * 60, // 1 час\n  onExpire: () => console.warn('session expired'),\n})\n"
  },
  {
    "file": "/workspace/docs/modules/persist.md",
    "lang": "ts",
    "code": "const cart = persist.state(base, [], {\n  name: 'cart',\n  storage: 'local',\n  sync: 'storage', // или 'broadcast'\n  broadcastChannelName: 'unisignal-persist',\n})\n"
  },
  {
    "file": "/workspace/docs/modules/persist.md",
    "lang": "ts",
    "code": "const secret = persist.state(base, 'plain', {\n  name: 'secret',\n  debug: true,\n  encrypt: (plaintext) => btoa(plaintext),\n  decrypt: (ciphertext) => atob(ciphertext),\n  maxSizeKb: 16,\n  onError: (e, ctx) => console.warn('persist error', ctx.phase, e),\n})\n"
  },
  {
    "file": "/workspace/docs/modules/persist.md",
    "lang": "ts",
    "code": "persist.state(base, 0, {name: 'cnt-local', storage: 'local'})\npersist.state(base, 0, {name: 'cnt-session', storage: 'session'})\npersist.state(base, {items: []}, {name: 'idb-cache', storage: 'idb'})\n"
  },
  {
    "file": "/workspace/docs/modules/persist.md",
    "lang": "ts",
    "code": "import {createCookieAdapter} from './src/modules/persist'\nconst cookie = createCookieAdapter({prefix: 'app-', ttlMs: 7 * 24 * 3600 * 1000})\npersist.state(base, {accepted: false}, {name: 'consent', storage: cookie})\n"
  },
  {
    "file": "/workspace/docs/modules/persist.md",
    "lang": "ts",
    "code": "import {createKVAdapter} from './src/modules/persist'\n\nconst kv = {\n  get: (k: string) => localStorage.getItem(k) ?? undefined,\n  set: (k: string, v: string) => localStorage.setItem(k, v),\n  delete: (k: string) => localStorage.removeItem(k),\n  list: () => Object.keys(localStorage),\n}\nconst kvAdapter = createKVAdapter(kv, 'app:')\npersist.state(base, {n: 0}, {name: 'kv-counter', storage: kvAdapter})\n"
  },
  {
    "file": "/workspace/docs/modules/persist.md",
    "lang": "ts",
    "code": "import {createI18n} from './src/modules/i18n'\n\nconst lang = persist.state(base, 'en', {name: 'lang', storage: 'local', namespace: 'app:'})\nconst i18n = createI18n(base, data, lang.get())\n\nfunction setLanguage(next: string) {\n  lang.set(next)\n  i18n.setLangFrom(next)\n}\n"
  },
  {
    "file": "/workspace/docs/modules/query.md",
    "lang": "ts",
    "code": "import {QueryClient, createQuery} from 'unisignal/modules/query'\nimport {adapter} from 'unisignal'\n\nconst client = new QueryClient(adapter.createYourAdapter?.() ?? ({} as any))\n\nconst q = createQuery(client, {\n  key: ['users', 1],\n  queryFn: async () => ({id: 1}),\n  refetchOnMount: true,\n})\n"
  },
  {
    "file": "/workspace/docs/modules/query.md",
    "lang": "ts",
    "code": "const q = createQuery(client, {\n  key: ['list'],\n  queryFn: fetchList,\n  persist: true, // имя будет q:[\"list\"] и префикс из client.persistNamespace\n  staleTime: 5_000,\n})\n"
  },
  {
    "file": "/workspace/docs/modules/query.md",
    "lang": "ts",
    "code": "import {QueryClient, createQuery} from 'unisignal/modules/query'\nimport {adapter} from 'unisignal'\n\nconst mem = /* ваш PersistAdapter */ ({} as any)\nconst client = new QueryClient(adapter.createYourAdapter?.() ?? ({} as any), {\n  persistNamespace: 'ns:',\n  persistStorage: mem,\n})\n\nconst q = createQuery(client, {\n  key: ['users'],\n  queryFn: async () => [{id: 1}],\n  persist: true, // ключ будет ns:q:[\"users\"]\n  staleTime: 5_000, // по умолчанию используется также как ttlMs для persist\n})\n"
  },
  {
    "file": "/workspace/docs/modules/query.md",
    "lang": "ts",
    "code": "const q = createQuery(client, {\n  key: ['detail', 1],\n  queryFn: async () => ({id: 1, name: 'A'}),\n  refetchOnMount: false,\n  staleTime: 0,\n  keepPreviousData: true,\n  select: (d) => d.name,\n})\n// q.selected.get() → 'A'\n"
  },
  {
    "file": "/workspace/docs/modules/query.md",
    "lang": "ts",
    "code": "import {createMutation} from 'unisignal/modules/query'\n\nconst list = createQuery(client, {\n  key: ['list'],\n  queryFn: async () => fetch('/api/list').then((r) => r.json()),\n  refetchOnMount: false,\n  staleTime: 0,\n})\n\nconst m = createMutation(client, {\n  mutationFn: async (v: any) => {\n    await fetch('/api/item', {method: 'POST', body: JSON.stringify(v)})\n    return v\n  },\n  onSuccess: () => client.invalidate(['list']),\n})\n"
  },
  {
    "file": "/workspace/docs/modules/query.md",
    "lang": "ts",
    "code": "import {createMutation} from 'unisignal/modules/query'\n\nconst m = createMutation(client, {\n  mutationFn: async (v: any) => v,\n  invalidateKeys: [['list']],\n})\n"
  },
  {
    "file": "/workspace/docs/modules/router.md",
    "lang": "ts",
    "code": "import {createLitSignalsAdapter} from '@unisignal/adapter/lit-signals'\nimport {url, configure as configureUrl} from '@unisignal/url'\nimport {Router, createRouter, buildHref, link} from '@unisignal/router'\n\n// Адаптер сигналов\nconst adapter = createLitSignalsAdapter()\n\n// Конфигурация (глобально)\nRouter.configure(adapter, {\n  base: '/app',                  // опционально, если приложение живёт не в корне\n  historyMax: 50,                // или false, чтобы не ограничивать\n  debug: process.env.NODE_ENV !== 'production',\n})\n// configureUrl(adapter) — вызывается внутри Router.configure\n\n// Инициализация\nconst root = Router.initRoot({\n  injectSelector: '#app',\n  render: (outer, ctx) => html`<main>${outer?.()}</main>`,\n})\n\n// Cоздаём дерево маршрутов\nconst users = root.addChild({name: 'users', render: () => html`Users`})\nusers.addChild({name: ':id', render: (_o, {params}) => html`User ${params.id}`})\nroot.addChild({name: 'signin', render: () => html`Sign in`})\nroot.addChild({name: 'private', render: () => html`Private`, entry: () => '/signin'})\n\n// Навигация\nRouter.start()\nawait Router.goto('/users/42?tab=info')\n\n// Helpers ссылок\nconst a = document.createElement('a')\nlink(a, {path: '/users/1', query: {tab: 'info'}})        // безопасная сборка href\na.href = buildHref({path: '/users/2', hash: 'section'})  // альтернативный helper\n\n// Режим отладки\nRouter.configure(adapter, {debug: {logger: (msg, ctx) => console.debug(msg, ctx)}})\n\n// Фабрика (инкапсуляция стейта)\nconst appRouter = createRouter({adapter, base: '/app'})\nappRouter.start()\n"
  },
  {
    "file": "/workspace/docs/modules/router.md",
    "lang": "ts",
    "code": "Router.beforeEach = ({from, to}) => {\n  // блок: остаёмся на месте\n  // return false\n  // редирект:\n  // return '/signin'\n}\n\nroot.addChild({\n  name: 'private',\n  render: () => html`Private`,\n  entry: ({from, to}) => (isAuthed() ? true : '/signin'),\n})\n"
  },
  {
    "file": "/workspace/docs/modules/router.md",
    "lang": "ts",
    "code": "Router.start()\n// /index.html#//users/1 → Router.goto('/users/1')\n"
  },
  {
    "file": "/workspace/docs/modules/router.md",
    "lang": "ts",
    "code": "const container = document.getElementById('app')!\nRouter.initRoot({container, render: (outer) => outer?.()})\n"
  }
] as const;
