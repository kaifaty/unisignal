[**unisignal**](../../../../README.md)

***

# Interface: PersistedSignalAdapter

Defined in: persist/types.ts:90

## Extends

- `Omit`\<[`SignalAdapter`](../../adapter/interfaces/SignalAdapter.md), `"state"`\>

## Methods

### computed()

> **computed**\<`T`\>(`fn`, `options?`): [`SignalComputed`](../../adapter/type-aliases/SignalComputed.md)\<`T`\>

Defined in: persist/types.ts:92

#### Type Parameters

##### T

`T`

#### Parameters

##### fn

() => `T`

##### options?

[`PersistComputedOptions`](../type-aliases/PersistComputedOptions.md)\<`T`\>

#### Returns

[`SignalComputed`](../../adapter/type-aliases/SignalComputed.md)\<`T`\>

#### Overrides

[`SignalAdapter`](../../adapter/interfaces/SignalAdapter.md).[`computed`](../../adapter/interfaces/SignalAdapter.md#computed)

***

### state()

> **state**\<`T`\>(`initial`, `options`): [`PersistState`](../type-aliases/PersistState.md)\<`T`\>

Defined in: persist/types.ts:91

#### Type Parameters

##### T

`T`

#### Parameters

##### initial

`T` | () => `T`

##### options

[`PersistOptions`](../type-aliases/PersistOptions.md)\<`T`\>

#### Returns

[`PersistState`](../type-aliases/PersistState.md)\<`T`\>
