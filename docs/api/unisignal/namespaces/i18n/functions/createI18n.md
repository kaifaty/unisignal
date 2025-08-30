[**unisignal**](../../../../README.md)

***

# Function: createI18n()

> **createI18n**\<`T`, `L`\>(`adapter`, `data`, `lang`, `options`): `object`

Defined in: i18n/translation.ts:33

## Type Parameters

### T

`T` *extends* `Readonly`\<\{\[`key`: `string`\]: `Readonly`\<`Partial`\<\{ `aa`: `string`; `ab`: `string`; `ae`: `string`; `af`: `string`; `ak`: `string`; `am`: `string`; `an`: `string`; `ar`: `string`; `as`: `string`; `av`: `string`; `ay`: `string`; `az`: `string`; `ba`: `string`; `be`: `string`; `bg`: `string`; `bh`: `string`; `bi`: `string`; `bm`: `string`; `bn`: `string`; `bo`: `string`; `br`: `string`; `bs`: `string`; `ca`: `string`; `ce`: `string`; `ch`: `string`; `co`: `string`; `cr`: `string`; `cs`: `string`; `cu`: `string`; `cv`: `string`; `cy`: `string`; `da`: `string`; `de`: `string`; `dv`: `string`; `dz`: `string`; `ee`: `string`; `el`: `string`; `en`: `string`; `eo`: `string`; `es`: `string`; `et`: `string`; `eu`: `string`; `fa`: `string`; `ff`: `string`; `fi`: `string`; `fj`: `string`; `fo`: `string`; `fr`: `string`; `fy`: `string`; `ga`: `string`; `gd`: `string`; `gl`: `string`; `gn`: `string`; `gu`: `string`; `gv`: `string`; `ha`: `string`; `he`: `string`; `hi`: `string`; `ho`: `string`; `hr`: `string`; `ht`: `string`; `hu`: `string`; `hy`: `string`; `hz`: `string`; `ia`: `string`; `id`: `string`; `ie`: `string`; `ig`: `string`; `ii`: `string`; `ik`: `string`; `io`: `string`; `is`: `string`; `it`: `string`; `iu`: `string`; `ja`: `string`; `jv`: `string`; `ka`: `string`; `kg`: `string`; `ki`: `string`; `kj`: `string`; `kk`: `string`; `kl`: `string`; `km`: `string`; `kn`: `string`; `ko`: `string`; `kr`: `string`; `ks`: `string`; `ku`: `string`; `kv`: `string`; `kw`: `string`; `ky`: `string`; `la`: `string`; `lb`: `string`; `lg`: `string`; `li`: `string`; `ln`: `string`; `lo`: `string`; `lt`: `string`; `lu`: `string`; `lv`: `string`; `mg`: `string`; `mh`: `string`; `mi`: `string`; `mk`: `string`; `ml`: `string`; `mn`: `string`; `mr`: `string`; `ms`: `string`; `mt`: `string`; `my`: `string`; `na`: `string`; `nb`: `string`; `nd`: `string`; `ne`: `string`; `ng`: `string`; `nl`: `string`; `nn`: `string`; `no`: `string`; `nr`: `string`; `nv`: `string`; `ny`: `string`; `oc`: `string`; `oj`: `string`; `om`: `string`; `or`: `string`; `os`: `string`; `pa`: `string`; `pi`: `string`; `pl`: `string`; `ps`: `string`; `pt`: `string`; `qu`: `string`; `rm`: `string`; `rn`: `string`; `ro`: `string`; `ru`: `string`; `rw`: `string`; `sa`: `string`; `sc`: `string`; `sd`: `string`; `se`: `string`; `sg`: `string`; `si`: `string`; `sk`: `string`; `sl`: `string`; `sm`: `string`; `sn`: `string`; `so`: `string`; `sq`: `string`; `sr`: `string`; `ss`: `string`; `st`: `string`; `su`: `string`; `sv`: `string`; `sw`: `string`; `ta`: `string`; `te`: `string`; `tg`: `string`; `th`: `string`; `ti`: `string`; `tk`: `string`; `tl`: `string`; `tn`: `string`; `to`: `string`; `tr`: `string`; `ts`: `string`; `tt`: `string`; `tw`: `string`; `ty`: `string`; `ug`: `string`; `uk`: `string`; `ur`: `string`; `uz`: `string`; `ve`: `string`; `vi`: `string`; `vo`: `string`; `wa`: `string`; `wo`: `string`; `xh`: `string`; `yi`: `string`; `yo`: `string`; `za`: `string`; `zh`: `string`; `zu`: `string`; \}\>\>; \}\>

