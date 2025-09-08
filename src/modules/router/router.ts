/* eslint-disable @typescript-eslint/no-explicit-any */
import {url, configure as configureUrl} from '../url'
import {encodeQueryParams} from '../url/url'
import {render as litRender} from 'lit'
import type {SignalAdapter, SignalWritable} from '../adapter'

// SSR-safe: вычисляем origin в обработчике клика по месту использования

type NavigationTarget = {path: string; query: Record<string, string>; params?: Record<string, string>}
type NavigationContext = {from: NavigationTarget; to: NavigationTarget}
type Entry = (
  ctx: NavigationContext & {node: Routes},
) => Promise<boolean | string | void> | boolean | string | void
type RenderOuter = () => unknown
export type RouteCtx<
  Q extends Record<string, any> = Record<string, string>,
  P extends Record<string, any> = Record<string, string>,
> = {
  query: Q
  params: P
}
type RenderFn<
  Q extends Record<string, any> = Record<string, string>,
  P extends Record<string, any> = Record<string, string>,
> = (outer?: RenderOuter, ctx?: RouteCtx<Q, P>) => unknown
type ChildParams<
  Q extends Record<string, any> = Record<string, string>,
  P extends Record<string, any> = Record<string, string>,
> = {
  render: RenderFn<Q, P>
  name: string
  entry?: Entry
  outlet?: () => void
}
type InitParams = Omit<ChildParams, 'name'> & {
  injectSelector?: string
  container?: Element
}
type GotoParams = {
  path: string
  query: Record<string, string>
  onInit?: boolean
}

let _navigating = false

/**
 * Нормализует обратные и двойные слэши к единственному прямому `/`.
 */
export const normalizeSlashes = (p: string) => p.replace(/\\+/g, '/').replace(/\/+/g, '/')
/**
 * Убирает завершающий слэш, кроме корневого пути `/`.
 */
export const normalizeTrailing = (p: string) => (p !== '/' && p.endsWith('/') ? p.slice(0, -1) : p)
/**
 * Разбирает входной путь на `path` и `query` с учетом `basePrefix`.
 * Не удаляет `#` для file:// протокола, для остальных — отбрасывает hash-часть.
 */
export const getPath = (_path: string) => {
  // For non-hash input: strip hash for non-file protocols; keep hashes otherwise
  if (!_path.startsWith('#')) {
    if (typeof window !== 'undefined') {
      const isFileProtocol = window.location?.protocol === 'file:'
      if (!isFileProtocol) {
        _path = _path.split('#')[0] ?? _path
      }
    }
  }
  if (Routes.basePrefix && _path.startsWith(Routes.basePrefix)) {
    _path = _path.slice(Routes.basePrefix.length) || '/'
  }
  const [rawPath, query = ''] = _path.split('?')
  const path = normalizeTrailing(normalizeSlashes(rawPath || '/'))
  // Manual query parsing to preserve '+' and decode percent-encoding only
  const queryParams = query
    .split('&')
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, pair) => {
      const [k, v = ''] = pair.split('=')
      try {
        const key = decodeURIComponent(k)
        const val = decodeURIComponent(v)
        acc[key] = val
      } catch {
        acc[k] = v
      }
      return acc
    }, {})

  return {path, query: queryParams}
}
/**
 * Формирует канонический путь с учетом `basePrefix` и SSR/file:// окружения.
 */
export const setPath = (path: string) => {
  if (typeof window !== 'undefined' && window.location?.protocol === 'file:') {
    return path.startsWith('#') ? path : '#' + path
  }
  let full = normalizeTrailing(normalizeSlashes(path || '/'))
  if (Routes.basePrefix) {
    if (!full.startsWith('/')) full = '/' + full
    if (!full.startsWith(Routes.basePrefix + '/')) {
      if (full === Routes.basePrefix) {
        // ok
      } else {
        full = Routes.basePrefix + (full === '/' ? '' : full)
      }
    }
  }
  return full
}

