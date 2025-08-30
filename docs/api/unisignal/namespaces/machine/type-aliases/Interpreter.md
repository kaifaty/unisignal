[**unisignal**](../../../../README.md)

***

# Type Alias: Interpreter\<Ctx, E, S\>

> **Interpreter**\<`Ctx`, `E`, `S`\> = `object`

Defined in: machine/fsm.ts:37

## Type Parameters

### Ctx

`Ctx`

### E

`E` *extends* [`EventObject`](EventObject.md)

### S

`S` *extends* `string`

## Properties

### state

> **state**: [`SignalReadable`](../../adapter/interfaces/SignalReadable.md)\<[`State`](State.md)\<`Ctx`, `S`\>\>

Defined in: machine/fsm.ts:43

## Methods

### getSnapshot()

> **getSnapshot**(): [`State`](State.md)\<`Ctx`, `S`\>

Defined in: machine/fsm.ts:42

#### Returns

[`State`](State.md)\<`Ctx`, `S`\>

***

### send()

> **send**(`event`): `void`

Defined in: machine/fsm.ts:40

#### Parameters

##### event

`E`

#### Returns

`void`

***

### start()

> **start**(): `Interpreter`\<`Ctx`, `E`, `S`\>

Defined in: machine/fsm.ts:38

#### Returns

`Interpreter`\<`Ctx`, `E`, `S`\>

***

### stop()

> **stop**(): `Interpreter`\<`Ctx`, `E`, `S`\>

Defined in: machine/fsm.ts:39

#### Returns

`Interpreter`\<`Ctx`, `E`, `S`\>

***

### subscribe()

> **subscribe**(`listener`): `object`

Defined in: machine/fsm.ts:41

#### Parameters

##### listener

(`state`) => `void`

#### Returns

`object`

##### unsubscribe()

> **unsubscribe**(): `void`

###### Returns

`void`
