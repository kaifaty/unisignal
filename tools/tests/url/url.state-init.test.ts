import {expect} from '@esm-bundle/chai'
import {url, configure, StateURL} from '../../../src/modules/url/url'
import {createTestSignalAdapter} from '../fixtures/adapter'

describe('url: state initialization', () => {
  let originalEnv: any

  beforeEach(() => {
    // Сохраняем оригинальное окружение
    originalEnv = {...StateURL._env}

    // Сбрасываем конфигурацию перед каждым тестом
    ;(StateURL as any)._signals = undefined
  })

  afterEach(() => {
    // Восстанавливаем оригинальное окружение
    StateURL.configureEnv(originalEnv)

    // Сбрасываем конфигурацию
    ;(StateURL as any)._signals = undefined
  })

  it('configure() sets the adapter correctly', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)
    expect((StateURL as any)._signals).to.equal(adapter)
  })

  it('throws error when accessing signals before configuration', () => {
    // Сбрасываем конфигурацию
    ;(StateURL as any)._signals = undefined

    expect(() => url.query).to.throw('URL signals adapter is not configured')
    expect(() => url.path).to.throw('URL signals adapter is not configured')
    expect(() => url.hash).to.throw('URL signals adapter is not configured')
    expect(() => url.state).to.throw('URL signals adapter is not configured')
  })

  it('isInitialized returns false before initialization', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    const urlInstance = new StateURL()
    expect(urlInstance.isInitialized).to.equal(false)
  })

  it('ensureInitialized() initializes the instance', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    const urlInstance = new StateURL()
    urlInstance.ensureInitialized()
    expect(urlInstance.isInitialized).to.equal(true)
  })

  it('accessing signals triggers initialization', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    const urlInstance = new StateURL()
    expect(urlInstance.isInitialized).to.equal(false)

    // Доступ к сигналу должен вызвать инициализацию
    const _query = urlInstance.query
    expect(urlInstance.isInitialized).to.equal(true)
  })

  it('double initialization does not cause issues', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    const urlInstance = new StateURL()

    // Первая инициализация
    urlInstance.ensureInitialized()
    expect(urlInstance.isInitialized).to.equal(true)

    // Вторая инициализация не должна вызывать проблем
    urlInstance.ensureInitialized()
    expect(urlInstance.isInitialized).to.equal(true)
  })

  it('initializes with current browser location values', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    const urlInstance = new StateURL()

    // Инициализация должна прочитать значения из текущей location браузера
    urlInstance.ensureInitialized()

    expect(urlInstance.isInitialized).to.equal(true)
    expect(urlInstance.path()).to.be.a('string')
    expect(urlInstance.hash()).to.be.a('string')
    expect(urlInstance.query()).to.be.an('object')
    expect(urlInstance.state()).to.equal(undefined)
  })

  it('handles browser environment gracefully', () => {
    // В браузерной среде window всегда доступен, проверяем базовую функциональность
    const adapter = createTestSignalAdapter()
    configure(adapter)

    const urlInstance = new StateURL()
    urlInstance.ensureInitialized()

    // Проверяем, что базовые сигналы созданы
    expect(urlInstance.path()).to.be.a('string')
    expect(urlInstance.hash()).to.be.a('string')
    expect(urlInstance.query()).to.be.an('object')
  })

  it('attaches event listeners in browser environment', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    const urlInstance = new StateURL()
    urlInstance.ensureInitialized()

    // В браузерной среде слушатели должны быть созданы
    expect((urlInstance as any)._unsubPop).to.be.a('function')
    expect((urlInstance as any)._unsubHash).to.be.a('function')
  })

  it('configureEnv allows overriding environment getters', () => {
    const customEnv = {
      window: {location: {pathname: '/custom'}},
      location: {pathname: '/custom'},
      history: {}
    }

    StateURL.configureEnv(customEnv)

    expect(StateURL._env.window).to.equal(customEnv.window)
    expect(StateURL._env.location).to.equal(customEnv.location)
    expect(StateURL._env.history).to.equal(customEnv.history)
  })
})