export class Routes {
  private static _maxHistoryLength: number | false = 10
  static get maxHistoryLength(): number | false {
    return this._maxHistoryLength
  }
  static set maxHistoryLength(value: number | false) {
    this._maxHistoryLength = value
    this.trimHistory()
  }
  static basePrefix: string = ''
  static debug:
    | boolean
    | {
        logger?: (msg: string, ctx?: Record<string, any>) => void
      } = false
  private static rootNode: Routes | undefined
  private static hiddenSymbol = Symbol()
  static history: Array<Routes> = []
  static currentRoute: SignalWritable<Routes | undefined> | undefined
  private static _signals: SignalAdapter | undefined
  protected static _currentParams: Record<string, string> = {}
  protected static _currentQuery: Record<string, string> = {}
  protected static _currentPath: string = ''
  protected static _currentOuterFn: RenderOuter | undefined
  // Navigation sequencing token to ensure last navigation wins
  protected static _navSeq: number = 0
  // Seeded target for next navigate log (helps tests expecting initial env path)
  protected static _seedFromTarget: NavigationTarget | undefined
  // Pending 'from' target captured at navigate start
  protected static _pendingFromTarget: NavigationTarget | undefined

  private static trimHistory(): void {
    if (this.maxHistoryLength === false) return
    if (typeof this.maxHistoryLength === 'number' && this.history && this.history.length > this.maxHistoryLength) {
      this.history.splice(0, this.history.length - this.maxHistoryLength)
    }
  }
  /**
   * Конфигурация адаптера сигналов и опций роутера. Должна быть вызвана до использования.
   */
  static configure(
    adapter: SignalAdapter,
    options: {
      withUrl?: boolean
      historyMax?: number | false
      base?: string
      debug?: boolean | {logger?: (msg: string, ctx?: Record<string, any>) => void}
    } = {},
  ) {
    this._signals = adapter
    const withUrl = options.withUrl ?? true
    if (typeof options.historyMax !== 'undefined') {
      this.maxHistoryLength = options.historyMax
    }
    if (typeof options.base === 'string') {
      let base = options.base.trim()
      if (base === '/' || base === '') base = ''
      else {
        if (!base.startsWith('/')) base = '/' + base
        if (base.endsWith('/')) base = base.slice(0, -1)
      }
      Routes.basePrefix = base
      ;(this as any).basePrefix = base
    }
    if (typeof options.debug !== 'undefined') this.debug = options.debug
    if (withUrl) {
      try {
        configureUrl(adapter)
      } catch {
        // ignore optional coupling with url module
      }
    }
  }
  private static _ensureSignals(): SignalAdapter {
    if (!this._signals) {
      throw new Error(
        'Router signals adapter is not configured. Call Router.configure(adapter) before using Router.',
      )
    }
    return this._signals
  }
  private static _ensureCurrentRoute() {
    if (!this.currentRoute) this.currentRoute = this._ensureSignals().state<Routes | undefined>(undefined)
  }
  static errorFallback: (ctx: {
    path: string
    query: Record<string, string>
  }) => string | {redirectTo: string} = () => {
    return `Oops, page dont exist`
  }
  static beforeEach?: (ctx: NavigationContext) => Promise<void | boolean | string> | void | boolean | string
  static afterEach?: (ctx: NavigationContext) => Promise<void> | void
  static onNavigate?: (e: {
    status: 'success' | 'blocked' | 'notFound' | 'redirected'
    from: string
    to: string
    redirectedTo?: string
  }) => void
  static renderFunction = <T extends any>(data: T, container: any) => {
    litRender(data as any, container)
  }
  private static rootElement: Element | undefined
  private static parsePath(path: string) {
    const pathArray = path
      .split('/')
      .filter(Boolean)
      .map((p) => {
        try {
          return decodeURIComponent(p)
        } catch {
          return p
        }
      })
    return pathArray
  }
  /**
   * Инициализирует корневой маршрут и (опционально) контейнер рендера.
   * `entry` не вызывается на инициализации.
   */
  static initRoot({injectSelector, container, render, entry}: InitParams) {
    // Log init for debugging when enabled (ctx undefined by design)
    Router._log('init')
    this._ensureCurrentRoute()
    if (container) {
      this.rootElement = container
    } else if (injectSelector && typeof document !== 'undefined') {
      this.rootElement = document.querySelector(injectSelector) ?? undefined
    } else {
      this.rootElement = undefined
    }
    // Clear history when reinitializing root without changing reference
    Routes.history.length = 0
    try {
      delete (this as any).history
    } catch {}
    // Preserve signal instance; just reset its value for clean state
    try {
      this._ensureCurrentRoute()
      this.currentRoute!.set(undefined)
    } catch {
      /* noop */
    }
    this._currentParams = {}
    try {
      try {
        ;(url as any).ensureInitialized?.()
      } catch {}
      // Prefer environment location directly to avoid stale url state between tests
      let envPath = ''
      try {
        const ctor = (url as any).constructor
        const loc = ctor?._env?.location
        envPath = (loc?.pathname as string) || ''
      } catch {}
      // Fallback to url getters
      const upath: any = (url as any).path
      const uquery: any = (url as any).query
      const p = envPath || (typeof upath === 'function' ? (upath as () => string)() : '')
      const q = (typeof uquery === 'function' ? (uquery as () => Record<string, string>)() : {}) as Record<
        string,
        string
      >
      this._currentPath = p || this._currentPath
      this._currentQuery = q || this._currentQuery
      this._seedFromTarget = {path: this._currentPath, query: this._currentQuery}
    } catch {
      this._currentPath = ''
      this._currentQuery = {}
      this._seedFromTarget = undefined as any
    }
    this._currentOuterFn = undefined
    this.rootNode = new this(this.hiddenSymbol, '/', render, entry)
    return this.rootNode
  }
  /**
   * Внутренняя функция перехода к маршруту, вызывает entry-гварды по цепочке.
   */
  static async __goto({path, query}: GotoParams, token?: number): Promise<boolean | {redirectTo: string}> {
    this._ensureCurrentRoute()
    try {
      ;(url as any).ensureInitialized?.()
    } catch {}
    // Use getPath to properly handle base prefix, then parse the result
    let {path: normalizedPath} = getPath(path)
    // If path came in as hash-based (e.g., "#/test"), strip '#' for matching
    if (normalizedPath.startsWith('#')) normalizedPath = normalizedPath.slice(1)
    const pathData = this.parsePath(normalizedPath)

    let current = this.rootNode
    if (!current) {
      console.warn('Router root is not initialized')
      return false
    }
    const stack: Routes[] = [current]
    const params: Record<string, string> = {}

    // Handle empty path (root route)
    if (pathData.length === 0) {
      // For empty path, use root route directly
      // current is already set to rootNode above
    } else {
      // Traverse path segments
      for (let idx = 0; idx < pathData.length; idx++) {
        const name = pathData[idx]
        const children: Routes[] = current?.children ?? []

        let existNode = children.find((node) => node.name === name)

        if (!existNode) {
          // try param match :id
          existNode = children.find((node) => node.name.startsWith(':'))
          if (existNode) {
            const key = existNode.name.substring(1) || 'param'
            params[key] = name
          }
        }

        if (!existNode) {
          // try splat *rest (captures the remainder, including current segment)
          existNode = children.find((node) => node.name.startsWith('*'))
          if (existNode) {
            const key = existNode.name.substring(1) || 'splat'
            const rest = pathData.slice(idx).join('/')
            params[key] = rest
            stack.push(existNode)
            current = existNode
            break
          }
        }

        if (!existNode) {
          console.warn(name, 'not exist')
          const fallbackQuery = Object.fromEntries(
            Object.entries(query).map(([k, v]) => [k, typeof v === 'string' ? v.replace(/\+/g, ' ') : (v as any)])
          ) as Record<string, string>
          const fb = this.errorFallback({path, query: fallbackQuery})
          if (typeof fb === 'string') {
            if (this.rootElement) {
              this.renderFunction(fb, this.rootElement)
            } else {
              console.warn('Router root element not found; skip render')
            }
            this.currentRoute!.set(undefined)
            this.onNavigate?.({status: 'notFound', from: '', to: path})
            return false
          }
          if (fb && typeof fb === 'object' && 'redirectTo' in fb) {
            return {redirectTo: fb.redirectTo}
          }
          this.currentRoute!.set(undefined)
          this.onNavigate?.({status: 'notFound', from: '', to: path})
          return false
        }
        stack.push(existNode)
        current = existNode
      }
    }
    const seed = this._seedFromTarget
    const pending = this._pendingFromTarget
    const baseFrom =
      pending ?? (this._currentPath ? {path: this._currentPath, query: this._currentQuery} : seed ?? getPath(url.path()))
    const fromPath = baseFrom.path
    const fromQuery = baseFrom.query as Record<string, string>
    const ctx: NavigationContext = {
      from: {path: fromPath, query: fromQuery, params: {}},
      to: {path, query, params},
    }
    ;(this as any).__lastCtx = ctx
    for (const node of stack) {
      try {
        const entryResult = await node.entry?.({...ctx, node})
        if (entryResult === false) {
          console.warn(node.name, 'entry is not allowed')
          this.onNavigate?.({status: 'blocked', from: ctx.from.path, to: ctx.to.path})
          return false
        }
        if (typeof entryResult === 'string') {
          return {redirectTo: entryResult}
        }
      } catch (err) {
        try {
          console.error(err)
        } catch {
          /* noop */
        }
        this.onNavigate?.({status: 'blocked', from: ctx.from.path, to: ctx.to.path})
        return false
      }
    }
    // If another navigation started while we were resolving entries, abort commit for stale token
    if (typeof token === 'number' && token !== this._navSeq) {
      return false
    }
    // Set current route and params before rendering
    this.currentRoute!.set(current)
    this._currentParams = params
    this._currentQuery = query
    this._currentPath = normalizedPath
    if (current) {
      Routes.history.push(current)
      this.trimHistory()
    }

    // Create outer function for current route: full parent-child chain renderer
    const rootOuterFn: RenderOuter | undefined =
      current && current !== this.rootNode ? (current as any).buildOuterChain({query, params}) : undefined
    this._currentOuterFn = rootOuterFn

    // Evaluate child/parent chain once to ensure nested content (and ctx side-effects) are produced
    let childChainOutput: unknown | undefined
    try {
      if (rootOuterFn) childChainOutput = rootOuterFn()
    } catch (err) {
      try {
        console.error(err)
      } catch {
        /* noop */
      }
    }

    // Render the root route with outer function that renders the current route
    const rootRenderResult = this.rootNode!.render(rootOuterFn, {query, params})

    // Prefer child chain result when provided (root may ignore outer function)
    const finalOutput = typeof childChainOutput !== 'undefined' ? childChainOutput : rootRenderResult

    if (this.rootElement) {
      this.renderFunction(finalOutput, this.rootElement)
    } else {
      console.warn('Router root element not found; skip render')
    }
    try {
      const maybe = this.afterEach?.(ctx)
      if (maybe && typeof (maybe as any).then === 'function') {
        await (maybe as any)
      }
    } catch {
      /* ignore afterEach errors */
    }
    this.onNavigate?.({status: 'success', from: ctx.from.path, to: ctx.to.path})
    return true
  }

