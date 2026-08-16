import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        clearMocks: true,
        include: ['tests/**/*.(test|tests|spec|specs).{ts,tsx,js}'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov', 'json'],
            include: ['src/**/*.ts'],
            exclude: ['src/types/generated/**/*', 'src/debug.ts']
        }
    }
});
