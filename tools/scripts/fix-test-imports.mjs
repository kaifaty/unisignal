import {readdirSync, readFileSync, writeFileSync, statSync} from 'node:fs'
import {join} from 'node:path'

function listTsFiles(dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    const st = statSync(full)
    if (st.isDirectory()) {
      // skip fixtures folder entirely
      if (name === 'fixtures') continue
      out.push(...listTsFiles(full))
    } else if (st.isFile()) {
      if (!name.endsWith('.ts')) continue
      if (name === 'setup.ts') continue
      out.push(full)
    }
  }
  return out
}

const root = process.cwd()
const testsRoot = join(root, 'tools', 'tests')
const files = listTsFiles(testsRoot)

let changed = 0
for (const file of files) {
  let src = readFileSync(file, 'utf8')
  const before = src
  // src path one level deeper now
  src = src.replaceAll("from '../../src", "from '../../../src")
  src = src.replaceAll('from "../../src', 'from "../../../src')
  // fixtures moved up one level from each module subfolder
  src = src.replaceAll("from './fixtures/", "from '../fixtures/")
  src = src.replaceAll('from "./fixtures/', 'from "../fixtures/')
  // docs snippets test moved into tests/docs
  src = src.replaceAll("from '../generated/", "from '../../generated/")
  src = src.replaceAll('from "../generated/', 'from "../../generated/')

  if (src !== before) {
    writeFileSync(file, src)
    changed++
  }
}

console.log(`[fix-test-imports] processed ${files.length} files, changed ${changed}`)
