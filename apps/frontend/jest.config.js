/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  testEnvironment: 'jsdom',
  setupFiles: ['<rootDir>/src/setupJest.ts'],
  setupFilesAfterEnv: ['<rootDir>/node_modules/@testing-library/jest-dom/dist/index.js', '<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^./utils/env$': '<rootDir>/src/utils/env.node.ts',
    '^../utils/env$': '<rootDir>/src/utils/env.node.ts',
    '^./env$': '<rootDir>/src/utils/env.node.ts',
    '^../env$': '<rootDir>/src/utils/env.node.ts',
  },
  transform: {
    '^.+\\.(t|j)sx?$': [
      '@swc/jest',
      {
        jsc: {
          transform: {
            react: {
              runtime: 'automatic',
            },
          },
        },
      },
    ],
  },
  testMatch: ['**/__tests__/**/*.test.tsx'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transformIgnorePatterns: ['node_modules/(?!(@chakra-ui|@emotion|framer-motion)/)'],
}; 