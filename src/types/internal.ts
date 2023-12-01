import { EOAExtensions, EOAOperationsExtensions, EOASchemaExtensions } from '../constants.js';
import { OpenAPIV3_1 } from 'openapi-types';

export * from './utils.js';

export type EOASchemaExtensionTypes = {
    [K in (typeof EOASchemaExtensions)[keyof typeof EOASchemaExtensions]]?: unknown;
} & {
    [EOASchemaExtensions.optional]?: boolean;
    [EOASchemaExtensions.description]?: string;
    [EOASchemaExtensions.summary]?: string;
    [EOASchemaExtensions.deprecated]?: boolean;
};

export type EOAOperationsExtensionTypes = {
    [K in (typeof EOAOperationsExtensions)[keyof typeof EOAOperationsExtensions]]?: unknown;
} & {
    [EOAOperationsExtensions.server]?: OpenAPIV3_1.ServerObject;
};

export type EOASchemaExtensionsValueTypes = EOASchemaExtensionTypes[keyof EOASchemaExtensionTypes];

export type EOASchemaExtensionsValues = (typeof EOASchemaExtensions)[keyof typeof EOASchemaExtensions];
export type EOAExtensionsValues = (typeof EOAExtensions)[keyof typeof EOAExtensions];

declare module 'openapi-types' {
    namespace OpenAPIV3 {
        interface BaseSchemaObject extends EOASchemaExtensionTypes {}
    }
}
