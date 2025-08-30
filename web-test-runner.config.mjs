import {esbuildPlugin} from '@web/dev-server-esbuild'
import {playwrightLauncher} from '@web/test-runner-playwright'

export default {
  files: ['tools/tests/**/*.test.ts'],
  nodeResolve: true,
  plugins: [
    esbuildPlugin({
      ts: true,
      tsx: true,
      target: 'es2020',
    }),
  ],
  browsers: [playwrightLauncher({product: 'chromium'})],
}
