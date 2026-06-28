import type { NextConfig } from 'next'

const config: NextConfig = {
  transpilePackages: [
    '@innovation-os/shared',
    '@innovation-os/foundation',
    '@innovation-os/domain',
    '@innovation-os/knowledge',
    '@innovation-os/application',
  ],
  experimental: {
    typedRoutes: true,
  },
}

export default config
