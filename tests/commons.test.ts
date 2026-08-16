import { describe, expect, it } from 'vitest';
import {
    getServiceName,
    matchAll,
    normalizePath,
    isRawHttpMethodFromMWeb,
    isRawHttpMethod,
    getAlphabeticSorter,
    deepClone
} from '../src/commons.js';
import { Service } from 'moleculer';

describe('commons.ts Unit Tests', () => {
    describe('getServiceName', () => {
        it('should use fullName if available', () => {
            const svc = { fullName: 'v1.custom.service', name: 'service' } as unknown as Service;
            expect(getServiceName(svc)).toBe('v1.custom.service');
        });

        it('should format service name with version and name', () => {
            const svc = { name: 'math', version: 2 } as unknown as Service;
            expect(getServiceName(svc)).toBe('v2.math');
        });

        it('should handle version as string', () => {
            const svc = { name: 'math', version: 'v3' } as unknown as Service;
            expect(getServiceName(svc)).toBe('v3.math');
        });

        it('should bypass version if $noVersionPrefix is set', () => {
            const svc = { name: 'math', version: 2, settings: { $noVersionPrefix: true } } as unknown as Service;
            expect(getServiceName(svc)).toBe('math');
        });

        it('should return name if no version is provided', () => {
            const svc = { name: 'math' } as unknown as Service;
            expect(getServiceName(svc)).toBe('math');
        });
    });

    describe('matchAll', () => {
        it('should match multiple occurrences', () => {
            const regex = /(\w+)/g;
            const matches = matchAll(regex, 'hello world');
            expect(matches).toEqual([['hello'], ['world']]);
        });

        it('should handle zero-width matches safely', () => {
            const regex = /a*/g;
            const matches = matchAll(regex, 'b');
            expect(matches).toEqual([[], []]);
        });
    });

    describe('normalizePath', () => {
        it('should resolve and normalize path', () => {
            expect(normalizePath('///foo/bar/../baz')).toBe('/foo/baz');
            expect(normalizePath()).toBe('/');
        });
    });

    describe('HttpMethod helpers', () => {
        it('should identify valid methods for moleculer-web', () => {
            expect(isRawHttpMethodFromMWeb('get')).toBe(true);
            expect(isRawHttpMethodFromMWeb('rest')).toBe(true);
            expect(isRawHttpMethodFromMWeb('*')).toBe(true);
            expect(isRawHttpMethodFromMWeb('INVALID')).toBe(false);
        });

        it('should identify raw http methods', () => {
            expect(isRawHttpMethod('get')).toBe(true);
            expect(isRawHttpMethod('*')).toBe(true);
            expect(isRawHttpMethod('rest')).toBe(false);
        });
    });

    describe('getAlphabeticSorter', () => {
        it('should sort strings', () => {
            const sorter = getAlphabeticSorter();
            const list = ['banana', 'Apple', 'cherry'];
            expect(list.sort(sorter)).toEqual(['Apple', 'banana', 'cherry']);
        });

        it('should sort objects by key', () => {
            const sorter = getAlphabeticSorter('name');
            const list = [{ name: 'banana' }, { name: 'Apple' }, { name: 'cherry' }];
            expect(list.sort(sorter)).toEqual([{ name: 'Apple' }, { name: 'banana' }, { name: 'cherry' }]);
        });
    });

    describe('deepClone', () => {
        it('should return null or undefined for null or undefined input', () => {
            expect(deepClone(null)).toBeNull();
            expect(deepClone(undefined)).toBeUndefined();
        });

        it('should successfully clone simple objects', () => {
            const obj = { a: 1, b: { c: 2 } };
            const clone = deepClone(obj);
            expect(clone).toEqual(obj);
            expect(clone).not.toBe(obj);
            expect(clone.b).not.toBe(obj.b);
        });

        it('should fall back to JSON clone if structuredClone fails (e.g. object with functions)', () => {
            const fn = () => {};
            const obj = { a: 1, fn };
            const clone = deepClone(obj);
            expect(clone).toEqual({ a: 1 });
        });
    });
});
