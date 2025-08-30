### План миграции монорепозитория в один пакет с под‑экспортами и treeshaking

1. Определить целевое имя пакета и стратегию публикации
   - Имя (рабочее): unisignal
   - Семвер и каналы: latest/next/canary (Changesets: pre-mode, canary).

2. Спроектировать модульные границы и под‑экспорты
   - Список модулей: `persist`, `router`, `url`, `lit`, `machine`, `i18n`, `utils`,.
   - Определить публичные API модулей и внутренние (неэкспортируемые) части.
   - Схема `exports` в `package.json` c под‑путями: `"./core"`, `"./persist"`, …

3. Согласовать «Signal Adapter» интерфейс (signal‑agnostic)
   - Минимальный протокол для чтения/записи/подписки и вычислимых значений.
   - Фабрики фич (например, роутер) принимают адаптер и не зависят от конкретной реализации сигналов.
   - Документация: как внедрить любой сигнал через адаптер.

   Интерфейс (черновик, реализован в `packages/core/src/types/signal-adapter.ts`):

   ```ts
   export interface SignalReadable<T> {
     get(): T
     subscribe(listener: (value: T) => void, subscriberName?: string): () => void
     peek(): T
   }

   export interface SignalWritable<T> extends SignalReadable<T> {
     set(value: T): void
   }

   export type SignalComputed<T> = SignalReadable<T>

   export type ComputedOptions = { name?: string }

   export interface SignalAdapter {
     state<T>(initial: T): SignalWritable<T>
     computed<T>(fn: () => T, options?: ComputedOptions): SignalComputed<T>
   }
   ```

   Базовая реализация для core (`packages/core/src/helpers/adapter-core.ts`):

   ```ts
   export const coreSignalAdapter: SignalAdapter = {
     state<T>(initial: T) { return state(initial) as any },
     computed<T>(fn: () => T, options?: {name?: string}) { return computed(fn, options) as any },
   }
   ```

   Пример использования в фиче (фабрика):

   ```ts
   // фича принимает адаптер, не зависит от конкретной реализации сигналов
   export const createCounter = (adapter: SignalAdapter) => {
     const count = adapter.state(0)
     const doubled = adapter.computed(() => count.get() * 2, {name: 'counter.doubled'})
     const inc = () => count.set(count.get() + 1)
     return {count, doubled, inc}
   }

   // потребитель с core
   import {coreSignalAdapter} from '@statx/core'
   const counter = createCounter(coreSignalAdapter)
   ```

4. Подготовить структуру нового пакета
   - Единый `package.json` (ESM‑first, `type: module`, `sideEffects: false`). Включить `exports` с под‑путями и типами.
   - Каталог `src/` со схемой: `src/modules/<name>/index.ts` и общие утилиты `src/shared/…`.
   - Единый `tsconfig.json` (+ `tsconfig.build.json` при необходимости).

5. Выбрать и настроить сборку
   - Инструмент: `tsup`  (ESM + d.ts, без CJS, если это допустимо). Конфиг: `tsup.config.ts` с многовходовой сборкой под под‑модули.
   - Входные точки: по модулю (многовходовая сборка) + root‑index с ре‑экспортами.
   - Treeshaking: убедиться в отсутствии побочных эффектов, `sideEffects: false`, pure‑аннотации при необходимости.

6. Консолидация зависимостей
   - Объединить зависимости из всех пакетов в один `package.json`.
   - Устранить дубли/конфликты версий, оформить `peerDependencies` там, где нужно .
   - Внешние peer для модулей:  `lit`, `@xstate/fsm`, `force-graph`, (optional).

7. Мигрировать исходники из пакетов в модули
   - Перенести код из `packages/*` в `src/modules/<name>` с сохранением внутренней структуры.
   - Обновить все импорт‑пути на новые относительные/подэкспортные.
   - Добавить «тонкие» `index.ts` в каждом модуле для стабильного публичного API.

8. Настроить под‑экспорты и типы
   - В `package.json` прописать для каждого модуля: `exports["./<name>"] = { types, import }`.
   - Сгенерированные типы (d.ts) должны следовать за каждой входной точкой.

9. Объединить тестовую инфраструктуру
   - Выбрать единый раннер: wtr
   - Переместить тесты в `tests/` с зеркалированием модулей или рядом с исходниками.
   - Обновить конфиги и фикстуры; обеспечить параллельный прогон.

10. Демки и playground

