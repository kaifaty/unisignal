[**unisignal**](../../../../README.md)

***

# Type Alias: PersistOptions\<T\>

> **PersistOptions**\<`T`\> = `object`

Defined in: persist/types.ts:41

## Type Parameters

### T

`T`

## Properties

### broadcastChannelName?

> `optional` **broadcastChannelName**: `string`

Defined in: persist/types.ts:78

***

### debug?

> `optional` **debug**: `boolean` \| \{ `logger?`: (`message`, `context`) => `void`; \}

Defined in: persist/types.ts:47

Диагностика: включить подробные логи или передать кастомный логгер

***

### decrypt()?

> `optional` **decrypt**: (`ciphertext`) => `string`

Defined in: persist/types.ts:50

#### Parameters

##### ciphertext

`string`

#### Returns

`string`

***

### deserialize()?

> `optional` **deserialize**: (`raw`) => `T`

Defined in: persist/types.ts:84

#### Parameters

##### raw

`any`

#### Returns

`T`

***

### encrypt()?

> `optional` **encrypt**: (`plaintext`) => `string`

Defined in: persist/types.ts:49

Ограничения и безопасность

#### Parameters

##### plaintext

`string`

#### Returns

`string`

***

### maxSizeKb?

> `optional` **maxSizeKb**: `number`

Defined in: persist/types.ts:51

***

### migrations?

> `optional` **migrations**: `Record`\<`number`, (`oldValue`) => `any`\>

Defined in: persist/types.ts:80

***

### name

> **name**: `string`

Defined in: persist/types.ts:42

***

### namespace?

> `optional` **namespace**: `string` \| (`name`) => `string`

Defined in: persist/types.ts:76

***

### onClear()?

> `optional` **onClear**: (`initialValue`) => `void`

Defined in: persist/types.ts:57

Событие: очистка значения (clear)

#### Parameters

##### initialValue

`T`

#### Returns

`void`

***

### onError()?

> `optional` **onError**: (`error`, `ctx`) => `void`

Defined in: persist/types.ts:59

Событие: ошибка при восстановлении/валидации/десериализации/синхронизации/записи

#### Parameters

##### error

`unknown`

##### ctx

###### phase

`"deserialize"` \| `"validate"` \| `"migrate"` \| `"restore"` \| `"persist"` \| `"clear"` \| `"sync"` \| `"init"` \| `"encrypt"` \| `"decrypt"` \| `"limit"`

#### Returns

`void`

***

### onExpire()?

> `optional` **onExpire**: () => `void`

Defined in: persist/types.ts:82

#### Returns

`void`

***

### onPersisStateInit()?

> `optional` **onPersisStateInit**: (`value`) => `void`

Defined in: persist/types.ts:45

#### Parameters

##### value

`T`

#### Returns

`void`

***

### onPersist()?

> `optional` **onPersist**: (`value`) => `void`

Defined in: persist/types.ts:55

Событие: запись значения в сторадж

#### Parameters

##### value

`T`

#### Returns

`void`

***

### onRestore()?

> `optional` **onRestore**: (`value`) => `void`

Defined in: persist/types.ts:53

Событие: успешное восстановление значения

#### Parameters

##### value

`T`

#### Returns

`void`

***

### restoreFn?

> `optional` **restoreFn**: [`RestoreFn`](RestoreFn.md)\<`T`\>

Defined in: persist/types.ts:44

***

### serialize()?

> `optional` **serialize**: (`value`) => `any`

Defined in: persist/types.ts:83

#### Parameters

##### value

`T`

#### Returns

`any`

***

### sync?

> `optional` **sync**: `"storage"` \| `"broadcast"` \| `false`

Defined in: persist/types.ts:77

***

### throttle?

> `optional` **throttle**: `number`

Defined in: persist/types.ts:43

***

### ttlMs?

> `optional` **ttlMs**: `number`

Defined in: persist/types.ts:81

***

### validate()?

> `optional` **validate**: (`value`) => `boolean`

Defined in: persist/types.ts:85

#### Parameters

##### value

`T`

#### Returns

`boolean`

***

### version?

> `optional` **version**: `number`

Defined in: persist/types.ts:79
