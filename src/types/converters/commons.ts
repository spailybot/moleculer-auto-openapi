import { RuleCustom, ValidationRule, ValidationRuleObject, ValidationSchema } from 'fastest-validator';
import { OpenAPIV3_1 } from 'openapi-types';
import { ValidationRuleMapping } from './FastestValidator/index.js';

export type Mapper<Rule extends RuleCustom> = (rule: Rule, schema?: ObjectRules) => OpenAPIV3_1.SchemaObject | undefined;

export type Mappers = {
    [K in keyof ValidationRuleMapping]: Mapper<ValidationRuleMapping[K]>;
};

export type RuleToSchemaFunction = (
    pRule: ValidationRule,
    parentProperties?: Partial<ValidationRuleObject>
) => OpenAPIV3_1.SchemaObject | undefined;
export type SchemaToRules = (schema: ValidationSchema) => Record<string, OpenAPIV3_1.SchemaObject>;

export type ObjectRules = ValidationSchema & Record<string, ValidationRule>;
