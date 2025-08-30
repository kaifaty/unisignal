import type {TValues} from './types'
import type {Lang} from './consts'
import {LANGUAGES} from './consts'

export function getValue(key: string, values: TValues): string | undefined {
  const path: string[] = key.split('.')
  let v: string | number | TValues | undefined = values
  for (let i = 0; i < path.length; i++) {
    const subkey = path[i]
    if (v === undefined || v === null) return undefined
    if (typeof v !== 'object') {
      // попытка углубиться в примитив — путь некорректен
      return undefined
    }
    v = v[subkey]
  }
  if (v === undefined || v === null) return undefined
  if (typeof v === 'object') return undefined
  return String(v)
}

const RTL_LANGS: Partial<Record<Lang, true>> = {ar: true, he: true, fa: true, ur: true}

export const setDocumentLang = (value: string) => {
  if (typeof window !== 'undefined') {
    const html = document?.documentElement
    if (!html) return
    html.lang = value
    html.dir = RTL_LANGS[value as Lang] ? 'rtl' : 'ltr'
  }
}

export const replaceValues = (value: string, data: TValues): string => {
  // поддержка базового имени и имени с форматом: name или name:format
  return value.replace(/\$\{([a-zA-Z0-9_.:]+)\}/g, (m: string, n: string) => {
    const [path] = n.split(':')
    const resolved = getValue(path, data)
    if (resolved !== undefined && resolved !== null) {
      return resolved
    }
    return m
  })
}
