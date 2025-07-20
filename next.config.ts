import type { NextConfig } from 'next';
import type { Configuration } from 'webpack';

const nextConfig: NextConfig = {
  webpack: (config: Configuration, { isServer }: { isServer: boolean }) => {
    if (!isServer) {
      config.resolve = {
        ...config.resolve,
        fallback: {
          ...(config.resolve?.fallback ?? {}),
          net: false,
          tls: false,
          crypto: false,
          stream: false,
        },
      };
    }
    return config;
  },
};

export default nextConfig;
