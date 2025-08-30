[**unisignal**](../../../../README.md)

***

# Interface: PersistAdapter

Defined in: persist/types.ts:17

## Properties

### isAsync

> **isAsync**: `boolean`

Defined in: persist/types.ts:18

## Methods

### clear()

> **clear**(`name`): `void`

Defined in: persist/types.ts:21

#### Parameters

##### name

`string`

#### Returns

`void`

***

### get()

> **get**(`name`): `unknown`

Defined in: persist/types.ts:19

#### Parameters

##### name

`string`

#### Returns

`unknown`

***

### keys()

> **keys**(): `string`[] \| `Promise`\<`string`[]\>

Defined in: persist/types.ts:22

#### Returns

`string`[] \| `Promise`\<`string`[]\>

***

### set()

> **set**(`name`, `value`): `void`

Defined in: persist/types.ts:20

#### Parameters

##### name

`string`

##### value

`unknown`

#### Returns

`void`
