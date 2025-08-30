[**unisignal**](../../../../README.md)

***

# Function: on()

> **on**\<`Ctx`, `E`\>(`mapping`): `Partial`\<`Record`\<`E`\[`"type"`\], [`TransitionConfig`](../type-aliases/TransitionConfig.md)\<`Ctx`, `Extract`\<`E`, \{ `type`: `string`; \}\>\>\>\>

Defined in: machine/fsm.ts:166

## Type Parameters

### Ctx

`Ctx`

### E

`E` *extends* [`EventObject`](../type-aliases/EventObject.md)

## Parameters

### mapping

`Partial`\<`Record`\<`E`\[`"type"`\], [`TransitionConfig`](../type-aliases/TransitionConfig.md)\<`Ctx`, `Extract`\<`E`, \{ `type`: `string`; \}\>\>\>\>

## Returns

`Partial`\<`Record`\<`E`\[`"type"`\], [`TransitionConfig`](../type-aliases/TransitionConfig.md)\<`Ctx`, `Extract`\<`E`, \{ `type`: `string`; \}\>\>\>\>
