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

const normalizeSlashes = (p: string) => p.replace(/\\+/g, '/').replace(/\/\/+/, '/')
const normalizeTrailing = (p: string) => (p !== '/' && p.endsWith('/') ? p.slice(0, -1) : p)
const getPath = (_path: string) => {
  if (typeof window !== 'undefined' && window.location?.protocol === 'file:') {
    _path = _path.split('#')[1] ?? _path
  }
  if (Routes.basePrefix && _path.startsWith(Routes.basePrefix)) {
    _path = _path.slice(Routes.basePrefix.length) || '/'
  }
  const [rawPath, query] = _path.split('?')
  const path = normalizeTrailing(normalizeSlashes(rawPath || '/'))
  const urlParams = new URLSearchParams(query)

  const queryParams = [...urlParams.entries()].reduce<Record<string, string>>((acc, v) => {
    acc[v[0]] = v[1]
    return acc
  }, {})

  return {path, query: queryParams}
}
const setPath = (path: string) => {
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

class Routes {
  static maxHistoryLength: number | false = 10
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
      this.basePrefix = base
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
  static initRoot({injectSelector, container, render, entry}: InitParams) {
    this._ensureCurrentRoute()
    if (container) {
      this.rootElement = container
    } else if (injectSelector && typeof document !== 'undefined') {
      this.rootElement = document.querySelector(injectSelector) ?? undefined
    } else {
      this.rootElement = undefined
    }
    this.rootNode = new this(this.hiddenSymbol, '/', render, entry)
    return this.rootNode
  }
  static async __goto({path, query}: GotoParams): Promise<boolean | {redirectTo: string}> {
    this._ensureCurrentRoute()
    const pathData = this.parsePath(path)
    let current = this.rootNode
    if (!current) {
      console.warn('Router root is not initialized')
      return false
    }
    const stack: Routes[] = [current]
    const params: Record<string, string> = {}
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
        const fb = this.errorFallback({path, query})
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
    const ctx: NavigationContext = {
      from: {path: url.path(), query: url.query(), params: {}},
      to: {path, query, params},
    }
    for (const node of stack) {
      const entryResult = await node.entry?.({...ctx, node})
      if (entryResult === false) {
        console.warn(node.name, 'entry is not allowed')
        this.onNavigate?.({status: 'blocked', from: ctx.from.path, to: ctx.to.path})
        return false
      }
      if (typeof entryResult === 'string') {
        return {redirectTo: entryResult}
      }
    }
    const renderResult = current!.render(undefined, {query, params})
    this.currentRoute!.set(current)
    if (current) {
      this.history.push(current)
      if (typeof this.maxHistoryLength === 'number' && this.history.length > this.maxHistoryLength) {
        this.history.splice(0, 1)
      }
    }
    if (this.rootElement) {
      this.renderFunction(renderResult, this.rootElement)
    } else {
      console.warn('Router root element not found; skip render')
    }
    this.afterEach?.(ctx)
    this.onNavigate?.({status: 'success', from: ctx.from.path, to: ctx.to.path})
    return true
  }

  private children: Routes[] = []
  constructor(
    symbol: symbol,
    public readonly name = '/',
    private renderFn: RenderFn,
    private entry?: Entry,
    private parent?: Routes,
  ) {
    if (symbol !== this.cnstr.hiddenSymbol) {
      throw new Error('Create new route with static initRoot or addChild functions')
    }
  }
  render(
    outerFn?: RenderOuter,
    ctx?: {query: Record<string, string>; params: Record<string, string>},
  ): unknown {
    if (this.parent) {
      return this.parent?.render(() => this.renderFn(outerFn, ctx), ctx)
    }
    return this.renderFn(outerFn, ctx)
  }
  getFullPath(): string {
    const segments: string[] = []
    const collect = (node?: Routes): void => {
      if (!node || node.name === '/') return
      segments.push(encodeURIComponent(node.name))
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
    const child = new this.cnstr(Routes.hiddenSymbol, name, render, entry, this)
    this.children.push(child)
    return child
  }
  get cnstr() {
    return this.constructor as any
  }
}

export class Router extends Routes {
  private static unsub?: () => void
  static __resetLoopForTests() {
    _navigating = false
  }
  static start(): void {
    const log = (msg: string, ctx?: Record<string, any>) => {
      const dbg = this.debug
      if (!dbg) return
      const logger = typeof dbg === 'object' && dbg.logger ? dbg.logger : console.debug
      try {
        logger(`[router] ${msg}`, ctx)
      } catch {
        /* noop */
      }
    }
    log('start')
    const isFile = typeof window !== 'undefined' && window.location.protocol === 'file:'
    if (isFile) {
      const initial = (url.hash() as string).replace(/^#/, '')
      this.goto(initial, true)
      this.unsub = url.hash.subscribe((h: string) => this.goto(h.replace(/^#/, ''), true))
    } else {
      const initialPath = getPath(url.path()).path
      this.goto(initialPath, true)
      this.unsub = url.path.subscribe((path: string) => this.goto(getPath(path).path, true))
    }
    window.addEventListener('click', this._onClick)
  }
  static stop() {
    const dbg = this.debug
    const logger = typeof dbg === 'object' && dbg.logger ? dbg.logger : console.debug
    if (dbg) {
      try {
        logger('[router] stop')
      } catch {
        /* noop */
      }
    }
    this.unsub?.()
    window.removeEventListener('click', this._onClick)
  }
  static async back() {
    url.back()
  }
  static async replace(path: string) {
    const result = await this.navigate(path)
    if (result.ok) {
      url.navigate(setPath(path), {replace: true})
    }
    return result.ok
  }
  static async navigate(path: string, fromUrl = false): Promise<NavigateResult> {
    if (_navigating) return {ok: false, reason: 'same'}
    const newPath = getPath(path)
    const currentPath = getPath(url.path())

    const samePath = newPath.path === currentPath.path
    const sameQuery = JSON.stringify(newPath.query) === JSON.stringify(currentPath.query)
    if (samePath && sameQuery && !fromUrl) {
      return {ok: false, reason: 'same'}
    }
    const pre = await this.beforeEach?.({from: currentPath, to: newPath})
    if (pre === false) {
      this.onNavigate?.({status: 'blocked', from: currentPath.path, to: newPath.path})
      const dbg = this.debug
      const logger = typeof dbg === 'object' && dbg.logger ? dbg.logger : console.debug
      if (dbg) {
        try {
          logger('[router] blocked', {from: currentPath, to: newPath})
        } catch {
          /* noop */
        }
      }
      return {ok: false, reason: 'blocked'}
    }
    if (typeof pre === 'string') {
      this.onNavigate?.({status: 'redirected', from: currentPath.path, to: newPath.path, redirectedTo: pre})
      return this.navigate(pre)
    }
    let redirectedTo: string | undefined
    _navigating = true
    try {
      const result = await this.__goto(newPath)
      if (typeof result === 'object') {
        redirectedTo = result.redirectTo
        return {ok: false, reason: 'redirected', redirectedTo}
      }
      if (result !== false && !fromUrl) {
        url.push(setPath(path))
      }
      const ok = result !== false
      const dbg = this.debug
      const logger = typeof dbg === 'object' && dbg.logger ? dbg.logger : console.debug
      if (dbg) {
        try {
          logger('[router] navigate', {from: currentPath, to: newPath, ok})
        } catch {
          /* noop */
        }
      }
      return {ok}
    } finally {
      _navigating = false
      if (redirectedTo) {
        this.onNavigate?.({status: 'redirected', from: currentPath.path, to: newPath.path, redirectedTo})
        const dbg = this.debug
        const logger = typeof dbg === 'object' && dbg.logger ? dbg.logger : console.debug
        if (dbg) {
          try {
            logger('[router] redirected', {from: currentPath, to: newPath, redirectedTo})
          } catch {
            /* noop */
          }
        }
        // perform redirect after navigation flag cleared
        // do not preserve fromUrl flag for redirects
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.navigate(redirectedTo)
      }
    }
  }
  static async goto(path: string, fromUrl = false): Promise<boolean> {
    const result = await this.navigate(path, fromUrl)
    return result.ok
  }

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
      if (dbg) {
        const logger = typeof dbg === 'object' && dbg.logger ? dbg.logger : console.debug
        try {
          logger('[router] click', {href: nextHref})
        } catch {
          /* noop */
        }
      }
      this.goto(getPath(nextHref).path)
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
