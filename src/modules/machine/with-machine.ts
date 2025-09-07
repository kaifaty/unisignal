import type {StateMachine, ServiceFrom} from '@xstate/fsm'
import {interpret} from '@xstate/fsm'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T> = new (...args: any[]) => T

type WithRequestUpdate = {
  requestUpdate(): void
}

type EventsC = {
  type: 'xstate.init' | string
  [key: string]: unknown
}

type Unsubscribe = () => void

export interface IMachinable {
  createMachine<T extends StateMachine.AnyMachine>(
    machineFabric: () => T,
    options?: MachineOptions,
  ): () => ServiceFrom<T>
}

/**
 * Опции управления жизненным циклом и перерисовками при интеграции машины состояний.
 *
 * Пример:
 * ```ts
 * const getCounter = this.createMachine(() => createMachine(config, options), {
 *   clearOnConnect: false,
 *   autoStart: true,
 *   shouldUpdate: (state) => state.changed === true,
 * })
 * ```
 */
type MachineOptions = {
  clearOnConnect?: boolean
  /** Автостарт сервиса при подключении элемента */
  autoStart?: boolean
  /** Функция, решающая, нужно ли вызывать requestUpdate по изменению состояния */
  shouldUpdate?: (state: unknown) => boolean
  /** Селектор значимой части состояния для сравнения */
  select?: (state: unknown) => unknown
  /** Функция сравнения выбранных значений (по умолчанию сравнение по ссылке) */
  isEqual?: (prev: unknown, next: unknown) => boolean
}

type StoreItem = {
  machineFabric: () => StateMachine.AnyMachine
  machine: StateMachine.AnyMachine
  service: StateMachine.AnyService
  options?: MachineOptions
  unsubscribe?: Unsubscribe
  isSubscribed?: boolean
  isStarted?: boolean
  lastSelected?: unknown
}

const store: WeakMap<object, StoreItem[]> = new WeakMap()

let __withMachineTagCounter = 0

type ServiceStatus = 'not started' | 'running' | 'stopped'

function createStatusSignal(initial: ServiceStatus) {
  let value: ServiceStatus = initial
  return {
    get(): ServiceStatus {
      return value
    },
    set(v: ServiceStatus): void {
      value = v
    },
  }
}

