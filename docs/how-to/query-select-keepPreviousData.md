# Select и keepPreviousData

Используйте `select` для проекции данных и `keepPreviousData`, чтобы не мерцать UI во время загрузки:

```ts
import {QueryClient, createQuery} from 'unisignal/modules/query'

const client = new QueryClient(({} as any))

const q = createQuery(client, {
  key: ['detail', 1],
  queryFn: async () => ({id: 1, name: 'A'}),
  refetchOnMount: false,
  staleTime: 0,
  keepPreviousData: true,
  select: (d) => d.name,
})

// q.selected.get() будет строкой имени и не сбросится на undefined при повторной загрузке
```
