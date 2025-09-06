import {expect} from '@esm-bundle/chai'
import {url, configure} from '../../../src/modules/url/url'
import {createTestSignalAdapter} from '../fixtures/adapter'

describe('url: navigation and history', () => {
  beforeEach(() => {
    // Сбрасываем конфигурацию
    ;(url.constructor as any)._signals = undefined
  })

  afterEach(() => {
    // Сбрасываем конфигурацию
    ;(url.constructor as any)._signals = undefined
  })

  it('push method exists and is callable', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    expect(url.push).to.be.a('function')
    expect(() => url.push('/test')).to.not.throw()
  })

  it('replaceState method exists and is callable', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    expect(url.replaceState).to.be.a('function')
    expect(() => url.replaceState('/test')).to.not.throw()
  })

  it('navigate method exists and is callable', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    expect(url.navigate).to.be.a('function')
    expect(() => url.navigate('/test')).to.not.throw()
  })

  it('go method exists and is callable', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    expect(url.go).to.be.a('function')
    expect(() => url.go()).to.not.throw()
    expect(() => url.go(1)).to.not.throw()
    expect(() => url.go(-1)).to.not.throw()
  })

  it('back method exists and is callable', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    expect(url.back).to.be.a('function')
    expect(() => url.back()).to.not.throw()
  })

  it('push updates state correctly', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Инициализируем url
    const _path = url.path

    const testState = {page: 'home', user: '123'}
    url.push('/home', testState)

    expect(url.state()).to.deep.equal(testState)
  })

  it('push updates path correctly', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Инициализируем url
    const _path = url.path

    url.push('/new-path')

    expect(url.path()).to.equal('/new-path')
  })

  it('replaceState updates state correctly', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Инициализируем url
    const _path = url.path

    const testState = {modal: 'open', id: '456'}
    url.replaceState('/current', testState)

    expect(url.state()).to.deep.equal(testState)
  })

  it('replaceState updates path correctly', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Инициализируем url
    const _path = url.path

    url.replaceState('/updated-path')

    expect(url.path()).to.equal('/updated-path')
  })

  it('navigate with replace=false calls push', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Инициализируем url
    const _path = url.path

    const testState = {nav: 'push'}
    url.navigate('/push-path', {replace: false, state: testState})

    expect(url.path()).to.equal('/push-path')
    expect(url.state()).to.deep.equal(testState)
  })

  it('navigate with replace=true calls replaceState', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Инициализируем url
    const _path = url.path

    const testState = {nav: 'replace'}
    url.navigate('/replace-path', {replace: true, state: testState})

    expect(url.path()).to.equal('/replace-path')
    expect(url.state()).to.deep.equal(testState)
  })

  it('navigate without replace parameter defaults to push', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Инициализируем url
    const _path = url.path

    url.navigate('/default-path')

    expect(url.path()).to.equal('/default-path')
  })

  it('push updates path correctly', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Инициализируем url
    const _path = url.path

    url.push('/new-page')

    expect(url.path()).to.equal('/new-page')
  })

  it('replaceState updates path correctly', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Инициализируем url
    const _path = url.path

    url.replaceState('/updated-page')

    expect(url.path()).to.equal('/updated-page')
  })

  it('push handles complex paths with query and hash', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Инициализируем url
    const _path = url.path

    url.push('/products?page=1&category=electronics#featured')

    expect(url.path()).to.equal('/products')
    expect(url.query()).to.deep.equal({page: '1', category: 'electronics'})
    expect(url.hash()).to.equal('#featured')
  })

  it('replaceState handles complex paths with query and hash', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Инициализируем url
    const _path = url.path

    url.replaceState('/search?q=laptop&sort=price#results')

    expect(url.path()).to.equal('/search')
    expect(url.query()).to.deep.equal({q: 'laptop', sort: 'price'})
    expect(url.hash()).to.equal('#results')
  })

  it('navigate handles complex paths with options', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Инициализируем url
    const _path = url.path

    const navState = {from: 'navigate'}
    url.navigate('/complex?a=1&b=2#anchor', {replace: true, state: navState})

    expect(url.path()).to.equal('/complex')
    expect(url.query()).to.deep.equal({a: '1', b: '2'})
    expect(url.hash()).to.equal('#anchor')
    expect(url.state()).to.deep.equal(navState)
  })

  it('push handles paths without leading slash', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Инициализируем url
    const _path = url.path

    url.push('relative-path')

    expect(url.path()).to.equal('/relative-path')
  })

  it('replaceState handles paths without leading slash', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Инициализируем url
    const _path = url.path

    url.replaceState('another-relative')

    expect(url.path()).to.equal('/another-relative')
  })

  it('navigation methods handle empty state parameter', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Инициализируем url
    const _path = url.path

    url.push('/no-state')
    expect(url.state()).to.equal(undefined)

    url.replaceState('/also-no-state', undefined)
    expect(url.state()).to.equal(undefined)
  })

  it('navigation methods handle null state parameter', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Инициализируем url
    const _path = url.path

    url.push('/null-state', null)
    expect(url.state()).to.equal(null)

    url.replaceState('/also-null', null)
    expect(url.state()).to.equal(null)
  })

  it('multiple navigation calls work correctly', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Инициализируем url
    const _path = url.path

    // Последовательные навигации
    url.push('/first')
    expect(url.path()).to.equal('/first')

    url.push('/second')
    expect(url.path()).to.equal('/second')

    url.replaceState('/third')
    expect(url.path()).to.equal('/third')
  })

  it('navigation preserves state across multiple calls', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Инициализируем url
    const _path = url.path

    const state1 = {step: 1}
    const state2 = {step: 2}

    url.push('/step1', state1)
    expect(url.state()).to.deep.equal(state1)

    url.push('/step2', state2)
    expect(url.state()).to.deep.equal(state2)

    url.replaceState('/step3')
    expect(url.state()).to.equal(undefined)
  })

  it('go and back methods handle browser environment gracefully', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Эти методы должны выполняться без ошибок в браузерной среде
    expect(() => url.go()).to.not.throw()
    expect(() => url.go(1)).to.not.throw()
    expect(() => url.go(-1)).to.not.throw()
    expect(() => url.back()).to.not.throw()
  })

  it('navigation methods handle special characters in paths', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Инициализируем url
    const _path = url.path

    const specialPath = '/path with spaces & symbols'
    url.push(specialPath)

    expect(url.path()).to.equal('/path%20with%20spaces%20&%20symbols')
  })

  it('navigation methods handle unicode characters in paths', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Инициализируем url
    const _path = url.path

    const unicodePath = '/тест-путь/навигация'
    url.push(unicodePath)

    expect(url.path()).to.equal('/%D1%82%D0%B5%D1%81%D1%82-%D0%BF%D1%83%D1%82%D1%8C/%D0%BD%D0%B0%D0%B2%D0%B8%D0%B3%D0%B0%D1%86%D0%B8%D1%8F')
  })
})
