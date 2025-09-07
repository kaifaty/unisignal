import {expect} from '@esm-bundle/chai'
import {verifyTransStore} from '../../../src/modules/i18n/verify'
import type {Lang} from '../../../src/modules/i18n/consts'

export const test = it

describe('i18n: verifyTransStore', () => {
  test('reports missing keys and placeholder mismatches', () => {
    const store = {
      greet: {en: 'Hello ${name}', ru: 'Привет ${name}'},
      info: {en: 'A ${a} and ${b}', ru: 'B ${b} only'},
      ruOnly: {ru: 'Только ру'},
    } as const

    const issues = verifyTransStore(store as any, ['en', 'ru'] as unknown as Lang[])

    // missing in en
    expect(issues.some((i) => i.type === 'missing-key' && (i as any).key === 'ruOnly' && (i as any).lang === 'en')).to
      .be.true

    // placeholder mismatch for 'info'
    const mismatch = issues.find((i) => i.type === 'placeholder-mismatch' && (i as any).key === 'info') as any
    expect(mismatch).to.exist
    expect(mismatch.langs).to.deep.equal(['en', 'ru'])
  })
})
