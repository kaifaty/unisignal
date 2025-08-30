[**unisignal**](../../../../README.md)

***

# Type Alias: StateNodeConfig\<Ctx, E\>

> **StateNodeConfig**\<`Ctx`, `E`\> = `object`

Defined in: machine/fsm.ts:7

## Type Parameters

### Ctx

`Ctx`

### E

`E` *extends* [`EventObject`](EventObject.md)

## Properties

### entry?

> `optional` **entry**: [`Action`](Action.md)\<`Ctx`, `E`\> \| [`Action`](Action.md)\<`Ctx`, `E`\>[]

Defined in: machine/fsm.ts:9

***

### exit?

> `optional` **exit**: [`Action`](Action.md)\<`Ctx`, `E`\> \| [`Action`](Action.md)\<`Ctx`, `E`\>[]

Defined in: machine/fsm.ts:10

***

### on?

> `optional` **on**: `Partial`\<`Record`\<`E`\[`"type"`\], [`TransitionConfig`](TransitionConfig.md)\<`Ctx`, `Extract`\<`E`, \{ `type`: `string`; \}\>\>\>\>

Defined in: machine/fsm.ts:8
