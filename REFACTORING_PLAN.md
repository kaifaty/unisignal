## План рефакторинга модулей

1. Подтвердить текущее состояние: установить зависимости, скачать браузеры Playwright и прогнать WTR-тесты.
2. Utils: документировать `delay` и `throttle` (JSDoc), уточнить гарантии без изменения поведения.
3. Router: добавить JSDoc к ключевым API (`configure`, `initRoot`, `navigate/goto/replace/back`, `start/stop`, `buildHref`, `link`), описать basePrefix/SSR-нюансы.
4. URL: добавить JSDoc к `parseQueryParams`, `encodeQueryParams`, `StateURL` и его методам (SSR-безопасность, hash/history, configureEnv).
5. Persist: JSDoc для `createPersistState`, `createPersistedAdapter`, `persist.*`; кратко описать TTL, версионирование, сериализацию/шифрование и синхронизацию.
6. Query: JSDoc для `QueryClient`, `createQuery`, `createMutation`; зафиксировать семантику staleTime, retry и invalidate.
7. I18n: JSDoc для `createI18n`, `i18n`, `rich`, кэша и ленивых догрузок; запрет IIFE в шаблонах не нарушается.
8. Machine: JSDoc для мини-FSM (`interpret`, `on`) и `withMachine` (жизненный цикл, requestUpdate, reset).
9. Прогнать WTR-тесты, убедиться, что все проходят. Никаких поведенческих изменений.
10. Итоговая проверка линтером и коммит минимального диффа.

Критерии тестов: изоляция, читаемость, быстрота, надежность, полное покрытие, правильность, поддерживаемость, детерминированность.

