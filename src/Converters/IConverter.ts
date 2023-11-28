import { ValidationRule, ValidationRuleObject, ValidationSchema, ValidationSchemaMetaKeys } from 'fastest-validator';
import { OpenAPIV3_1 as OA3_1 } from 'openapi-types';
import { ObjectRules } from '../types/index.js';

/**
 * @experimental
 */
export interface IConverter {
    getValidationRules(schema: ValidationSchema): Record<string, ValidationRule>;
    getMetas(schema: ValidationSchema): ValidationSchemaMetaKeys;
    getSchemaObjectFromSchema(schema: ValidationSchema): Record<string, OA3_1.SchemaObject>;
    getSchemaObjectFromRootSchema(schema: ValidationSchema): OA3_1.SchemaObject | undefined;
    getSchemaObjectFromRule(
        pRule: ValidationRule,
        parentProperties?: Partial<ValidationRuleObject>,
        parentSchema?: ObjectRules
    ): OA3_1.SchemaObject | undefined;
}
