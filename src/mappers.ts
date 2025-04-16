import type { RuleToSchemaFunction, SchemaToRules } from './types/index.js';
import type { OpenAPIV3_1 as OA } from 'openapi-types';
import { ValidationRuleObject, ValidationSchema } from 'fastest-validator';

export const getOpenApiType = (obj: unknown): OA.NonArraySchemaObjectType | OA.ArraySchemaObjectType | undefined => {
    const type = typeof obj;
    const OATypes = ['boolean', 'object', 'number', 'string', 'integer', 'array'] as const;

    if (!(OATypes as unknown as Array<string>).includes(type)) {
        return undefined;
    }

    return type as (typeof OATypes)[number];
};

type fastestValidatorDefaultFn<T = unknown> = (
    schema: ValidationSchema,
    field: string,
    parent: ValidationSchema | null,
    context?: unknown
) => T;

/**
 * handle the edge case where you can run openapi on the same node of the rule, and use a function to default
 */
export const getDefaultFromRule = (rule: ValidationRuleObject): unknown => {
    return typeof rule.default === 'function' ? undefined : rule.default;
};

export type MappersOptions = {
    getSchemaObjectFromRule: RuleToSchemaFunction;
    getSchemaObjectFromSchema: SchemaToRules;
};
