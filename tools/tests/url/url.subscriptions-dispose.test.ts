import {expect} from '@esm-bundle/chai'
import {url, configure} from '../../../src/modules/url/url'
import {createTestSignalAdapter} from '../fixtures/adapter'

describe('url: subscriptions and dispose', () => {
  beforeEach(() => {
    // Сбрасываем конфигурацию
    ;(url.constructor as any)._signals = undefined
  })

  afterEach(() => {
    // Сбрасываем конфигурацию
    ;(url.constructor as any)._signals = undefined
  })

  it('dispose prevents memory leaks from subscriptions', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Создаем несколько подписок
    const unsub1 = url.onPathChange(() => {})
    const unsub2 = url.onQueryChange(() => {})
    const unsub3 = url.onPathChange(() => {})

    // Проверяем, что подписки созданы
    expect(typeof unsub1).to.equal('function')
    expect(typeof unsub2).to.equal('function')
    expect(typeof unsub3).to.equal('function')

    // Вызываем dispose
    url.dispose()

    // Проверяем, что dispose выполнен
    expect((url as any)._disposed).to.equal(true)

    // Повторный dispose безопасен
    expect(() => url.dispose()).to.not.throw()
  })

  it('dispose after subscriptions prevents event listener leaks', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Создаем подписки
    const unsub1 = url.onPathChange(() => {})
    const unsub2 = url.onQueryChange(() => {})

    // Вызываем dispose - должен очистить слушатели событий
    url.dispose()

    expect((url as any)._disposed).to.equal(true)

    // Отписываемся от оставшихся подписок
    unsub1()
    unsub2()
  })

  it('unsubscribe functions work correctly after dispose', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    let callCount = 0
    const unsubscribe = url.onPathChange(() => callCount++)

    // Изменяем значение
    url.path.set('/test')
    expect(callCount).to.equal(1)

    // Вызываем dispose
    url.dispose()

    // Пытаемся отписаться - должно быть безопасно
    expect(() => unsubscribe()).to.not.throw()

    // Изменяем значение после отписки
    url.path.set('/after-unsubscribe')
    expect(callCount).to.equal(1) // Не должно увеличиться
  })

  it('dispose handles edge cases gracefully', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Dispose без инициализации
    expect(() => url.dispose()).to.not.throw()

    // Dispose без подписок
    expect(() => url.dispose()).to.not.throw()

    // Многократный dispose
    url.dispose()
    url.dispose()
    url.dispose()
    expect(() => url.dispose()).to.not.throw()
  })

  it('dispose handles subscriptions created after dispose', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Сначала dispose
    url.dispose()

    let callCount = 0

    // Создаем подписку после dispose
    const unsubscribe = url.onPathChange(() => callCount++)

    // Изменяем значение - подписка должна сработать (сигналы работают независимо от dispose)
    url.path.set('/after-dispose')

    expect(callCount).to.equal(1)

    // Отписка должна работать
    unsubscribe()
  })

  it('dispose preserves current signal values', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Устанавливаем значения
    url.path.set('/test-path')
    url.query.set({test: 'value'})
    url.hash.set('#test-hash')

    // Проверяем значения до dispose
    expect(url.path()).to.equal('/test-path')
    expect(url.query()).to.deep.equal({test: 'value'})
    expect(url.hash()).to.equal('#test-hash')

    // Dispose
    url.dispose()

    // Значения должны сохраниться
    expect(url.path()).to.equal('/test-path')
    expect(url.query()).to.deep.equal({test: 'value'})
    expect(url.hash()).to.equal('#test-hash')
  })

  it('dispose is idempotent - multiple calls have no effect', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Многократные вызовы dispose
    for (let i = 0; i < 5; i++) {
      expect(() => url.dispose()).to.not.throw()
      expect((url as any)._disposed).to.equal(true)
    }
  })

  it('dispose handles subscriptions created and removed dynamically', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    const subscriptions: (() => void)[] = []

    // Создаем и удаляем подписки динамически
    for (let i = 0; i < 3; i++) {
      subscriptions.push(url.onPathChange(() => {}))
    }

    // Удаляем некоторые подписки
    subscriptions[0]()
    subscriptions[2]()

    // Dispose должен обработать оставшиеся подписки корректно
    expect(() => url.dispose()).to.not.throw()
    expect((url as any)._disposed).to.equal(true)
  })

  it('subscriptions and dispose work together in complex scenarios', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    const results: string[] = []

    // Создаем несколько типов подписок
    const unsubPath1 = url.onPathChange((path) => results.push(`path1: ${path}`))
    const unsubPath2 = url.onPathChange((path) => results.push(`path2: ${path}`))
    const unsubQuery = url.onQueryChange((query) => results.push(`query: ${JSON.stringify(query)}`))

    // Выполняем различные операции
    url.path.set('/step1')
    expect(results).to.deep.equal(['path1: /step1', 'path2: /step1'])

    url.query.set({step: '1'})
    expect(results).to.deep.equal(['path1: /step1', 'path2: /step1', 'query: {"step":"1"}'])

    // Удаляем одну подписку
    unsubPath1()

    url.path.set('/step2')
    expect(results).to.deep.equal(['path1: /step1', 'path2: /step1', 'query: {"step":"1"}', 'path2: /step2'])

    // Dispose - очищает слушатели событий, но подписки сигналов продолжают работать
    url.dispose()

    // Дальнейшие изменения продолжают вызывать подписки сигналов
    url.path.set('/step3')
    url.query.set({step: '3'})

    expect(results).to.deep.equal(['path1: /step1', 'path2: /step1', 'query: {"step":"1"}', 'path2: /step2', 'path2: /step3', 'query: {"step":"3"}'])

    // Очистка оставшихся подписок
    unsubPath2()
    unsubQuery()
  })
})
