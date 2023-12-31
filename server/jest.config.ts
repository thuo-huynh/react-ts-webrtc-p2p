import type { Config } from '@jest/types';

// For possible configuration options see: https://jestjs.io/docs/configuration
// Sync object
const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  collectCoverage: true,
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'graphql', 'json', 'node'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  moduleDirectories: ['node_modules', __dirname],
};

export default config;
