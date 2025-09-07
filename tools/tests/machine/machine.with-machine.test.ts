import {expect} from '@esm-bundle/chai'
import {createMachine} from '@xstate/fsm'
import {withMachine, action} from '../../../src/modules/machine/with-machine'

export const test = it

describe('machine: withMachine mixin', () => {
  class BaseEl extends HTMLElement {
    updated = 0
    connected = 0
    disconnected = 0
    requestUpdate() {
      this.updated++
    }
    connectedCallback(): void {
      this.connected++
    }
    disconnectedCallback(): void {
      this.disconnected++
    }
  }

  const Mixin = withMachine(BaseEl)

  test('createMachine returns handle with send/stop/reset', () => {
    const el = new Mixin()
    type Ctx = {v: number}
    type E = {type: 'INC'} | {type: 'xstate.init'}
    const get = el.createMachine(() =>
      createMachine<Ctx, E, 'idle'>({
        initial: 'idle',
        context: {v: 0},
        states: {idle: {on: {INC: {actions: (ctx) => void ctx.v++}}}},
      }),
    )
    const svc = get()
    expect(svc.getSnapshot().context.v).to.equal(0)
    get.send({type: 'INC'})
    expect(svc.getSnapshot().context.v).to.equal(1)
    get.stop()
    get.reset()
    const svc2 = get()
    expect(svc2.getSnapshot().context.v).to.equal(0)
  })

  test('lifecycle: subscribe on connect, start by default, clearOnConnect resets', () => {
    const el = new Mixin()
    const get = el.createMachine(
      () =>
        createMachine({
          initial: 'idle',
          context: {n: 0},
          states: {idle: {on: {INC: {actions: (ctx: any) => void ctx.n++}}}},
        }),
      {clearOnConnect: true},
    )

    // before connect nothing started
    const svc = get()
    expect(svc.status.get()).to.equal('not started')

    // connect triggers subscribe and start
    el.connectedCallback()
    expect(svc.status.get()).to.equal('running')

    get.send({type: 'INC'})
    // should cause requestUpdate
    expect(el.updated).to.be.greaterThan(0)

    // disconnect -> unsubscribe and stop
    el.disconnectedCallback()
    expect(svc.status.get()).to.equal('stopped')
  })

  test('shouldUpdate and select + isEqual control updates', () => {
    const el = new Mixin()
    const get = el.createMachine(
      () =>
        createMachine({
          initial: 'idle',
          context: {a: 0, b: {x: 1}},
          states: {
            idle: {
              on: {
                INC: {actions: (ctx: any) => void ctx.a++},
                SETX: {actions: (ctx: any) => void (ctx.b = {x: (ctx.b?.x ?? 0) + 1})},
              },
            },
          },
        }),
      {
        shouldUpdate: (state) => (state as any).changed === true,
        select: (state) => (state as any).context.b,
        isEqual: (p, n) => (p as any)?.x === (n as any)?.x,
      },
    )

    const svc = get()
    el.connectedCallback()
    const updatesBefore = el.updated

    // change a only -> selected b not changed -> no update
    get.send({type: 'INC'})
    expect(el.updated).to.equal(updatesBefore)

    // change b.x -> selected changes -> update
    get.send({type: 'SETX'})
    expect(el.updated).to.be.greaterThan(updatesBefore)

    el.disconnectedCallback()
  })

  test('action helper ignores xstate.init', () => {
    type C = {log: string[]}
    type E = {type: 'xstate.init'} | {type: 'CUSTOM'; v: number}

    const logs: string[] = []
    const safe = action<C, E>((ctx, ev) => logs.push('v:' + (ev as any).v))
    safe({log: logs}, {type: 'xstate.init'} as any)
    safe({log: logs}, {type: 'CUSTOM', v: 42} as any)

    expect(logs).to.deep.equal(['v:42'])
  })
})
