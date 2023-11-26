import { IConverter } from './IConverter.js';
import { ValidationRule, ValidationRuleObject, ValidationSchema, ValidationSchemaMetaKeys } from 'fastest-validator';
import { OpenAPIV3_1 } from 'openapi-types';
import { ObjectRules } from '../types/types.js';

/**
 * @experimental
 */
export class NoopConverter implements IConverter {
    getMetas(schema: ValidationSchema): ValidationSchemaMetaKeys {
        return undefined;
    }

    getSchemaObjectFromRootSchema(schema: ValidationSchema): OpenAPIV3_1.SchemaObject {
        return undefined;
    }

    getSchemaObjectFromRule(
        pRule: ValidationRule,
        parentProperties?: Partial<ValidationRuleObject>,
        parentSchema?: ObjectRules
    ): OpenAPIV3_1.SchemaObject | undefined {
        return undefined;
    }

    getSchemaObjectFromSchema(schema: ValidationSchema): Record<string, OpenAPIV3_1.SchemaObject> {
        return undefined;
    }

    getValidationRules(schema: ValidationSchema): Record<string, ValidationRule> {
        return undefined;
    }
}
