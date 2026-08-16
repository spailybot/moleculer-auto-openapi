import { describe, expect, it } from 'vitest';
import { getOpenApiType, getDefaultFromRule } from '../src/mappers.js';

describe('mappers.ts Unit Tests', () => {
    describe('getOpenApiType', () => {
        it('should return valid OpenAPI types', () => {
            expect(getOpenApiType('test')).toBe('string');
            expect(getOpenApiType(123)).toBe('number');
            expect(getOpenApiType(true)).toBe('boolean');
            expect(getOpenApiType({})).toBe('object');
        });

        it('should return undefined for unsupported types', () => {
            expect(getOpenApiType(Symbol('sym'))).toBeUndefined();
            expect(getOpenApiType(undefined)).toBeUndefined();
            expect(getOpenApiType(10n)).toBeUndefined(); // bigint
        });
    });

    describe('getDefaultFromRule', () => {
        it('should return undefined if default is a function', () => {
            const rule = { type: 'string', default: () => 'val' };
            expect(getDefaultFromRule(rule)).toBeUndefined();
        });

        it('should return default if it is a value', () => {
            const rule = { type: 'string', default: 'val' };
            expect(getDefaultFromRule(rule)).toBe('val');
        });
    });
});
