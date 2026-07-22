import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    define: {
      __APP_VERSION__: '"0.0.0-test"',
      'import.meta.env.VITE_APP_NAME': '"CS2 Bot Assistant Community"',
      'import.meta.env.VITE_APP_BRAND_LABEL': '"CS2 BOT ASSISTANT COMMUNITY"',
      'import.meta.env.VITE_APP_CHANNEL': '"test"',
      'import.meta.env.VITE_API_BASE_URL': '"http://localhost:3000"',
      'import.meta.env.VITE_WORKSPACE_NAME': '"Test Workspace"',
      'import.meta.env.VITE_DEFAULT_PROJECT_ID': '"cs2-bot-improver"',
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./vitest.setup.ts'],
      exclude: [...configDefaults.exclude, 'e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
    },
  }),
)
