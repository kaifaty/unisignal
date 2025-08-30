## How‑to: синхронизация состояния с URL

Двусторонняя синхронизация query/hash с приложением.

```ts
import {url} from './src/modules/url'

// sync: состояние <-> query
function setFilters(next: {page?: number; tags?: string[]}) {
  url.setQuery(next)
}

url.onQueryChange((q) => {
  // обновить локальное состояние из q
})
```
