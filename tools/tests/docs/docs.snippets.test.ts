import {expect} from '@esm-bundle/chai'
import {snippets} from '../../generated/docs-snippets.data'

describe('docs snippets', () => {
  it('exist and non-empty', () => {
    expect(Array.isArray(snippets)).to.equal(true)
  })

  it('typescript imports do not use .js extension', () => {
    const ts = snippets.filter((s) => s.lang === 'ts' || s.lang === 'tsx')
    for (const s of ts) {
      const lines = s.code.split('\n')
      for (const ln of lines) {
        if (/^\s*import\s+/.test(ln)) {
          expect(/\.js['"]/.test(ln)).to.equal(false, `Bad import in ${s.file}: ${ln}`)
        }
      }
    }
  })
})