### L

`L` *extends* `"id"` \| `"br"` \| `"hr"` \| `"li"` \| `"th"` \| `"tr"` \| `"tt"` \| `"mi"` \| `"mn"` \| `"ms"` \| `"so"` \| `"it"` \| `"ts"` \| `"es"` \| `"tk"` \| `"te"` \| `"ca"` \| `"ie"` \| `"el"` \| `"ab"` \| `"aa"` \| `"af"` \| `"ak"` \| `"sq"` \| `"am"` \| `"ar"` \| `"an"` \| `"hy"` \| `"as"` \| `"av"` \| `"ae"` \| `"ay"` \| `"az"` \| `"bm"` \| `"ba"` \| `"eu"` \| `"be"` \| `"bn"` \| `"bh"` \| `"bi"` \| `"bs"` \| `"bg"` \| `"my"` \| `"km"` \| `"ch"` \| `"ce"` \| `"ny"` \| `"zh"` \| `"cu"` \| `"cv"` \| `"kw"` \| `"co"` \| `"cr"` \| `"cs"` \| `"da"` \| `"dv"` \| `"nl"` \| `"dz"` \| `"en"` \| `"eo"` \| `"et"` \| `"ee"` \| `"fo"` \| `"fj"` \| `"fi"` \| `"fr"` \| `"ff"` \| `"gd"` \| `"gl"` \| `"lg"` \| `"ka"` \| `"de"` \| `"ki"` \| `"kl"` \| `"gn"` \| `"gu"` \| `"ht"` \| `"ha"` \| `"he"` \| `"hz"` \| `"hi"` \| `"ho"` \| `"hu"` \| `"is"` \| `"io"` \| `"ig"` \| `"ia"` \| `"iu"` \| `"ik"` \| `"ga"` \| `"ja"` \| `"jv"` \| `"kn"` \| `"kr"` \| `"ks"` \| `"kk"` \| `"rw"` \| `"kv"` \| `"kg"` \| `"ko"` \| `"kj"` \| `"ku"` \| `"ky"` \| `"lo"` \| `"la"` \| `"lv"` \| `"lb"` \| `"ln"` \| `"lt"` \| `"lu"` \| `"mk"` \| `"mg"` \| `"ml"` \| `"mt"` \| `"gv"` \| `"mr"` \| `"mh"` \| `"ro"` \| `"na"` \| `"nv"` \| `"nd"` \| `"ng"` \| `"ne"` \| `"se"` \| `"no"` \| `"nb"` \| `"nn"` \| `"ii"` \| `"oc"` \| `"oj"` \| `"or"` \| `"om"` \| `"os"` \| `"pi"` \| `"pa"` \| `"ps"` \| `"fa"` \| `"pl"` \| `"pt"` \| `"qu"` \| `"rm"` \| `"rn"` \| `"ru"` \| `"sm"` \| `"sg"` \| `"sa"` \| `"sc"` \| `"sr"` \| `"sn"` \| `"sd"` \| `"si"` \| `"sk"` \| `"sl"` \| `"st"` \| `"nr"` \| `"su"` \| `"sw"` \| `"ss"` \| `"sv"` \| `"tl"` \| `"ty"` \| `"tg"` \| `"ta"` \| `"bo"` \| `"ti"` \| `"to"` \| `"tn"` \| `"tw"` \| `"ug"` \| `"uk"` \| `"ur"` \| `"uz"` \| `"ve"` \| `"vi"` \| `"vo"` \| `"wa"` \| `"cy"` \| `"fy"` \| `"wo"` \| `"xh"` \| `"yi"` \| `"yo"` \| `"za"` \| `"zu"`

## Parameters

### adapter

[`SignalAdapter`](../../adapter/interfaces/SignalAdapter.md)

### data

`T`

### lang

`L`

### options

`I18nOptions`\<`T`\> = `{}`

## Returns

`object`

### errorState

