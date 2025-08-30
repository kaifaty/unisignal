import {readdirSync, readFileSync, writeFileSync, mkdirSync} from 'node:fs'
import {join} from 'node:path'

type Snippet = {file: string; lang: string; code: string}

function walk(dir: string, acc: string[] = []) {
  for (const entry of readdirSync(dir, {withFileTypes: true})) {
    const p = join(dir, entry.name)
    if (entry.isDirectory()) walk(p, acc)
    else if (entry.isFile() && entry.name.endsWith('.md')) acc.push(p)
  }
  return acc
}

function extractFromMarkdown(md: string): Snippet[] {
  const re = /```(ts|tsx|js|jsx)\n([\s\S]*?)```/g
  const out: Snippet[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(md))) {
    out.push({file: '', lang: m[1], code: m[2]})
  }
  return out
}

function main() {
  const root = join(process.cwd(), 'docs')
  const files = walk(root)
  const all: Snippet[] = []
  for (const f of files) {
    const md = readFileSync(f, 'utf8')
    const parts = extractFromMarkdown(md)
    for (const s of parts) all.push({...s, file: f.replace(process.cwd() + '\\', '')})
  }
  mkdirSync('tools/generated', {recursive: true})
  const body = `export const snippets = ${JSON.stringify(all, null, 2)} as const;\n`
  writeFileSync('tools/generated/docs-snippets.data.ts', body)
}

main()
