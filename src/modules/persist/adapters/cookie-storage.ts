/* eslint-disable @typescript-eslint/no-explicit-any */
import type {PersistAdapter} from '../types'

const DEFAULT_PREFIX = 'persist-cookie-'

const getDocument = () => {
  try {
    // @ts-ignore
    const g = typeof globalThis !== 'undefined' ? (globalThis as any) : undefined
    return (g && g.document) as Document | undefined
  } catch {
    return undefined
  }
}

const readCookie = (name: string): string | undefined => {
  const d = getDocument()
  if (!d || !d.cookie) return undefined
  const cookies = d.cookie.split('; ')
  for (const c of cookies) {
    const [k, ...rest] = c.split('=')
    if (k === name) return rest.join('=')
  }
  return undefined
}

const writeCookie = (name: string, value: string, ttlMs?: number) => {
  const d = getDocument()
  if (!d) return
  const parts = [`${name}=${value}; path=/`]
  if (typeof ttlMs === 'number' && ttlMs > 0) {
    const expires = new Date(Date.now() + ttlMs)
    parts.push(`expires=${expires.toUTCString()}`)
  }
  // best-effort secure flags (won't hurt in non-https dev)
  parts.push('SameSite=Lax')
  try {
    d.cookie = parts.join('; ')
  } catch {
    // ignore
  }
}

const deleteCookie = (name: string) => {
  const d = getDocument()
  if (!d) return
  try {
    d.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/; SameSite=Lax`
  } catch {
    // ignore
  }
}

export const createCookieAdapter = (options: {prefix?: string; ttlMs?: number} = {}): PersistAdapter => {
  const prefix = options.prefix ?? DEFAULT_PREFIX
  const ttlMs = options.ttlMs
  return {
    isAsync: false,
    keys(): string[] {
      const d = getDocument()
      if (!d || !d.cookie) return []
      const out: string[] = []
      try {
        const cookies = d.cookie.split('; ')
        for (const c of cookies) {
          const [k] = c.split('=')
          if (k && k.startsWith(prefix)) out.push(decodeURIComponent(k.slice(prefix.length)))
        }
      } catch {
        // ignore
      }
      return out
    },
    set(name: string, value: unknown): void {
      try {
        const payload =
          typeof value === 'object' && value && 'value' in (value as any)
            ? (value as any)
            : {value, timestamp: Date.now()}
        const json = JSON.stringify(payload)
        writeCookie(prefix + encodeURIComponent(name), encodeURIComponent(json), ttlMs)
      } catch {
        // ignore set errors
      }
    },
    get(name: string): unknown {
      try {
        const raw = readCookie(prefix + encodeURIComponent(name))
        if (!raw) return undefined
        const json = decodeURIComponent(raw)
        return JSON.parse(json)
      } catch {
        // corrupted; cleanup
        try {
          deleteCookie(prefix + encodeURIComponent(name))
        } catch {
          // ignore
        }
        return undefined
      }
    },
    clear(name: string): void {
      deleteCookie(prefix + encodeURIComponent(name))
    },
  }
}