> **errorState**: [`SignalWritable`](../../adapter/interfaces/SignalWritable.md)\<`unknown`\>

### exists()

> **exists**: (`key`, `lang?`) => `boolean`

#### Parameters

##### key

keyof `T`

##### lang?

`"id"` | `"br"` | `"hr"` | `"li"` | `"th"` | `"tr"` | `"tt"` | `"mi"` | `"mn"` | `"ms"` | `"so"` | `"it"` | `"ts"` | `"es"` | `"tk"` | `"te"` | `"ca"` | `"ie"` | `"el"` | `"ab"` | `"aa"` | `"af"` | `"ak"` | `"sq"` | `"am"` | `"ar"` | `"an"` | `"hy"` | `"as"` | `"av"` | `"ae"` | `"ay"` | `"az"` | `"bm"` | `"ba"` | `"eu"` | `"be"` | `"bn"` | `"bh"` | `"bi"` | `"bs"` | `"bg"` | `"my"` | `"km"` | `"ch"` | `"ce"` | `"ny"` | `"zh"` | `"cu"` | `"cv"` | `"kw"` | `"co"` | `"cr"` | `"cs"` | `"da"` | `"dv"` | `"nl"` | `"dz"` | `"en"` | `"eo"` | `"et"` | `"ee"` | `"fo"` | `"fj"` | `"fi"` | `"fr"` | `"ff"` | `"gd"` | `"gl"` | `"lg"` | `"ka"` | `"de"` | `"ki"` | `"kl"` | `"gn"` | `"gu"` | `"ht"` | `"ha"` | `"he"` | `"hz"` | `"hi"` | `"ho"` | `"hu"` | `"is"` | `"io"` | `"ig"` | `"ia"` | `"iu"` | `"ik"` | `"ga"` | `"ja"` | `"jv"` | `"kn"` | `"kr"` | `"ks"` | `"kk"` | `"rw"` | `"kv"` | `"kg"` | `"ko"` | `"kj"` | `"ku"` | `"ky"` | `"lo"` | `"la"` | `"lv"` | `"lb"` | `"ln"` | `"lt"` | `"lu"` | `"mk"` | `"mg"` | `"ml"` | `"mt"` | `"gv"` | `"mr"` | `"mh"` | `"ro"` | `"na"` | `"nv"` | `"nd"` | `"ng"` | `"ne"` | `"se"` | `"no"` | `"nb"` | `"nn"` | `"ii"` | `"oc"` | `"oj"` | `"or"` | `"om"` | `"os"` | `"pi"` | `"pa"` | `"ps"` | `"fa"` | `"pl"` | `"pt"` | `"qu"` | `"rm"` | `"rn"` | `"ru"` | `"sm"` | `"sg"` | `"sa"` | `"sc"` | `"sr"` | `"sn"` | `"sd"` | `"si"` | `"sk"` | `"sl"` | `"st"` | `"nr"` | `"su"` | `"sw"` | `"ss"` | `"sv"` | `"tl"` | `"ty"` | `"tg"` | `"ta"` | `"bo"` | `"ti"` | `"to"` | `"tn"` | `"tw"` | `"ug"` | `"uk"` | `"ur"` | `"uz"` | `"ve"` | `"vi"` | `"vo"` | `"wa"` | `"cy"` | `"fy"` | `"wo"` | `"xh"` | `"yi"` | `"yo"` | `"za"` | `"zu"`

#### Returns

`boolean`

### getLang()

