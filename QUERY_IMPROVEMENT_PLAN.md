### Цель

Создать модуль `query`, совместимый с `SignalAdapter`, как лёгкую замену React Query: кэш, загрузка/ошибки/успех, рефетч/инвалидация, мутации.

### Дизайн-заметки

- Базироваться на `SignalAdapter` (`state`, `computed`).
- Хранить записи кэша по ключу массива (`QueryKey = readonly unknown[]`).
- Минимальные статусы: `idle | loading | success | error`.
- Политики: `staleTime`, `gcTime`, `refetchOnMount` (минимум).
- Мутации: `mutate`, статусы, опциональный `onSuccess/onError`, инвалидация по ключу.

### Улучшения (план работ)

1. Управление жизненным циклом запросов
   1.1. Добавить `dispose()` в `QueryResult` для отписки от `client.subscribe` и очистки ресурсов.
   1.2. Реализовать `gcTime`: авто-очистка записей кэша без подписчиков (таймер, сброс при новой подписке).

2. Persist: DX и согласование политик
   2.1. Поддержать `persist: true | {name?: string, ...}`; если `true` — авто-имя на базе `key` (например, `q:${hash}`).
   2.2. Если `persist.ttlMs` не задан — по умолчанию использовать `staleTime`.
   2.3. Добавить глобальный `namespace` на уровне `QueryClient` для persist-ключей.

3. Гибкость запроса и UX
   3.1. `enabled?: boolean` — запрет авто-запуска/рефетча.
   3.2. `select?: (data: TData) => TSelected` и `selected: SignalReadable<TSelected | undefined>`.
   3.3. `keepPreviousData?: boolean` — не сбрасывать данные при повторном `loading`.
   3.4. Скип рефетча, если данные не stale: быстрый путь в `run()`.

4. Повторы, отмена и защита от гонок
   4.1. `retry?: number | {count: number, delay?: (n)=>ms, predicate?: (err)=>boolean}`.
   4.2. AbortController: прокидывать `signal` в `queryFn(ctx)` и отменять предыдущий запрос.
   4.3. Last-write-wins: применять результат только самого свежего запуска.

5. Инвалидация и рефетч-политики
   5.1. В `createMutation`: по умолчанию `invalidateKeys` если заданы; упростить DX.
   5.2. Триггеры: `refetchOnFocus`, `refetchOnReconnect` (за флагами; среда — noop в тестах/SSR).

6. Ключи и сериализация
   6.1. Конфиг `keySerializer` в `QueryClient` (детерминированная сериализация, порядок свойств, циклы — запрещены).
   6.2. Экспорт утилиты `getKeyHash` как публичной, документировать контракт ключей.

7. Конфиг клиента и диагностика
   7.1. `QueryClient` принимать `defaults`: `{staleTime?, retry?, persistNamespace?, debug?}`.
   7.2. `client.invalidateQueries(key|predicate)` и `client.clear()`.
   7.3. Лёгкие дев-логи (`debug`) и `client.inspect()` (метрики кэша/промисов).

8. Документация и примеры
   8.1. `docs/modules/query.md`: концепции, API, примеры с persist.
   8.2. How-to: инвалидация после мутации; восстановление с TTL; select и keepPreviousData.
   8.3. Сниппеты покрыть WTR-тестами.

### Критерии готовности

— Все пункты 1–5 реализованы и покрыты WTR-тестами; 6–7 — с базовыми тестами; 8 — задокументировано и проверено сниппетами.
