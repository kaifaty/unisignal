## URL — руководство

Работа с путём, query и hash, подписки и навигация.

### Основной API

- `configure(base)` — привязка адаптера сигналов
- `navigate(path, opts)` — переход
- `setQuery(object)` / `setHash(string)` — изменение части URL
- Подписки: `onPathChange`, `onQueryChange`, `onHashChange`

### Рецепты

- Синхронизация состояния с URL
- DI окружения в тестах (fake `window/location/history`)