> **getLang**: () => `"id"` \| `"br"` \| `"hr"` \| `"li"` \| `"th"` \| `"tr"` \| `"tt"` \| `"mi"` \| `"mn"` \| `"ms"` \| `"so"` \| `"it"` \| `"ts"` \| `"es"` \| `"tk"` \| `"te"` \| `"ca"` \| `"ie"` \| `"el"` \| `"ab"` \| `"aa"` \| `"af"` \| `"ak"` \| `"sq"` \| `"am"` \| `"ar"` \| `"an"` \| `"hy"` \| `"as"` \| `"av"` \| `"ae"` \| `"ay"` \| `"az"` \| `"bm"` \| `"ba"` \| `"eu"` \| `"be"` \| `"bn"` \| `"bh"` \| `"bi"` \| `"bs"` \| `"bg"` \| `"my"` \| `"km"` \| `"ch"` \| `"ce"` \| `"ny"` \| `"zh"` \| `"cu"` \| `"cv"` \| `"kw"` \| `"co"` \| `"cr"` \| `"cs"` \| `"da"` \| `"dv"` \| `"nl"` \| `"dz"` \| `"en"` \| `"eo"` \| `"et"` \| `"ee"` \| `"fo"` \| `"fj"` \| `"fi"` \| `"fr"` \| `"ff"` \| `"gd"` \| `"gl"` \| `"lg"` \| `"ka"` \| `"de"` \| `"ki"` \| `"kl"` \| `"gn"` \| `"gu"` \| `"ht"` \| `"ha"` \| `"he"` \| `"hz"` \| `"hi"` \| `"ho"` \| `"hu"` \| `"is"` \| `"io"` \| `"ig"` \| `"ia"` \| `"iu"` \| `"ik"` \| `"ga"` \| `"ja"` \| `"jv"` \| `"kn"` \| `"kr"` \| `"ks"` \| `"kk"` \| `"rw"` \| `"kv"` \| `"kg"` \| `"ko"` \| `"kj"` \| `"ku"` \| `"ky"` \| `"lo"` \| `"la"` \| `"lv"` \| `"lb"` \| `"ln"` \| `"lt"` \| `"lu"` \| `"mk"` \| `"mg"` \| `"ml"` \| `"mt"` \| `"gv"` \| `"mr"` \| `"mh"` \| `"ro"` \| `"na"` \| `"nv"` \| `"nd"` \| `"ng"` \| `"ne"` \| `"se"` \| `"no"` \| `"nb"` \| `"nn"` \| `"ii"` \| `"oc"` \| `"oj"` \| `"or"` \| `"om"` \| `"os"` \| `"pi"` \| `"pa"` \| `"ps"` \| `"fa"` \| `"pl"` \| `"pt"` \| `"qu"` \| `"rm"` \| `"rn"` \| `"ru"` \| `"sm"` \| `"sg"` \| `"sa"` \| `"sc"` \| `"sr"` \| `"sn"` \| `"sd"` \| `"si"` \| `"sk"` \| `"sl"` \| `"st"` \| `"nr"` \| `"su"` \| `"sw"` \| `"ss"` \| `"sv"` \| `"tl"` \| `"ty"` \| `"tg"` \| `"ta"` \| `"bo"` \| `"ti"` \| `"to"` \| `"tn"` \| `"tw"` \| `"ug"` \| `"uk"` \| `"ur"` \| `"uz"` \| `"ve"` \| `"vi"` \| `"vo"` \| `"wa"` \| `"cy"` \| `"fy"` \| `"wo"` \| `"xh"` \| `"yi"` \| `"yo"` \| `"za"` \| `"zu"`

#### Returns

