# Минималистичный FSM с сигналами (SignalAdapter)

Лёгкая машина состояний с API, схожим с `@xstate/fsm`, и встроенной реактивностью через абстракцию `SignalAdapter`. Работает с несколькими реализациями сигналов: `@preact/signals-core` и `@lit-labs/signals` (через адаптеры).

## Возможности

- Простая декларация машины: `createMachine({ initial, context, states })`
- Интерпретатор с сервисом: `interpret(machine, signals)` → `start/stop/send/subscribe/getSnapshot`
- Рективация состояния через сигнал: `service.state` — `SignalReadable<State>`
- `entry/exit`-экшены, `guard`-условия, таблица `on` через хелпер `on({...})`

---

## Установка адаптера сигналов

Выберите одну из реализаций сигналов и создайте адаптер.

### Preact Signals

```ts
import {adapter} from '../../'
import * as Signals from '@preact/signals-core'

const signals = adapter.createPreactSignalsAdapter({
  signal: Signals.signal,
  computed: Signals.computed,
  effect: Signals.effect,
})
```

---

## Сравнение API с @xstate/fsm

| Возможность | @xstate/fsm | Наш FSM |
| --- | --- | --- |
| Создание машины | `createMachine(config)` | `createMachine(config)` |
| Интерпретация | `interpret(machine)` | `interpret(machine, signals)` |
| Сервис | `start/stop/send/subscribe/getSnapshot` | `start/stop/send/subscribe/getSnapshot` |
| Сигнал состояния | — | `service.state: SignalReadable<State>` |
| Таблица переходов | `on: { EVENT: {target, actions, cond} }` | `on(mapping)`, `guard` вместо `cond` |
| Entry/Exit | `entry/exit` | `entry/exit` |
| Несколько transitions | Приоритизация массива | Берётся первый элемент массива |
| Обновление контекста | Через `assign` (иммутабельно) | Мутируйте `ctx` или используйте утилиты ниже |

Примечание: для совместимости можно по-прежнему использовать `service.getSnapshot()` и `service.subscribe`. Рекомендуется использовать `service.state` для реактивного UI.

---

## Иммутабельные обновления контекста

По умолчанию экшены работают с мутабельным `ctx`. Чтобы придерживаться иммутабельного стиля (не менять существующие объекты, а создавать новые), используйте один из подходов:

### 1) Шаллоу-иммутабельность (обновляем свойства через новые объекты)

```ts
type Ctx = { user: { name: string; age: number }; items: string[] }

const m = machine.createMachine<Ctx, {type: 'RENAME' | 'PUSH' | 'xstate.init'}, 'idle'>({
  initial: 'idle',
  context: { user: { name: 'Ann', age: 30 }, items: [] },
  states: {
    idle: {
      on: machine.on({
        RENAME: {
          actions: (ctx) => {
            // создаём новый объект вместо мутации полей по месту
            ctx.user = { ...ctx.user, name: 'Kate' }
          },
        },
        PUSH: {
          actions: (ctx) => {
            // создаём новый массив вместо push по месту
            ctx.items = [...ctx.items, 'new']
          },
        },
      }),
    },
  },
})
```

### 2) Утилита-assign без зависимостей

```ts
// Универсальная утилита для безопасного частичного обновления
const assign = <T extends object>(patch: Partial<T>) => (target: T) => Object.assign(target, patch)

// Использование
const inc = (delta: number) => (ctx: {count: number}) => assign({ count: ctx.count + delta })(ctx)

const m = machine.createMachine<{count: number}, {type: 'INC'} | {type: 'xstate.init'}, 'idle'>({
  initial: 'idle',
  context: {count: 0},
  states: {
    idle: {
      on: machine.on({
        INC: { actions: [ (ctx) => inc(1)(ctx) ] },
      }),
    },
  },
})
```

### 3) Паттерн «produce» без сторонних библиотек

```ts
// Мини-produce: передаём мутирующую функцию, изменения применяются к целевому объекту
function produce<T extends object>(target: T, recipe: (draft: T) => void): void {
  const draft = target as T
  recipe(draft)
}

const m = machine.createMachine<{ items: string[] }, {type: 'ADD'} | {type: 'xstate.init'}, 'idle'>({
  initial: 'idle',
  context: { items: [] },
  states: {
    idle: {
      on: machine.on({
        ADD: {
          actions: (ctx) => produce(ctx, (d) => {
            d.items = [...d.items, 'x']
          }),
        },
      }),
    },
  },
})
```