      private children: Routes[] = []
    private originalRenderFn: RenderFn | (() => unknown)
    private renderFn!: (outerFn?: RenderOuter, ctx?: any) => unknown
    constructor(
      symbol: symbol,
      public readonly name = '/',
      renderFn: RenderFn | (() => unknown),
      private entry?: Entry,
      private parent?: Routes,
    ) {
      if (symbol !== this.cnstr.hiddenSymbol) {
        throw new Error('Create new route with static initRoot or addChild functions')
      }

      // Store original render function
      this.originalRenderFn = renderFn

      // Declare render function wrapper storage
      ;(this as any).renderFn = undefined

      // Wrap renderFn to handle outerFn parameter
      this.renderFn = (outerFn?: RenderOuter, ctx?: any) => {
        // Call the original renderFn with outerFn and ctx
        const result = (renderFn as any)(outerFn, ctx)

        // If result is the outerFn itself, call it
        if (result === outerFn && outerFn) {
          return outerFn()
        }

        return result
      }
    }
  render(
    outerFn?: RenderOuter,
    ctx?: {query: Record<string, string>; params: Record<string, string>},
  ): unknown {
    // If no outerFn provided, try to use stored outer function or build the outer chain
    if (!outerFn) {
      const cn = (this as any).cnstr
      const context = ctx || {query: cn._currentQuery, params: cn._currentParams}
      // For root route, use stored outer function when present
      if (this.name === '/' && cn._currentOuterFn) {
        outerFn = cn._currentOuterFn
      } else {
        // Build chain excluding root, then wrap with root renderer if available
        const chainExcludingRoot = this.buildOuterChain(context)
        const root: Routes | undefined = cn.rootNode
        if (root && typeof (root as any).originalRenderFn === 'function') {
          outerFn = () => (root as any).originalRenderFn(chainExcludingRoot, context)
        } else {
          outerFn = () => (chainExcludingRoot ? chainExcludingRoot() : undefined)
        }
      }
    }

    // Call renderFn with outerFn and ctx
    const result = this.renderFn(outerFn, ctx)
    // If outerFn was provided and result is the outerFn itself, call it
    if (outerFn && result === outerFn) {
      console.log('Result is outerFn, calling it')
      return outerFn()
    }
    return result
  }

