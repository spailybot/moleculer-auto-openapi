export * from './utils.js';

declare module 'openapi-types' {
    namespace OpenAPIV3 {
        interface BaseSchemaObject {
            [key: string]: unknown;
        }
    }
}
