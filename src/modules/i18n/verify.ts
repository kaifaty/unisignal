import type {TransStore} from './types'
import type {Lang} from './consts'

export type VerifyIssue =
  | {type: 'missing-key'; key: string; lang: Lang}
  | {type: 'placeholder-mismatch'; key: string; langs: Lang[]; details: string}

const extractPlaceholders = (s: string): string[] => {
  const set = new Set<string>()
  const re = /\$\{([a-zA-Z0-9_.:]+)\}/g
  let m: RegExpExecArray | null
  while ((m = re.exec(s))) {
    const [path] = m[1].split(':')
    set.add(path)
  }
  return Array.from(set).sort()
}

export function verifyTransStore<T extends TransStore>(store: T, langs: Lang[]): VerifyIssue[] {
  const issues: VerifyIssue[] = []
  for (const key in store) {
    const unit = store[key]
    // отсутствующие ключи
    for (const l of langs) {
      if (unit?.[l] === undefined) {
        issues.push({type: 'missing-key', key, lang: l})
      }
    }
    // соответствие плейсхолдеров
    const present = langs
      .map((l) => [l, unit?.[l]] as const)
      .filter(([, v]) => typeof v === 'string') as Array<readonly [Lang, string]>
    if (present.length > 1) {
      const [firstLang, firstStr] = present[0]
      const firstPh = extractPlaceholders(firstStr)
      for (let i = 1; i < present.length; i++) {
        const [l, s] = present[i]
        const ph = extractPlaceholders(s)
        if (firstPh.join('\u0001') !== ph.join('\u0001')) {
          issues.push({
            type: 'placeholder-mismatch',
            key,
            langs: [firstLang, l],
            details: `${firstLang}: ${firstPh.join(', ')} <> ${l}: ${ph.join(', ')}`,
          })
        }
      }
    }
  }
  return issues
}
