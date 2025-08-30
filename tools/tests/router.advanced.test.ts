/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from '@esm-bundle/chai'
import {Router, createRouter} from '../../src/modules/router/router'
import {configure as configureUrl, url} from '../../src/modules/url'
import type {SignalAdapter, SignalWritable} from '../../src/modules/adapter/types'

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
          listeners.forEach((l) => l(value))
        },
        peek(): T {
          return value
        },
        subscribe(listener: (v: T) => void) {
          listeners.add(listener)
          return () => listeners.delete(listener)
        },
      }
    },
    computed<T>(_fn: () => T) {
      throw new Error('not needed')
    },
  }
}

describe('router: advanced', () => {
  beforeEach(() => {
    Router.__resetLoopForTests()
  })

  it('matches dynamic params and passes them to render', async () => {
    const adapter = createTestSignalAdapter()
    Router.configure(adapter, {withUrl: true, base: '/app'})
    configureUrl(adapter)

    const historyRecords: any[] = []
    const fakeLocation: any = {pathname: '/app', hash: '', origin: 'http://x', protocol: 'http:'}
    const fakeHistory: any = {
      pushState: (_s: any, _t: string, p: string) => {
        historyRecords.push(['push', p])
        fakeLocation.pathname = String(p).split('?')[0]
      },
      replaceState: (_s: any, _t: string, p: string) => {
        historyRecords.push(['replace', p])
        fakeLocation.pathname = String(p).split('?')[0]
      },
      go() {},
      back() {},
    }
    ;(url as any).constructor.configureEnv({
      get window() {
        return (globalThis as any).window
      },
      get location() {
        return fakeLocation as any
      },
      get history() {
        return fakeHistory as any
      },
    })

    const host = document.createElement('div')
    document.body.appendChild(host)

    const root = Router.initRoot({
      container: host,
      render: (outer) => {
        outer?.()
        return 'root'
      },
    })
    const users = root.addChild({
      name: 'users',
      render: (outer) => {
        outer?.()
        return 'users'
      },
    })
    let capturedId: string | undefined
    users.addChild({
      name: ':id',
      render: (_outer, ctx) => {
        capturedId = ctx?.params.id
        return 'user'
      },
    })

    await Router.goto('/users/42')
    expect(capturedId).to.equal('42')
    expect(historyRecords[0][0]).to.equal('push')
    const pushed = String(historyRecords[0][1])
    expect(/^(\/app)?\/.+/.test(pushed)).to.equal(true)
    expect(pushed.includes('/users/42')).to.equal(true)
    Router.stop()
  })

  it('redirects from entry via string', async () => {
    const adapter = createTestSignalAdapter()
    Router.configure(adapter, {withUrl: true})
    configureUrl(adapter)

    const fakeLocation: any = {pathname: '/', hash: '', origin: 'http://x', protocol: 'http:'}
    const fakeHistory: any = {
      pushState: (_s: any, _t: string, p: string) => {
        fakeLocation.pathname = String(p).split('?')[0]
      },
      replaceState: (_s: any, _t: string, p: string) => {
        fakeLocation.pathname = String(p).split('?')[0]
      },
      go() {},
      back() {},
    }
    ;(url as any).constructor.configureEnv({
      get window() {
        return (globalThis as any).window
      },
      get location() {
        return fakeLocation as any
      },
      get history() {
        return fakeHistory as any
      },
    })

    const host = document.createElement('div')
    document.body.appendChild(host)

    const root = Router.initRoot({container: host, render: () => 'root'})
    root.addChild({name: 'signin', render: () => 'signin'})
    root.addChild({
      name: 'private',
      render: () => 'private',
      entry: () => '/signin',
    })

    const result = await (Router as any).navigate('/private')
    expect(result.ok).to.equal(false)
    expect(result.reason).to.equal('redirected')
    expect(result.redirectedTo).to.equal('/signin')
    Router.stop()
  })
})
