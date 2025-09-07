import {expect} from '@esm-bundle/chai'
import {persist} from '../../../src/modules/persist/persist'
import {createBasicAdapter} from '../fixtures/adapter'
import {createMemoryAdapter} from '../fixtures/persist'

export const test = it

describe('persist: size limit and encrypt/decrypt', () => {
  test('maxSizeKb prevents set and reports limit error', async () => {
    const signals = createBasicAdapter()
    const storage = createMemoryAdapter()
    let errors: any[] = []

    const s = persist.state<string>(signals, '', {
      name: 'big',
      storage,
      maxSizeKb: 1, // tiny
      onError: (e, ctx) => errors.push([e?.message, ctx.phase]),
    })

    // craft payload > 1KB
    const big = 'x'.repeat(2 * 1024)
    s.set(big)

    // no write should happen (adapter stores payload object when accepted)
    expect(storage.store.size).to.equal(0)
    const msg = (errors[0]?.[0] || '') as string
    expect(errors[0]?.[1]).to.equal('limit')
    expect(msg).to.include('persist payload too large')
  })

  test('encrypt success and decrypt on storage refresh', async () => {
    const signals = createBasicAdapter()
    const storage = createMemoryAdapter()

    const s = persist.state<any>(signals, {a: 1}, {
      name: 'sec',
      storage,
      encrypt: (plaintext) => plaintext.split('').reverse().join(''),
      decrypt: (cipher) => cipher.split('').reverse().join(''),
    })

    s.set({a: 2})
    // storage stores encrypted payload shape
    const raw = storage.store.get('sec')
    expect(raw.__enc__).to.equal(true)

    // force refresh path for sync storage
    ;(s as any).refreshFromStorage()
    expect(s.get()).to.deep.equal({a: 2})
  })

  test('encrypt error and decrypt error reported', async () => {
    const signals = createBasicAdapter()
    const storage = createMemoryAdapter()
    const errors: Array<{phase: string}> = []

    const s = persist.state<any>(signals, {a: 0}, {
      name: 'sec2',
      storage,
      encrypt: () => {
        throw new Error('enc')
      },
      decrypt: () => {
        throw new Error('dec')
      },
      onError: (_e, ctx) => errors.push({phase: ctx.phase}),
    })

    s.set({a: 1})
    // encrypt error recorded, but we still set unencrypted payload
    const raw = storage.store.get('sec2')
    expect(raw.__enc__).to.not.equal(true)

    ;(s as any).refreshFromStorage()
    // decrypt error should be recorded during refresh
    expect(errors.some((e) => e.phase === 'encrypt')).to.equal(true)
    expect(errors.some((e) => e.phase === 'decrypt')).to.equal(true)
  })
})
