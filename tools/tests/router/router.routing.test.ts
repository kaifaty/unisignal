/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from '@esm-bundle/chai'
import {Router} from '../../../src/modules/router/router'
import {createRouterTestEnv, cleanupRouterContainer} from '../fixtures/router'

describe('router: routing matches', () => {
  beforeEach(() => {
    Router.__resetLoopForTests()
  })

  it('matches static routes', async () => {
    const {adapter, fakeHistory, historyRecords} = createRouterTestEnv({
      withUrl: true,
      initialPath: '/',
    })

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = Router.initRoot({
      container,
      render: () => 'root',
    })

    root.addChild({
      name: 'about',
      render: () => 'about page',
    })

    root.addChild({
      name: 'contact',
      render: () => 'contact page',
    })

    const result1 = await Router.navigate('/about')
    expect(result1.ok).to.equal(true)
    expect(historyRecords.length).to.equal(1)
    expect(historyRecords[0][0]).to.equal('push')
    expect(historyRecords[0][1]).to.include('/about')

    const result2 = await Router.navigate('/contact')
    expect(result2.ok).to.equal(true)
    expect(historyRecords.length).to.equal(2)
    expect(historyRecords[1][0]).to.equal('push')
    expect(historyRecords[1][1]).to.include('/contact')

    cleanupRouterContainer(container)
  })

  it('matches dynamic params with custom param names', async () => {
    const {adapter, fakeHistory, historyRecords} = createRouterTestEnv({
      withUrl: true,
      initialPath: '/',
    })

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = Router.initRoot({
      container,
      render: () => 'root',
    })

    root
      .addChild({
        name: 'users',
        render: () => 'users',
      })
      .addChild({
        name: ':userId',
        render: () => 'user',
      })

    const result1 = await Router.navigate('/users/123')
    expect(result1.ok).to.equal(true)
    expect(historyRecords.length).to.equal(1)
    expect(historyRecords[0][1]).to.include('/users/123')

    const result2 = await Router.navigate('/users/john-doe')
    expect(result2.ok).to.equal(true)
    expect(historyRecords.length).to.equal(2)
    expect(historyRecords[1][1]).to.include('/users/john-doe')

    cleanupRouterContainer(container)
  })

  it('matches splat routes capturing remainder', async () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = Router.initRoot({
      container,
      render: (outer) => `root(${outer?.() || 'empty'})`,
    })

    let capturedSplat = ''
    root
      .addChild({
        name: 'files',
        render: () => 'files',
      })
      .addChild({
        name: '*path',
        render: (_outer: unknown, ctx: {params: {path?: string}} | undefined) => {
          capturedSplat = ctx?.params.path || ''
          return 'file'
        },
      })

    const result1 = await Router.navigate('/files/docs/readme.txt')
    expect(result1.ok).to.equal(true)
    // Get render result which should include the splat parameter
    const renderResult = root.render()
    expect(renderResult).to.equal('root(file)')
    // capturedSplat should be set by the splat render function
    expect(capturedSplat).to.equal('docs/readme.txt')

    // Reset for next test
    capturedSplat = ''

    const result2 = await Router.navigate('/files/src/index.ts')
    expect(result2.ok).to.equal(true)
    // Trigger render to capture splat parameter
    root.render()
    expect(capturedSplat).to.equal('src/index.ts')

    // Reset for next test
    capturedSplat = ''

    const result3 = await Router.navigate('/files')
    expect(result3.ok).to.equal(true)
    // For '/files' path, it should match the 'files' route, not the splat route
    root.render()
    expect(capturedSplat).to.equal('')

    cleanupRouterContainer(container)
  })

  it('matches splat routes with custom splat name', async () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = Router.initRoot({
      container,
      render: (outer) => `root(${outer?.() || 'empty'})`,
    })

    let capturedRest = ''
    root.addChild({
      name: '*catchall',
      render: (_outer, ctx) => {
        capturedRest = ctx?.params.catchall || ''
        return 'catchall'
      },
    })

    const result1 = await Router.navigate('/any/path/here')
    expect(result1.ok).to.equal(true)
    // Trigger render to capture splat parameter
    root.render()
    expect(capturedRest).to.equal('any/path/here')

    const result2 = await Router.navigate('/single')
    expect(result2.ok).to.equal(true)
    // Trigger render to capture splat parameter
    root.render()
    expect(capturedRest).to.equal('single')

    cleanupRouterContainer(container)
  })

  it('handles URL encoded segments', async () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = Router.initRoot({
      container,
      render: () => 'root',
    })

    let capturedId = ''
    root.addChild({
      name: ':id',
      render: (_outer, ctx) => {
        capturedId = ctx?.params.id || ''
        return 'item'
      },
    })

    const result1 = await Router.navigate('/hello%20world')
    expect(result1.ok).to.equal(true)
    // Trigger render to capture parameter
    root.render()
    expect(capturedId).to.equal('hello world')

    const result2 = await Router.navigate('/test%2Bencoded')
    expect(result2.ok).to.equal(true)
    // Trigger render to capture parameter
    root.render()
    expect(capturedId).to.equal('test+encoded')

    cleanupRouterContainer(container)
  })

  it('handles malformed URL encoding gracefully', async () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = Router.initRoot({
      container,
      render: () => 'root',
    })

    let capturedId = ''
    root.addChild({
      name: ':id',
      render: (_outer, ctx) => {
        capturedId = ctx?.params.id || ''
        return 'item'
      },
    })

    // Malformed percent encoding should be handled
    const result = await Router.navigate('/test%2')
    expect(result.ok).to.equal(true)
    // Trigger render to capture parameter
    root.render()
    expect(capturedId).to.equal('test%2') // Should keep original if can't decode

    cleanupRouterContainer(container)
  })

  it('matches nested routes with multiple params', async () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = Router.initRoot({
      container,
      render: () => 'root',
    })

    let capturedParams: any = {}
    const orgs = root.addChild({
      name: 'orgs',
      render: () => 'orgs',
    })

    const org = orgs.addChild({
      name: ':orgId',
      render: () => 'org',
    })

    org
      .addChild({
        name: 'projects',
        render: () => 'projects',
      })
      .addChild({
        name: ':projectId',
        render: (_outer: unknown, ctx: {params: {orgId?: string; projectId?: string}} | undefined) => {
          capturedParams = ctx?.params
          return 'project'
        },
      })

    const result = await Router.navigate('/orgs/123/projects/456')
    expect(result.ok).to.equal(true)
    // Trigger render to capture parameters
    root.render()
    expect(capturedParams.orgId).to.equal('123')
    expect(capturedParams.projectId).to.equal('456')

    cleanupRouterContainer(container)
  })

  it('prioritizes static routes over dynamic', async () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = Router.initRoot({
      container,
      render: () => 'root',
    })

    let rendered = ''
    root.addChild({
      name: ':id',
      render: () => {
        rendered = 'dynamic'
        return 'dynamic'
      },
    })

    root.addChild({
      name: 'static',
      render: () => {
        rendered = 'static'
        return 'static'
      },
    })

    const result = await Router.navigate('/static')
    expect(result.ok).to.equal(true)
    // Trigger render to set rendered variable
    root.render()
    expect(rendered).to.equal('static')

    cleanupRouterContainer(container)
  })

  it('prioritizes static routes over splat', async () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = Router.initRoot({
      container,
      render: () => 'root',
    })

    let rendered = ''
    root.addChild({
      name: '*rest',
      render: () => {
        rendered = 'splat'
        return 'splat'
      },
    })

    root.addChild({
      name: 'specific',
      render: () => {
        rendered = 'specific'
        return 'specific'
      },
    })

    const result = await Router.navigate('/specific')
    expect(result.ok).to.equal(true)
    // Trigger render to set rendered variable
    root.render()
    expect(rendered).to.equal('specific')

    cleanupRouterContainer(container)
  })

  it('handles empty path segments', async () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/'})

    const container = document.createElement('div')
    document.body.appendChild(container)

    const root = Router.initRoot({
      container,
      render: () => 'root',
    })

    let rendered = ''
    root.addChild({
      name: 'test',
      render: () => {
        rendered = 'test'
        return 'test'
      },
    })

    // Extra slashes should be normalized
    const result = await Router.navigate('//test//')
    expect(result.ok).to.equal(true)
    // Trigger render to set rendered variable
    root.render()
    expect(rendered).to.equal('test')

    cleanupRouterContainer(container)
  })

  it('handles root path navigation', async () => {
    const {adapter} = createRouterTestEnv({withUrl: true, initialPath: '/other'})

    const container = document.createElement('div')
    document.body.appendChild(container)

    let rendered = ''
    const root = Router.initRoot({
      container,
      render: () => {
        rendered = 'root'
        return 'root'
      },
    })

    const result = await Router.navigate('/')
    expect(result.ok).to.equal(true)
    // Trigger render to set rendered variable
    root.render()
    expect(rendered).to.equal('root')

    cleanupRouterContainer(container)
  })
})
