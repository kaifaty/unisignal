[**unisignal**](../../../../README.md)

***

# Interface: SignalReadable\<T\>

Defined in: adapter/types.ts:1

## Extended by

- [`SignalWritable`](SignalWritable.md)

## Type Parameters

### T

`T`

## Methods

### get()

> **get**(): `T`

Defined in: adapter/types.ts:2

#### Returns

`T`

***

### peek()

> **peek**(): `T`

Defined in: adapter/types.ts:4

#### Returns

`T`

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
