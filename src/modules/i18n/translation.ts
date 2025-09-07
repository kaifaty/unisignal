import type {SignalAdapter} from '../adapter'
import type {I18nResult, PickValues, TransStore} from './types'
import type {Lang} from './consts'
import {LANGUAGES} from './consts'
import {replaceValues, setDocumentLang} from './utils'
import {html, type TemplateResult} from 'lit'

type I18nOptions<T extends TransStore> = {
  baseLang?: Lang
  onMissing?: (key: string, lang: Lang) => void
  loader?: (lang: Lang) => Promise<Partial<T>>
  cacheLimit?: number
}

const isKnownLang = (value: string): value is Lang => {
  return value in LANGUAGES
}

const normalizeLang = (value: string, base?: Lang): Lang => {
  const lower = value.toLowerCase()
  if (isKnownLang(lower)) return lower
  const short = lower.split('-')[0]
  if (isKnownLang(short)) return short
  return base ?? (isKnownLang('en') ? 'en' : (Object.keys(LANGUAGES)[0] as Lang))
}

type WritableTransStore<TS extends TransStore> = {
  -readonly [K in keyof TS]: {
    -readonly [L in keyof TS[K]]: TS[K][L]
  }
}

export const createI18n = <const T extends TransStore, L extends Lang>(
  adapter: SignalAdapter,
  data: T,
  lang: L,
  options: I18nOptions<T> = {},
) => {
  // локальная изменяемая копия стора для слияния данных ленивой загрузки
  const store: WritableTransStore<T> = {...(data as unknown as WritableTransStore<T>)}
  const baseLang = options.baseLang
  const initial = normalizeLang(lang, baseLang)
  const langState = adapter.state<Lang>(initial)
  const loadingState = adapter.state<boolean>(false)
  const errorState = adapter.state<unknown | null>(null)
  const loadedLangs = new Set<Lang>([initial])
  setDocumentLang(initial)

  // LRU-кэш строк после подстановки
  const cacheLimit = options.cacheLimit ?? 200
  const cache = new Map<string, string>()
  const touchCache = (key: string, value: string) => {
    if (cache.has(key)) cache.delete(key)
    cache.set(key, value)
    if (cache.size > cacheLimit) {
      const first = cache.keys().next().value as string | undefined
      if (first !== undefined) cache.delete(first)
    }
  }
  const stableStringify = (obj: unknown): string => {
    if (obj === null || obj === undefined) return ''
    if (typeof obj !== 'object') return String(obj)
    const entries = Object.entries(obj as Record<string, unknown>).sort(([a], [b]) =>
      a < b ? -1 : a > b ? 1 : 0,
    )
    return `{${entries.map(([k, v]) => `${k}:${stableStringify(v)}`).join(',')}}`
  }
  const computeKey = (langKey: Lang, transKey: string, values: unknown): string => {
    return `${langKey}|${transKey}|${stableStringify(values)}`
  }

  const mergeIntoStore = (partial: Partial<T>) => {
    for (const k of Object.keys(partial) as Array<keyof T>) {
      const incoming = partial[k]
      if (!incoming) continue
      const current = store[k] ?? ({} as WritableTransStore<T>[typeof k])
      store[k] = {
        ...(current as object),
        ...(incoming as object),
      } as WritableTransStore<T>[typeof k]
    }
  }

  const ensureLangLoaded = async (l: Lang): Promise<void> => {
    if (!options.loader) return
    if (loadedLangs.has(l)) return
    try {
      loadingState.set(true)
      errorState.set(null)
      const partial = await options.loader(l)
      mergeIntoStore(partial)
      loadedLangs.add(l)
    } catch (e) {
      errorState.set(e)
    } finally {
      loadingState.set(false)
    }
  }

  const setLang = (value: Lang) => {
    const next = normalizeLang(value, baseLang)
    langState.set(next)
    setDocumentLang(next)
    // запускаем фоновую загрузку (без ожидания)
    void ensureLangLoaded(next)
  }

  const setLangFrom = (value: string) => {
    const next = normalizeLang(value, baseLang)
    langState.set(next)
    setDocumentLang(next)
    void ensureLangLoaded(next)
  }
  const i18n = <K extends keyof T, const V extends PickValues<T, K, L>>(
    key: K,
    values: V | undefined = undefined,
  ): I18nResult<T, K, L, V> => {
    const current = langState.get()
    const value = store[key]?.[current]

    if (value === undefined) {
      // возможна фоновая загрузка; не ждём, но триггерим
      void ensureLangLoaded(current)
      const fallback = baseLang ? store[key]?.[baseLang] : undefined
      if (fallback !== undefined) {
        if (values) {
          return replaceValues(fallback, values) as I18nResult<T, K, L, V>
        }
        return fallback as I18nResult<T, K, L, V>
      }
      if (typeof process !== 'undefined' && (process.env?.NODE_ENV ?? 'development') !== 'production') {
        options.onMissing?.(String(key), current)
        // eslint-disable-next-line no-console
        console.warn('[i18n] missing translation', {key: String(key), lang: current})
      } else {
        options.onMissing?.(String(key), current)
      }
      return key as I18nResult<T, K, L, V>
    }
    if (!values) {
      return value as I18nResult<T, K, L, V>
    }

    const cacheKey = computeKey(current, String(key), values)
    const cached = cache.get(cacheKey)
    if (cached !== undefined) {
      return cached as unknown as I18nResult<T, K, L, V>
    }
    const replaced = replaceValues(value, values)
    touchCache(cacheKey, replaced)
    return replaced as unknown as I18nResult<T, K, L, V>
  }

  const exists = (key: keyof T, lang?: Lang): boolean => {
    const l = lang ?? langState.get()
    return store[key]?.[l] !== undefined
  }

  const missing = (lang?: Lang): Array<{key: string; lang: Lang}> => {
    const l = lang ?? langState.get()
    const res: Array<{key: string; lang: Lang}> = []
    for (const k in store) {
      if (store[k]?.[l] === undefined) {
        res.push({key: String(k), lang: l})
      }
    }
    return res
  }

  const rich = <K extends keyof T, const V extends PickValues<T, K, L>>(
    key: K,
    values: V | undefined = undefined,
  ): TemplateResult => {
    const text = i18n(key, values) as unknown as string
    // Безопасная вставка как текст; дополнительно предоставляем полезную строковую репрезентацию
    const tpl = html`${text}` as unknown as Record<string, unknown>
    try {
      Object.defineProperty(tpl, 'toString', {
        value: () => String(text),
        configurable: true,
      })
    } catch {
      // ignore inability to define in some environments
    }
    return tpl as unknown as TemplateResult
  }

  const res = {
    store: () => store,
    getLang: () => langState.get(),
    langState,
    loadingState,
    errorState,
    setLang,
    setLangFrom,
    load: (l?: Lang) => ensureLangLoaded(l ?? langState.get()),
    i18n,
    rich,
    exists,
    missing,
  }
  return res
}
