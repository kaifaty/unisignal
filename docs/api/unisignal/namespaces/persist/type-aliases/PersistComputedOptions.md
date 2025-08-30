[**unisignal**](../../../../README.md)

***

# Type Alias: PersistComputedOptions\<T\>

> **PersistComputedOptions**\<`T`\> = [`ComputedOptions`](../../adapter/type-aliases/ComputedOptions.md) & `object`

Defined in: persist/types.ts:112

## Type Declaration

### debug?

> `optional` **debug**: `boolean` \| \{ `logger?`: (`message`, `context`) => `void`; \}

Диагностика

### deserialize()?

> `optional` **deserialize**: (`raw`) => `T`

#### Parameters

##### raw

`any`

#### Returns

`T`

### name?

> `optional` **name**: `string`

Имя ключа для кэша

### namespace?

> `optional` **namespace**: `string` \| (`name`) => `string`

Необязательный namespace для ключа

### persist?

> `optional` **persist**: `boolean`

Включить кэш для computed в сторадже (по умолчанию выключен)

### serialize()?

> `optional` **serialize**: (`value`) => `any`

Сериализация/десериализация и валидация значения

#### Parameters

##### value

`T`

#### Returns

`any`

### storage?

> `optional` **storage**: [`StorageKind`](StorageKind.md) \| [`PersistAdapter`](../interfaces/PersistAdapter.md)

Хранилище для кэша

### ttlMs?

> `optional` **ttlMs**: `number`

TTL для кэшированного значения

### validate()?

> `optional` **validate**: (`value`) => `boolean`

#### Parameters

##### value

`T`

#### Returns

`boolean`

## Type Parameters

### T

`T`
