import {expect} from '@esm-bundle/chai'
import {persist} from '../../../src/modules/persist/persist'
import {createBasicAdapter} from '../fixtures/adapter'
import {createMemoryAdapter} from '../fixtures/persist'

export const test = it

describe('persist: init hooks', () => {
  test('onPersisStateInit called once for async adapter', async () => {
    const signals = createBasicAdapter()
    const asyncStorage = {
      ...createMemoryAdapter(),
      isAsync: true as const,
      async get(name: string) {
        await new Promise((r) => setTimeout(r, 0))
        return undefined
      },
    }

    let initVal: number | undefined
    const s = persist.state<number>(signals, 1, {
      name: 'k',
      storage: asyncStorage as any,
      onPersisStateInit: (v) => (initVal = v),
    })

    await new Promise((r) => setTimeout(r, 0))
    expect(initVal).to.equal(1)
    // second refresh should not re-trigger init hook
    await (s as any).refreshFromStorage()
    expect(initVal).to.equal(1)
  })
})