- Перенести демо‑страницы/проекты (lit/react) в `examples/` или `playground/`.
- Обновить импорты на новый пакет и под‑пути.

1. Проверка treeshaking и размера бандла

- Тесты с `rollup`/`vite`/`webpack`: импорт отдельных модулей; убедиться, что неиспользуемое кодогеном отбрасывается.
- Запретить побочные эффекты в модулях (инициализация только по вызову).

12. CI/CD для одного пакета

- Джобы: lint → build → test → size‑check → publish (с dry‑run для веток).
- Кэширование сборки/тестов, публикация тегов, генерация changelog.

13. Совместимость и стратегия деприкации

- В старых пакетах: выпустить патч‑версии с `npm deprecate` и README, указывающими на новый пакет и пути миграции.
- Опционально: опубликовать «прокси‑пакеты», ре‑экспортирующие из нового (временная мера для плавной миграции).

14. Документация и MIGRATION_GUIDE.md

- Таблица соответствия импортов: `@old/pkg` → `new-pkg/<module>`.
- Примеры интеграции с разными сигналами через адаптер, рецепты для `react`, `lit` и т.д.

15. Релиз и наблюдение

- Выложить релиз‑кандидат → собрать обратную связь → стабилизировать 1.0.0.
- Мониторинг инцидентов, быстрая выдача патчей.

#### Критерии готовности

- Один пакет с рабочими под‑экспортами, корректными `types` и ESM‑билдами.
- Все модули сборки проходят тесты; демо‑проекты работают на новых импорт‑путях.
- Treeshaking подтверждён тестовыми проектами и анализаторами бандла.
- Опубликованы гайды по миграции и объявлена деприкация старых пакетов.

### Публичные API (черновик из текущих пакетов)

- core: `list`, `state`, `asyncState`, `computed`, `cachedState`, `makeAutoObservable`, `nodesMap`, `status`, `events`, `recorder`, type/guards: `isAsyncComputed`, `isComputed`, `isListener`, `isStatxFn`, `isState`, `isList`, `assert`, `eachDependency`, `stateTypes`, `reason`, `getDependencyType`, `getNodeType`, `DependencyType`, `ListenerInternal`, плюс все типы из `types`.
- persist: `stateLocalStorage`, `stateSessionStorage`, `indexedDBStorage`, типы `Persist*`.
- router: `Router`, `createRouter`, `NavigateResult`, `buildHref`, `link`.
- url: `url`.
- utils: `throttle`, `isEqualSet`, `delay`.
- lit: `XLitElement`, `SignalElement`, `property`.
- machine: `withMachine`.
- react: `statxComponent`.
- i18n: `createI18n`, `LANGUAGES`, плюс типы (`Lang`, `I18nResult`, ...).
- visualizer: `openVisualizer` (модуль с сайд‑эффектом и глобалями `window.visualizer`).

### Схема exports (черновик)

- Под‑пути: `"./core"`, `"./persist"`, `"./router"`, `"./url"`, `"./utils"`, `"./lit"`, `"./machine"`, `"./react"`, `"./i18n"`, `"./visualizer"`.
- Для каждого под‑пути: `{ types: "./dist/modules/<name>/index.d.ts", import: "./dist/modules/<name>/index.js" }`.
- Корневой экспорт `"."`: `{ types: "./dist/index.d.ts", import: "./dist/index.js" }`.
- Файл‑референс с полной схемой: `exports.schema.json` (в корне репозитория).

### Границы модулей (черновик)

- core: публичны `nodes`, `cached`, `helpers` (ограничить только необходимые функции), типы из `types`; скрыть внутренние структуры, не ре‑экспортировать тестовые/демо.
- persist: публичен `persist.ts` и `types.ts`; скрыть `adapters/*` и `utils.ts` как внутренние реализации.
- router: публичен `router.ts`; скрыть утилиты/демо.
- url: публичен `url.ts`; `parseQueryParams`/`encodeQueryParams` остаются внутренними (если выделять — за отдельный под‑экспорт, но по умолчанию скрыть).
- utils: публичны только `throttle`, `isEqualSet`, `delay`.
- lit: публичны элементы и декораторы (`XLitElement`, `SignalElement`, `property`).
- machine: публичен `withMachine`.
- react: публичен `statxComponent`.
- i18n: публичны `translation.ts`, `consts.ts`, `types.ts`.
- visualizer: публичен `openVisualizer`; явно документировать сайд‑эффекты.
