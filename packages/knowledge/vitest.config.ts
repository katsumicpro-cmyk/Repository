import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'url'
import { resolve, dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkg = (p: string) => resolve(__dirname, '../', p)

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@innovation-os/shared/result':     pkg('shared/src/result/index.ts'),
      '@innovation-os/shared/errors':     pkg('shared/src/errors/index.ts'),
      '@innovation-os/shared/events':     pkg('shared/src/events/index.ts'),
      '@innovation-os/shared/constants':  pkg('shared/src/constants/index.ts'),
      '@innovation-os/shared/types':      pkg('shared/src/types/index.ts'),
      '@innovation-os/foundation/ids':        pkg('foundation/src/ids/index.ts'),
      '@innovation-os/foundation/time':       pkg('foundation/src/time/index.ts'),
      '@innovation-os/foundation/logger':     pkg('foundation/src/logger/index.ts'),
      '@innovation-os/foundation/cache':      pkg('foundation/src/cache/index.ts'),
      '@innovation-os/foundation/validation': pkg('foundation/src/validation/index.ts'),
      '@innovation-os/domain/core':       pkg('domain/src/core/index.ts'),
      '@innovation-os/knowledge/fact':        'src/fact/index.ts',
      '@innovation-os/knowledge/embedding':   'src/embedding/index.ts',
    },
  },
})
