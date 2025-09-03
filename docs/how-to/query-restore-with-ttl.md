# Восстановление данных c TTL (persist)

При включённом `persist` TTL по умолчанию берётся из `staleTime`. Можно задать явный `ttlMs`:

```ts
import {QueryClient, createQuery} from 'unisignal/modules/query'

const client = new QueryClient(({} as any), {
  persistNamespace: 'ns:',
  persistStorage: ({} as any),
})

const q = createQuery(client, {
  key: ['profile'],
  queryFn: async () => ({id: 1}),
  refetchOnMount: false,
  staleTime: 5_000,
  persist: {ttlMs: 10_000},
})
```
