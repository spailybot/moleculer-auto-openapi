import { Service } from 'moleculer';
import path from 'path/posix';

export enum EOAExtensions {
    optional = 'x-fastest-optional',
    description = 'x-fastest-description'
}

export enum HTTP_METHODS {
    GET = 'get',
    PUT = 'put',
    POST = 'post',
    DELETE = 'delete',
    OPTIONS = 'options',
    HEAD = 'head',
    PATCH = 'patch',
    TRACE = 'trace'
}

export const openApiVersionsSupported = ['3.1'] as const;
export type openApiVersionsSupported = (typeof openApiVersionsSupported)[number];
export const defaultOpenApiVersion: openApiVersionsSupported = '3.1';

export const HTTP_METHODS_ARRAY = Object.values(HTTP_METHODS);
export const methodIsHttpMethod = (method: string): method is HTTP_METHODS =>
    HTTP_METHODS_ARRAY.includes(method?.toLowerCase() as HTTP_METHODS);

export const JOKER_METHOD = '*' as const;
export const REST_METHOD = 'rest' as const;
export const multiOAProperties = ['oneOf', 'allOf', 'anyOf'];

export type rawHttpMethod = HTTP_METHODS | typeof JOKER_METHOD;
export type rawHttpMethodFromMWeb = HTTP_METHODS | typeof JOKER_METHOD | typeof REST_METHOD;

export const getServiceName = (svc: Service): string => {
    if (svc.fullName) {
        return svc.fullName;
    }

    if (svc.version != null && svc.settings?.$noVersionPrefix !== true) {
        return (typeof svc.version == 'number' ? 'v' + svc.version : svc.version) + '.' + svc.name;
    }

    return svc.name;
};

export const mergeObjects = (orig = {}, toMerge = {}): object => {
    return Object.keys(toMerge).reduce(
        (result, key) => {
            return {
                ...result,
                [key]: {
                    ...(result[key] || {}),
                    ...toMerge[key]
                }
            };
        },
        { ...orig }
    );
};

export const matchAll = (regex: RegExp, str: string): Array<Array<string>> => {
    const matches: Array<Array<string>> = [];
    let m: RegExpExecArray;

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
