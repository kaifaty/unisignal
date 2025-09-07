import {expect} from '@esm-bundle/chai'
import {createPersistLogger} from '../../../src/modules/persist/utils'

export const test = it

describe('persist: logger', () => {
  test('noop when debug disabled', () => {
    const log = createPersistLogger({}, 'persist', {name: 'x'})
    // should not throw
    log('event', {a: 1})
  })

  test('uses custom logger when provided', () => {
    const calls: any[] = []
    const logger = (msg: string, ctx: any) => calls.push([msg, ctx])
    const log = createPersistLogger({debug: {logger}}, 'restore', {name: 'k'})
    log('event', {b: 2})
    expect(calls.length).to.equal(1)
    expect(calls[0][0]).to.include('[persist:restore] event')
    expect(calls[0][1]).to.deep.equal({name: 'k', b: 2})
  })
})
