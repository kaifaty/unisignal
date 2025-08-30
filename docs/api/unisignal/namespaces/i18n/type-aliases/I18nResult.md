[**unisignal**](../../../../README.md)

***

# Type Alias: I18nResult\<T, K, L, Vals\>

> **I18nResult**\<`T`, `K`, `L`, `Vals`\> = `T`\[`K`\]\[`L`\] *extends* `string` ? `Vals` *extends* [`PickValues`](PickValues.md)\<`T`, `K`, `L`\> ? `ReplaceString`\<`Vals`, `T`\[`K`\]\[`L`\]\> : `T`\[`K`\]\[`L`\] : `K`

Defined in: i18n/types.ts:51

## Type Parameters

### T

`T` *extends* [`TransStore`](TransStore.md)

### K

`K` *extends* keyof `T`

### L

`L` *extends* [`Lang`](Lang.md)

### Vals

`Vals` *extends* [`PickValues`](PickValues.md)\<`T`, `K`, `L`\> \| `undefined` = `undefined`
