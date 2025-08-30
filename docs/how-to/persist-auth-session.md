## How‑to: хранение сессии аутентификации

Безопасное хранение токенов/состояния входа с TTL и миграциями.

```ts
import {persist} from './src/modules/persist'

const session = persist.state(adapter, {token: ''}, {
  name: 'session',
  storage: 'session',
  ttlMs: 1000 * 60 * 60, // 1 час
  onExpire: () => console.warn('session expired'),
  serialize: (s) => ({t: s.token}),
  deserialize: (raw) => ({token: String(raw?.t ?? '')}),
  validate: (s) => s.token.length > 0,
})

function login(token: string) { session.set({token}) }
function logout() { session.clear() }
```