`"id"` \| `"br"` \| `"hr"` \| `"li"` \| `"th"` \| `"tr"` \| `"tt"` \| `"mi"` \| `"mn"` \| `"ms"` \| `"so"` \| `"it"` \| `"ts"` \| `"es"` \| `"tk"` \| `"te"` \| `"ca"` \| `"ie"` \| `"el"` \| `"ab"` \| `"aa"` \| `"af"` \| `"ak"` \| `"sq"` \| `"am"` \| `"ar"` \| `"an"` \| `"hy"` \| `"as"` \| `"av"` \| `"ae"` \| `"ay"` \| `"az"` \| `"bm"` \| `"ba"` \| `"eu"` \| `"be"` \| `"bn"` \| `"bh"` \| `"bi"` \| `"bs"` \| `"bg"` \| `"my"` \| `"km"` \| `"ch"` \| `"ce"` \| `"ny"` \| `"zh"` \| `"cu"` \| `"cv"` \| `"kw"` \| `"co"` \| `"cr"` \| `"cs"` \| `"da"` \| `"dv"` \| `"nl"` \| `"dz"` \| `"en"` \| `"eo"` \| `"et"` \| `"ee"` \| `"fo"` \| `"fj"` \| `"fi"` \| `"fr"` \| `"ff"` \| `"gd"` \| `"gl"` \| `"lg"` \| `"ka"` \| `"de"` \| `"ki"` \| `"kl"` \| `"gn"` \| `"gu"` \| `"ht"` \| `"ha"` \| `"he"` \| `"hz"` \| `"hi"` \| `"ho"` \| `"hu"` \| `"is"` \| `"io"` \| `"ig"` \| `"ia"` \| `"iu"` \| `"ik"` \| `"ga"` \| `"ja"` \| `"jv"` \| `"kn"` \| `"kr"` \| `"ks"` \| `"kk"` \| `"rw"` \| `"kv"` \| `"kg"` \| `"ko"` \| `"kj"` \| `"ku"` \| `"ky"` \| `"lo"` \| `"la"` \| `"lv"` \| `"lb"` \| `"ln"` \| `"lt"` \| `"lu"` \| `"mk"` \| `"mg"` \| `"ml"` \| `"mt"` \| `"gv"` \| `"mr"` \| `"mh"` \| `"ro"` \| `"na"` \| `"nv"` \| `"nd"` \| `"ng"` \| `"ne"` \| `"se"` \| `"no"` \| `"nb"` \| `"nn"` \| `"ii"` \| `"oc"` \| `"oj"` \| `"or"` \| `"om"` \| `"os"` \| `"pi"` \| `"pa"` \| `"ps"` \| `"fa"` \| `"pl"` \| `"pt"` \| `"qu"` \| `"rm"` \| `"rn"` \| `"ru"` \| `"sm"` \| `"sg"` \| `"sa"` \| `"sc"` \| `"sr"` \| `"sn"` \| `"sd"` \| `"si"` \| `"sk"` \| `"sl"` \| `"st"` \| `"nr"` \| `"su"` \| `"sw"` \| `"ss"` \| `"sv"` \| `"tl"` \| `"ty"` \| `"tg"` \| `"ta"` \| `"bo"` \| `"ti"` \| `"to"` \| `"tn"` \| `"tw"` \| `"ug"` \| `"uk"` \| `"ur"` \| `"uz"` \| `"ve"` \| `"vi"` \| `"vo"` \| `"wa"` \| `"cy"` \| `"fy"` \| `"wo"` \| `"xh"` \| `"yi"` \| `"yo"` \| `"za"` \| `"zu"`

### i18n()

> **i18n**: \<`K`, `V`\>(`key`, `values`) => [`I18nResult`](../type-aliases/I18nResult.md)\<`T`, `K`, `L`, `V`\>

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

##### V

`V` *extends* [`PickValues`](../type-aliases/PickValues.md)\<`T`, `K`, `L`\>

#### Parameters

##### key

`K`

##### values

`undefined` | `V`

#### Returns

[`I18nResult`](../type-aliases/I18nResult.md)\<`T`, `K`, `L`, `V`\>

### langState

