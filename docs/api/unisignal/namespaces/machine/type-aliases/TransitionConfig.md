[**unisignal**](../../../../README.md)

***

# Type Alias: TransitionConfig\<Ctx, E\>

> **TransitionConfig**\<`Ctx`, `E`\> = `object`

Defined in: machine/fsm.ts:15

## Type Parameters

### Ctx

`Ctx`

### E

`E` *extends* [`EventObject`](EventObject.md)

## Properties

### actions?

> `optional` **actions**: [`Action`](Action.md)\<`Ctx`, `E`\> \| [`Action`](Action.md)\<`Ctx`, `E`\>[]

Defined in: machine/fsm.ts:18

***

### guard?

> `optional` **guard**: [`Guard`](Guard.md)\<`Ctx`, `E`\>

Defined in: machine/fsm.ts:17

***

### target?

> `optional` **target**: `string`

Defined in: machine/fsm.ts:16