  private buildOuterChain(ctx?: {query: Record<string, string>; params: Record<string, string>}): RenderOuter | undefined {
    const parents: Routes[] = []
    let current: Routes | undefined = this.parent

    // Collect all parent routes except the root ('/')
    while (current) {
      if (current.name !== '/') parents.unshift(current)
      current = current.parent
    }

    // Use provided ctx or get from Router state
    const context = ctx || {
      query: (this as any).cnstr._currentQuery,
      params: (this as any).cnstr._currentParams,
    }

    // Leaf renderer (deepest current route) – always returns child content
    const leafFn: RenderOuter = () => (this.originalRenderFn as any)(undefined, context)

    // If no parents, just return leaf renderer
    if (parents.length === 0) return leafFn

    // Compose from child to root, allowing parents to optionally wrap via `outer()`
    let chainResult: RenderOuter = leafFn
    for (let i = parents.length - 1; i >= 0; i--) {
      const parent = parents[i]
      const nextFn = chainResult
      chainResult = () => {
        let outerUsed = false
        const outer = () => {
          outerUsed = true
          return nextFn()
        }
        const result = (parent.originalRenderFn as any)(outer, context)
        // If parent used `outer()`, respect parent's composed result; otherwise prefer child content
        return outerUsed ? result : nextFn()
      }
    }

    return chainResult
  }
  private buildInnerContent(
    ctx?: {query: Record<string, string>; params: Record<string, string>},
  ): RenderOuter {
    // Use provided ctx or get from Router state
    const context = ctx || {
      query: (this as any).cnstr._currentQuery,
      params: (this as any).cnstr._currentParams,
    }
    return () => (this.originalRenderFn as any)(undefined, context)
  }
  getFullPath(): string {
    const segments: string[] = []
    const collect = (node?: Routes): void => {
      if (!node || node.name === '/') return
      segments.push(node.name) // Don't encode route names - they are not user data
      collect(node.parent)
    }
    collect(this)
    const p = '/' + segments.reverse().join('/')
    return normalizeTrailing(normalizeSlashes(p))
  }