> **langState**: [`SignalWritable`](../../adapter/interfaces/SignalWritable.md)\<`"id"` \| `"br"` \| `"hr"` \| `"li"` \| `"th"` \| `"tr"` \| `"tt"` \| `"mi"` \| `"mn"` \| `"ms"` \| `"so"` \| `"it"` \| `"ts"` \| `"es"` \| `"tk"` \| `"te"` \| `"ca"` \| `"ie"` \| `"el"` \| `"ab"` \| `"aa"` \| `"af"` \| `"ak"` \| `"sq"` \| `"am"` \| `"ar"` \| `"an"` \| `"hy"` \| `"as"` \| `"av"` \| `"ae"` \| `"ay"` \| `"az"` \| `"bm"` \| `"ba"` \| `"eu"` \| `"be"` \| `"bn"` \| `"bh"` \| `"bi"` \| `"bs"` \| `"bg"` \| `"my"` \| `"km"` \| `"ch"` \| `"ce"` \| `"ny"` \| `"zh"` \| `"cu"` \| `"cv"` \| `"kw"` \| `"co"` \| `"cr"` \| `"cs"` \| `"da"` \| `"dv"` \| `"nl"` \| `"dz"` \| `"en"` \| `"eo"` \| `"et"` \| `"ee"` \| `"fo"` \| `"fj"` \| `"fi"` \| `"fr"` \| `"ff"` \| `"gd"` \| `"gl"` \| `"lg"` \| `"ka"` \| `"de"` \| `"ki"` \| `"kl"` \| `"gn"` \| `"gu"` \| `"ht"` \| `"ha"` \| `"he"` \| `"hz"` \| `"hi"` \| `"ho"` \| `"hu"` \| `"is"` \| `"io"` \| `"ig"` \| `"ia"` \| `"iu"` \| `"ik"` \| `"ga"` \| `"ja"` \| `"jv"` \| `"kn"` \| `"kr"` \| `"ks"` \| `"kk"` \| `"rw"` \| `"kv"` \| `"kg"` \| `"ko"` \| `"kj"` \| `"ku"` \| `"ky"` \| `"lo"` \| `"la"` \| `"lv"` \| `"lb"` \| `"ln"` \| `"lt"` \| `"lu"` \| `"mk"` \| `"mg"` \| `"ml"` \| `"mt"` \| `"gv"` \| `"mr"` \| `"mh"` \| `"ro"` \| `"na"` \| `"nv"` \| `"nd"` \| `"ng"` \| `"ne"` \| `"se"` \| `"no"` \| `"nb"` \| `"nn"` \| `"ii"` \| `"oc"` \| `"oj"` \| `"or"` \| `"om"` \| `"os"` \| `"pi"` \| `"pa"` \| `"ps"` \| `"fa"` \| `"pl"` \| `"pt"` \| `"qu"` \| `"rm"` \| `"rn"` \| `"ru"` \| `"sm"` \| `"sg"` \| `"sa"` \| `"sc"` \| `"sr"` \| `"sn"` \| `"sd"` \| `"si"` \| `"sk"` \| `"sl"` \| `"st"` \| `"nr"` \| `"su"` \| `"sw"` \| `"ss"` \| `"sv"` \| `"tl"` \| `"ty"` \| `"tg"` \| `"ta"` \| `"bo"` \| `"ti"` \| `"to"` \| `"tn"` \| `"tw"` \| `"ug"` \| `"uk"` \| `"ur"` \| `"uz"` \| `"ve"` \| `"vi"` \| `"vo"` \| `"wa"` \| `"cy"` \| `"fy"` \| `"wo"` \| `"xh"` \| `"yi"` \| `"yo"` \| `"za"` \| `"zu"`\>

### load()

> **load**: (`l?`) => `Promise`\<`void`\>

#### Parameters

##### l?

`"id"` | `"br"` | `"hr"` | `"li"` | `"th"` | `"tr"` | `"tt"` | `"mi"` | `"mn"` | `"ms"` | `"so"` | `"it"` | `"ts"` | `"es"` | `"tk"` | `"te"` | `"ca"` | `"ie"` | `"el"` | `"ab"` | `"aa"` | `"af"` | `"ak"` | `"sq"` | `"am"` | `"ar"` | `"an"` | `"hy"` | `"as"` | `"av"` | `"ae"` | `"ay"` | `"az"` | `"bm"` | `"ba"` | `"eu"` | `"be"` | `"bn"` | `"bh"` | `"bi"` | `"bs"` | `"bg"` | `"my"` | `"km"` | `"ch"` | `"ce"` | `"ny"` | `"zh"` | `"cu"` | `"cv"` | `"kw"` | `"co"` | `"cr"` | `"cs"` | `"da"` | `"dv"` | `"nl"` | `"dz"` | `"en"` | `"eo"` | `"et"` | `"ee"` | `"fo"` | `"fj"` | `"fi"` | `"fr"` | `"ff"` | `"gd"` | `"gl"` | `"lg"` | `"ka"` | `"de"` | `"ki"` | `"kl"` | `"gn"` | `"gu"` | `"ht"` | `"ha"` | `"he"` | `"hz"` | `"hi"` | `"ho"` | `"hu"` | `"is"` | `"io"` | `"ig"` | `"ia"` | `"iu"` | `"ik"` | `"ga"` | `"ja"` | `"jv"` | `"kn"` | `"kr"` | `"ks"` | `"kk"` | `"rw"` | `"kv"` | `"kg"` | `"ko"` | `"kj"` | `"ku"` | `"ky"` | `"lo"` | `"la"` | `"lv"` | `"lb"` | `"ln"` | `"lt"` | `"lu"` | `"mk"` | `"mg"` | `"ml"` | `"mt"` | `"gv"` | `"mr"` | `"mh"` | `"ro"` | `"na"` | `"nv"` | `"nd"` | `"ng"` | `"ne"` | `"se"` | `"no"` | `"nb"` | `"nn"` | `"ii"` | `"oc"` | `"oj"` | `"or"` | `"om"` | `"os"` | `"pi"` | `"pa"` | `"ps"` | `"fa"` | `"pl"` | `"pt"` | `"qu"` | `"rm"` | `"rn"` | `"ru"` | `"sm"` | `"sg"` | `"sa"` | `"sc"` | `"sr"` | `"sn"` | `"sd"` | `"si"` | `"sk"` | `"sl"` | `"st"` | `"nr"` | `"su"` | `"sw"` | `"ss"` | `"sv"` | `"tl"` | `"ty"` | `"tg"` | `"ta"` | `"bo"` | `"ti"` | `"to"` | `"tn"` | `"tw"` | `"ug"` | `"uk"` | `"ur"` | `"uz"` | `"ve"` | `"vi"` | `"vo"` | `"wa"` | `"cy"` | `"fy"` | `"wo"` | `"xh"` | `"yi"` | `"yo"` | `"za"` | `"zu"`