Замечание: верхнеуровневую ссылку на `context` интерпретатор сохраняет неизменной между переходами; однако каждый переход публикует новый объект `state` через сигнал, поэтому UI получит уведомление даже при иммутабельных обновлениях вложенных структур.

### Lit Signals

```ts
import {adapter} from '../../'
import {signal, computed, effect} from '@lit-labs/signals'

const signals = adapter.createLitSignalsAdapter({
  signal,
  computed,
  effect,
})
```

---

## Быстрый старт

```ts
import {machine} from '../../'

type Ctx = {count: number}
type E =
  | {type: 'INC'}
  | {type: 'DEC'}
  | {type: 'RESET'}
  | {type: 'xstate.init'}

const counter = machine.createMachine<Ctx, E, 'idle' | 'active'>({
  initial: 'idle',
  context: {count: 0},
  states: {
    idle: {
      entry: (ctx) => {
        // Выполняется при входе в состояние
      },
      on: machine.on<Ctx, E>({
        INC: {target: 'active', actions: (ctx) => { ctx.count++ }},
      }),
    },
    active: {
      on: machine.on<Ctx, E>({
        DEC: {target: 'idle', actions: (ctx) => { ctx.count-- }},
        RESET: {actions: (ctx) => { ctx.count = 0 }},
      }),
    },
  },
})

const service = machine.interpret(counter, signals).start()

// Подписка на изменения состояния
const sub = service.subscribe((state) => {
  console.log(state.value, state.context.count)
})

service.send({type: 'INC'})
service.send({type: 'DEC'})

sub.unsubscribe()
```

---

## Использование с UI

### Lit (рекативный рендер через signals)

С адаптером `createLitSignalsAdapter` можно безопасно читать `service.state.get()` прямо в `render()` — Lit подхватит зависимости через `@lit-labs/signals`.

```ts
import {LitElement, html} from 'lit'
import {signal, computed, effect} from '@lit-labs/signals'
import {adapter, machine} from '../../'

const signals = adapter.createLitSignalsAdapter({signal, computed, effect})

class CounterElement extends LitElement {
  private service = machine
    .interpret(
      machine.createMachine({
        initial: 'idle',
        context: {count: 0},
        states: {
          idle: { on: machine.on({ INC: {target: 'idle', actions: (ctx) => { ctx.count++ }}}) },
        },
      }),
      signals,
    )
    .start()

  render() {
    const state = this.service.state.get()
    return html`
      <div>value: ${state.value}</div>
      <div>count: ${state.context.count}</div>
      <button @click=${() => this.service.send({type: 'INC'})}>inc</button>
    `
  }
}

customElements.define('counter-element', CounterElement)
```

### Preact/React

Подпишитесь на `service.state` через Signals и используйте `.value`-семантику (внутри адаптера она уже транслируется в универсальный `get()`):

```ts
import {useEffect, useState} from 'react'
import {signal, computed, effect} from '@preact/signals-core'
import {adapter, machine} from '../../'

const signals = adapter.createPreactSignalsAdapter({signal, computed, effect})

export function Counter() {
  const [service] = useState(() =>
    machine.interpret(
      machine.createMachine({
        initial: 'idle',
        context: {count: 0},
        states: {
          idle: { on: machine.on({ INC: {actions: (ctx) => { ctx.count++ }}}) },
        },
      }),
      signals,
    ).start(),
  )

  const [, setTick] = useState(0)
  useEffect(() => service.subscribe(() => setTick((x) => x + 1)).unsubscribe, [service])

  const state = service.state.get()
  return (
    <div>
      <div>value: {state.value}</div>
      <div>count: {state.context.count}</div>
      <button onClick={() => service.send({type: 'INC'})}>inc</button>
    </div>
  )
}
```

---

## API

### createMachine(config)

Принимает конфиг:

```ts
type MachineConfig<Ctx, E extends {type: string}, S extends string> = {
  id?: string
  initial: S
  context: Ctx
  states: Record<S, StateNodeConfig<Ctx, E>>
}

type StateNodeConfig<Ctx, E> = {
  on?: Partial<Record<E['type'], TransitionConfig<Ctx, E>>>
  entry?: Action<Ctx, E> | Action<Ctx, E>[]
  exit?: Action<Ctx, E> | Action<Ctx, E>[]
}

type TransitionConfig<Ctx, E> = {
  target?: string
  guard?: (ctx: Ctx, event: E) => boolean
  actions?: Action<Ctx, E> | Action<Ctx, E>[]
}

type Action<Ctx, E> = (ctx: Ctx, event: E) => void
```

