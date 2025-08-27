/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
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
