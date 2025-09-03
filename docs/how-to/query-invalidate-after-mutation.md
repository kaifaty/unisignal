# Инвалидация данных после мутации

После успешной мутации вызовите `client.invalidate(key)`, чтобы пометить кэш как устаревший и инициировать рефетч:

```ts
import {QueryClient, createQuery, createMutation} from 'unisignal/modules/query'

const client = new QueryClient(({} as any))

const list = createQuery(client, {
  key: ['list'],
  queryFn: async () => fetch('/api/list').then((r) => r.json()),
  refetchOnMount: false,
  staleTime: 0,
})

const m = createMutation(client, {
  mutationFn: async (v: any) => v,
  onSuccess: () => client.invalidate(['list']),
})
```