#### Returns

`Promise`\<`void`\>

### loadingState

> **loadingState**: [`SignalWritable`](../../adapter/interfaces/SignalWritable.md)\<`boolean`\>

### missing()

> **missing**: (`lang?`) => `object`[]

#### Parameters

##### lang?

`"id"` | `"br"` | `"hr"` | `"li"` | `"th"` | `"tr"` | `"tt"` | `"mi"` | `"mn"` | `"ms"` | `"so"` | `"it"` | `"ts"` | `"es"` | `"tk"` | `"te"` | `"ca"` | `"ie"` | `"el"` | `"ab"` | `"aa"` | `"af"` | `"ak"` | `"sq"` | `"am"` | `"ar"` | `"an"` | `"hy"` | `"as"` | `"av"` | `"ae"` | `"ay"` | `"az"` | `"bm"` | `"ba"` | `"eu"` | `"be"` | `"bn"` | `"bh"` | `"bi"` | `"bs"` | `"bg"` | `"my"` | `"km"` | `"ch"` | `"ce"` | `"ny"` | `"zh"` | `"cu"` | `"cv"` | `"kw"` | `"co"` | `"cr"` | `"cs"` | `"da"` | `"dv"` | `"nl"` | `"dz"` | `"en"` | `"eo"` | `"et"` | `"ee"` | `"fo"` | `"fj"` | `"fi"` | `"fr"` | `"ff"` | `"gd"` | `"gl"` | `"lg"` | `"ka"` | `"de"` | `"ki"` | `"kl"` | `"gn"` | `"gu"` | `"ht"` | `"ha"` | `"he"` | `"hz"` | `"hi"` | `"ho"` | `"hu"` | `"is"` | `"io"` | `"ig"` | `"ia"` | `"iu"` | `"ik"` | `"ga"` | `"ja"` | `"jv"` | `"kn"` | `"kr"` | `"ks"` | `"kk"` | `"rw"` | `"kv"` | `"kg"` | `"ko"` | `"kj"` | `"ku"` | `"ky"` | `"lo"` | `"la"` | `"lv"` | `"lb"` | `"ln"` | `"lt"` | `"lu"` | `"mk"` | `"mg"` | `"ml"` | `"mt"` | `"gv"` | `"mr"` | `"mh"` | `"ro"` | `"na"` | `"nv"` | `"nd"` | `"ng"` | `"ne"` | `"se"` | `"no"` | `"nb"` | `"nn"` | `"ii"` | `"oc"` | `"oj"` | `"or"` | `"om"` | `"os"` | `"pi"` | `"pa"` | `"ps"` | `"fa"` | `"pl"` | `"pt"` | `"qu"` | `"rm"` | `"rn"` | `"ru"` | `"sm"` | `"sg"` | `"sa"` | `"sc"` | `"sr"` | `"sn"` | `"sd"` | `"si"` | `"sk"` | `"sl"` | `"st"` | `"nr"` | `"su"` | `"sw"` | `"ss"` | `"sv"` | `"tl"` | `"ty"` | `"tg"` | `"ta"` | `"bo"` | `"ti"` | `"to"` | `"tn"` | `"tw"` | `"ug"` | `"uk"` | `"ur"` | `"uz"` | `"ve"` | `"vi"` | `"vo"` | `"wa"` | `"cy"` | `"fy"` | `"wo"` | `"xh"` | `"yi"` | `"yo"` | `"za"` | `"zu"`

