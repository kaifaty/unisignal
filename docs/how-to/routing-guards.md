## How‑to: роутинг‑гварды

Примеры защиты маршрутов и перенаправлений.

### Сценарии

- Проверка аутентификации
- Редирект при отсутствии доступа

### Пример: guard на аутентификацию

```ts
import {Router} from './src/modules/router'

// примитивный guard
async function requireAuth(): Promise<boolean> {
  const isLoggedIn = Boolean(localStorage.getItem('token'))
  if (!isLoggedIn) {
    await Router.goto('/login', true)
    return false
  }
  return true
}

Router.configure(adapter)
Router.start()

// при входе на защищённый маршрут
Router.beforeEach(async (to) => {
  if (to.path.startsWith('/app')) return requireAuth()
  return true
})
```

### Пример: short‑circuit перенаправлений

```ts
import {Router} from './src/modules/router'

Router.configure(adapter)
Router.start()

// переходим на тот же путь и query → переход не выполнится (false)
const didNavigate = await Router.goto('/a?x=1')
if (didNavigate === false) {
  // уже на месте — можно пропустить перерисовку
}
```
