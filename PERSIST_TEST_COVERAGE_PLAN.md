## План покрытия тестами модуля persist

1. State: восстановление и базовая функциональность — ГОТОВО
   - Sync/Async восстановление: default → restore, serialize/deserialize/validate.
   - TTL: просроченное значение → onExpire, fallback; валидное значение → restore.
   - Migrations: последовательное применение, отсутствие incomingVersion, ошибка в миграции → onError('migrate').
   - Hooks/флаги: onPersisStateInit, onRestore, onPersist, onClear; isRestored/restoredOnce до/после restore и clear.
   - refreshFromStorage: sync/async ветви, TTL/deserialize/validate/decrypt ветки.

2. Синхронизация через StorageEvent (sync: 'storage') — ГОТОВО
   - Установка нового значения → восстановление.
   - Очистка ключа → сброс к initial.
   - Просроченный TTL → onExpire + сброс.
   - Повреждённый JSON → безопасный игнор/сброс.
   - decrypt/deserialize/validate ошибки → onError соответствующих фаз.
   - Namespace (строка и функция): корректная адресация ключей.

3. Синхронизация через BroadcastChannel (sync: 'broadcast') — ГОТОВО
   - Рассылка set между инстансами → приём и onRestore.
   - Невалидное входящее значение (validate false) → игнор.
   - Отсутствие зацикливания/эхо.

4. Computed: кэширование — ГОТОВО
   - persist=true: запись в сторадж с name/namespace; обновление при изменении. — покрыто
   - TTL: просрочка → не восстанавливать, onExpire. — покрыто (не восстанавливаем, запись нового значения при изменении)
   - serialize/deserialize/validate ошибки при чтении кэша. — покрыто
   - Auto-name: в dev — автогенерация имени при отсутствии name; в production — без name кэш не включается. — покрыто (dev)

5. wrap: внешний writable — ГОТОВО
   - Инициализация: clear() откатывает к начальному внешнему значению. — покрыто
   - refreshFromStorage для async стораджа: подтягивание изменений извне. — покрыто
   - Флаги/хуки: isRestored/restoredOnce/onRestore/onClear корректны. — покрыто

6. Throttle и лимиты — ГОТОВО
   - throttle > 0: серия set приводит к одному persisted write (последнее значение); onPersist вызван ограниченно. — покрыто
   - maxSizeKb: превышение → onError('limit'), запись не происходит. — покрыто
   - В связке с encrypt: лимит проверяется по зашифрованному payload. — покрыто

7. Адаптеры хранилищ — ГОТОВО
   - 'local'/'session' (fallback in-memory): запись/чтение/keys. — покрыто
   - LocalAdapter: запрет типов (symbol/function/bigint) → console.error, запись отсутствует. — покрыто
   - LocalAdapter: повреждённый JSON в getItem → возврат undefined и удаление ключа. — покрыто
   - IndexedDBAdapter (если окружение позволяет): set/get/keys базовый сценарий. — покрыто

8. Списки ключей и очистка — ГОТОВО
   - keys и clearAll без namespace и с namespace (строка/функция). — покрыто
   - async сторадж (idb): корректный список/очистка. — покрыто

9. with/enhancer/use — ГОТОВО
   - with: мердж defaults storage/namespace с опциями вызова; приоритет явных опций. — покрыто
   - enhancer: добавление persist в адаптер; compose через use (несколько enhancers). — покрыто

10. Namespace и автоимена — ГОТОВО

- Проверка коллизий: одинаковые name в разных namespace не конфликтуют.
- Функциональный namespace для state/computed и для keys/clearAll.

11. Безопасность/шифрование — ГОТОВО

- encrypt/decrypt рабочий сценарий: запись/чтение, decrypt в StorageEvent.
- Ошибка decrypt → onError('decrypt'), игнор значения, fallback.

12. Интеграция с query — ГОТОВО

- persist.state для данных запроса: начальное восстановление без затирания до fetch.
- TTL по умолчанию из staleTime; persistNamespace/persistStorage из QueryClient.
- selected (computed) работает с восстановленным значением.

13. SSR/окружение (опционально) — ГОТОВО

- Отсутствие globalThis.window/localStorage/sessionStorage → безопасный fallback, без ошибок при инициализации.

14. Диагностика/логи (опционально) — ГОТОВО

- debug true/кастомный logger: отсутствие падений, вызовы логгера в ключевых фазах (smoke-тест).

Файловая структура тестов (рекомендация)

1) tools/tests/persist.state.test.ts — п.1, частично п.6
2) tools/tests/persist.storage-sync.test.ts — п.2
3) tools/tests/persist.broadcast.test.ts — п.3
4) tools/tests/persist.computed.test.ts — п.4
5) tools/tests/persist.wrap.test.ts — п.5
6) tools/tests/persist.adapters.test.ts — п.7
7) tools/tests/persist.keys-clearAll.test.ts — п.8
8) tools/tests/persist.with-enhancer.test.ts — п.9
9) tools/tests/persist.namespace.test.ts — п.10
10) tools/tests/persist.security.test.ts — п.11
11) tools/tests/query.persist.integration.test.ts — п.12
12) tools/tests/persist.ssr.test.ts — п.13
13) tools/tests/persist.debug.test.ts — п.14
