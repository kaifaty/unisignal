[**unisignal**](../../../../README.md)

***

# Interface: KeyValueLike

Defined in: persist/adapters/kv-storage.ts:4

## Methods

### delete()

> **delete**(`key`): `void` \| `Promise`\<`void`\>

Defined in: persist/adapters/kv-storage.ts:7

#### Parameters

##### key

`string`

#### Returns

`void` \| `Promise`\<`void`\>

***

### get()

> **get**(`key`): `undefined` \| `string` \| `Promise`\<`undefined` \| `string`\>

Defined in: persist/adapters/kv-storage.ts:5

#### Parameters

##### key

`string`

#### Returns

`undefined` \| `string` \| `Promise`\<`undefined` \| `string`\>

***

### list()?

> `optional` **list**(): `string`[] \| `Promise`\<`string`[]\>

Defined in: persist/adapters/kv-storage.ts:8

#### Returns

`string`[] \| `Promise`\<`string`[]\>

***

### set()

> **set**(`key`, `value`): `void` \| `Promise`\<`void`\>

Defined in: persist/adapters/kv-storage.ts:6

#### Parameters

##### key

`string`

##### value

`string`

#### Returns

`void` \| `Promise`\<`void`\>
