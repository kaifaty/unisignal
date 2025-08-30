[**unisignal**](../../../../README.md)

***

# Type Alias: ParseString\<T\>

> **ParseString**\<`T`\> = `T` *extends* `undefined` ? `never` : `T` *extends* `` `${infer _}${${infer variable}}${infer E}` `` ? `variable` \| `ParseString`\<`E`\> : `T` *extends* `` `${infer _}${${infer variable}}` `` ? `variable` : `T` *extends* `` `${${infer variable}}` `` ? `variable` : `never`

Defined in: i18n/types.ts:17

## Type Parameters

### T

`T` *extends* `string` \| `undefined`
