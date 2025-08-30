### Релиз‑поток для одного пакета с под‑экспортами

1. Ветвление
   - Trunk‑based: основная ветка `main` (protected), фичи через PR из `feat/*`, `fix/*`.
   - Требования к PR: зелёные lint/typecheck/tests/build/size.

2. Семантические версии и аннотации изменений
   - Используем Changesets: разработчик добавляет `changeset` с типом релиза (patch/minor/major) и кратким описанием.
   - Формат коммитов: Conventional Commits (желательно), но необязательно для Changesets.

3. Каналы релизов (npm dist‑tags)
   - `latest` — стабильные релизы.
   - `next` — беты/RC: версии вида `1.3.0-next.0` (pre‑mode Changesets).
   - `canary` — сборки с `-canary.<sha>` на каждый merge в `main` или по ручному триггеру.

4. Скрипты в package.json (пример)

```json
{
  "scripts": {
    "build": "tsup --dts --format esm",
    "release:version": "changeset version",
    "release:publish": "npm run build && changeset publish --tag latest --access public",
    "release:pre:enter": "changeset pre enter next",
    "release:pre:exit": "changeset pre exit",
    "release:next": "npm run release:pre:enter && npm run release:version && npm run release:publish && npm run release:pre:exit",
    "release:canary": "changeset version --snapshot canary && npm run build && changeset publish --tag canary --no-git-tag"
  }
}
```

5. CI: PR‑проверки
   - Lint, Typecheck, Unit/DOM tests, Build, Size‑limit/bundle‑анализ, `npm pack` + smoke‑тест установки.
   - Проверка treeshaking на sample‑проекте (импорт одного под‑экспорта).

6. CI: публикация (GitHub Actions, Changesets Action)

```yaml
name: Release
on:
  push:
    branches: [ master ]

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      packages: write
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm run build
      - name: Changesets Release
        uses: changesets/action@v1
        with:
          publish: npm run release:publish
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

7. Pre‑release (next)
   - Создать pre‑режим: `npm run release:pre:enter` → слить PR с changesets → CI выполнит `release:next` (или вручную).
   - По готовности — выйти из pre‑режима: `npm run release:pre:exit`.

8. Canary
   - Публиковать на каждый merge в `main` или по workflow_dispatch: `npm run release:canary` (dist‑tag `canary`).
   - Использование потребителями: `npm i pkg@canary` или точный `@canary-<sha>`.

9. Git‑теги и GitHub Release
   - Changesets создаёт теги `vX.Y.Z` и changelog; включить создание GitHub Release (опция action или отдельный шаг).

10. Проверки качества релиза

- Smoke‑тест: `npm pack` + установка в временный проект, проверка импорта `pkg/<subpath>`.
- Проверка типов: потребительский TypeScript‑проект с `skipLibCheck=false`.

11. Безопасность и целостность

- `NPM_TOKEN` c правами публикации, 2FA → automation‑tokens (npm provenance при желании).
- Защитить `main`; требовать минимум 1‑2 approvals.

12. Откат

- Быстрый rollback через смену `dist-tag` (перевесить `latest` на предыдущую версию).
- При критике: `npm deprecate <pkg>@<bad> "reason"` и hotfix.

13. Деприкация старых пакетов (после миграции)

- `npm deprecate @old/pkg "Moved to <new-pkg> (<map>)"`.
- Опционально: «прокси‑пакеты» c ре‑экспортами на период перехода.

14. Метрики и мониторинг

- Отслеживать размеры бандла, частоту скачиваний, ошибки интеграции.
- Автогенерация релиз‑заметок и уведомления.

Примечания:

- Пакет ESM‑only, `sideEffects: false`, корректные `exports`/тип‑экспорты для каждого под‑пути.
- Для scoped‑пакетов требовать `--access public` при публикации.
