[**unisignal**](../../../../README.md)

***

# Type Alias: MachineConfig\<Ctx, E, S\>

> **MachineConfig**\<`Ctx`, `E`, `S`\> = `object`

Defined in: machine/fsm.ts:21

## Type Parameters

### Ctx

`Ctx`

### E

`E` *extends* [`EventObject`](EventObject.md)

### S

`S` *extends* `string`

## Properties

### context

> **context**: `Ctx`

Defined in: machine/fsm.ts:24

***

### id?

> `optional` **id**: `string`

Defined in: machine/fsm.ts:22

***

### initial

> **initial**: `S`

Defined in: machine/fsm.ts:23

***

### states

> **states**: [`StatesConfig`](StatesConfig.md)\<`Ctx`, `E`, `S`\>

Defined in: machine/fsm.ts:25
