import {expect} from '@esm-bundle/chai'
import {url, configure, parseQueryParams} from '../../../src/modules/url/url'
import {createTestSignalAdapter} from '../fixtures/adapter'

describe('url: SSR and environment handling', () => {
  beforeEach(() => {
    // Сбрасываем конфигурацию и полностью переинициализируем состояние
    ;(url.constructor as any)._signals = undefined

    // Полностью очищаем состояние между тестами
    try {
      // Очищаем все сигналы
      url.clearQuery()
      url.setHash('')
      url.path.set('')
      url.state.set(undefined)

      // Сбрасываем внутреннее состояние
      ;(url as any)._initialized = false
      ;(url as any)._disposed = false
      ;(url as any)._unsubPop = undefined
      ;(url as any)._unsubHash = undefined
    } catch {
      // Игнорируем ошибки очистки
    }
  })

  afterEach(() => {
    // Сбрасываем конфигурацию
    ;(url.constructor as any)._signals = undefined
  })

  it('parseQueryParams works with explicit query string', () => {
    const result = parseQueryParams('?a=1&b=2')
    expect(result).to.deep.equal({a: '1', b: '2'})
  })

  it('parseQueryParams handles undefined search string gracefully', () => {
    const result = parseQueryParams(undefined)
    // В браузерной среде parseQueryParams(undefined) использует window.location.search
    expect(typeof result).to.equal('object')
    expect(result).to.not.equal(null)
  })

  it('parseQueryParams handles malformed query strings', () => {
    // Различные malformed строки должны обрабатываться без ошибок
    expect(() => parseQueryParams('')).to.not.throw()
    expect(() => parseQueryParams('?')).to.not.throw()
    expect(() => parseQueryParams('?a')).to.not.throw()
    expect(() => parseQueryParams('?a=')).to.not.throw()
    expect(() => parseQueryParams('?=a')).to.not.throw()
    expect(() => parseQueryParams('?a=b=c')).to.not.throw()
  })

  it('all url methods are callable in browser environment', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Все методы должны быть доступны и callable в браузерной среде
    expect(() => url.path()).to.not.throw()
    expect(() => url.query()).to.not.throw()
    expect(() => url.hash()).to.not.throw()
    expect(() => url.state()).to.not.throw()
    expect(() => url.push('/test')).to.not.throw()
    expect(() => url.replaceState('/test')).to.not.throw()
    expect(() => url.navigate('/test')).to.not.throw()
    expect(() => url.go(1)).to.not.throw()
    expect(() => url.back()).to.not.throw()
    expect(() => url.setHash('#test')).to.not.throw()
    expect(() => url.clearHash()).to.not.throw()
    expect(() => url.addQueryParam('test', 'value')).to.not.throw()
    expect(() => url.deleteQueryParam('test')).to.not.throw()
    expect(() => url.setQuery({test: 'value'})).to.not.throw()
    expect(() => url.updateQuery(() => ({test: 'updated'}))).to.not.throw()
    expect(() => url.clearQuery()).to.not.throw()
    expect(() => url.dispose()).to.not.throw()
  })

  it('subscriptions work correctly in browser environment', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    let pathValue = ''
    let queryValue: any = {}

    // Создание подписок должно работать
    const unsubPath = url.onPathChange((path) => pathValue = path)
    const unsubQuery = url.onQueryChange((query) => queryValue = {...query})

    expect(typeof unsubPath).to.equal('function')
    expect(typeof unsubQuery).to.equal('function')

    // Изменение значений должно вызывать подписки
    url.path.set('/test-path')
    url.query.set({test: 'query'})

    expect(pathValue).to.equal('/test-path')
    expect(queryValue).to.deep.equal({test: 'query'})

    // Отписка должна работать
    unsubPath()
    unsubQuery()
  })

  it('dispose works safely in browser environment', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Dispose должен работать без ошибок
    expect(() => url.dispose()).to.not.throw()
    expect((url as any)._disposed).to.equal(true)

    // Повторный dispose безопасен
    expect(() => url.dispose()).to.not.throw()
  })

  it('environment has required browser APIs available', () => {
    // Проверяем, что в браузерной среде доступны необходимые API
    expect(typeof window).to.not.equal('undefined')
    expect(typeof window.location).to.not.equal('undefined')
    expect(typeof window.history).to.not.equal('undefined')
    expect(typeof window.history.pushState).to.equal('function')
    expect(typeof window.history.replaceState).to.equal('function')
  })

  it('parseQueryParams can parse current browser location', () => {
    // parseQueryParams без аргументов должен работать с текущей location
    expect(() => parseQueryParams()).to.not.throw()
    const result = parseQueryParams()
    expect(typeof result).to.equal('object')
    expect(result).to.not.equal(null)
  })

  it('url methods handle browser location properties', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Методы должны корректно работать с реальными свойствами браузера
    expect(typeof url.path()).to.equal('string')
    expect(typeof url.hash()).to.equal('string')
    expect(typeof url.query()).to.equal('object')
    expect(Array.isArray(url.query())).to.equal(false)
  })

  it('navigation methods work with browser history API', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Методы навигации должны работать с реальным history API
    expect(() => url.push('/test')).to.not.throw()
    expect(() => url.replaceState('/test')).to.not.throw()
    expect(() => url.navigate('/test')).to.not.throw()
    expect(() => url.go(1)).to.not.throw()
    expect(() => url.back()).to.not.throw()
  })

  it('handles browser refresh and location changes gracefully', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // После "обновления страницы" все должно продолжать работать
    expect(() => {
      url.path.set('/refreshed')
      url.query.set({refreshed: 'true'})
      url.hash.set('#refreshed')
    }).to.not.throw()

    expect(url.path()).to.equal('/refreshed')
    expect(url.query()).to.deep.equal({refreshed: 'true'})
    expect(url.hash()).to.equal('#refreshed')
  })

  it('works correctly with browser security restrictions', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Тестируем работу в рамках ограничений браузерной безопасности
    expect(() => {
      // Попытка установить значения, которые могут быть ограничены
      url.setQuery({redirect: 'http://external.com'})
      url.setHash('#anchor')
    }).to.not.throw()

    expect(url.query()).to.deep.equal({redirect: 'http://external.com'})
    expect(url.hash()).to.equal('#anchor')
  })

  it('handles rapid successive operations correctly', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Быстрые последовательные операции
    expect(() => {
      url.setQuery({step: '1'})
      url.updateQuery((q) => ({...q, step: '2'}))
      url.addQueryParam('rapid', 'test')
      url.setHash('#rapid')
      url.push('/rapid')
    }).to.not.throw()

    // Проверяем, что основные операции завершились без ошибок
    expect(typeof url.query()).to.equal('object')
    expect(typeof url.hash()).to.equal('string')
    expect(typeof url.path()).to.equal('string')
  })

  it('environment detection works in browser context', () => {
    // В браузерной среде window всегда должен быть доступен
    const hasWindow = typeof globalThis !== 'undefined' && !!(globalThis as any).window
    expect(hasWindow).to.equal(true)

    // Проверка типа window
    expect(typeof window).to.equal('object')
    expect(window).to.not.equal(null)
  })
})