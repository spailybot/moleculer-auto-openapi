import { Service, ServiceSchema } from 'moleculer';
import path from 'path/posix';
import { JOKER_METHOD, methodIsHttpMethod, rawHttpMethod, rawHttpMethodFromMWeb, REST_METHOD } from './constants.js';

export const getServiceName = (svc: Service<any> | ServiceSchema<any>): string => {
    if (svc.fullName) {
        return svc.fullName;
    }

    if (svc.version != null && svc.settings?.$noVersionPrefix !== true) {
        return (typeof svc.version == 'number' ? 'v' + svc.version : svc.version) + '.' + svc.name;
    }

    return svc.name;
};

export const matchAll = (regex: RegExp, str: string): Array<Array<string>> => {
    const matches: Array<Array<string>> = [];
    let m: RegExpExecArray | null;

    while ((m = regex.exec(str)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }

        matches.push([...m.slice(1)]);
    }

    return matches;
};

/**
 * @param currentPath
 * @returns {string}
 */
export const normalizePath = (currentPath = ''): string => {
    return path.resolve('/', path.normalize(currentPath));
};

export const isRawHttpMethodFromMWeb = (value: string): value is rawHttpMethodFromMWeb => {
    return value === JOKER_METHOD || value === REST_METHOD || methodIsHttpMethod(value);
};
export const isRawHttpMethod = (value: string): value is rawHttpMethod => {
    return value === JOKER_METHOD || methodIsHttpMethod(value);
};

export function getAlphabeticSorter(): (a: string, b: string) => number;
export function getAlphabeticSorter(key: string): (a: Record<string, any>, b: Record<string, any>) => number;
export function getAlphabeticSorter(key?: string) {
    if (!key) {
        return (a: string, b: string) => a.localeCompare(b, 'en', { sensitivity: 'base' });
    }

    return (a: Record<string, any>, b: Record<string, any>): number => a[key]?.localeCompare(b[key], 'en', { sensitivity: 'base' }) ?? -1;
}

/**
 * Deep clone an object using structuredClone if available,
 * falling back to JSON.parse(JSON.stringify()) for compatibility.
 * @param val
 */
export function deepClone<T>(val: T): T {
    if (typeof structuredClone === 'function') {
        try {
            return structuredClone(val);
        } catch (e) {
            // Fallback for objects that cannot be cloned by structuredClone (e.g. containing functions)
        }
    }
    return JSON.parse(JSON.stringify(val));
}
