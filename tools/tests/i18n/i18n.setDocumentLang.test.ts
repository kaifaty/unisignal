import {expect} from '@esm-bundle/chai'
import {setDocumentLang} from '../../../src/modules/i18n/utils'

describe('i18n:setDocumentLang', () => {
  beforeEach(() => {
    const html = document.documentElement
    html.lang = ''
    html.dir = ''
  })

  it('устанавливает document.documentElement.lang', () => {
    setDocumentLang('en')
    expect(document.documentElement.lang).to.equal('en')
  })

  it('выставляет dir="rtl" для RTL-языков', () => {
    setDocumentLang('ar')
    expect(document.documentElement.dir).to.equal('rtl')
  })

  it('выставляет dir="ltr" для не-RTL языков и неизвестных', () => {
    setDocumentLang('en')
    expect(document.documentElement.dir).to.equal('ltr')

    setDocumentLang('zz')
    expect(document.documentElement.dir).to.equal('ltr')
  })
})
