[**unisignal**](../../../../README.md)

***

# Variable: persist

> `const` **persist**: `object`

Defined in: persist/persist.ts:210

## Type Declaration

### clearAll()

> **clearAll**(`base`, `options`): `Promise`\<`void`\>

#### Parameters

##### base

[`SignalAdapter`](../../adapter/interfaces/SignalAdapter.md)

##### options

[`ListOptions`](../type-aliases/ListOptions.md) = `{}`

#### Returns

`Promise`\<`void`\>

### computed()

> **computed**\<`T`\>(`base`, `fn`, `options?`): [`SignalComputed`](../../adapter/type-aliases/SignalComputed.md)\<`T`\>

#### Type Parameters

##### T

`T`

#### Parameters

##### base

[`SignalAdapter`](../../adapter/interfaces/SignalAdapter.md)

##### fn

() => `T`

##### options?

[`PersistComputedOptions`](../type-aliases/PersistComputedOptions.md)\<`T`\>

#### Returns

[`SignalComputed`](../../adapter/type-aliases/SignalComputed.md)\<`T`\>

### enhancer()

> **enhancer**(`opts`): `AdapterEnhancer`

#### Parameters

##### opts

[`CreatePersistedAdapterOptions`](../type-aliases/CreatePersistedAdapterOptions.md) = `{}`

#### Returns

`AdapterEnhancer`

### keys()

> **keys**(`base`, `options`): `Promise`\<`string`[]\>

#### Parameters

##### base

[`SignalAdapter`](../../adapter/interfaces/SignalAdapter.md)

##### options

[`ListOptions`](../type-aliases/ListOptions.md) = `{}`

#### Returns

`Promise`\<`string`[]\>

### state()

> **state**\<`T`\>(`base`, `initial`, `options`): [`PersistState`](../type-aliases/PersistState.md)\<`T`\>

#### Type Parameters

##### T

`T`

#### Parameters

##### base

[`SignalAdapter`](../../adapter/interfaces/SignalAdapter.md)

##### initial

`T` | () => `T`

##### options

[`PersistStateOptions`](../type-aliases/PersistStateOptions.md)\<`T`\>

#### Returns

[`PersistState`](../type-aliases/PersistState.md)\<`T`\>

### use()

> **use**(`base`, ...`enhancers`): [`SignalAdapter`](../../adapter/interfaces/SignalAdapter.md)

#### Parameters

##### base

[`SignalAdapter`](../../adapter/interfaces/SignalAdapter.md)

##### enhancers

...`AdapterEnhancer`[]

#### Returns

[`SignalAdapter`](../../adapter/interfaces/SignalAdapter.md)

### with()

> **with**(`defaults`): `object`

#### Parameters

##### defaults

###### namespace?

`string` \| (`name`) => `string`

###### storage?

`"session"` \| `"local"` \| [`PersistAdapter`](../interfaces/PersistAdapter.md) \| `"idb"`

#### Returns

`object`

##### clearAll()

> **clearAll**(`base`, `options`): `Promise`\<`void`\>

###### Parameters

###### base

[`SignalAdapter`](../../adapter/interfaces/SignalAdapter.md)

###### options

`Omit`\<[`ListOptions`](../type-aliases/ListOptions.md), `"storage"` \| `"namespace"`\> & `object` = `{}`

###### Returns

`Promise`\<`void`\>

##### computed()

> **computed**\<`T`\>(`base`, `fn`, `options?`): [`SignalComputed`](../../adapter/type-aliases/SignalComputed.md)\<`T`\>

###### Type Parameters

###### T

`T`

###### Parameters

###### base

[`SignalAdapter`](../../adapter/interfaces/SignalAdapter.md)

###### fn

() => `T`

###### options?

`Omit`\<[`PersistComputedOptions`](../type-aliases/PersistComputedOptions.md)\<`T`\>, `"storage"` \| `"namespace"`\> & `object`

###### Returns

[`SignalComputed`](../../adapter/type-aliases/SignalComputed.md)\<`T`\>

##### keys()

> **keys**(`base`, `options`): `Promise`\<`string`[]\>

###### Parameters

###### base

[`SignalAdapter`](../../adapter/interfaces/SignalAdapter.md)

###### options

`Omit`\<[`ListOptions`](../type-aliases/ListOptions.md), `"storage"` \| `"namespace"`\> & `object` = `{}`

###### Returns

`Promise`\<`string`[]\>

##### state()

> **state**\<`T`\>(`base`, `initial`, `options`): [`PersistState`](../type-aliases/PersistState.md)\<`T`\>

###### Type Parameters

###### T

`T`

###### Parameters

###### base

[`SignalAdapter`](../../adapter/interfaces/SignalAdapter.md)

###### initial

`T` | () => `T`

###### options

`Omit`\<[`PersistStateOptions`](../type-aliases/PersistStateOptions.md)\<`T`\>, `"storage"` \| `"namespace"`\> & `object`

###### Returns

[`PersistState`](../type-aliases/PersistState.md)\<`T`\>

##### wrap()

> **wrap**\<`T`\>(`base`, `external`, `options`): [`PersistState`](../type-aliases/PersistState.md)\<`T`\>

###### Type Parameters

###### T

`T`

###### Parameters

###### base

[`SignalAdapter`](../../adapter/interfaces/SignalAdapter.md)

###### external

[`WritableLike`](../type-aliases/WritableLike.md)\<`T`\>

###### options

`Omit`\<[`PersistStateOptions`](../type-aliases/PersistStateOptions.md)\<`T`\>, `"storage"` \| `"namespace"`\> & `object`

###### Returns

[`PersistState`](../type-aliases/PersistState.md)\<`T`\>

### wrap()

> **wrap**\<`T`\>(`base`, `external`, `options`): [`PersistState`](../type-aliases/PersistState.md)\<`T`\>

#### Type Parameters

##### T

`T`

#### Parameters

##### base

[`SignalAdapter`](../../adapter/interfaces/SignalAdapter.md)

##### external

[`WritableLike`](../type-aliases/WritableLike.md)\<`T`\>

##### options

[`PersistStateOptions`](../type-aliases/PersistStateOptions.md)\<`T`\>

#### Returns

[`PersistState`](../type-aliases/PersistState.md)\<`T`\>