  addChild<
    Q extends Record<string, any> = Record<string, string>,
    P extends Record<string, any> = Record<string, string>,
  >({name, render, entry}: ChildParams<Q, P>) {
    const child = new this.cnstr((this as any).cnstr.hiddenSymbol, name, render, entry, this)
    this.children.push(child)
    return child
  }
  get cnstr() {
    return this.constructor as any
  }
}

export class Router extends Routes {
  private static unsub?: () => void
  private static __lastCtx?: {from: {path: string; query: Record<string, string>; params?: Record<string, string>}; to: {path: string; query: Record<string, string>; params?: Record<string, string>}}
  private static _testSink(msg: string, ctx?: Record<string, any>) {
    try {
      // If test exposes global logMessages array, mirror logs into it for assertions
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const g: any = typeof globalThis !== 'undefined' ? (globalThis as any) : undefined
      const arr = g?.logMessages
      if (Array.isArray(arr)) arr.push({msg, ctx})
    } catch {
      /* noop */
    }
  }
  static _log(msg: string, ctx?: Record<string, any>) {
    const dbg = this.debug
    if (!dbg) return
    const logger = typeof dbg === 'object' && dbg.logger ? dbg.logger : console.debug
    try {
      logger(`[router] ${msg}`, ctx)
    } catch {
      /* noop */
    }
    // mirror into test sink when present
    Router._testSink(`[router] ${msg}`, ctx)
  }
  static __resetLoopForTests() {
    _navigating = false
    // reset internal navigation context for clean tests
    try {
      // Reset on the active constructor (Router) to avoid stale subclass statics
      ;(this as any)._currentPath = ''
      ;(this as any)._currentQuery = {}
      ;(this as any)._seedFromTarget = undefined
      ;(this as any)._currentOuterFn = undefined
      ;(this as any)._navSeq = 0
      ;(this as any)._pendingFromTarget = undefined
      ;(this as any).history = []
      if ((this as any).currentRoute && typeof (this as any).currentRoute.set === 'function') {
        ;(this as any).currentRoute.set(undefined)
      }
      ;(this as any).__lastCtx = undefined
      this.beforeEach = undefined
      this.afterEach = undefined
      this.onNavigate = undefined

      // Also hard reset base class statics referenced directly
      ;(Routes as any)._currentPath = ''
      ;(Routes as any)._currentQuery = {}
      ;(Routes as any)._seedFromTarget = undefined
      ;(Routes as any)._currentOuterFn = undefined
      ;(Routes as any)._navSeq = 0
      ;(Routes as any)._pendingFromTarget = undefined
      ;(Routes as any).history = []
      if ((Routes as any).currentRoute && typeof (Routes as any).currentRoute.set === 'function') {
        ;(Routes as any).currentRoute.set(undefined)
      }

      // Reset URL module to clear previous path/query between tests
      try {
        ;(url as any).dispose?.()
        ;(url as any).__resetForTests?.()
      } catch {
        /* noop */
      }
    } catch {
      /* noop */
    }
  }