#### Returns

`object`[]

### rich()

> **rich**: \<`K`, `V`\>(`key`, `values`) => `TemplateResult`

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

##### V

`V` *extends* [`PickValues`](../type-aliases/PickValues.md)\<`T`, `K`, `L`\>

#### Parameters

##### key

`K`

##### values

`undefined` | `V`

#### Returns

`TemplateResult`

### setLang()

> **setLang**: (`value`) => `void`

#### Parameters

##### value

`"id"` | `"br"` | `"hr"` | `"li"` | `"th"` | `"tr"` | `"tt"` | `"mi"` | `"mn"` | `"ms"` | `"so"` | `"it"` | `"ts"` | `"es"` | `"tk"` | `"te"` | `"ca"` | `"ie"` | `"el"` | `"ab"` | `"aa"` | `"af"` | `"ak"` | `"sq"` | `"am"` | `"ar"` | `"an"` | `"hy"` | `"as"` | `"av"` | `"ae"` | `"ay"` | `"az"` | `"bm"` | `"ba"` | `"eu"` | `"be"` | `"bn"` | `"bh"` | `"bi"` | `"bs"` | `"bg"` | `"my"` | `"km"` | `"ch"` | `"ce"` | `"ny"` | `"zh"` | `"cu"` | `"cv"` | `"kw"` | `"co"` | `"cr"` | `"cs"` | `"da"` | `"dv"` | `"nl"` | `"dz"` | `"en"` | `"eo"` | `"et"` | `"ee"` | `"fo"` | `"fj"` | `"fi"` | `"fr"` | `"ff"` | `"gd"` | `"gl"` | `"lg"` | `"ka"` | `"de"` | `"ki"` | `"kl"` | `"gn"` | `"gu"` | `"ht"` | `"ha"` | `"he"` | `"hz"` | `"hi"` | `"ho"` | `"hu"` | `"is"` | `"io"` | `"ig"` | `"ia"` | `"iu"` | `"ik"` | `"ga"` | `"ja"` | `"jv"` | `"kn"` | `"kr"` | `"ks"` | `"kk"` | `"rw"` | `"kv"` | `"kg"` | `"ko"` | `"kj"` | `"ku"` | `"ky"` | `"lo"` | `"la"` | `"lv"` | `"lb"` | `"ln"` | `"lt"` | `"lu"` | `"mk"` | `"mg"` | `"ml"` | `"mt"` | `"gv"` | `"mr"` | `"mh"` | `"ro"` | `"na"` | `"nv"` | `"nd"` | `"ng"` | `"ne"` | `"se"` | `"no"` | `"nb"` | `"nn"` | `"ii"` | `"oc"` | `"oj"` | `"or"` | `"om"` | `"os"` | `"pi"` | `"pa"` | `"ps"` | `"fa"` | `"pl"` | `"pt"` | `"qu"` | `"rm"` | `"rn"` | `"ru"` | `"sm"` | `"sg"` | `"sa"` | `"sc"` | `"sr"` | `"sn"` | `"sd"` | `"si"` | `"sk"` | `"sl"` | `"st"` | `"nr"` | `"su"` | `"sw"` | `"ss"` | `"sv"` | `"tl"` | `"ty"` | `"tg"` | `"ta"` | `"bo"` | `"ti"` | `"to"` | `"tn"` | `"tw"` | `"ug"` | `"uk"` | `"ur"` | `"uz"` | `"ve"` | `"vi"` | `"vo"` | `"wa"` | `"cy"` | `"fy"` | `"wo"` | `"xh"` | `"yi"` | `"yo"` | `"za"` | `"zu"`

#### Returns

`void`

### setLangFrom()

> **setLangFrom**: (`value`) => `void`

#### Parameters

##### value

`string`

#### Returns

`void`

### store()

> **store**: () => `WritableTransStore`\<`T`\>

#### Returns

`WritableTransStore`\<`T`\>
