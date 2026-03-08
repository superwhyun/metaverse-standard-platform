import { setupDevPlatform } from '@cloudflare/next-on-pages/next-dev';

// Setup Cloudflare Dev Platform in next dev to enable D1/R2/KV bindings
if (process.env.NODE_ENV === 'development') {
  await setupDevPlatform();
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  transpilePackages: ['pdfjs-dist'],
  // Merge Cloudflare-friendly webpack config from the old next.config.js
  webpack: (config, { isServer }) => {
    // Prevent polyfilling Node built-ins in client bundles (Workers safe)
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      os: false,
      crypto: false,
      'better-sqlite3': false,
    }

    // Add support for top-level await if needed
    config.experiments = {
      ...config.experiments,
      topLevelAwait: true,
    }

    // Stub node-only adapter in client to avoid accidental inclusion
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        './database-adapter-node': './database-adapter-stub',
      }
    }

    return config
  },
}

export default nextConfig
