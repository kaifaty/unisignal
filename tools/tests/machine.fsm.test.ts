/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from '@esm-bundle/chai'
import {createMachine, interpret, on} from '../../src/modules/machine/fsm'
import type {SignalAdapter, SignalWritable} from '../../src/modules/adapter/types'

function createTestSignalAdapterReactive(): SignalAdapter {
  return {
    state<T>(initial: T): SignalWritable<T> {
      let value = initial
      const listeners = new Set<(v: T) => void>()
      return {
        get(): T {
          return value
        },
        peek(): T {
          return value
        },
        set(v: T): void {
          value = v
          for (const l of Array.from(listeners)) l(value)
        },
        subscribe(listener: (v: T) => void): () => void {
          listeners.add(listener)
          return () => listeners.delete(listener)
        },
      }
    },
    // not used in these tests
    computed<T>(_fn: () => T) {
      throw new Error('not needed in tests')
    },
  }
}

type Ctx = {count: number}
type E = {type: 'INC'} | {type: 'DEC'} | {type: 'RESET'} | {type: 'xstate.init'}

describe('fsm: core', () => {
  it('should start/stop/send and update state and subscriptions', async () => {
    const signals = createTestSignalAdapterReactive()
    const m = createMachine<Ctx, E, 'idle'>({
      initial: 'idle',
      context: {count: 0},
      states: {
        idle: {
          on: on<Ctx, E>({
            INC: {actions: (ctx) => void ctx.count++},
            DEC: {actions: (ctx) => void ctx.count--},
            RESET: {actions: (ctx) => void (ctx.count = 0)},
          }),
        },
      },
    })

    const service = interpret(m, signals)

    // snapshot before start
    const snap0 = service.getSnapshot()
    expect(snap0.value).to.equal('idle')
    expect(snap0.context.count).to.equal(0)
    expect(snap0.changed).to.equal(false)

    const seen: number[] = []
    const sub = service.subscribe((s) => seen.push(s.context.count))

    service.start()
    // after start → may emit once or twice (notify + signal), we only care about the latest value
    expect(service.getSnapshot().context.count).to.equal(0)

    service.send({type: 'INC'})
    expect(service.getSnapshot().context.count).to.equal(1)

    service.send({type: 'DEC'})
    expect(service.getSnapshot().context.count).to.equal(0)

    service.send({type: 'RESET'})
    expect(service.getSnapshot().context.count).to.equal(0)
    // state value unchanged → changed flag false
    expect(service.getSnapshot().changed).to.equal(false)

    // stop should ignore events
    service.stop()
    service.send({type: 'INC'})
    expect(service.getSnapshot().context.count).to.equal(0)

    sub.unsubscribe()

    // ensure subscription received something and final value matches snapshot
    expect(seen.length >= 1).to.equal(true)
    expect(seen[seen.length - 1]).to.equal(service.getSnapshot().context.count)
  })
})

describe('fsm: guards and actions', () => {
  it('should respect guard and execute multiple actions in order', async () => {
    const signals = createTestSignalAdapterReactive()
    const order: string[] = []
    const canDec = (ctx: Ctx) => ctx.count > 0

    const m = createMachine<Ctx, E, 'idle'>({
      initial: 'idle',
      context: {count: 0},
      states: {
        idle: {
          on: on<Ctx, E>({
            DEC: {guard: canDec, actions: (ctx) => void ctx.count--},
            INC: {
              actions: [
                (_ctx) => void order.push('a'),
                (ctx) => void ctx.count++,
                (_ctx) => void order.push('c'),
              ],
            },
          }),
        },
      },
    })

    const service = interpret(m, signals).start()

    // guard prevents DEC at 0
    service.send({type: 'DEC'})
    expect(service.getSnapshot().context.count).to.equal(0)

    // INC passes and executes actions in order
    service.send({type: 'INC'})
    expect(order).to.deep.equal(['a', 'c'])
    expect(service.getSnapshot().context.count).to.equal(1)

    // now DEC allowed
    service.send({type: 'DEC'})
    expect(service.getSnapshot().context.count).to.equal(0)
  })
})

describe('fsm: state signal', () => {
  it('should expose reactive state signal', async () => {
    const signals = createTestSignalAdapterReactive()
    const m = createMachine<Ctx, E, 'idle'>({
      initial: 'idle',
      context: {count: 0},
      states: {idle: {on: on<Ctx, E>({INC: {actions: (ctx) => void ctx.count++}})}},
    })

    const service = interpret(m, signals).start()
    const seen: number[] = []
    const unsub = service.state.subscribe((s) => seen.push(s.context.count))

    service.send({type: 'INC'})
    service.send({type: 'INC'})

    // last emission should be 2
    expect(seen.length >= 1).to.equal(true)
    expect(seen[seen.length - 1]).to.equal(2)

    unsub()
  })
})
