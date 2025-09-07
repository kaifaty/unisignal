## План покрытия тестами модуля url

1. ✅ Базовые функции: parseQueryParams / encodeQueryParams
   - ✅ Ввод/вывод без параметров: пустая строка/undefined → {}
   - ✅ Префикс '?': обрезается корректно
   - ✅ Повторяющиеся ключи → массивы: `?x=a&x=b` → `{x:['a','b']}`
   - ✅ `autoParse: true`: числа, булевы значения, пустые строки, 'NaN' (остается строкой)
   - ✅ `jsonKeys`: корректный JSON → объект; некорректный JSON → исходная строка
   - ✅ Спецсимволы/пробелы/юникод: корректное кодирование/декодирование (`+`, `%20`, `,`, `;`, русские символы)
   - ✅ Порядок ключей при encode: с `sortKeys: true` — сортированный; без — как в объекте
   - ✅ Массивы при encode: несколько `append` одного ключа, порядок значений сохраняется
   - ✅ Пропуск `undefined`/`null` при encode; пустой объект → пустая строка, не `?`
   - ✅ Round-trip: `encode(parse(q))` без `autoParse` даёт эквивалентный набор пар ключ/значение

   Рекомендуемые файлы:
   - `tools/tests/url/url.parse-encode.test.ts` (расширить существующий, добавить граничные кейсы)

2. ✅ Конфигурация StateURL и инициализация
   - ✅ `configure(adapter)`: обязательность конфигурации, ошибка до конфигурации
   - ✅ `ensureInitialized()` и `isInitialized`: двойная инициализация не приводит к дублированию слушателей
   - ✅ Начальные значения после init: `path`, `hash`, `query` считываются из environment
   - ✅ Без `globalThis.window`: инициализация безопасна, слушатели не навешиваются

   Рекомендуемые файлы:
   - `tools/tests/url/url.state-init.test.ts`

3. ✅ Обновления из окружения (popstate/hashchange)
   - ✅ Эмуляция `popstate`: обновление `state`, пересчет `path/hash/query`
   - ✅ Эмуляция `hashchange`: пересчет `hash` и `query` без изменения `state`
   - ✅ Подписки `onPathChange`/`onQueryChange`: вызовы и корректный `unsubscribe`

   Рекомендуемые файлы:
   - `tools/tests/url/url.events.test.ts`

4. ✅ Манипуляции query-параметрами
   - ✅ `addQueryParam(key, value, replace=false)`: добавление/мердж с существующими
   - ✅ `deleteQueryParam(key, replace)`: удаление существующего и отсутствие действий, если ключа нет
   - ✅ `setQuery(params, {replace})`: полная замена
   - ✅ `updateQuery(updater, {replace})`: мердж и вычисление следующего значения
   - ✅ `clearQuery({replace})`: очистка до пустой строки
   - ✅ Проверка, что `replace=true` вызывает `history.replaceState`, иначе `pushState`

   Рекомендуемые файлы:
   - `tools/tests/url/url.query.test.ts`

5. ✅ Работа с hash
   - ✅ `setHash(value, {replace})`: добавление `#` при отсутствии, сохранение `path` и `query`
   - ✅ `clearHash({replace})`: удаление `#...` при сохранении `path` и `query`
   - ✅ Проверка вызовов `pushState/replaceState` в зависимости от флага

   Рекомендуемые файлы:
   - `tools/tests/url/url.hash.test.ts`

6. ✅ Навигация/история
   - ✅ `push(path, state?)`: обновление `state` и пересчет `path/hash/query`
   - ✅ `replaceState(path, state?)`: аналогично, но без добавления записи в историю
   - ✅ `navigate(path, {replace, state})`: делегирование на `push/replaceState`
   - ✅ `go(n)`/`back()`: проксирование вызовов `history`

   Рекомендуемые файлы:
   - `tools/tests/url/url.navigation.test.ts`

7. ✅ Подписки и dispose
   - ✅ `onPathChange`/`onQueryChange`: корректный возврат функции отписки, вызов слушателей по изменениям
   - ✅ `dispose()` снимает слушатели `popstate/hashchange` и безопасен при повторном вызове
   - ✅ `dispose()` в среде без `window` — безопасен

   Рекомендуемые файлы:
   - `tools/tests/url/url.subscriptions-dispose.test.ts`

8. ✅ SSR/окружение
   - ✅ Отсутствие `globalThis.window`: доступ к сигналам (`query/path/hash/state`) без ошибок, методы, требующие window, ничего не делают
   - ✅ Частично поврежденное окружение: отсутствуют `location`/`history` — отсутствие падений, no-op для операций
   - ✅ `parseQueryParams` без аргументов при отсутствии `window` возвращает `{}`

   Рекомендуемые файлы:
   - `tools/tests/url/url.ssr.test.ts`

9. Инфраструктура тестов и фикстуры
   - Переиспользовать адаптеры сигналов из `tools/tests/fixtures/adapter.ts` (`createTestSignalAdapter`)
   - Добавить простую фикстуру `tools/tests/fixtures/url.ts` (если потребуется):
     - Фейковые `location/history`
     - Хелперы `createUrlTestEnv()` и `cleanup()`
     - В `cleanup()` восстанавливать дефолтный `configureEnv` (через геттеры, ссылающиеся на `globalThis.window`)

10. Требования к тестам (качество и стабильность)
    - Изоляция, читаемость, скорость, надежность, детерминированность (см. workspace rules)
    - Минимизировать зависимость от реального DOM/браузера; использовать эмуляцию событий
    - Ясные названия кейсов, покрытие граничных сценариев и ошибок

11. Файловая структура (рекомендация)
    - `tools/tests/url/url.parse-encode.test.ts` — парсинг/кодирование
    - `tools/tests/url/url.state-init.test.ts` — конфигурация/инициализация
    - `tools/tests/url/url.events.test.ts` — popstate/hashchange/подписки
    - `tools/tests/url/url.query.test.ts` — операции с query
    - `tools/tests/url/url.hash.test.ts` — операции с hash
    - `tools/tests/url/url.navigation.test.ts` — push/replace/navigate/go/back
    - `tools/tests/url/url.subscriptions-dispose.test.ts` — отписки/dispose
    - `tools/tests/url/url.ssr.test.ts` — отсутствие window и частичные окружения

12. Критерии готовности (DoD)
    - Покрыты все публичные API `src/modules/url/url.ts`
    - Все ветви условной логики протестированы (включая no-op при отсутствии `window`)
    - Тесты стабильны локально и в CI (WTR, Playwright headless)
    - Повторяемость результатов, отсутствие зависимости от порядка