### interpret(machine, signals)

Создаёт интерпретатор. Возвращает сервис:

```ts
type Interpreter<Ctx, E, S extends string> = {
  start(): Interpreter<Ctx, E, S>
  stop(): Interpreter<Ctx, E, S>
  send(event: E): void
  subscribe(listener: (state: State<Ctx, S>) => void): {unsubscribe(): void}
  getSnapshot(): State<Ctx, S>
  state: SignalReadable<State<Ctx, S>>
}
```

`state` — это сигнал. Для чтения без подписки используйте `state.peek()`.

### on(mapping)

Сахар для объявления таблицы переходов: `on({ EVENT: {target, guard, actions} })`.

---

## Паттерны и советы

- Контекст по умолчанию мутабельный — обновляйте его в `actions` и `entry/exit`. Если нужна иммутабельность, придерживайтесь клонов `ctx` внутри ваших доменных функций.
- `guard` возвращает `true/false`. При `false` переход игнорируется.
- Если в `TransitionConfig` не указан `target`, состояние останется прежним; экшены выполнятся.
- На `start()` автоматически исполняется `entry` начального состояния и выставляется снимок `{changed: false}`.

---

## Отличия от @xstate/fsm (кратко)

- Нет схемы и валидаторов — только то, что описано выше.
- Реактивность встроена и основана на переданном `SignalAdapter`.
- Поддерживается только плоская таблица переходов без иерархии/истории.

---

## Отладка

- Используйте `service.getSnapshot()` для быстрой синхронной проверки текущего состояния.
- В UI читайте `service.state.get()`; для невизуальных подписок предпочтительнее `service.subscribe` с `unsubscribe`.

---

## Миграция с @xstate/fsm

Основные отличия и шаги миграции:

- Добавьте адаптер сигналов и передайте его вторым аргументом в `interpret(machine, signals)`.
- Доступно дополнительное поле `service.state` — это сигнал текущего состояния. Для совместимости можно продолжать использовать `service.getSnapshot()` и `service.subscribe`.
- Переходы объявляются так же, но массив переходов не обрабатывается приоритизированно — используется первый элемент массива (если всё же передан массив).

Пример миграции:

```ts
// Было (@xstate/fsm)
import {createMachine, interpret} from '@xstate/fsm'

const m = createMachine({
  initial: 'idle',
  context: {count: 0},
  states: {
    idle: { on: { INC: {target: 'idle', actions: (ctx) => { ctx.count++ }} } },
  },
})

const service = interpret(m).start()
service.subscribe((state) => console.log(state.value, state.context.count))
service.send({type: 'INC'})
```

```ts
// Стало (наш FSM с SignalAdapter)
import {machine, adapter} from '../../'
import {signal, computed, effect} from '@preact/signals-core' // или @lit-labs/signals

const signals = adapter.createPreactSignalsAdapter({signal, computed, effect})

const m = machine.createMachine({
  initial: 'idle',
  context: {count: 0},
  states: {
    idle: { on: machine.on({ INC: {target: 'idle', actions: (ctx) => { ctx.count++ }} }) },
  },
})

const service = machine.interpret(m, signals).start()
service.subscribe((state) => console.log(state.value, state.context.count))

// Дополнительно доступен реактивный сигнал состояния
service.state.subscribe((s) => console.log('signal', s.value, s.context.count))
service.send({type: 'INC'})
```

---

## Примеры: guard и несколько actions

### Guard для валидации перехода

```ts
type Ctx = {count: number}
type E = {type: 'DEC'} | {type: 'INC'} | {type: 'xstate.init'}

const canDec = (ctx: Ctx) => ctx.count > 0

const m = machine.createMachine<Ctx, E, 'idle'>({
  initial: 'idle',
  context: {count: 0},
  states: {
    idle: {
      on: machine.on<Ctx, E>({
        DEC: {guard: canDec, actions: (ctx) => { ctx.count-- }},
        INC: {actions: (ctx) => { ctx.count++ }},
      }),
    },
  },
})
```

### Несколько actions в одном переходе

```ts
const log = (_: Ctx, e: E) => console.log('event', e.type)
const update = (ctx: Ctx) => { ctx.count++ }
const after = (_: Ctx) => console.log('updated')

const m2 = machine.createMachine<Ctx, E, 'idle'>({
  initial: 'idle',
  context: {count: 0},
  states: {
    idle: {
      on: machine.on<Ctx, E>({
        INC: {actions: [log, update, after]},
      }),
    },
  },
})
```
