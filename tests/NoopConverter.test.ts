import { describe, expect, it } from 'vitest';
import { NoopConverter } from '../src/Converters/NoopConverter.js';

describe('NoopConverter.ts Unit Tests', () => {
    describe('NoopConverter', () => {
        it('should implement all IConverter interface methods with empty/undefined values', async () => {
            const converter = new NoopConverter();
            await expect(converter.load()).resolves.toBeUndefined();
            expect(converter.getMetas({})).toEqual({});
            expect(converter.getSchemaObjectFromRootSchema({})).toEqual({});
            expect(converter.getSchemaObjectFromRule('type')).toBeUndefined();
            expect(converter.getSchemaObjectFromSchema({})).toEqual({});
            expect(converter.getValidationRules({})).toEqual({});
        });
    });
});
