#!/usr/bin/env tsx
import {verifyTransStore} from '../../src/modules/i18n/verify'
import {LANGUAGES, type Lang} from '../../src/modules/i18n/consts'

async function main() {
  // Пользователь может импортировать свой store; здесь ожидается, что
  // проект экспортирует store из src/index или другого места.
  // Для примера попытаемся требовать src/index.
  let store: unknown
  try {
    const mod = await import('../../src/index')
    const modRecord = mod as Record<string, unknown>
    const maybe: unknown = modRecord.translations ?? modRecord.i18nStore ?? mod
    store = maybe
  } catch (e) {
    console.error('[i18n:verify] Не удалось импортировать store из src/index. Экспортируйте translations.')
    process.exit(2)
  }

  const langs: Lang[] = Object.keys(LANGUAGES) as Lang[]
  const issues = verifyTransStore(store as Record<string, Partial<Record<Lang, string>>>, langs)
  if (issues.length === 0) {
    console.log('[i18n:verify] OK')
    return
  }
  for (const i of issues) {
    if (i.type === 'missing-key') {
      console.error(`missing-key key=${i.key} lang=${i.lang}`)
    } else if (i.type === 'placeholder-mismatch') {
      console.error(`placeholder-mismatch key=${i.key} langs=${i.langs.join(', ')} details=${i.details}`)
    }
  }
  process.exit(1)
}

main()
