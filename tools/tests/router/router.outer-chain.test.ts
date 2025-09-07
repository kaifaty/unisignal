import {expect} from '@esm-bundle/chai'
import {Router, Routes} from '../../../src/modules/router'
import {createRouterTestEnv, createRouterContainer, cleanupRouterContainer} from '../fixtures/router'

export const test = it

describe('router: outer chain and render wrapping', () => {
  beforeEach(() => {
    Router.__resetLoopForTests()
    ;(Routes as any).basePrefix = ''
  })

  afterEach(() => {
    ;(Routes as any).basePrefix = ''
  })

  test('child render returns outerFn and executes parent wrapping', async () => {
    const {adapter, cleanup} = createRouterTestEnv()

    const container = createRouterContainer()
    const root = Router.initRoot({container, render: () => 'ROOT'})

    const parent = root.addChild({name: 'users', render: (outer) => `PARENT-[${outer ? outer() : ''}]`})
    parent.addChild({name: ':id', render: () => 'CHILD'})

    Router.start()
    await Router.goto('/users/42')

    const html = container.innerHTML
    expect(html).to.contain('PARENT-[CHILD]')

    cleanupRouterContainer(container)
    cleanup()
  })

  test('getFullPath builds path without encoding names', async () => {
    const {cleanup} = createRouterTestEnv()
    const root = Router.initRoot({render: () => ''})
    const a = root.addChild({name: 'a', render: () => ''})
    const b = a.addChild({name: 'b c', render: () => ''})

    expect(b.getFullPath()).to.equal('/a/b c')

    cleanup()
  })
})
