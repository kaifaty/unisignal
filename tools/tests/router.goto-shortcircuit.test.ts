/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from '@esm-bundle/chai'
import {Router} from '../../src/modules/router/router'
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

describe('router: goto short-circuit', () => {
  it('does not re-navigate when path and query are the same', async () => {
    const adapter = createTestSignalAdapter()
    Router.configure(adapter, {withUrl: true})
    configureUrl(adapter)

    // fake env
    const historyRecords: any[] = []
    const fakeLocation: any = {pathname: '/a', hash: '', origin: 'http://x', protocol: 'http:'}
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

    // initial goto
    await Router.goto('/a?x=1', true)
    const before = historyRecords.length
    // same path+query should short-circuit
    const result = await Router.goto('/a?x=1')
    const after = historyRecords.length
    expect(result).to.equal(false)
    expect(after - before).to.equal(0)
  })
})
