[**unisignal**](../../../../README.md)

***

# Interface: SignalAdapter

Defined in: adapter/types.ts:15

## Methods

### computed()

> **computed**\<`T`\>(`fn`, `options?`): [`SignalComputed`](../type-aliases/SignalComputed.md)\<`T`\>

Defined in: adapter/types.ts:17

#### Type Parameters

##### T

`T`

#### Parameters

##### fn

() => `T`

##### options?

[`ComputedOptions`](../type-aliases/ComputedOptions.md)

#### Returns

[`SignalComputed`](../type-aliases/SignalComputed.md)\<`T`\>

***

### state()

> **state**\<`T`\>(`initial`): [`SignalWritable`](SignalWritable.md)\<`T`\>

Defined in: adapter/types.ts:16

#### Type Parameters

##### T

`T`

#### Parameters

##### initial

`T`

#### Returns

[`SignalWritable`](SignalWritable.md)\<`T`\>
