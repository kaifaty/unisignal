[**unisignal**](../../../../README.md)

***

# Class: Router

Defined in: router/router.ts:205

## Extends

- `Routes`

## Constructors

### Constructor

> **new Router**(`symbol`, `name`, `renderFn`, `entry?`, `parent?`): `Router`

Defined in: router/router.ts:168

#### Parameters

##### symbol

`symbol`

##### name

`string` = `'/'`

##### renderFn

`RenderFn`

##### entry?

`Entry`

##### parent?

`Routes`

#### Returns

`Router`

#### Inherited from

`Routes.constructor`

## Properties

### name

> `readonly` **name**: `string` = `'/'`

Defined in: router/router.ts:170

#### Inherited from

`Routes.name`

***

### currentRoute

> `static` **currentRoute**: `undefined` \| [`SignalWritable`](../../adapter/interfaces/SignalWritable.md)\<`undefined` \| `Routes`\>

Defined in: router/router.ts:68

#### Inherited from

`Routes.currentRoute`

***

### history

> `static` **history**: `Routes`[] = `[]`

Defined in: router/router.ts:67

#### Inherited from

`Routes.history`

***

### maxHistoryLength

> `static` **maxHistoryLength**: `number` = `10`

Defined in: router/router.ts:64

#### Inherited from

`Routes.maxHistoryLength`

## Accessors

### cnstr

#### Get Signature

> **get** **cnstr**(): `any`

Defined in: router/router.ts:200

##### Returns

`any`

#### Inherited from

`Routes.cnstr`

## Methods

### addChild()

> **addChild**(`__namedParameters`): `any`

Defined in: router/router.ts:195

#### Parameters

##### \_\_namedParameters

`ChildParams`

#### Returns

`any`

#### Inherited from

`Routes.addChild`

***

### getFullPath()

> **getFullPath**(): `string`

Defined in: router/router.ts:185

#### Returns

`string`

#### Inherited from

`Routes.getFullPath`

***

### render()

> **render**(`outerFn?`, `query?`): `unknown`

Defined in: router/router.ts:179

#### Parameters

##### outerFn?

`RenderOuter`

##### query?

`Record`\<`string`, `string`\>

#### Returns

`unknown`

#### Inherited from

`Routes.render`

***

### \_\_goto()

> `static` **\_\_goto**(`__namedParameters`): `Promise`\<`boolean`\>

Defined in: router/router.ts:118

#### Parameters

##### \_\_namedParameters

`GotoParams`

#### Returns

`Promise`\<`boolean`\>

#### Inherited from

`Routes.__goto`

***

### \_\_resetLoopForTests()

> `static` **\_\_resetLoopForTests**(): `void`

Defined in: router/router.ts:207

#### Returns

`void`

***

### back()

> `static` **back**(): `Promise`\<`undefined` \| `boolean`\>

Defined in: router/router.ts:221

#### Returns

`Promise`\<`undefined` \| `boolean`\>

***

### configure()

> `static` **configure**(`adapter`, `options`): `void`

Defined in: router/router.ts:70

#### Parameters

##### adapter

[`SignalAdapter`](../../adapter/interfaces/SignalAdapter.md)

##### options

###### withUrl?

`boolean`

#### Returns

`void`

#### Inherited from

`Routes.configure`

***

### errorFallback()

> `static` **errorFallback**(): `string`

Defined in: router/router.ts:92

#### Returns

`string`

#### Inherited from

`Routes.errorFallback`

***

### goto()

> `static` **goto**(`path`, `fromUrl`): `Promise`\<`boolean`\>

Defined in: router/router.ts:237

#### Parameters

##### path

`string`

##### fromUrl

`boolean` = `false`

#### Returns

`Promise`\<`boolean`\>

***

### initRoot()

> `static` **initRoot**(`__namedParameters`): `Routes`

Defined in: router/router.ts:112

#### Parameters

##### \_\_namedParameters

`InitParams`

#### Returns

`Routes`

#### Inherited from

`Routes.initRoot`

***

### renderFunction()

> `static` **renderFunction**\<`T`\>(`data`, `container`): `void`

Defined in: router/router.ts:95

#### Type Parameters

##### T

`T` *extends* `unknown`

#### Parameters

##### data

`T`

##### container

`any`

#### Returns

`void`

#### Inherited from

`Routes.renderFunction`

***

### replace()

> `static` **replace**(`path`): `Promise`\<`boolean`\>

Defined in: router/router.ts:230

#### Parameters

##### path

`string`

#### Returns

`Promise`\<`boolean`\>

***

### start()

> `static` **start**(): `void`

Defined in: router/router.ts:212

#### Returns

`void`

***

### stop()

> `static` **stop**(): `void`

Defined in: router/router.ts:217

#### Returns

`void`
