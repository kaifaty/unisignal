## How‑to: переключение языка (i18n)

Хранение выбранного языка и реактивное переключение.

```ts
import {createI18n} from './src/modules/i18n'
import {persist} from './src/modules/persist'

const lang = persist.state(adapter, 'en', {name: 'lang', storage: 'local', namespace: 'app:'})
const i18n = createI18n(adapter, data, lang.get())

function setLanguage(next: string) {
  lang.set(next)
  i18n.setLangFrom(next)
}
```
