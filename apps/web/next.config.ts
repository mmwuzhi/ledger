import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
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
