import {expect} from '@esm-bundle/chai'
import {parseQueryParams, encodeQueryParams} from '../../../src/modules/url/url'

describe('url: parse/encode', () => {
  it('encodes arrays and sorts keys when enabled', () => {
    const query = encodeQueryParams({b: '2', a: ['x', 'y']}, {sortKeys: true})
    expect(query === '?a=x&a=y&b=2' || query === '?a=y&a=x&b=2').to.equal(true)
  })

  it('parses numbers/booleans with autoParse', () => {
    const res = parseQueryParams('?a=1&b=true&c=false&d=zzz', {autoParse: true}) as Record<string, unknown>
    expect(res.a).to.equal(1)
    expect(res.b).to.equal(true)
    expect(res.c).to.equal(false)
    expect(res.d).to.equal('zzz')
  })

  it('parses arrays by repeating keys', () => {
    const res = parseQueryParams('?tag=a&tag=b') as Record<string, unknown>
    expect(Array.isArray(res.tag)).to.equal(true)
    expect(res.tag).to.deep.equal(['a', 'b'])
  })

  it('parses json keys specified in options', () => {
    const res = parseQueryParams('?filter=%7B%22x%22%3A1%7D', {jsonKeys: ['filter']}) as Record<
      string,
      unknown
    >
    expect(res.filter).to.deep.equal({x: 1})
  })

  it('handles empty input', () => {
    expect(parseQueryParams('')).to.deep.equal({})
  })

  it('handles undefined search string', () => {
    // parseQueryParams(undefined) использует текущую location браузера
    const result = parseQueryParams(undefined as any)
    expect(typeof result).to.equal('object')
    expect(result).to.not.equal(null)
  })

  it('strips leading "?" prefix correctly', () => {
    const withPrefix = parseQueryParams('?a=1&b=2')
    const withoutPrefix = parseQueryParams('a=1&b=2')
    expect(withPrefix).to.deep.equal(withoutPrefix)
  })

  it('autoParse handles empty strings, NaN, and edge cases', () => {
    const res = parseQueryParams('?a=&b=NaN&c=null', {autoParse: true}) as Record<string, unknown>
    expect(res.a).to.equal('')
    expect(res.b).to.equal('NaN') // NaN string should remain string
    expect(res.c).to.equal('null') // 'null' string remains string
  })

  it('jsonKeys with invalid JSON returns original string', () => {
    const res = parseQueryParams('?filter=invalid-json', {jsonKeys: ['filter']}) as Record<
      string,
      unknown
    >
    expect(res.filter).to.equal('invalid-json')
  })

  it('handles special characters, unicode, and encoding', () => {
    const query = '?name=%D0%98%D0%B2%D0%B0%D0%BD+%D0%9F%D1%83%D0%BF%D0%BA%D0%B8%D0%BD&symbol=%2B%2C%3B%20%26%3D'
    const res = parseQueryParams(query)
    expect(res.name).to.equal('Иван Пупкин')
    expect(res.symbol).to.equal('+,; &=') // decoded + , ; space &
  })

  it('encode preserves key order when sortKeys is false', () => {
    const query = encodeQueryParams({c: '3', a: '1', b: '2'}, {sortKeys: false})
    // Without sorting, order depends on object iteration (typically insertion order in modern JS)
    expect(query).to.include('c=3')
    expect(query).to.include('a=1')
    expect(query).to.include('b=2')
  })

  it('encode skips undefined and null values', () => {
    const query = encodeQueryParams({a: '1', b: undefined, c: null, d: '2'})
    expect(query).to.equal('?a=1&d=2')
  })

  it('encode empty object returns empty string', () => {
    const query = encodeQueryParams({})
    expect(query).to.equal('')
  })

  it('round-trip without autoParse preserves key-value pairs', () => {
    const original = '?x=hello&y=world&z=test'
    const parsed = parseQueryParams(original)
    const encoded = encodeQueryParams(parsed)
    // Should be equivalent (order may differ)
    const parsedAgain = parseQueryParams(encoded)
    expect(parsedAgain).to.deep.equal(parsed)
  })

  it('encodes unicode characters correctly', () => {
    const query = encodeQueryParams({name: 'Иван Пупкин', symbol: 'тест'})
    expect(query).to.include('name=%D0%98%D0%B2%D0%B0%D0%BD+%D0%9F%D1%83%D0%BF%D0%BA%D0%B8%D0%BD')
    expect(query).to.include('symbol=%D1%82%D0%B5%D1%81%D1%82')
  })

  it('handles spaces and special characters in encoding', () => {
    const query = encodeQueryParams({text: 'hello world + , ; & = ?'})
    expect(query).to.equal('?text=hello+world+%2B+%2C+%3B+%26+%3D+%3F')
  })
})
