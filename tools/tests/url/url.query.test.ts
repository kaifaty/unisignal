import {expect} from '@esm-bundle/chai'
import {url, configure} from '../../../src/modules/url/url'
import {createTestSignalAdapter} from '../fixtures/adapter'

describe('url: query parameter manipulations', () => {
  beforeEach(() => {
    // Сбрасываем конфигурацию
    ;(url.constructor as any)._signals = undefined
  })

  afterEach(() => {
    // Сбрасываем конфигурацию
    ;(url.constructor as any)._signals = undefined
  })

  it('addQueryParam method exists and is callable', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    expect(url.addQueryParam).to.be.a('function')
    expect(() => url.addQueryParam('test', 'value')).to.not.throw()
  })

  it('deleteQueryParam method exists and is callable', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    expect(url.deleteQueryParam).to.be.a('function')
    expect(() => url.deleteQueryParam('test')).to.not.throw()
  })

  it('setQuery method exists and is callable', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    expect(url.setQuery).to.be.a('function')
    expect(() => url.setQuery({test: 'value'})).to.not.throw()
  })

  it('updateQuery method exists and is callable', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    expect(url.updateQuery).to.be.a('function')
    expect(() => url.updateQuery(() => ({}))).to.not.throw()
  })

  it('clearQuery method exists and is callable', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    expect(url.clearQuery).to.be.a('function')
    expect(() => url.clearQuery()).to.not.throw()
  })

  it('query manipulation methods accept replace parameter', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Все методы должны принимать replace параметр без ошибок
    expect(() => url.addQueryParam('test', 'value', true)).to.not.throw()
    expect(() => url.deleteQueryParam('test', true)).to.not.throw()
    expect(() => url.setQuery({}, {replace: true})).to.not.throw()
    expect(() => url.updateQuery(() => ({}), {replace: true})).to.not.throw()
    expect(() => url.clearQuery({replace: true})).to.not.throw()
  })

  it('setQuery replaces entire query object', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Устанавливаем начальный query
    url.query.set({old: 'values'})

    // Полностью заменяем query
    url.setQuery({new: 'query', completely: 'different'})

    expect(url.query()).to.deep.equal({new: 'query', completely: 'different'})
  })

  it('setQuery with empty object clears query', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Устанавливаем начальный query
    url.query.set({param: 'value'})

    // Очищаем query
    url.setQuery({})

    expect(url.query()).to.deep.equal({})
  })

  it('updateQuery merges changes using updater function', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Устанавливаем начальный query
    url.query.set({keep: 'value', modify: 'old'})

    // Обновляем через функцию
    url.updateQuery((current) => ({
      ...current,
      modify: 'new',
      added: 'param'
    }))

    expect(url.query()).to.deep.equal({keep: 'value', modify: 'new', added: 'param'})
  })

  it('updateQuery works with empty initial query', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Начинаем с пустого query
    url.query.set({})

    // Добавляем параметры через updateQuery
    url.updateQuery((current) => ({
      ...current,
      added: 'param'
    }))

    expect(url.query()).to.deep.equal({added: 'param'})
  })

  it('clearQuery removes all query parameters', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Устанавливаем начальный query
    url.query.set({param1: 'value1', param2: 'value2'})

    // Очищаем query
    url.clearQuery()

    expect(url.query()).to.deep.equal({})
  })

  it('handles complex query objects with different value types', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Устанавливаем query с различными типами значений
    const complexQuery = {
      string: 'value',
      number: '123',
      empty: '',
      special: 'hello world + , ; & = ?'
    }

    url.setQuery(complexQuery)

    expect(url.query()).to.deep.equal(complexQuery)
  })

  it('methods work correctly when called multiple times', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Множественные вызовы методов
    url.setQuery({initial: 'value'})
    expect(url.query()).to.deep.equal({initial: 'value'})

    url.updateQuery((current) => ({...current, second: 'value'}))
    expect(url.query()).to.deep.equal({initial: 'value', second: 'value'})

    url.clearQuery()
    expect(url.query()).to.deep.equal({})
  })

  it('methods handle undefined and null values gracefully', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Методы должны работать с undefined/null без падений
    expect(() => url.addQueryParam('key', undefined as any)).to.not.throw()
    expect(() => url.addQueryParam('key', null as any)).to.not.throw()
    expect(() => url.setQuery({key: undefined, other: null})).to.not.throw()
  })

  it('updateQuery receives correct current query state', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Устанавливаем начальный query
    const initialQuery = {count: '5', status: 'active'}
    url.query.set(initialQuery)

    let receivedQuery: any = null

    // updateQuery должен получить текущий query
    url.updateQuery((current) => {
      receivedQuery = {...current}
      return {...current, count: '10'}
    })

    expect(receivedQuery).to.deep.equal(initialQuery)
    expect(url.query()).to.deep.equal({count: '10', status: 'active'})
  })
})
