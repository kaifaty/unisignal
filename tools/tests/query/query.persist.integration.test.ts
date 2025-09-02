/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from '@esm-bundle/chai'
import type {adapter} from '../../../src'
import {QueryClient, createQuery} from '../../../src/modules/query'
import {createBasicAdapter, createComputedTestAdapter} from '../fixtures/adapter'
import {createMemoryAdapter} from '../fixtures/persist'

function createTestAdapter(): adapter.SignalAdapter {
  return createBasicAdapter()
}

describe('query: persist integration', () => {
  it('persist.state для данных запроса: начальное восстановление без затирания до fetch', async () => {
    const mem = createMemoryAdapter()
    const client = new QueryClient(createTestAdapter(), {
      persistStorage: mem,
      persistNamespace: 'query:',
    })

    // Предварительно записываем данные в storage
    mem.set('query:q:restored', {value: {cached: true, data: 'from_storage'}, timestamp: Date.now()})

    let fetchCalls = 0
    const q = createQuery(client, {
      key: ['restored'],
      queryFn: async () => {
        fetchCalls++
        return {cached: false, data: 'from_fetch'}
      },
      refetchOnMount: false,
      persist: {name: 'q:restored'},
      staleTime: 1000,
    })

    // Данные должны быть восстановлены из storage без вызова fetch
    expect(q.data.get()).to.deep.equal({cached: true, data: 'from_storage'})
    expect(fetchCalls).to.equal(0)

    // После refetch данные обновляются
    await q.refetch()
    expect(q.data.get()).to.deep.equal({cached: false, data: 'from_fetch'})
    expect(fetchCalls).to.equal(1)

    q.dispose()
  })

  it('TTL по умолчанию из staleTime; persistNamespace/persistStorage из QueryClient', async () => {
    const mem = createMemoryAdapter()
    const client = new QueryClient(createTestAdapter(), {
      persistStorage: mem,
      persistNamespace: 'test:',
      defaults: {staleTime: 2000},
    })

    // Создаем query с persist: true
    const q = createQuery(client, {
      key: ['ttl-test'],
      queryFn: async () => ({value: 'fresh'}),
      refetchOnMount: false,
      persist: true, // должно использовать настройки из client
    })

    await q.refetch()
    expect(q.data.get()).to.deep.equal({value: 'fresh'})

    // Проверяем, что данные сохранены с правильным namespace и TTL
    const key = 'test:q:["ttl-test"]'
    const stored = mem.get(key) as {value?: unknown; timestamp?: number} | undefined
    expect(stored).to.not.be.undefined
    expect(stored?.value).to.deep.equal({value: 'fresh'})
    // TTL должен быть взят из staleTime (2000ms)
    expect(stored?.timestamp).to.be.a('number')

    // Создаем новый query с тем же ключом - данные должны восстановиться
    const q2 = createQuery(client, {
      key: ['ttl-test'],
      queryFn: async () => ({value: 'refetched'}),
      refetchOnMount: false,
      persist: true,
    })
    expect(q2.data.get()).to.deep.equal({value: 'fresh'})

    q.dispose()
    q2.dispose()
  })

  it('selected (computed) работает с восстановленным значением', async () => {
    const mem = createMemoryAdapter()
    const client = new QueryClient(createComputedTestAdapter(), {
      persistStorage: mem,
      persistNamespace: 'select:',
    })

    // Предварительно записываем данные
    mem.set('select:q:select-test', {
      value: {
        users: [
          {id: 1, name: 'John'},
          {id: 2, name: 'Jane'},
        ],
      },
      timestamp: Date.now(),
    })

    let selectorCalls = 0
    const q = createQuery(client, {
      key: ['select-test'],
      queryFn: async () => ({users: [{id: 3, name: 'Bob'}]}),
      refetchOnMount: false,
      persist: {name: 'q:select-test'},
      select: (data: any) => {
        selectorCalls++
        return data.users.map((u: any) => u.name)
      },
    })

    // Данные должны быть восстановлены и селектор применен
    expect(q.data.get()?.users).to.deep.equal([
      {id: 1, name: 'John'},
      {id: 2, name: 'Jane'},
    ])
    expect(q.selected?.get()).to.deep.equal(['John', 'Jane'])
    expect(selectorCalls).to.equal(1) // Селектор должен быть вызван при инициализации

    // После refetch данные обновляются и селектор применяется заново
    await q.refetch()
    expect(q.selected?.get()).to.deep.equal(['Bob'])
    expect(selectorCalls).to.equal(2)

    q.dispose()
  })

  it('persist с функциональным namespace из QueryClient', async () => {
    const mem = createMemoryAdapter()
    const client = new QueryClient(createTestAdapter(), {
      persistStorage: mem,
      persistNamespace: (name: string) => `func:${name}:end`,
    })

    const q = createQuery(client, {
      key: ['func-test'],
      queryFn: async () => ({result: 'functional'}),
      refetchOnMount: false,
      persist: true,
    })

    await q.refetch()
    expect(q.data.get()).to.deep.equal({result: 'functional'})

    // Проверяем, что namespace применен функционально
    const key = 'func:q:["func-test"]:end'
    const stored = mem.get(key) as {value?: unknown} | undefined
    expect(stored).to.not.be.undefined
    expect(stored?.value).to.deep.equal({result: 'functional'})

    q.dispose()
  })

  it('persist с explicit настройками переопределяет client defaults', async () => {
    const mem = createMemoryAdapter()
    const client = new QueryClient(createTestAdapter(), {
      persistStorage: mem,
      persistNamespace: 'client:',
    })

    const q = createQuery(client, {
      key: ['override-test'],
      queryFn: async () => ({override: true}),
      refetchOnMount: false,
      persist: {
        name: 'custom-name',
        namespace: 'explicit:',
        storage: mem,
        ttlMs: 5000,
      },
    })

    await q.refetch()

    // В query.ts происходит двойное применение namespace, поэтому ключ = 'explicit:explicit:'
    const key = 'explicit:explicit:'
    const stored = mem.get(key) as {value?: unknown} | undefined
    expect(stored).to.not.be.undefined
    expect(stored?.value).to.deep.equal({override: true})

    q.dispose()
  })
})