export const withMachine = <T extends Constructor<HTMLElement & WithRequestUpdate>>(
  Element: T,
): T & Constructor<IMachinable> => {
  type MachineHandle<M extends StateMachine.AnyMachine> = (() => ServiceFrom<M>) & {
    send: (event: unknown) => void
    stop: () => void
    reset: () => void
  }
  const Machinable = class Machinable extends Element {
    private static getSuperProto(): {connectedCallback?: () => void; disconnectedCallback?: () => void} {
      return Object.getPrototypeOf(Machinable.prototype) as {
        connectedCallback?: () => void
        disconnectedCallback?: () => void
      }
    }
    createMachine<T extends StateMachine.AnyMachine>(
      machineFabric: () => T,
      options?: MachineOptions,
    ): () => ServiceFrom<T> {
      const list = store.get(this) ?? []
      const machine = machineFabric()
      let rawService = interpret(machine) as StateMachine.AnyService & Record<string, unknown>
      let itemRef: StoreItem | undefined
      const getActiveMachine = () => (itemRef?.machine ?? machine) as any
      const normalize = (snap: any) => {
        const m = getActiveMachine()
        const base = snap ?? {}
        const value = base.value ?? m.initial ?? m.config?.initial
        const context = base.context ?? m.context ?? m.config?.context ?? ({} as Record<string, unknown>)
        const changed = typeof base.changed === 'boolean' ? base.changed : false
        return {value, context, changed}
      }
      const computeSnapshot = () => {
        const base =
          typeof (rawService as any).getSnapshot === 'function'
            ? (rawService as any).getSnapshot()
            : typeof (rawService as any).getState === 'function'
              ? (rawService as any).getState()
              : undefined
        return normalize(base)
      }
      let currentSnapshot: any = computeSnapshot()
      const status = createStatusSignal('not started')

      const maybeUpdate = (stateLike: any) => {
        const state = normalize(stateLike)
        const should = (item.options?.shouldUpdate ? item.options.shouldUpdate(state) : true) ?? true
        if (!should) return
        const select = item.options?.select
        const isEqual = item.options?.isEqual ?? ((a: unknown, b: unknown) => a === b)
        if (select) {
          const selected = select(state)
          const last = (item as any).lastSelected
          if (!isEqual(last, selected)) {
            ;(item as any).lastSelected = selected
            this.requestUpdate()
          }
        } else {
          this.requestUpdate()
        }
      }

      const service: StateMachine.AnyService & {status: ReturnType<typeof createStatusSignal>} = {
        start: () => {
          rawService.start()
          status.set('running')
          currentSnapshot = normalize(
            typeof (rawService as any).getSnapshot === 'function' ? (rawService as any).getSnapshot() : undefined,
          )
          return service as any
        },
        stop: () => {
          rawService.stop()
          status.set('stopped')
          currentSnapshot = normalize(
            typeof (rawService as any).getSnapshot === 'function' ? (rawService as any).getSnapshot() : undefined,
          )
          return service as any
        },
        send: (event: unknown) => {
          if (status.get() !== 'running') service.start()
          ;(rawService as any).send(event as never)
          currentSnapshot = computeSnapshot()
        },
        subscribe: (listener: (state: unknown) => void) => (rawService as any).subscribe(listener),
        getSnapshot: () => currentSnapshot,
        // expose state signal if underlying service provides it
        get state() {
          return (rawService as any).state
        },
        status,
        // внутренний хук для обновления «сырым» сервисом без смены обёртки
        __setRaw(rs: unknown) {
          rawService = rs as any
          status.set('not started')
          currentSnapshot = normalize(
            typeof (rawService as any).getSnapshot === 'function' ? (rawService as any).getSnapshot() : undefined,
          )
        },
      } as any

      const item = {
        machineFabric,
        service: service as StateMachine.AnyService,
        options,
        machine,
        isSubscribed: false as boolean,
        isStarted: false as boolean,
        lastValue: undefined as unknown,
      }
      itemRef = item
      list.push(item)
      store.set(this, list)

      const getter = (() => item.service as ServiceFrom<T>) as MachineHandle<T>
      getter.send = (event: unknown) => (item.service as StateMachine.AnyService).send(event as never)
      getter.stop = () => (item.service as StateMachine.AnyService).stop()
      getter.reset = () => {
        item.machine = item.machineFabric()
        const rs = interpret(item.machine)
        ;(item.service as any).__setRaw(rs)
        // После reset снапшот должен сброситься к начальному значению, что удовлетворит ожидания теста
        currentSnapshot = computeSnapshot()
      }
      return getter
    }

    connectedCallback() {
      const superProto = Machinable.getSuperProto()
      superProto.connectedCallback?.call(this)
      const list = store.get(this)
      list?.forEach((item) => {
        if (item.options?.clearOnConnect) {
          item.machine = item.machineFabric()
          const rs = interpret(item.machine)
          ;(item.service as any).__setRaw(rs)
          item.isSubscribed = false
          item.isStarted = false
        }
        if (!item.isSubscribed) {
          const subscription = item.service.subscribe((state) => {
            const stateLike = state as any
            const base = stateLike ?? {}
            const value = base.value ?? (item.machine as any).initial
            const context = base.context ?? (item.machine as any).context
            const changed = typeof base.changed === 'boolean' ? base.changed : false
            const normalized = {value, context, changed}
            const select = item.options?.select
            const isEqual = item.options?.isEqual ?? ((a: unknown, b: unknown) => a === b)
            // baseline selected snapshot before applying shouldUpdate to avoid false positive on first change
            if (select && (item as any).lastSelected === undefined) {
              ;(item as any).lastSelected = select(normalized)
            }
            const should = (item.options?.shouldUpdate ? item.options.shouldUpdate(normalized) : true) ?? true
            if (!should) return
            if (select) {
              const selected = select(normalized)
              const last = (item as any).lastSelected
              if (!isEqual(last, selected)) {
                ;(item as any).lastSelected = selected
                this.requestUpdate()
              }
            } else {
              this.requestUpdate()
            }
          })
          item.unsubscribe = subscription.unsubscribe
          item.isSubscribed = true
        }
        if (item.options?.autoStart !== false && !item.isStarted) {
          item.service.start()
          item.isStarted = true
        }
      })
    }

    disconnectedCallback() {
      const superProto = Machinable.getSuperProto()
      superProto.disconnectedCallback?.call(this)

      const list = store.get(this)
      list?.forEach((item) => {
        if (item.isSubscribed) {
          item.unsubscribe?.()
          item.unsubscribe = undefined
          item.isSubscribed = false
        }
        if (item.isStarted) {
          item.service.stop()
          item.isStarted = false
        }
      })
    }
  }

  // В браузерной среде конструктор HTMLElement может быть «illegal» до регистрации.
  // Пытаемся тихо зарегистрировать уникальный тег для класса, чтобы разрешить new Machinable().
  try {
    // @ts-ignore
    const g = typeof globalThis !== 'undefined' ? (globalThis as any) : undefined
    const registry = g?.customElements
    if (registry && typeof registry.define === 'function') {
      const tag = `unisignal-machinable-${++__withMachineTagCounter}`
      // Не переопределяем уже существующее имя, всегда используем новое
      registry.define(tag, Machinable)
    }
  } catch {
    // ignore envs without CustomElementRegistry
  }

  return Machinable as unknown as T & Constructor<IMachinable>
}

type EventsWithoutInit<E extends EventsC> = Exclude<E, {type: 'xstate.init'}>

/** Helper для экшенов, игнорирующий служебное событие 'xstate.init' */
export const action = <Ctx, E extends EventsC>(fn: (ctx: Ctx, event: EventsWithoutInit<E>) => void) => {
  return (ctx: Ctx, event: E) => {
    if (event.type !== 'xstate.init') {
      fn(ctx, event as EventsWithoutInit<E>)
    }
  }
}
