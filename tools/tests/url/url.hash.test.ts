import {expect} from '@esm-bundle/chai'
import {url, configure} from '../../../src/modules/url/url'
import {createTestSignalAdapter} from '../fixtures/adapter'

describe('url: hash manipulations', () => {
  beforeEach(() => {
    // Сбрасываем конфигурацию
    ;(url.constructor as any)._signals = undefined
  })

  afterEach(() => {
    // Сбрасываем конфигурацию
    ;(url.constructor as any)._signals = undefined
  })

  it('setHash method exists and is callable', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    expect(url.setHash).to.be.a('function')
    expect(() => url.setHash('test')).to.not.throw()
  })

  it('clearHash method exists and is callable', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    expect(url.clearHash).to.be.a('function')
    expect(() => url.clearHash()).to.not.throw()
  })

  it('hash manipulation methods accept replace parameter', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Методы должны принимать replace параметр без ошибок
    expect(() => url.setHash('test', {replace: true})).to.not.throw()
    expect(() => url.clearHash({replace: true})).to.not.throw()
  })

  it('setHash sets hash value correctly', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Устанавливаем hash
    url.setHash('test-hash')

    expect(url.hash()).to.equal('#test-hash')
  })

  it('setHash adds # prefix if not provided', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Устанавливаем hash без #
    url.setHash('test-hash')

    expect(url.hash()).to.equal('#test-hash')
  })

  it('setHash preserves existing # prefix', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Устанавливаем hash с #
    url.setHash('#test-hash')

    expect(url.hash()).to.equal('#test-hash')
  })

  it('setHash handles empty string', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Устанавливаем пустой hash
    url.setHash('')

    expect(url.hash()).to.equal('')
  })

  it('clearHash removes hash completely', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Сначала устанавливаем hash
    url.setHash('test-hash')
    expect(url.hash()).to.equal('#test-hash')

    // Затем очищаем
    url.clearHash()
    expect(url.hash()).to.equal('')
  })

  it('clearHash works when no hash is set', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Очищаем hash когда его нет
    url.clearHash()
    expect(url.hash()).to.equal('')
  })

  it('hash methods work correctly', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Инициализируем url
    const _path = url.path
    const _query = url.query

    // Устанавливаем hash
    url.setHash('test-hash')

    // Проверяем, что hash установлен корректно
    expect(url.hash()).to.equal('#test-hash')
  })

  it('clearHash works correctly', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Инициализируем url
    const _path = url.path
    const _query = url.query

    // Устанавливаем и затем очищаем hash
    url.setHash('test-hash')
    expect(url.hash()).to.equal('#test-hash')

    url.clearHash()
    expect(url.hash()).to.equal('')
  })

  it('setHash handles special characters in hash value', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Устанавливаем hash со специальными символами
    const specialHash = 'test hash with spaces & symbols'
    url.setHash(specialHash)

    expect(url.hash()).to.equal('#test%20hash%20with%20spaces%20&%20symbols')
  })

  it('setHash handles unicode characters in hash value', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Устанавливаем hash с unicode символами
    const unicodeHash = 'тест-хэш'
    url.setHash(unicodeHash)

    expect(url.hash()).to.equal('#%D1%82%D0%B5%D1%81%D1%82-%D1%85%D1%8D%D1%88')
  })

  it('multiple hash operations work correctly', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Множественные операции с hash
    url.setHash('first')
    expect(url.hash()).to.equal('#first')

    url.setHash('second')
    expect(url.hash()).to.equal('#second')

    url.clearHash()
    expect(url.hash()).to.equal('')

    url.setHash('#third')
    expect(url.hash()).to.equal('#third')
  })

  it('setHash handles hash with query-like syntax', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Hash может содержать символы как в query string
    const complexHash = 'section?id=123&tab=details'
    url.setHash(complexHash)

    expect(url.hash()).to.equal('#section?id=123&tab=details')
  })

  it('hash methods work independently of query changes', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Устанавливаем hash
    url.setHash('test-hash')
    expect(url.hash()).to.equal('#test-hash')

    // Изменяем query
    url.query.set({new: 'param'})
    expect(url.hash()).to.equal('#test-hash') // hash должен остаться

    // Очищаем query
    url.clearQuery()
    expect(url.hash()).to.equal('#test-hash') // hash должен остаться
  })

  it('hash methods work independently of path changes', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Устанавливаем hash
    url.setHash('test-hash')
    expect(url.hash()).to.equal('#test-hash')

    // Изменяем path
    url.path.set('/new-path')
    expect(url.hash()).to.equal('#test-hash') // hash должен остаться

    // Изменяем path еще раз
    url.path.set('/another-path')
    expect(url.hash()).to.equal('#test-hash') // hash должен остаться
  })

  it('setHash can be called multiple times with different values', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    const hashes = ['first', '#second', 'third-value', '']

    hashes.forEach((hash, index) => {
      url.setHash(hash)
      const expected = hash.startsWith('#') ? hash : (hash ? `#${hash}` : '')
      expect(url.hash()).to.equal(expected, `Failed at index ${index} with hash: ${hash}`)
    })
  })

  it('clearHash can be called multiple times safely', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Множественные вызовы clearHash
    for (let i = 0; i < 3; i++) {
      url.clearHash()
      expect(url.hash()).to.equal('', `Failed at call ${i + 1}`)
    }
  })

  it('hash state is preserved across different operations', () => {
    const adapter = createTestSignalAdapter()
    configure(adapter)

    // Серия операций для проверки сохранения состояния
    url.setHash('initial')
    expect(url.hash()).to.equal('#initial')

    url.updateQuery((q) => ({...q, test: 'value'}))
    expect(url.hash()).to.equal('#initial')

    url.path.set('/test')
    expect(url.hash()).to.equal('#initial')

    url.setHash('updated')
    expect(url.hash()).to.equal('#updated')
  })
})
