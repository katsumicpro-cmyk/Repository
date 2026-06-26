import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/index.ts', 'src/**/*.types.ts'],
    },
  },
  resolve: {
    alias: {
      '@innovation-os/shared/types': new URL('../shared/src/types/index.ts', import.meta.url).pathname,
      '@innovation-os/shared/errors': new URL('../shared/src/errors/index.ts', import.meta.url).pathname,
      '@innovation-os/shared/events': new URL('../shared/src/events/index.ts', import.meta.url).pathname,
      '@innovation-os/shared/constants': new URL('../shared/src/constants/index.ts', import.meta.url).pathname,
      '@innovation-os/shared/result': new URL('../shared/src/result/index.ts', import.meta.url).pathname,
      '@innovation-os/foundation/ids': new URL('../foundation/src/ids/index.ts', import.meta.url).pathname,
      '@innovation-os/foundation/time': new URL('../foundation/src/time/index.ts', import.meta.url).pathname,
      '@innovation-os/foundation/logger': new URL('../foundation/src/logger/index.ts', import.meta.url).pathname,
      '@innovation-os/foundation/cache': new URL('../foundation/src/cache/index.ts', import.meta.url).pathname,
      '@innovation-os/foundation/env': new URL('../foundation/src/env/index.ts', import.meta.url).pathname,
      '@innovation-os/foundation/config': new URL('../foundation/src/config/index.ts', import.meta.url).pathname,
      '@innovation-os/foundation/validation': new URL('../foundation/src/validation/index.ts', import.meta.url).pathname,
      '@innovation-os/foundation/telemetry': new URL('../foundation/src/telemetry/index.ts', import.meta.url).pathname,
    },
  },
})
