import {expect} from '@esm-bundle/chai'
import {url, configure} from '../../../src/modules/url/url'
import {createTestSignalAdapter} from '../fixtures/adapter'

describe('url: events (popstate/hashchange)', () => {
  beforeEach(() => {
    // Чистим слушатели, затем сбрасываем состояние и location
    try { url.dispose() } catch {}
    // Снова разрешаем работу после dispose в рамках теста
    ;(url as any)._disposed = false
    ;(url as any)._initialized = false
    ;(url.constructor as any)._signals = undefined
    window.history.replaceState({}, '', '/')
    window.location.hash = ''
  })

  afterEach(() => {
    // Чистим слушатели и сбрасываем конфигурацию
    try { url.dispose() } catch {}
    ;(url.constructor as any)._signals = undefined
  })

  it('reacts to popstate by reading current location (path/query/hash/state)', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Инициализируем доступом к свойствам
    const _path = url.path

    // Меняем URL через history и диспатчим popstate с состоянием
    const state = {from: 'event'}
    window.history.pushState({}, '', '/event-path?x=1#h')
    window.dispatchEvent(new PopStateEvent('popstate', {state}))

    expect(url.path()).to.equal('/event-path')
    expect(url.query()).to.deep.equal({x: '1'})
    expect(url.hash()).to.equal('#h')
    expect(url.state()).to.deep.equal(state)
  })

  it('onPathChange subscription creates unsubscribe function', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Инициализируем url
    const _path = url.path

    let callCount = 0
    const unsubscribe = url.onPathChange(() => callCount++)

    expect(unsubscribe).to.be.a('function')
    expect(callCount).to.equal(0) // Не должен вызваться сразу

    // Проверяем, что отписка работает
    unsubscribe()
  })

  it('onQueryChange subscription creates unsubscribe function', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Инициализируем url
    const _query = url.query

    let callCount = 0
    const unsubscribe = url.onQueryChange(() => callCount++)

    expect(unsubscribe).to.be.a('function')
    expect(callCount).to.equal(0) // Не должен вызваться сразу

    // Проверяем, что отписка работает
    unsubscribe()
  })

  it('after dispose, popstate/hashchange no longer update signals', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Инициализация
    const _path = url.path

    // Устанавливаем начальные значения через событие
    window.history.pushState({}, '', '/before?z=1#a')
    window.dispatchEvent(new PopStateEvent('popstate', {state: {s: 1}}))
    expect(url.path()).to.equal('/before')
    expect(url.query()).to.deep.equal({z: '1'})
    expect(url.hash()).to.equal('#a')

    // Dispose
    url.dispose()

    // Меняем location и диспатчим события — значения не должны измениться
    window.history.pushState({}, '', '/after?z=2#b')
    window.dispatchEvent(new PopStateEvent('popstate', {state: {s: 2}}))
    window.location.hash = '#c'
    window.dispatchEvent(new HashChangeEvent('hashchange'))

    expect(url.path()).to.equal('/before')
    expect(url.query()).to.deep.equal({z: '1'})
    expect(url.hash()).to.equal('#a')

    // Повторный dispose безопасен
    expect(() => url.dispose()).to.not.throw()
  })

  it('subscriptions work with signal changes', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Инициализируем url
    const _path = url.path
    const _query = url.query

    let pathValue: string = ''
    let queryValue: any = {}

    const unsubscribePath = url.onPathChange((path) => {
      pathValue = path
    })

    const unsubscribeQuery = url.onQueryChange((query) => {
      queryValue = {...query}
    })

    // Изменяем сигналы напрямую (имитируем изменение через события)
    url.path.set('/test-path')
    url.query.set({test: 'value'})

    // Проверяем, что подписки сработали
    expect(pathValue).to.equal('/test-path')
    expect(queryValue).to.deep.equal({test: 'value'})

    unsubscribePath()
    unsubscribeQuery()
  })

  it('multiple subscriptions can be managed independently', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Инициализируем url
    const _path = url.path
    const _query = url.query

    let pathCalls = 0
    let queryCalls = 0

    const unsubPath1 = url.onPathChange(() => pathCalls++)
    const unsubPath2 = url.onPathChange(() => pathCalls++)
    const unsubQuery1 = url.onQueryChange(() => queryCalls++)

    // Изменяем path
    url.path.set('/new-path')
    expect(pathCalls).to.equal(2) // Оба подписчика path должны сработать

    // Изменяем query
    url.query.set({key: 'value'})
    expect(queryCalls).to.equal(1)

    // Отписываемся от одного path подписчика
    unsubPath1()

    url.path.set('/another-path')
    expect(pathCalls).to.equal(3) // Только один подписчик должен сработать

    unsubPath2()
    unsubQuery1()
  })

  it('reacts to real popstate/hashchange events by updating signals', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Инициализируем url
    const _path = url.path
    const _query = url.query

    // Меняем URL, диспатчим popstate — оба подписчика должны отработать
    window.history.pushState({}, '', '/changed?a=1')
    window.dispatchEvent(new PopStateEvent('popstate', {state: {e: 1}}))

    expect(url.path()).to.equal('/changed')
    expect(url.query()).to.deep.equal({a: '1'})

    // Меняем hash и диспатчим hashchange
    window.location.hash = '#anchor'
    window.dispatchEvent(new HashChangeEvent('hashchange'))
    expect(url.hash()).to.equal('#anchor')
  })
})
