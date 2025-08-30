/* eslint-disable @typescript-eslint/no-explicit-any */
import {PREFIXES, NOT_ALLOWED_TYPES} from '../consts'
import type {PersistAdapter} from '../types'

export const createLocalAdapter = (storage: Storage, kind?: 'localStorage' | 'sessionStorage') => {
  const detectKind = (): 'localStorage' | 'sessionStorage' => {
    if (kind) return kind
    try {
      // @ts-ignore
      const g = typeof globalThis !== 'undefined' ? (globalThis as any) : undefined
      return g && g.localStorage && storage === g.localStorage ? 'localStorage' : 'sessionStorage'
    } catch {
      return 'localStorage'
    }
  }
  const storageName = detectKind()
  const prefix = PREFIXES[storageName]
  return class LocalStorageAdapter implements PersistAdapter {
    isAsync = false
    constructor() {}
    keys(): string[] {
      const result: string[] = []
      try {
        for (let i = 0; i < storage.length; i++) {
          const key = storage.key(i)
          if (key && key.startsWith(prefix)) {
            result.push(key.slice(prefix.length))
          }
        }
      } catch {
        // ignore
      }
      return result
    }
    set(name: string, value: unknown) {
      const type = typeof value
      if (NOT_ALLOWED_TYPES.includes(type)) {
        console.error(`[TypeError]: ${type} is not allowed`)
        return
      }
      try {
        const payload =
          typeof value === 'object' && value && 'value' in (value as any)
            ? (value as any)
            : {value, timestamp: Date.now()}
        storage.setItem(prefix + name, JSON.stringify(payload))
      } catch (e) {
        console.error(`[Storage set item error]: ${(e as Error).message}`)
      }
    }
    get(name: string): unknown {
      const raw = storage.getItem(prefix + name)
      if (!raw) return undefined
      try {
        const data = JSON.parse(raw)
        return data
      } catch (e) {
        console.error(`[Storage parse error]: ${(e as Error).message}`)
        // broken value; clean up
        try {
          storage.removeItem(prefix + name)
        } catch (_e) {
          void 0 // ignore cleanup error
        }
        return undefined
      }
    }
    clear(name: string): void {
      storage.removeItem(prefix + name)
    }
  }
}
