/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@moneybook/core$': '<rootDir>/../../packages/core/src/index.ts',
    '^@moneybook/core/(.*)$': '<rootDir>/../../packages/core/src/$1',
  },
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: { jsx: 'react' } }],
  },
  // Allow ts-jest to transform next/* packages (they ship ESM which Node can't run directly)
  transformIgnorePatterns: ['node_modules/(?!(next)/)'],
};
