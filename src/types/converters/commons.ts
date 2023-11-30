import { RuleCustom, ValidationRule, ValidationRuleObject, ValidationSchema } from 'fastest-validator';
import { OpenAPIV3_1 as OA3_1 } from 'openapi-types';
import { ValidationRuleMapping } from './FastestValidator/index.js';

export type Mapper<Rule extends RuleCustom> = (rule: Rule, schema?: ObjectRules) => OA3_1.SchemaObject | undefined;

export type Mappers = {
    [K in keyof ValidationRuleMapping]: Mapper<ValidationRuleMapping[K]>;
};

export type RuleToSchemaFunction = (
    pRule: ValidationRule,
    parentProperties?: Partial<ValidationRuleObject>
) => OA3_1.SchemaObject | undefined;
export type SchemaToRules = (schema: ValidationSchema) => Record<string, OA3_1.SchemaObject>;

export type ObjectRules = ValidationSchema & Record<string, ValidationRule>;