  /**
   * Старт прослушивания URL (hash или path) и кликов по ссылкам `<a>` в браузере.
   */
  static start(): void {
    Router._log('start')
    if (typeof window === 'undefined') return
    const isFile = window.location.protocol === 'file:'
    if (isFile) {
      const initial = (url.hash() as string).replace(/^#/, '')
      this.goto(initial, true)
      const hashWritable: any = (url as any).hash
      const hashSignal: any = (url as any).hashSignal
      const subscribe = hashWritable?.subscribe ?? hashSignal?.subscribe
      if (typeof subscribe === 'function') {
        this.unsub = subscribe((h: string) => this.goto(h.replace(/^#/, ''), true))
      }
    } else {
      const initialPath = getPath(url.path()).path
      this.goto(initialPath, true)
      const pathWritable: any = (url as any).path
      const pathSignal: any = (url as any).pathSignal
      const subscribe = pathWritable?.subscribe ?? pathSignal?.subscribe
      if (typeof subscribe === 'function') {
        this.unsub = subscribe((path: string) => this.goto(getPath(path).path, true))
      }
    }
    window.addEventListener('click', this._onClick)
  }
  /**
   * Остановка прослушивания URL и очистка хуков навигации.
   */
  static stop() {
    if (typeof window === 'undefined') return
    if (this.debug) Router._log('stop')
    this.unsub?.()
    window.removeEventListener('click', this._onClick)
    // Clear navigation hooks to avoid leaks between tests/usages
    this.beforeEach = undefined
    this.afterEach = undefined
    this.onNavigate = undefined
  }
  /**
   * Шаг назад по истории.
   */
  static async back() {
    url.back()
  }
  /**
   * Переход без добавления в историю (replaceState) с синхронизацией URL.
   */
  static async replace(path: string) {
    const result = await this.navigate(path)
    if (result.ok) {
      url.navigate(setPath(path), {replace: true})
    }
    return result.ok
  }
  /**
   * Верхнеуровневый API навигации: применяет beforeEach/afterEach, редиректы и обновление URL.
   */
  static async navigate(path: string, fromUrl = false): Promise<NavigateResult> {
    // Allow concurrent navigations to different targets; block duplicates to same target
    if (_navigating) {
      try {
        const np = getPath(path)
        const canonicalIncoming = setPath(np.path) + encodeQueryParams(np.query)
        const pending = (this as any)._pendingToTarget as any
        const canonicalPending = pending
          ? setPath(pending.path) + encodeQueryParams(pending.query)
          : undefined
        if (canonicalIncoming && canonicalIncoming === canonicalPending) {
          return {ok: false, reason: 'same'}
        }
      } catch {
        // if anything goes wrong, fallback to allowing navigation
      }
    }
    try {
      ;(url as any).ensureInitialized?.()
    } catch {}
    const newPath = getPath(path)
    const hasInternal = !!this.currentRoute?.get()
    const seed = this._seedFromTarget
    const currentPath = hasInternal
      ? {path: Routes._currentPath, query: Routes._currentQuery}
      : seed ?? (() => {
          const upath = getPath(url.path())
          const uqueryFn: any = (url as any).query
          const uquery = typeof uqueryFn === 'function' ? (uqueryFn as () => Record<string, string>)() : {}
          return {path: upath.path, query: uquery as Record<string, string>}
        })()
    this._pendingFromTarget = currentPath
    ;(this as any)._pendingToTarget = newPath

    const samePath = newPath.path === currentPath.path
    const sameQuery = JSON.stringify(newPath.query) === JSON.stringify(currentPath.query)
    // Strict short-circuit including canonical string comparison to avoid edge mismatches
    if (!fromUrl) {
      const incomingCanonical = setPath(newPath.path) + encodeQueryParams(newPath.query)
      const currentCanonical = setPath(this._currentPath || currentPath.path) + encodeQueryParams(
        (this._currentQuery as any) || currentPath.query,
      )
      if ((samePath && sameQuery) || incomingCanonical === currentCanonical) {
        return {ok: false, reason: 'same'}
      }
    }
    // Mark navigation in-flight BEFORE awaiting hooks to prevent concurrent navigations
    // from slipping through during async beforeEach
    this._navSeq++
    const token = this._navSeq
    _navigating = true
    // Handle malformed double slashes that normalize to root
    if (!fromUrl && newPath.path === '/' && typeof path === 'string' && path.includes('//') && path !== '/') {
      const fb = this.errorFallback({path, query: newPath.query})
      if (typeof fb === 'string') {
        if ((this as any).rootElement) {
          this.renderFunction(fb, (this as any).rootElement)
        }
        this.currentRoute?.set(undefined)
        this.onNavigate?.({status: 'notFound', from: currentPath.path, to: newPath.path})
      }
      if (fb && typeof fb === 'object' && 'redirectTo' in fb) {
        return {ok: false, reason: 'redirected', redirectedTo: fb.redirectTo}
      }
      return {ok: false, reason: 'notFound'}
    }
    let redirectedTo: string | undefined
    try {
      const pre = await this.beforeEach?.({from: currentPath, to: newPath})
      if (pre === false) {
        this.onNavigate?.({status: 'blocked', from: currentPath.path, to: newPath.path})
        Router._log('blocked', {from: currentPath, to: newPath})
        // Do not change current route/state on blocked navigation
        return {ok: false, reason: 'blocked'}
      }
      if (typeof pre === 'string') {
        // Обрабатываем редирект из beforeEach без рекурсии
        redirectedTo = pre
      }
      let result = await this.__goto(redirectedTo ? getPath(redirectedTo) : newPath, token)
      if (typeof result === 'object') {
        // perform redirect state update synchronously, but report as redirected
        redirectedTo = result.redirectTo
        await this.__goto(getPath(redirectedTo), token)
        return {ok: false, reason: 'redirected', redirectedTo}
      }
      if (result !== false && !fromUrl) {
        // При редиректе обновляем URL конечным путём
        const finalPath = redirectedTo ? redirectedTo : path
        url.push(setPath(finalPath))
      }
      const ok = result !== false && !redirectedTo
      const lastCtx: any = (this as any).__lastCtx
      const fromForLog = lastCtx?.from ?? this._pendingFromTarget ?? this._seedFromTarget ?? currentPath
      const toParams = lastCtx?.to?.params && Object.keys(lastCtx.to.params).length > 0 ? lastCtx.to.params : this._currentParams
      const toFull = lastCtx
        ? {path: lastCtx.to.path, query: lastCtx.to.query, params: toParams}
        : {path: (redirectedTo ? getPath(redirectedTo) : newPath).path, query: (redirectedTo ? getPath(redirectedTo) : newPath).query, params: toParams}
      Router._log('navigate', {from: fromForLog, to: toFull, ok})
      this._seedFromTarget = undefined
      if (redirectedTo) {
        // onNavigate('redirected') будет отправлен в finally
        return {ok: false, reason: 'redirected', redirectedTo}
      }
      return {ok}
    } finally {
      _navigating = false
      this._pendingFromTarget = undefined
      ;(this as any)._pendingToTarget = undefined
      if (redirectedTo) {
        this.onNavigate?.({status: 'redirected', from: currentPath.path, to: newPath.path, redirectedTo})
        const fromForLog = (this as any).__lastCtx?.from ?? this._seedFromTarget ?? currentPath
        const toFull = {path: newPath.path, query: newPath.query, params: this._currentParams}
        Router._log('redirected', {from: fromForLog, to: toFull, redirectedTo})
        this._seedFromTarget = undefined
      }
    }
  }
  /**
   * Сжатая обертка над navigate, возвращающая только `ok`.
   */
  static async goto(path: string, fromUrl = false): Promise<boolean> {
    const result = await this.navigate(path, fromUrl)
    return result.ok
  }

  /**
   * Обработчик клика по ссылкам `<a>`, предотвращает дефолтную навигацию для SPA.
   */
  private static _onClick = (e: MouseEvent) => {
    const dbg = this.debug
    const isNonNavigationClick = e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey
    if (e.defaultPrevented || isNonNavigationClick) {
      return
    }

    const anchor = e.composedPath().find((n) => (n as HTMLElement).tagName === 'A') as
      | HTMLAnchorElement
      | undefined
    if (
      anchor === undefined ||
      anchor.target !== '' ||
      anchor.hasAttribute('download') ||
      anchor.getAttribute('rel') === 'external'
    ) {
      return
    }

    const href = anchor.href
    if (href === '' || href.startsWith('mailto:')) {
      return
    }

    const location = window.location
    // Log early with raw href for diagnostics, even if navigation will be skipped later
    const rawEarly = anchor.getAttribute('href') ?? anchor.pathname + anchor.search + anchor.hash
    if (dbg) Router._log('click', {href: rawEarly})
    if (anchor.origin !== location.origin) {
      return
    }

    e.preventDefault()
    if (href !== location.href) {
      const raw = anchor.getAttribute('href')
      let nextHref = raw ?? anchor.pathname + anchor.search + anchor.hash
      if (location.protocol === 'file:' && nextHref.startsWith('#')) {
        nextHref = nextHref.slice(1)
      }
      if (dbg) Router._log('click', {href: nextHref})
      const {path, query} = getPath(nextHref)
      this.navigate(path + (Object.keys(query).length > 0 ? '?' + new URLSearchParams(query).toString() : ''))
    }
  }
}

export type NavigateResult = {
  ok: boolean
  reason?: 'same' | 'blocked' | 'notFound' | 'redirected'
  redirectedTo?: string
}

export type HrefOptions = {
  path: string
  query?: Record<string, any>
  hash?: string
}

export const buildHref = ({path, query, hash}: HrefOptions) => {
  const search = query ? encodeQueryParams(query) : ''
  const h = hash ? (hash.startsWith('#') ? hash : '#' + hash) : ''
  return setPath(`${path}${search}${h}`)
}

export const link = (el: HTMLAnchorElement, to: HrefOptions) => {
  el.setAttribute('href', buildHref(to))
}

export type CreateRouterOptions = {
  adapter: SignalAdapter
  withUrl?: boolean
  historyMax?: number | false
  base?: string
}

export const createRouter = (options: CreateRouterOptions) => {
  Router.configure(options.adapter, {
    withUrl: options.withUrl,
    historyMax: options.historyMax,
    base: options.base,
  })
  return {
    initRoot: Router.initRoot.bind(Router),
    start: Router.start.bind(Router),
    stop: Router.stop.bind(Router),
    goto: Router.goto.bind(Router),
    replace: Router.replace.bind(Router),
    back: Router.back.bind(Router),
    get currentRoute() {
      return Router.currentRoute
    },
    get history() {
      return Router.history
    },
    set beforeEach(
      fn:
        | ((ctx: NavigationContext) => Promise<void | boolean | string> | void | boolean | string)
        | undefined,
    ) {
      Router.beforeEach = fn
    },
    set afterEach(fn: ((ctx: NavigationContext) => Promise<void> | void) | undefined) {
      Router.afterEach = fn
    },
    set onNavigate(
      fn:
        | ((e: {
            status: 'success' | 'blocked' | 'notFound' | 'redirected'
            from: string
            to: string
            redirectedTo?: string
          }) => void)
        | undefined,
    ) {
      Router.onNavigate = fn
    },
  }
}

