[**unisignal**](../../../../README.md)

***

# Function: interpret()

> **interpret**\<`Ctx`, `E`, `S`\>(`machine`, `signals`): [`Interpreter`](../type-aliases/Interpreter.md)\<`Ctx`, `E`, `S`\>

Defined in: machine/fsm.ts:52

## Type Parameters

### Ctx

`Ctx`

### E

`E` *extends* [`EventObject`](../type-aliases/EventObject.md)

### S

`S` *extends* `string`

## Parameters

### machine

[`MachineConfig`](../type-aliases/MachineConfig.md)\<`Ctx`, `E`, `S`\>

### signals

[`SignalAdapter`](../../adapter/interfaces/SignalAdapter.md)

## Returns

[`Interpreter`](../type-aliases/Interpreter.md)\<`Ctx`, `E`, `S`\>
