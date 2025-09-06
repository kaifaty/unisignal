import {esbuildPlugin} from '@web/dev-server-esbuild'
import {playwrightLauncher} from '@web/test-runner-playwright'

export default {
  files: ['tools/tests/**/*.test.ts'],
  // используем setupFiles вместо кастомного HTML
  setupFiles: ['tools/tests/setup.ts'],
  nodeResolve: true,
  // Глобальный таймаут завершения всех браузерных тестов
  testsFinishTimeout: 20000,
  // Таймаут старта тестов
  testsStartTimeout: 8000,
  // Полностью глушим логи из браузера, чтобы избежать DataCloneError
  filterBrowserLogs: () => true,
  // Последовательный запуск помогает изолировать зависания
  concurrentBrowsers: 1,
  // Явные настройки mocha (BDD по умолчанию) и таймаут кейса
  testFramework: {
    config: {
      ui: 'bdd',
      timeout: 8000,
    },
  },
  plugins: [
    esbuildPlugin({
      ts: true,
      tsx: true,
      target: 'es2020',
    }),
  ],
  // Вернём headless для стабильности CI/локально
  browsers: [playwrightLauncher({product: 'chromium', launchOptions: {headless: true}})],
}
