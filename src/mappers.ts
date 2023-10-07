import { Mappers, ObjectRules, RuleToSchemaFunction, SchemaToRules } from './types.js';
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
    RuleObjectID,
    RuleRecord,
    RuleString,
    RuleTuple,
    RuleURL,
    RuleUUID,
    ValidationRuleObject
} from 'fastest-validator';
import { OpenAPIV3_1 as OA } from 'openapi-types';

const getOpenApiType = (obj: unknown): OA.NonArraySchemaObjectType | OA.ArraySchemaObjectType | undefined => {
    const type = typeof obj;
    const OATypes = ['boolean', 'object', 'number', 'string', 'integer', 'array'] as const;

    if (!(OATypes as unknown as Array<string>).includes(type)) {
        return undefined;
    }

    return type as (typeof OATypes)[number];
};

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
        class: () => undefined,
        currency: (rule: RuleCurrency): OA.SchemaObject => {
            let pattern: string;
            if (rule.customRegex) {
                pattern = rule.customRegex.toString();
            } else {
                const currencySymbol = rule.currencySymbol || null;
                const thousandSeparator = rule.thousandSeparator || ',';
                const decimalSeparator = rule.decimalSeparator || '.';
                const currencyPart = currencySymbol ? `\\${currencySymbol}${rule.symbolOptional ? '?' : ''}` : '';

                const finalPattern = '(?=.*\\d)^(-?~1|~1-?)(([0-9]\\d{0,2}(~2\\d{3})*)|0)?(\\~3\\d{1,2})?$'
                    .replace(/~1/g, currencyPart)
                    .replace('~2', thousandSeparator)
                    .replace('~3', decimalSeparator);
                pattern = new RegExp(finalPattern).source;
            }

            return {
                type: 'string',
                pattern: pattern,
                examples: rule.default ? [rule.default] : undefined,
                format: 'currency'
            };
        },
        date: (rule: RuleDate): OA.SchemaObject => {
            //without convert, date can't be sent handled
            if (!rule.convert) {
                return undefined;
            }

            const example = new Date(rule.default ?? Date.now());
            const examples = [example.toISOString(), example.getTime()];

            return {
                type: 'string',
                format: 'date-time',
                examples
            };
        },
        email: (rule: RuleEmail): OA.SchemaObject => {
            const PRECISE_PATTERN =
                /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            const BASIC_PATTERN = /^\S+@\S+\.\S+$/;

            const pattern = rule.mode == 'precise' ? PRECISE_PATTERN : BASIC_PATTERN;

            return {
                type: 'string',
                format: 'email',
                pattern: new RegExp(pattern).source,
                maxLength: rule.max,
                minLength: rule.min,
                examples: [rule.default ?? 'foo@bar.com']
            };
        },
        enum: (rule: RuleEnum): OA.SchemaObject =>
            getSchemaObjectFromRule({
                type: 'string',
                enum: rule.values
            }),
        equal: (rule: RuleEqual, parent: ObjectRules): OA.SchemaObject => {
            if (rule.field && parent?.[rule.field]) {
                return getSchemaObjectFromRule(parent?.[rule.field]);
            }

            const type: OA.NonArraySchemaObjectType | OA.ArraySchemaObjectType | undefined = rule.strict
                ? getOpenApiType(rule.value)
                : 'string';

            return {
                type,
                examples: rule.default ? [rule.default] : undefined,
                enum: rule.value ? [rule.value] : undefined
            } as OA.ArraySchemaObject | OA.NonArraySchemaObject;
        },
        forbidden: () => undefined,
        function: () => undefined,
        luhn: (rule: RuleLuhn): OA.SchemaObject => ({
            type: 'string',
            pattern: '^(\\d{1,4} ){3}\\d{1,4}$',
            examples: rule.default ? [rule.default] : undefined,
            format: 'luhn'
        }),
        mac: (rule: RuleMac): OA.SchemaObject => {
            const PATTERN =
                /^((([a-f0-9][a-f0-9]+[-]){5}|([a-f0-9][a-f0-9]+[:]){5})([a-f0-9][a-f0-9])$)|(^([a-f0-9][a-f0-9][a-f0-9][a-f0-9]+[.]){2}([a-f0-9][a-f0-9][a-f0-9][a-f0-9]))$/i;
            return {
                type: 'string',
                pattern: new RegExp(PATTERN).source,
                examples: rule.default ? [rule.default] : undefined,
                format: 'mac'
            };
        },
        multi: (rule: RuleMulti): OA.SchemaObject => {
            const schemas: OA.SchemaObject[] = rule.rules
                .map((rule: ValidationRuleObject | string) => getSchemaObjectFromRule(rule))
                .filter(Boolean);
            return {
                oneOf: schemas,
                examples: rule.default ? [rule.default] : undefined
            };
        },
        number: (rule: RuleNumber): OA.SchemaObject => {
            const example = rule.default ?? rule.enum?.[0] ?? rule.min ?? rule.max;
            const schema: OA.NonArraySchemaObject = {
                type: 'number',
                examples: example ? [example] : undefined
            };

            if (rule.positive) {
                schema.minimum = 0;
            }

            if (rule.negative) {
                schema.maximum = 0;
            }

            if (rule.max) {
                schema.maximum = rule.max;
            }

            if (rule.min) {
                schema.minimum = rule.min;
            }

            if (rule.equal) {
                schema.maximum = rule.equal;
                schema.minimum = rule.equal;
            }

            return schema;
        },
        object: (rule: RuleObject): OA.SchemaObject => {
            return {
                type: 'object',
                minProperties: rule.minProps,
                maxProperties: rule.maxProps,
                properties: rule.props ?? rule.properties ? getSchemaObjectFromSchema(rule.props ?? rule.properties) : undefined,
                examples: rule.default ? [rule.default] : undefined
            };
        },
        record: (fvRule: RuleRecord) => {
            const valueSchema = fvRule.value ? getSchemaObjectFromRule(fvRule.value) : undefined;

            let schema: OA.SchemaObject = {
                type: 'object',
                additionalProperties: valueSchema
            };

            return schema;
        },
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
        tuple: (rule: RuleTuple): OA.SchemaObject => {
            const baseSchema = getSchemaObjectFromRule({
                type: 'array',
                length: 2
            } as RuleArray) as OA.ArraySchemaObject;

            if (rule.items) {
                baseSchema.items = {
                    oneOf: rule.items.map((rule) => getSchemaObjectFromRule(rule))
                };
            }

            if (rule.default) {
                baseSchema.examples = [rule.default];
            }

            return baseSchema;
        },
        url: (rule: RuleURL): OA.SchemaObject => ({
            type: 'string',
            format: 'url',
            examples: [rule.default ?? 'https://foobar.com']
        }),
        uuid: (rule: RuleUUID): OA.SchemaObject => {
            let example = undefined;

            switch (rule.version) {
                case 0:
                    example = '00000000-0000-0000-0000-000000000000';
                    break;
                case 1:
                    example = '45745c60-7b1a-11e8-9c9c-2d42b21b1a3e';
                    break;
                case 2:
                    example = '9a7b330a-a736-21e5-af7f-feaf819cdc9f';
                    break;
                case 3:
                    example = '9125a8dc-52ee-365b-a5aa-81b0b3681cf6';
                    break;
                case 4:
                default:
                    example = '10ba038e-48da-487b-96e8-8d3b99b6d18a';
                    break;
                case 5:
                    example = 'fdda765f-fc57-5604-a269-52a7df8164ec';
                    break;
                case 6:
                    example = 'a9030619-8514-6970-e0f9-81b9ceb08a5f';
                    break;
            }

            return {
                type: 'string',
                format: 'uuid',
                examples: rule.default ? [rule.default] : [example]
            };
        },
        objectID: (rule: RuleObjectID): OA.SchemaObject => {
            const defaultObjectId = '507f1f77bcf86cd799439011';

            return {
                type: 'string',
                format: 'ObjectId',
                minLength: defaultObjectId.length,
                maxLength: defaultObjectId.length,
                examples: rule.default ? [rule.default] : [defaultObjectId]
            };
        },
        custom: () => undefined
    } as Mappers;
};
