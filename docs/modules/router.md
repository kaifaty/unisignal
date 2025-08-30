## Router — руководство

Краткое руководство по модулю маршрутизации.

### Quick Start

```ts
import {createLitSignalsAdapter} from '@statx/adapter/lit-signals'
import {url, configure as configureUrl} from '@statx/url'
import {Router, createRouter, buildHref, link} from '@statx/router'

// Адаптер сигналов
const adapter = createLitSignalsAdapter()

// Конфигурация (глобально)
Router.configure(adapter, {
  base: '/app',                  // опционально, если приложение живёт не в корне
  historyMax: 50,                // или false, чтобы не ограничивать
  debug: process.env.NODE_ENV !== 'production',
})
// configureUrl(adapter) — вызывается внутри Router.configure

// Инициализация
const root = Router.initRoot({
  injectSelector: '#app',
  render: (outer, ctx) => html`<main>${outer?.()}</main>`,
})

// Cоздаём дерево маршрутов
const users = root.addChild({name: 'users', render: () => html`Users`})
users.addChild({name: ':id', render: (_o, {params}) => html`User ${params.id}`})
root.addChild({name: 'signin', render: () => html`Sign in`})
root.addChild({name: 'private', render: () => html`Private`, entry: () => '/signin'})

// Навигация
Router.start()
await Router.goto('/users/42?tab=info')

// Helpers ссылок
const a = document.createElement('a')
link(a, {path: '/users/1', query: {tab: 'info'}})        // безопасная сборка href
a.href = buildHref({path: '/users/2', hash: 'section'})  // альтернативный helper

// Режим отладки
Router.configure(adapter, {debug: {logger: (msg, ctx) => console.debug(msg, ctx)}})

// Фабрика (инкапсуляция стейта)
const appRouter = createRouter({adapter, base: '/app'})
appRouter.start()
```

### Хуки и entry

- beforeEach({ from, to }) → boolean | string | void
- afterEach({ from, to })
- onNavigate({ status, from, to, redirectedTo? })
- entry({ from, to, node }) → boolean | string | void

### Особенности

- SSR‑безопасно: можно передать container вместо селектора, доступ к window/document защищён
- `file:` режим — hash‑навигация
- Поддерживаются `:params` и `*splat`
- `Router.replace(path)`, `Router.navigate(path)` (возвращает NavigateResult)

### Guards (глобальные и пер‑роут)

```ts
Router.beforeEach = ({from, to}) => {
  // блок: остаёмся на месте
  // return false
  // редирект:
  // return '/signin'
}

root.addChild({
  name: 'private',
  render: () => html`Private`,
  entry: ({from, to}) => (isAuthed() ? true : '/signin'),
})
```

### Hash‑режим (`file:`)

При открытии из файловой системы (`file:`) роутер автоматически работает через `hash` и синхронизируется с `url.hash`.

```ts
Router.start()
// /index.html#//users/1 → Router.goto('/users/1')
```

### SSR контейнер

Можно передать готовый контейнер вместо селектора. Доступ к `window`/`document` обёрнут защитой.

```ts
const container = document.getElementById('app')!
Router.initRoot({container, render: (outer) => outer?.()})
```

### Краткое API

- Router.configure(adapter, { base?, historyMax?, debug?, withUrl? })
- Router.initRoot({ injectSelector? | container?, render, entry? })
- Router.start()/stop()
- Router.addChild({ name, render, entry? }) на узлах
- Router.goto(path) / Router.replace(path) / Router.navigate(path)
- Router.beforeEach/afterEach/onNavigate
- buildHref({path, query?, hash?}) / link(anchor, to)

### Разделы

- Обзор и сценарии использования
- API поверхности и конфигурация
- Рецепты: Guards, redirect, short‑circuit, интеграция с `url`
- Ограничения, FAQ
