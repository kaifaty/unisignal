/* eslint-disable @typescript-eslint/no-explicit-any */
import type {SignalAdapter, SignalWritable, CallableWritable} from '../adapter'

function asCallableWritable<T>(signal: SignalWritable<T>): CallableWritable<T> {
  const fn: any = () => signal.get()
  fn.get = () => signal.get()
  fn.peek = () => signal.peek()
  fn.set = (v: T) => signal.set(v)
  fn.subscribe = signal.subscribe.bind(signal)
  return fn as CallableWritable<T>
}

export type QueryParseOptions = {
  autoParse?: boolean
  jsonKeys?: string[]
}
export type QueryEncodeOptions = {
  sortKeys?: boolean
}

export const parseQueryParams = (searchString?: string, options: QueryParseOptions = {}) => {
  const hasWindow = typeof globalThis !== 'undefined' && !!(globalThis as any).window
  let search = searchString ?? (hasWindow ? (globalThis as any).window.location.search : '')
  if (!search) {
    return {}
  }
  if (search.startsWith('?')) {
    search = search.substring(1)
  }
  const params = new URLSearchParams(search)
  const result: Record<string, any> = {}
  const jsonKeys = new Set(options.jsonKeys ?? [])
  const parseVal = (k: string, v: string): any => {
    if (jsonKeys.has(k)) {
      try {
        return JSON.parse(v)
      } catch {
        return v
      }
    }
    if (options.autoParse) {
      if (v === 'true') return true
      if (v === 'false') return false
      if (!Number.isNaN(Number(v)) && v.trim() !== '') return Number(v)
    }
    return v
  }
  for (const [key, value] of params.entries()) {
    const parsed = parseVal(key, value)
    if (key in result) {
      const prev = result[key]
      if (Array.isArray(prev)) result[key] = [...prev, parsed]
      else result[key] = [prev, parsed]
    } else {
      result[key] = parsed
    }
  }
  return result
}

export const encodeQueryParams = (data: Record<string, any>, options: QueryEncodeOptions = {}) => {
  const params = new URLSearchParams()
  const keys = Object.keys(data)
  const ordered = options.sortKeys ? keys.sort() : keys
  for (const key of ordered) {
    const value = data[key]
    if (Array.isArray(value)) {
      for (const v of value) params.append(key, String(v))
    } else if (value !== undefined && value !== null) {
      params.set(key, String(value))
    }
  }
  const query = params.toString()
  return query ? `?${query}` : ''
}

export class StateURL {
  private static _signals: SignalAdapter | undefined
  private static _env: {
    get window(): Window | undefined
    get location(): Location | undefined
    get history(): History | undefined
  } = {
    get window() {
      return (globalThis as any).window as Window | undefined
    },
    get location() {
      return ((globalThis as any).window as Window | undefined)?.location
    },
    get history() {
      return ((globalThis as any).window as Window | undefined)?.history
    },
  }
  static configure(adapter: SignalAdapter) {
    this._signals = adapter
  }
  static configureEnv(env: Partial<typeof StateURL._env>) {
    this._env = {...this._env, ...env}
  }
  private static _ensureSignals(): SignalAdapter {
    if (!this._signals) {
      throw new Error('URL signals adapter is not configured. Call url.configure(adapter) before using url.')
    }
    return this._signals
  }

  private _query?: CallableWritable<Record<string, string>>
  private _path?: CallableWritable<string>
  private _hash?: CallableWritable<string>
  private _state?: CallableWritable<any>
  private _initialized = false
  private _disposed = false

  get query(): CallableWritable<Record<string, string>> {
    this._ensureInit()
    return this._query!
  }
  get path(): CallableWritable<string> {
    this._ensureInit()
    return this._path!
  }
  get hash(): CallableWritable<string> {
    this._ensureInit()
    return this._hash!
  }
  get state(): CallableWritable<any> {
    this._ensureInit()
    return this._state!
  }

  get isInitialized(): boolean {
    return this._initialized
  }
  ensureInitialized(): void {
    this._ensureInit()
  }
  onPathChange(listener: (path: string) => void): () => void {
    return this.path.subscribe(listener)
  }
  onQueryChange(listener: (query: Record<string, any>) => void): () => void {
    return this.query.subscribe(listener)
  }

