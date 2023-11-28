import { IConverter } from './IConverter.js';
import { ValidationRule, ValidationRuleObject, ValidationSchema, ValidationSchemaMetaKeys } from 'fastest-validator';
import { OpenAPIV3_1 } from 'openapi-types';
import { ObjectRules } from '../types/index.js';

/**
 * @experimental
 */
export class NoopConverter implements IConverter {
    getMetas(schema: ValidationSchema): ValidationSchemaMetaKeys {
        return {};
    }

    getSchemaObjectFromRootSchema(schema: ValidationSchema): OpenAPIV3_1.SchemaObject {
        return {};
    }

    getSchemaObjectFromRule(
        pRule: ValidationRule,
        parentProperties?: Partial<ValidationRuleObject>,
        parentSchema?: ObjectRules
    ): OpenAPIV3_1.SchemaObject | undefined {
        return undefined;
    }

    getSchemaObjectFromSchema(schema: ValidationSchema): Record<string, OpenAPIV3_1.SchemaObject> {
        return {};
    }

    getValidationRules(schema: ValidationSchema): Record<string, ValidationRule> {
        return {};
    }
}
