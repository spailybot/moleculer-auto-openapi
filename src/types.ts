import {
    default as ValidatorDefault,
    RuleAny,
    RuleArray,
    RuleBoolean,
    RuleClass,
    RuleCurrency,
    RuleCustom,
    RuleDate,
    RuleEmail,
    RuleEnum,
    RuleEqual,
    RuleForbidden,
    RuleFunction,
    RuleLuhn,
    RuleMac,
    RuleMulti,
    RuleNumber,
    RuleObject,
    RuleRecord,
    RuleString,
    RuleURL,
    RuleUUID,
    ValidationRule,
    ValidationRuleName,
    ValidationRuleObject,
    ValidationSchema
} from 'fastest-validator';
import { OpenAPIV3_1 as OA } from 'openapi-types';

export type tSystemParams = {
    description?: string;
};

export type ValidationRuleMapping = {
    [K in ValidationRuleName]: K extends 'any'
        ? RuleAny
        : K extends 'array'
        ? RuleArray
        : K extends 'boolean'
        ? RuleBoolean
        : K extends 'class'
        ? RuleClass
        : K extends 'currency'
        ? RuleCurrency
        : K extends 'custom'
        ? RuleCustom
        : K extends 'date'
        ? RuleDate
        : K extends 'email'
        ? RuleEmail
        : K extends 'enum'
        ? RuleEnum
        : K extends 'equal'
        ? RuleEqual
        : K extends 'forbidden'
        ? RuleForbidden
        : K extends 'function'
        ? RuleFunction
        : K extends 'luhn'
        ? RuleLuhn
        : K extends 'mac'
        ? RuleMac
        : K extends 'multi'
        ? RuleMulti
        : K extends 'number'
        ? RuleNumber
        : K extends 'object'
        ? RuleObject
        : K extends 'record'
        ? RuleRecord
        : K extends 'string'
        ? RuleString
        : K extends 'url'
        ? RuleURL
        : K extends 'uuid'
        ? RuleUUID
        : never;
};

export type Mapper<Rule extends RuleCustom> = (rule: Rule) => OA.SchemaObject;

export type Mappers = {
    [K in keyof ValidationRuleMapping]: Mapper<ValidationRuleMapping[K]>;
};

export type RuleToSchemaFunction = (pRule: ValidationRule, parentProperties?: Partial<ValidationRuleObject>) => OA.SchemaObject | undefined;
export type SchemaToRules = (schema: ValidationSchema) => Record<string, OA.SchemaObject>;

export type ValidatorType = ValidatorDefault.default;
