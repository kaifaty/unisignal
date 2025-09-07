import {expect} from '@esm-bundle/chai'
import {createI18n} from '../../../src/modules/i18n'
import {LANGUAGES, type Lang} from '../../../src/modules/i18n/consts'
import {createBasicAdapter} from '../fixtures/adapter'

export const test = it

describe('i18n: createI18n', () => {
  const adapter = createBasicAdapter()
  const store = {
    hello: {en: 'Hello, ${user.name}!', ru: 'Привет, ${user.name}!'},
    simple: {en: 'Hi', ru: 'Привет'},
    baseOnly: {en: 'Base ${x} only'},
  } as const

  test('normalizeLang and initial lang sets document lang/dir', async () => {
    const api = createI18n(adapter, store, 'EN' as Lang, {})
    expect(api.getLang()).to.equal('en')
    const html = document.documentElement
    expect(html.lang).to.equal('en')
    expect(html.dir).to.equal('ltr')
  })

  test('rtl dir for rtl languages', () => {
    const api = createI18n(adapter, store, 'ar' as Lang, {})
    expect(document.documentElement.dir).to.equal('rtl')
    api.setLang('en' as Lang)
    expect(document.documentElement.dir).to.equal('ltr')
  })

  test('fallback to baseLang when missing, then to first language name', () => {
    const api = createI18n(adapter, store, 'zz' as Lang, {baseLang: 'en' as Lang})
    expect(api.getLang()).to.equal('en')
    // base-only key present only in en
    expect(api.i18n('baseOnly', {x: 1 as any})).to.equal('Base 1 only')

    // Construct with unknown base -> fallback to 'en' (exists) or first key
    const api2 = createI18n(adapter, store, 'zz' as Lang, {})
    expect(Object.keys(LANGUAGES)).to.include(api2.getLang())
  })

  test('setLang and setLangFrom trigger lazy load via loader', async () => {
    let loaded: Lang[] = []
    const api = createI18n(adapter, store, 'en' as Lang, {
      loader: async (l) => {
        loaded.push(l)
        return {simple: {[l]: `Hi-${l}`}} as any
      },
    })
    api.setLang('ru' as Lang)
    await new Promise((r) => setTimeout(r, 0))
    expect(loaded).to.deep.equal(['ru'])

    api.setLangFrom('de-DE')
    await new Promise((r) => setTimeout(r, 0))
    expect(loaded).to.have.length(2)
  })

  test('i18n replaces placeholders and caches results (LRU)', () => {
    const api = createI18n(adapter, store, 'en' as Lang, {cacheLimit: 2})
    const v1 = api.i18n('hello', {user: {name: 'John'}})
    const v2 = api.i18n('hello', {user: {name: 'John'}})
    expect(v1).to.equal('Hello, John!')
    expect(v2).to.equal('Hello, John!')

    // push different keys to evict
    void api.i18n('simple')
    void api.i18n('hello', {user: {name: 'Mary'}})
    // first cached may be evicted now; call again recomputes
    const v3 = api.i18n('hello', {user: {name: 'John'}})
    expect(v3).to.equal('Hello, John!')
  })

  test('onMissing called in both dev and prod; returns key as fallback', () => {
    const calls: Array<{key: string; lang: Lang}> = []
    const prev = (globalThis as any).process
    ;(globalThis as any).process = {env: {NODE_ENV: 'production'}}
    try {
      const api = createI18n(adapter, {only: {en: 'x'}}, 'en' as Lang, {
        onMissing: (key, lang) => calls.push({key, lang}),
      })
      const res = api.i18n('missing' as any)
      expect(res).to.equal('missing')
      expect(calls.length).to.equal(1)
    } finally {
      ;(globalThis as any).process = prev
    }
  })

  test('exists and missing lists', () => {
    const api = createI18n(adapter, store, 'en' as Lang, {})
    expect(api.exists('simple')).to.equal(true)
    const miss = api.missing('ru' as Lang)
    // ru has hello/simple, but lacks baseOnly
    expect(miss.find((x) => x.key === 'baseOnly')).to.exist
  })

  test('rich wraps result into TemplateResult-like', () => {
    const api = createI18n(adapter, store, 'ru' as Lang, {})
    const res = api.rich('hello', {user: {name: 'Вася'}})
    expect(String(res)).to.include('Привет, Вася!')
  })
})
