export const UNRESOLVED_ACTION_NAME = 'unknown-action';

export const EOAOperationsExtensions = {
    server: 'x-moleculer-web-server'
} as const;

export const EOASchemaExtensions = {
    optional: 'x-fastest-optional',
    description: 'x-fastest-description',
    summary: 'x-fastest-summary',
    deprecated: 'x-fastest-deprecated'
} as const;

export const EOAExtensions = {
    ...EOAOperationsExtensions,
    ...EOASchemaExtensions
} as const;

// export enum EOAExtensions {
//     optional = 'x-fastest-optional',
//     description = 'x-fastest-description',
//     summary = 'x-fastest-summary',
//     deprecated = 'x-fastest-deprecated',
//     server = 'x-moleculer-web-server'
// }

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

export const OPENAPI_VERSIONS_SUPPORTED = ['3.1'] as const;
export type OpenApiVersionsSupported = (typeof OPENAPI_VERSIONS_SUPPORTED)[number];
export const DEFAULT_OPENAPI_VERSION: OpenApiVersionsSupported = '3.1';

export const HTTP_METHODS_ARRAY = Object.values(HTTP_METHODS);
export const methodIsHttpMethod = (method: string): method is HTTP_METHODS =>
    HTTP_METHODS_ARRAY.includes(method?.toLowerCase() as HTTP_METHODS);

export const JOKER_METHOD = '*' as const;
export const REST_METHOD = 'rest' as const;
export const multiOAProperties = ['oneOf', 'allOf', 'anyOf'] as const;

export type rawHttpMethod = HTTP_METHODS | typeof JOKER_METHOD;
export type rawHttpMethodFromMWeb = HTTP_METHODS | typeof JOKER_METHOD | typeof REST_METHOD;

export const ALLOWING_BODY_METHODS: Array<HTTP_METHODS> = [HTTP_METHODS.PUT, HTTP_METHODS.POST, HTTP_METHODS.PATCH];
export const DISALLOWING_BODY_METHODS: Array<HTTP_METHODS> = Object.values(HTTP_METHODS).filter(
    (method) => !ALLOWING_BODY_METHODS.includes(method)
);

export const DEFAULT_CONTENT_TYPE = 'application/json';
export const DEFAULT_MULTI_PART_FIELD_NAME = 'file';
export const DEFAULT_SUMMARY_TEMPLATE = '{{summary}}\n            ({{action}}){{autoAlias}}';
export const DEFAULT_SWAGGER_UI_DIST = '//unpkg.com/swagger-ui-dist';

export const OA_NAME_REGEXP = /^[a-zA-Z0-9._-]+$/;

export const BODY_PARSERS_CONTENT_TYPE = {
    json: ['application/json'],
    urlencoded: ['application/x-www-form-urlencoded'],
    text: ['text/plain'],
    multipart: ['multipart/form-data'],
    stream: ['application/octet-stream']
};
