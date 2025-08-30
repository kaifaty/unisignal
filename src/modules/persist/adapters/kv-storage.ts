/* eslint-disable @typescript-eslint/no-explicit-any */
import type {PersistAdapter} from '../types'

export interface KeyValueLike {
  get(key: string): Promise<string | undefined> | string | undefined
  set(key: string, value: string): Promise<void> | void
  delete(key: string): Promise<void> | void
  list?(): Promise<string[]> | string[]
}

export const createKVAdapter = (kv: KeyValueLike, prefix = 'persist-kv-'): PersistAdapter => {
  return {
    isAsync: true,
    async keys() {
      if (typeof kv.list === 'function') {
        const all = await Promise.resolve(kv.list())
        return all.filter((k) => k.startsWith(prefix)).map((k) => k.slice(prefix.length))
      }
      // no list support — cannot enumerate
      return []
    },
    set(name: string, value: unknown) {
      const payload =
        typeof value === 'object' && value && 'value' in (value as any) ? (value as any) : {value}
      const json = JSON.stringify(payload)
      void Promise.resolve(kv.set(prefix + name, json))
    },
    clear(name: string) {
      void Promise.resolve(kv.delete(prefix + name))
    },
    async get(name: string) {
      const raw = await Promise.resolve(kv.get(prefix + name))
      if (!raw) return undefined
      try {
        return JSON.parse(raw)
      } catch {
        return undefined
      }
    },
  }
}
