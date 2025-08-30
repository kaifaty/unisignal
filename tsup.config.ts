import {defineConfig} from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'modules/adapter/index': 'src/modules/adapter/index.ts',
    'modules/persist/index': 'src/modules/persist/index.ts',
    'modules/router/index': 'src/modules/router/index.ts',
    'modules/url/index': 'src/modules/url/index.ts',
    'modules/utils/index': 'src/modules/utils/index.ts',
    'modules/machine/index': 'src/modules/machine/index.ts',
    'modules/i18n/index': 'src/modules/i18n/index.ts',
    'modules/query/index': 'src/modules/query/index.ts',
  },
  dts: true,
  format: ['esm'],
  outExtension: () => ({js: '.js'}),
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: false,
  target: 'es2022',
  outDir: 'dist',
  treeshake: true,
  skipNodeModulesBundle: true,
})
