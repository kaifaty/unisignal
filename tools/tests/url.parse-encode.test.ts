import {expect} from '@esm-bundle/chai'
import {parseQueryParams, encodeQueryParams} from '../../src/modules/url/url'

describe('url: parse/encode', () => {
  it('encodes arrays and sorts keys when enabled', () => {
    const query = encodeQueryParams({b: '2', a: ['x', 'y']}, {sortKeys: true})
    expect(query === '?a=x&a=y&b=2' || query === '?a=y&a=x&b=2').to.equal(true)
  })

  it('parses numbers/booleans with autoParse', () => {
    const res = parseQueryParams('?a=1&b=true&c=false&d=zzz', {autoParse: true}) as any
    expect(res.a).to.equal(1)
    expect(res.b).to.equal(true)
    expect(res.c).to.equal(false)
    expect(res.d).to.equal('zzz')
  })

  it('parses arrays by repeating keys', () => {
    const res = parseQueryParams('?tag=a&tag=b') as any
    expect(Array.isArray(res.tag)).to.equal(true)
    expect(res.tag).to.deep.equal(['a', 'b'])
  })

  it('parses json keys specified in options', () => {
    const res = parseQueryParams('?filter=%7B%22x%22%3A1%7D', {jsonKeys: ['filter']}) as any
    expect(res.filter).to.deep.equal({x: 1})
  })
})
