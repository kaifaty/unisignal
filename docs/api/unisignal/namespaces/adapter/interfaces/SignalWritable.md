[**unisignal**](../../../../README.md)

***

# Interface: SignalWritable\<T\>

Defined in: adapter/types.ts:7

## Extends

- [`SignalReadable`](SignalReadable.md)\<`T`\>

## Type Parameters

### T

`T`

## Methods

### get()

> **get**(): `T`

Defined in: adapter/types.ts:2

#### Returns

`T`

#### Inherited from

[`SignalReadable`](SignalReadable.md).[`get`](SignalReadable.md#get)

***

### peek()

> **peek**(): `T`

Defined in: adapter/types.ts:4

#### Returns

`T`

#### Inherited from

[`SignalReadable`](SignalReadable.md).[`peek`](SignalReadable.md#peek)

***

### set()

> **set**(`value`): `void`

Defined in: adapter/types.ts:8

#### Parameters

##### value

`T`

#### Returns

`void`

***

### subscribe()

> **subscribe**(`listener`, `subscriberName?`): () => `void`

Defined in: adapter/types.ts:3

#### Parameters

##### listener

(`value`) => `void`

##### subscriberName?

`string`

#### Returns

> (): `void`

##### Returns

`void`

#### Inherited from

[`SignalReadable`](SignalReadable.md).[`subscribe`](SignalReadable.md#subscribe)
