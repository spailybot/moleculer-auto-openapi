import { RuleToSchemaFunction, SchemaToRules } from './types/index.js';
import { OpenAPIV3_1 as OA } from 'openapi-types';

export const getOpenApiType = (obj: unknown): OA.NonArraySchemaObjectType | OA.ArraySchemaObjectType | undefined => {
    const type = typeof obj;
    const OATypes = ['boolean', 'object', 'number', 'string', 'integer', 'array'] as const;

    if (!(OATypes as unknown as Array<string>).includes(type)) {
        return undefined;
    }

    return type as (typeof OATypes)[number];
};

export type MappersOptions = {
    getSchemaObjectFromRule: RuleToSchemaFunction;
    getSchemaObjectFromSchema: SchemaToRules;
};
