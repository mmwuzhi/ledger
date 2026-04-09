/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterFramework: ['./jest.setup.js'],
  moduleNameMapper: {
    '^@moneybook/core/(.*)$': '<rootDir>/src/$1',
  },
};
