# Query

Лёгкий помощник для асинхронных запросов на базе SignalAdapter.

## Быстрый старт

```ts
import {QueryClient, createQuery} from 'unisignal/modules/query'
import {adapter} from 'unisignal'

const client = new QueryClient(adapter.createYourAdapter?.() ?? ({} as any))

const q = createQuery(client, {
  key: ['users', 1],
  queryFn: async () => ({id: 1}),
  refetchOnMount: true,
})
```

## Опции

- key: массивовой ключ
- queryFn: функция-запрос
- staleTime, gcTime
- refetchOnMount, enabled
- keepPreviousData
- select(data) => selected
- retry: число или {count, delay, predicate}
- persist: true | {name?, storage?, ttlMs?, namespace?, ...}

## Persist

```ts
const q = createQuery(client, {
  key: ['list'],
  queryFn: fetchList,
  persist: true, // имя будет q:["list"] и префикс из client.persistNamespace
  staleTime: 5_000,
})
```

Если вы используете `QueryClient` с `persistNamespace`/`persistStorage`, то их значения применятся по умолчанию:

```ts
import {QueryClient, createQuery} from 'unisignal/modules/query'
import {adapter} from 'unisignal'

const mem = /* ваш PersistAdapter */ ({} as any)
const client = new QueryClient(adapter.createYourAdapter?.() ?? ({} as any), {
  persistNamespace: 'ns:',
  persistStorage: mem,
})

const q = createQuery(client, {
  key: ['users'],
  queryFn: async () => [{id: 1}],
  persist: true, // ключ будет ns:q:["users"]
  staleTime: 5_000, // по умолчанию используется также как ttlMs для persist
})
```

## Select и keepPreviousData

```ts
const q = createQuery(client, {
  key: ['detail', 1],
  queryFn: async () => ({id: 1, name: 'A'}),
  refetchOnMount: false,
  staleTime: 0,
  keepPreviousData: true,
  select: (d) => d.name,
})
// q.selected.get() → 'A'
```

## Инвалидация после мутации

```ts
import {createMutation} from 'unisignal/modules/query'

const list = createQuery(client, {
  key: ['list'],
  queryFn: async () => fetch('/api/list').then((r) => r.json()),
  refetchOnMount: false,
  staleTime: 0,
})

const m = createMutation(client, {
  mutationFn: async (v: any) => {
    await fetch('/api/item', {method: 'POST', body: JSON.stringify(v)})
    return v
  },
  onSuccess: () => client.invalidate(['list']),
})
```

## Инвалидация

```ts
import {createMutation} from 'unisignal/modules/query'

const m = createMutation(client, {
  mutationFn: async (v: any) => v,
  invalidateKeys: [['list']],
})
```

## Триггеры

В `QueryClient` можно включить `refetchOnFocus/refetchOnReconnect`.
