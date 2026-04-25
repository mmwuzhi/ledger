import type { NextConfig } from 'next';
import path from 'path';

const BASE_PATH = '/ledger';

const nextConfig: NextConfig = {
  basePath: BASE_PATH,
  env: { NEXT_PUBLIC_BASE_PATH: BASE_PATH },
  async redirects() {
    return [{ source: '/', destination: '/ledger', basePath: false, permanent: false }];
  },
  transpilePackages: ['@moneybook/core'],
  turbopack: {
    root: path.resolve(__dirname, '../..'),
    resolveAlias: {
      'expo-sqlite': './lib/stubs/expo-sqlite.ts',
      'expo-crypto': './lib/stubs/expo-crypto.ts',
      'expo-modules-core': './lib/stubs/expo-modules-core.ts',
    },
  },
};

export default nextConfig;
