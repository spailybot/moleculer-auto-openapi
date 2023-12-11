import { ValidationRule, ValidationRuleObject, ValidationSchema, ValidationSchemaMetaKeys } from 'fastest-validator';
import { OpenAPIV3_1 } from 'openapi-types';
import { ObjectRules } from '../types/index.js';

/**
 * @experimental
 */
export interface IConverter {
    getValidationRules(schema: ValidationSchema): Record<string, ValidationRule>;
    getMetas(schema: ValidationSchema): ValidationSchemaMetaKeys;
    getSchemaObjectFromSchema(schema: ValidationSchema): Record<string, OpenAPIV3_1.SchemaObject>;
    getSchemaObjectFromRootSchema(schema: ValidationSchema): OpenAPIV3_1.SchemaObject | undefined;
    getSchemaObjectFromRule(
        pRule: ValidationRule,
        parentProperties?: Partial<ValidationRuleObject>,
        parentSchema?: ObjectRules
    ): OpenAPIV3_1.SchemaObject | undefined;
    load(): Promise<void>;
}
