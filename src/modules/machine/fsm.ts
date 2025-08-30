import type {SignalAdapter, SignalReadable, SignalWritable} from '../adapter'

// Минималистичный FSM с API, похожим на @xstate/fsm, но со встроенной реактивностью через SignalAdapter.

export type EventObject = {type: string; [key: string]: unknown}

export type StateNodeConfig<Ctx, E extends EventObject> = {
  on?: Partial<Record<E['type'], TransitionConfig<Ctx, Extract<E, {type: string}>>>>
  entry?: Action<Ctx, E> | Array<Action<Ctx, E>>
  exit?: Action<Ctx, E> | Array<Action<Ctx, E>>
}

export type StatesConfig<Ctx, E extends EventObject, S extends string> = Record<S, StateNodeConfig<Ctx, E>>

export type TransitionConfig<Ctx, E extends EventObject> = {
  target?: string
  guard?: Guard<Ctx, E>
  actions?: Action<Ctx, E> | Array<Action<Ctx, E>>
}

export type MachineConfig<Ctx, E extends EventObject, S extends string> = {
  id?: string
  initial: S
  context: Ctx
  states: StatesConfig<Ctx, E, S>
}

export type Guard<Ctx, E extends EventObject> = (ctx: Ctx, event: E) => boolean
export type Action<Ctx, E extends EventObject> = (ctx: Ctx, event: E) => void

export type State<Ctx, S extends string> = {
  value: S
  context: Ctx
  changed: boolean
}

export type Interpreter<Ctx, E extends EventObject, S extends string> = {
  start(): Interpreter<Ctx, E, S>
  stop(): Interpreter<Ctx, E, S>
  send(event: E): void
  subscribe(listener: (state: State<Ctx, S>) => void): {unsubscribe(): void}
  getSnapshot(): State<Ctx, S>
  state: SignalReadable<State<Ctx, S>>
}

export function createMachine<Ctx, E extends EventObject, S extends string>(
  config: MachineConfig<Ctx, E, S>,
) {
  return config
}

export function interpret<Ctx, E extends EventObject, S extends string>(
  machine: MachineConfig<Ctx, E, S>,
  signals: SignalAdapter,
): Interpreter<Ctx, E, S> {
  const stateSignal: SignalWritable<State<Ctx, S>> = signals.state<State<Ctx, S>>({
    value: machine.initial,
    context: machine.context,
    changed: false,
  })

  let isRunning = false
  const subscriptions = new Set<(state: State<Ctx, S>) => void>()

  function next(target: string | undefined, event: E, transition?: TransitionConfig<Ctx, E>) {
    const current = stateSignal.peek()
    const currentNode = machine.states[current.value]
    const targetKey = target ?? current.value

    if (targetKey !== current.value) {
      if (currentNode?.exit) runActions(currentNode.exit, current.context, event)
    }

    const maybeGuard = transition?.guard
    if (maybeGuard && !maybeGuard(current.context, event)) return

    if (transition?.actions) runActions(transition.actions, current.context, event)

    const nextValue = (targetKey as S) ?? current.value
    const nextState: State<Ctx, S> = {
      value: nextValue,
      context: current.context,
      changed: nextValue !== current.value,
    }

    stateSignal.set(nextState)

    if (targetKey !== current.value) {
      const targetNode = machine.states[nextValue]
      if (targetNode?.entry) runActions(targetNode.entry, nextState.context, event)
    }
  }

  function runActions(actions: Action<Ctx, E> | Array<Action<Ctx, E>>, ctx: Ctx, event: E) {
    const list = Array.isArray(actions) ? actions : [actions]
    for (const act of list) act(ctx, event)
  }

  function send(event: E): void {
    if (!isRunning) return
    const current = stateSignal.peek()
    const node = machine.states[current.value]
    const transitionLike = node?.on?.[event.type as E['type']]
    if (!transitionLike) return
    const transition: TransitionConfig<Ctx, E> = Array.isArray(transitionLike)
      ? transitionLike[0]!
      : (transitionLike as TransitionConfig<Ctx, E>)

    next(transition.target, event, transition)
  }

  function start(): Interpreter<Ctx, E, S> {
    if (isRunning) return api
    isRunning = true
    // эмулируем служебное событие xstate.init
    const initEvent = {type: 'xstate.init'} as E
    const node = machine.states[machine.initial]
    if (node?.entry) runActions(node.entry, machine.context, initEvent)
    stateSignal.set({value: machine.initial, context: machine.context, changed: false})
    notify()
    return api
  }

  function stop(): Interpreter<Ctx, E, S> {
    if (!isRunning) return api
    isRunning = false
    return api
  }

  function getSnapshot(): State<Ctx, S> {
    return stateSignal.peek()
  }

  function subscribe(listener: (state: State<Ctx, S>) => void) {
    subscriptions.add(listener)
    const dispose = stateSignal.subscribe((s) => {
      if (!isRunning) return
      listener(s)
    })
    return {
      unsubscribe: () => {
        subscriptions.delete(listener)
        dispose()
      },
    }
  }

  function notify() {
    const snapshot = stateSignal.peek()
    for (const l of subscriptions) l(snapshot)
  }

  const api: Interpreter<Ctx, E, S> = {
    start,
    stop,
    send,
    subscribe,
    getSnapshot,
    state: stateSignal,
  }

  return api
}

// Утилита для удобного создания on-таблиц
export function on<Ctx, E extends EventObject>(
  mapping: Partial<Record<E['type'], TransitionConfig<Ctx, Extract<E, {type: string}>>>>,
) {
  return mapping
}
