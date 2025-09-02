/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from '@esm-bundle/chai'
import {Router} from '../../../src/modules/router/router'
import {createRouterTestEnv, createRouterContainer, cleanupRouterContainer} from '../fixtures/router'

describe('router: advanced', () => {
  beforeEach(() => {
    Router.__resetLoopForTests()
  })

  it('matches dynamic params and passes them to render', async () => {
    const {adapter, fakeHistory, historyRecords} = createRouterTestEnv({
      base: '/app',
      withUrl: true,
      initialPath: '/app',
    })

    const host = document.createElement('div')
    document.body.appendChild(host)

    const root = Router.initRoot({
      container: host,
      render: (outer) => {
        outer?.()
        return 'root'
      },
    })
    const users = root.addChild({
      name: 'users',
      render: (outer) => {
        outer?.()
        return 'users'
      },
    })
    let capturedId: string | undefined
    users.addChild({
      name: ':id',
      render: (_outer: unknown, ctx: {params: {id: string}} | undefined) => {
        capturedId = ctx?.params.id
        return 'user'
      },
    })

    await Router.goto('/users/42')
    expect(capturedId).to.equal('42')
    expect(historyRecords[0][0]).to.equal('push')
    const pushed = String(historyRecords[0][1])
    expect(/^(\/app)?\/.+/.test(pushed)).to.equal(true)
    expect(pushed.includes('/users/42')).to.equal(true)
    cleanupRouterContainer(host)
  })

  it('redirects from entry via string', async () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    const host = document.createElement('div')
    document.body.appendChild(host)

    const root = Router.initRoot({container: host, render: () => 'root'})
    root.addChild({name: 'signin', render: () => 'signin'})
    root.addChild({
      name: 'private',
      render: () => 'private',
      entry: () => '/signin',
    })

    const result = await (Router as any).navigate('/private')
    expect(result.ok).to.equal(false)
    expect(result.reason).to.equal('redirected')
    expect(result.redirectedTo).to.equal('/signin')
    cleanupRouterContainer(host)
  })
})
