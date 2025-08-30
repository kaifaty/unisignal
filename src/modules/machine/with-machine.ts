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

export const withMachine = <T extends Constructor<HTMLElement & WithRequestUpdate>>(
  Element: T,
): T & Constructor<IMachinable> => {
  type MachineHandle<M extends StateMachine.AnyMachine> = (() => ServiceFrom<M>) & {
    send: (event: unknown) => void
    stop: () => void
    reset: () => void
  }
  return class Machinable extends Element {
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
      const item = {
        machineFabric,
        service: interpret(machine),
        options,
        machine,
        isSubscribed: false as boolean,
        isStarted: false as boolean,
      }
      list.push(item)
      store.set(this, list)

      const getter = (() => item.service as ServiceFrom<T>) as MachineHandle<T>
      getter.send = (event: unknown) => (item.service as StateMachine.AnyService).send(event as never)
      getter.stop = () => (item.service as StateMachine.AnyService).stop()
      getter.reset = () => {
        item.machine = item.machineFabric()
        item.service = interpret(item.machine)
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
          item.service = interpret(item.machine)
          item.isSubscribed = false
          item.isStarted = false
        }
        if (!item.isSubscribed) {
          const subscription = item.service.subscribe((state) => {
            const should = item.options?.shouldUpdate ? item.options.shouldUpdate(state) : true
            if (!should) return

            const select = item.options?.select
            const isEqual = item.options?.isEqual ?? ((a: unknown, b: unknown) => a === b)
            if (select) {
              const selected = select(state)
              const equal = isEqual(item.lastSelected, selected)
              if (!equal) {
                item.lastSelected = selected
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
