import { Mappers, RuleToSchemaFunction, SchemaToRules } from './types.js';
import {
    RuleAny,
    RuleArray,
    RuleBoolean,
    RuleCurrency,
    RuleDate,
    RuleEmail,
    RuleEnum,
    RuleEqual,
    RuleLuhn,
    RuleMac,
    RuleMulti,
    RuleNumber,
    RuleObject,
    RuleRecord,
    RuleString,
    RuleURL,
    RuleUUID,
    ValidationRuleObject
} from 'fastest-validator';
import { OpenAPIV3_1 as OA } from 'openapi-types';
import { escapeRegExp } from './utils.js';

export const getFastestValidatorMappers = ({
    getSchemaObjectFromRule,
    getSchemaObjectFromSchema
}: {
    getSchemaObjectFromRule: RuleToSchemaFunction;
    getSchemaObjectFromSchema: SchemaToRules;
}) => {
    return {
        any: (rule: RuleAny): OA.SchemaObject => ({
            examples: rule.default ? [rule.default] : undefined
        }),
        array: (rule: RuleArray): OA.SchemaObject => {
            const schema: OA.ArraySchemaObject = {
                type: 'array',
                examples: rule.default ? [rule.default] : undefined,
                uniqueItems: rule.unique,
                items: rule.items ? getSchemaObjectFromRule(rule.items, { enum: rule.enum }) : undefined
            };

            if (rule.length) {
                schema.maxItems = rule.length;
                schema.minItems = rule.length;
            } else {
                schema.maxItems = rule.max;
                schema.minItems = rule.min;
            }

            return schema;
        },
        boolean: (rule: RuleBoolean): OA.SchemaObject => ({
            type: 'boolean',
            examples: rule.default ?? [true, false]
        }),
        string: (rule: RuleString): OA.SchemaObject => {
            let schema: OA.NonArraySchemaObject = {
                type: 'string'
            };

            if (rule.length) {
                schema.maxLength = rule.length;
                schema.minLength = rule.length;
            } else {
                schema.maxLength = rule.max;
                schema.minLength = rule.min;
            }

            let defaultExample: string | undefined;

            if (rule.pattern) {
                schema.pattern = new RegExp(rule.pattern).source;
            } else if (rule.contains) {
                schema.pattern = `.*${rule.contains}.*`;
                defaultExample = rule.contains;
            } else if (rule.numeric) {
                schema.pattern = '^[0-9]+$';
                schema.format = 'numeric';
                defaultExample = '12345';
            } else if (rule.alpha) {
                schema.pattern = '^[a-zA-Z]+$';
                schema.format = 'alpha';
                defaultExample = 'abcdef';
            } else if (rule.alphanum) {
                schema.pattern = '^[a-zA-Z0-9]+$';
                schema.format = 'alphanum';
                defaultExample = 'abc123';
            } else if (rule.alphadash) {
                schema.pattern = '^[a-zA-Z0-9_-]+$';
                schema.format = 'alphadash';
                defaultExample = 'abc-123';
            } else if (rule.singleLine) {
                schema.pattern = '^[^\\r\\n]*$';
                schema.format = 'single-line';
                defaultExample = 'abc 123';
            } else if (rule.hex) {
                schema.pattern = '^([0-9A-Fa-f]{2})+$';
                schema.format = 'hex';
                defaultExample = '48656c6c6f20576f726c64';
            } else if (rule.base64) {
                schema.pattern = '^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$';
                schema.format = 'byte';
                defaultExample = 'aGVsbG8gd29ybGQ='; // "hello world" en base64.
            }

            schema.enum = rule.enum;

            const example = rule.default ?? rule.enum?.[0] ?? defaultExample;

            if (example) {
                schema.examples = [example];
            }

            return schema;
        },
        number: (rule: RuleNumber): OA.SchemaObject => {
            return {
                type: 'number',
                minimum: rule.min,
                maximum: rule.max,
                examples: [rule.default ?? rule.enum?.[0] ?? rule.min ?? rule.max ?? 5]
            };
        },
        uuid: (rule: RuleUUID): OA.SchemaObject => ({
            type: 'string',
            format: 'uuid',
            examples: rule.default ? [rule.default] : undefined
        }),
        email: (rule: RuleEmail): OA.SchemaObject => ({
            type: 'string',
            format: 'email',
            examples: [rule.default ?? 'foo@bar.com']
        }),
        date: (rule: RuleDate): OA.SchemaObject => ({
            type: 'string',
            format: 'date-time',
            examples: [rule.default ?? new Date().toISOString()]
        }),
        url: (rule: RuleURL): OA.SchemaObject => ({
            type: 'string',
            format: 'url',
            examples: [rule.default ?? 'https://foobar.com']
        }),
        currency: (rule: RuleCurrency): OA.SchemaObject => {
            let pattern: string;
            if (rule.customRegex) {
                pattern = rule.customRegex.toString();
            } else {
                // Default values
                const currencySymbol = escapeRegExp(rule.currencySymbol);
                const thousandSeparator = escapeRegExp(rule.thousandSeparator || ',');
                const decimalSeparator = escapeRegExp(rule.decimalSeparator || '.');

                // Prepare symbol part of the regex
                let symbolRegexPart = rule.symbolOptional ? `(${currencySymbol})?` : currencySymbol;

                // Prepare the pattern
                pattern = `^${symbolRegexPart}?\\d{1,3}(\\${thousandSeparator}?\\d{3})*(\\"${decimalSeparator}\\d{1,2})?$`;
            }

            return {
                type: 'string',
                pattern: pattern,
                examples: rule.default ? [rule.default] : undefined,
                format: 'currency'
            };
        },
        equal: (rule: RuleEqual): OA.SchemaObject => ({
            type: 'string',
            examples: rule.default ? [rule.default] : undefined,
            enum: rule.value ? [rule.value] : undefined
        }),
        luhn: (rule: RuleLuhn): OA.SchemaObject => ({
            type: 'string',
            pattern: '^(\\d{1,4} ){3}\\d{1,4}$',
            examples: rule.default ? [rule.default] : undefined,
            format: 'luhn'
        }),
        mac: (rule: RuleMac): OA.SchemaObject => ({
            type: 'string',
            pattern: '^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$',
            examples: rule.default ? [rule.default] : undefined,
            format: 'mac'
        }),
        record: (fvRule: RuleRecord) => {
            const valueSchema = fvRule.value ? getSchemaObjectFromRule(fvRule.value) : undefined;

            let schema: OA.SchemaObject = {
                type: 'object',
                additionalProperties: valueSchema
            };

            return schema;
        },
        multi: (rule: RuleMulti): OA.SchemaObject => {
            const schemas: OA.SchemaObject[] = rule.rules
                .map((rule: ValidationRuleObject | string) => getSchemaObjectFromRule(rule))
                .filter(Boolean);
            return {
                anyOf: schemas,
                examples: rule.default ? [rule.default] : undefined
            };
        },
        enum: (rule: RuleEnum): OA.SchemaObject =>
            getSchemaObjectFromRule({
                type: 'string',
                enum: rule.values
            }),
        object: (rule: RuleObject): OA.SchemaObject => ({
            type: 'object',
            properties: rule.props ?? rule.properties ? getSchemaObjectFromSchema(rule.props ?? rule.properties) : undefined
        }),
        forbidden: () => undefined,
        function: () => undefined,
        class: () => undefined,
        custom: () => undefined
    } as Mappers;
};
