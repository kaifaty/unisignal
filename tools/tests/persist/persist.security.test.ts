/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from '@esm-bundle/chai'
import {persist} from '../../../src/modules/persist/persist'
import type {SignalAdapter, SignalWritable} from '../../../src/modules/adapter/types'
import {createMemoryAdapter} from '../fixtures/persist'

function createTestSignalAdapter(): SignalAdapter {
  return {
    state<T>(initial: T): SignalWritable<T> {
      let value = initial
      const listeners = new Set<(v: T) => void>()
      return {
        get(): T {
          return value
        },
        set(v: T): void {
          value = v
          for (const l of listeners) l(v)
        },
        peek(): T {
          return value
        },
        subscribe(listener: (v: T) => void): () => void {
          listeners.add(listener)
          return () => listeners.delete(listener)
        },
      }
    },
    computed<T>(_fn: () => T) {
      throw new Error('not needed here')
    },
  }
}

describe('persist: security/encryption', () => {
  it('encrypt write and decrypt on refreshFromStorage (sync adapter)', () => {
    const base = createTestSignalAdapter()
    const storage = createMemoryAdapter()
    const encrypt = (plaintext: string) => `enc:${plaintext}`
    const decrypt = (ciphertext: string) => {
      if (!ciphertext.startsWith('enc:')) throw new Error('bad cipher')
      return ciphertext.slice(4)
    }

    const s1 = persist.state(base, 'init', {storage, name: 'sec1', encrypt, decrypt})
    s1.set('SECRET')

    // во внутреннем сторадже должен лежать зашифрованный payload
    const raw = storage.store.get('sec1')
    expect(!!raw && typeof raw === 'object' && raw.__enc__).to.equal(true)

    // второй инстанс подтягивает значение через refreshFromStorage с расшифровкой
    const s2 = persist.state(base, 'x', {storage, name: 'sec1', encrypt, decrypt}) as any
    s2.refreshFromStorage()
    expect(s2.get()).to.equal('SECRET')
  })

  it('decrypt in StorageEvent path updates the state', () => {
    const base = createTestSignalAdapter()
    const encrypt = (plaintext: string) => `enc:${plaintext}`
    const decrypt = (ciphertext: string) => {
      if (!ciphertext.startsWith('enc:')) throw new Error('bad cipher')
      return ciphertext.slice(4)
    }

    const s = persist.state(base, 'init', {storage: 'local', name: 'e1', decrypt, encrypt, sync: 'storage'})

    // смоделируем событие storage с зашифрованным значением
    const inner = {value: 'ABC', timestamp: Date.now()}
    const ciphertext = encrypt(JSON.stringify(inner))
    const newValue = JSON.stringify({value: ciphertext, __enc__: true, timestamp: Date.now()})

    const ev: any = new Event('storage')
    ev.key = 'e1'
    ev.newValue = newValue
    ;(globalThis as any).window.dispatchEvent(ev)

    expect(s.get()).to.equal('ABC')
  })

  it("decrypt error in StorageEvent → onError('decrypt') and fallback to initial", () => {
    const base = createTestSignalAdapter()
    const errors: string[] = []
    const decrypt = (_cipher: string) => {
      throw new Error('oops')
    }
    const s = persist.state(base, 'init', {
      storage: 'local',
      name: 'e2',
      decrypt,
      sync: 'storage',
      onError: (_e, ctx) => errors.push(ctx.phase || ''),
    })

    const inner = {value: 'XYZ', timestamp: Date.now()}
    const newValue = JSON.stringify({
      value: 'enc:' + JSON.stringify(inner),
      __enc__: true,
      timestamp: Date.now(),
    })

    const ev: any = new Event('storage')
    ev.key = 'e2'
    ev.newValue = newValue
    ;(globalThis as any).window.dispatchEvent(ev)

    expect(s.get()).to.equal('init')
    expect(errors.includes('decrypt')).to.equal(true)
  })
})