  constructor() {}
  private onLocationChange() {
    if (!StateURL._env.window) {
      return
    }
    this.query.set(parseQueryParams())
    this.path.set(StateURL._env.location!.pathname)
    this.hash.set(StateURL._env.location!.hash)
  }
  private _unsubPop?: () => void
  private _unsubHash?: () => void
  private init() {
    const pop = (e: PopStateEvent) => {
      this.state.set(e.state)
      this.onLocationChange()
    }
    const hash = () => {
      this.onLocationChange()
    }
    StateURL._env.window!.addEventListener('popstate', pop)
    StateURL._env.window!.addEventListener('hashchange', hash)
    this._unsubPop = () => StateURL._env.window!.removeEventListener('popstate', pop)
    this._unsubHash = () => StateURL._env.window!.removeEventListener('hashchange', hash)
  }
  dispose() {
    if (this._disposed) return
    this._disposed = true
    try {
      this._unsubPop?.()
      this._unsubHash?.()
    } catch {
      // ignore dispose errors
    }
  }
  private _ensureInit() {
    if (this._initialized) return
    const signals = StateURL._ensureSignals()
    this._query = asCallableWritable<Record<string, string>>(signals.state<Record<string, string>>({}))
    this._path = asCallableWritable<string>(signals.state<string>(''))
    this._hash = asCallableWritable<string>(signals.state<string>(''))
    this._state = asCallableWritable<any>(signals.state<any>(undefined))
    this._initialized = true
    if (!globalThis.window) {
      return
    }
    this.init()
    this.onLocationChange()
  }
  private applyParam(data: Record<string, any>, replace: boolean) {
    if (!globalThis.window) {
      return
    }
    const basePath = globalThis.window.location.pathname
    const hash = globalThis.window.location.hash
    const search = encodeQueryParams(data)
    const target = `${basePath}${search}${hash}`
    if (replace) {
      this.replaceState(target)
    } else {
      this.push(target)
    }
  }
  deleteQueryParam(key: string, replace = false) {
    const data = {...this.query()}
    if (key in data) {
      delete data[key]
      this.applyParam(data, replace)
    }
  }
  addQueryParam(key: string, value: any, replace = false) {
    this.applyParam({...this.query(), [key]: value}, replace)
  }
  setQuery(params: Record<string, any>, {replace = false}: {replace?: boolean} = {}) {
    this.applyParam(params, replace)
  }
  updateQuery(
    updater: (q: Record<string, any>) => Record<string, any>,
    {replace = false}: {replace?: boolean} = {},
  ) {
    const next = updater({...this.query()})
    this.applyParam(next, replace)
  }
  clearQuery({replace = false}: {replace?: boolean} = {}) {
    this.applyParam({}, replace)
  }
  setHash(value: string, {replace = false}: {replace?: boolean} = {}) {
    if (!StateURL._env.window) return
    const basePath = StateURL._env.location!.pathname
    const search = encodeQueryParams(this.query())
    const target = `${basePath}${search}${value.startsWith('#') ? value : '#' + value}`
    if (replace) this.replaceState(target)
    else this.push(target)
  }
  clearHash({replace = false}: {replace?: boolean} = {}) {
    if (!StateURL._env.window) return
    const basePath = StateURL._env.location!.pathname
    const search = encodeQueryParams(this.query())
    const target = `${basePath}${search}`
    if (replace) this.replaceState(target)
    else this.push(target)
  }
  push(path: string, state?: any) {
    if (!StateURL._env.window) {
      return
    }
    this.state.set(state)
    StateURL._env.history!.pushState(state, '', path)
    this.onLocationChange()
  }
  replaceState(path: string, state?: any) {
    if (!StateURL._env.window) {
      return
    }
    this.state.set(state)
    StateURL._env.history!.replaceState(state, '', path)
    this.onLocationChange()
  }
  navigate(path: string, {replace = false, state}: {replace?: boolean; state?: any} = {}) {
    if (replace) this.replaceState(path, state)
    else this.push(path, state)
  }
  go(value?: number) {
    if (!StateURL._env.window) {
      return
    }
    StateURL._env.history!.go(value)
  }
  back() {
    if (!StateURL._env.window) {
      return
    }
    StateURL._env.history!.back()
  }
}

export const url = new StateURL()
export const configure = (adapter: SignalAdapter) => StateURL.configure(adapter)
