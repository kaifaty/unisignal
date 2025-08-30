[**unisignal**](../../../../README.md)

***

# Interface: CallableWritable()\<T\>

Defined in: adapter/types.ts:20

## Type Parameters

### T

`T`

> **CallableWritable**(): `T`

Defined in: adapter/types.ts:21

## Returns

`T`

## Methods

### get()

> **get**(): `T`

Defined in: adapter/types.ts:22

#### Returns

`T`

***

### peek()

> **peek**(): `T`

Defined in: adapter/types.ts:23

#### Returns

`T`

***

### set()

> **set**(`value`): `void`

Defined in: adapter/types.ts:24

#### Parameters

##### value

`T`

#### Returns

`void`

***

### subscribe()

> **subscribe**(`listener`, `subscriberName?`): () => `void`

Defined in: adapter/types.ts:25

#### Parameters

##### listener

(`value`) => `void`

##### subscriberName?

`string`

#### Returns

> (): `void`

##### Returns

`void`
