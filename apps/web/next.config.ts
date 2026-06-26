import type { NextConfig } from 'next'

const config: NextConfig = {
  transpilePackages: [
    '@innovation-os/shared',
    '@innovation-os/foundation',
    '@innovation-os/domain',
  ],
  experimental: {
    typedRoutes: true,
  },
}

export default config
