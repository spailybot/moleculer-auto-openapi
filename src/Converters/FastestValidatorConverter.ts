import { addMappersFn, FastestValidatorType, FVOARuleMetaKeys, Mapper, Mappers, ObjectRules } from '../types/index.js';
import { getOpenApiType, MappersOptions } from '../mappers.js';
import type {
    RuleAny,
    RuleArray,
    RuleBoolean,
    RuleCurrency,
    RuleCustom,
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
    ValidationRule,
    ValidationRuleName,
    ValidationRuleObject,
    ValidationSchema,
    ValidationSchemaMetaKeys
} from 'fastest-validator';
import type { OpenAPIV3_1 } from 'openapi-types';
import type { IConverter } from './IConverter.js';
import { EOAExtensions } from '../constants.js';
import { EOAExtensionsValues, EOASchemaExtensionsValues, EOASchemaExtensionsValueTypes } from '../types/internal.js';

export class FastestValidatorConverter implements IConverter {
    private readonly mappers: Mappers;

    constructor(
        private readonly validator: FastestValidatorType,
        private readonly additionalMappersFn?: addMappersFn
    ) {
        this.mappers = getFastestValidatorMappers(this.getMapperFn());
        this.load();
    }

    private getMapperFn(): MappersOptions {
        return {
            getSchemaObjectFromSchema: (...args) => this.getSchemaObjectFromSchema(...args),
            getSchemaObjectFromRule: (...args) => this.getSchemaObjectFromRule(...args)
        };
    }

    private _loadingPromise?: Promise<void>;

    public async load(): Promise<void> {
        if (this._loadingPromise) {
            return this._loadingPromise;
        }

        this._loadingPromise = new Promise(async (resolve, reject) => {
            try {
                const mapperFn = this.getMapperFn();

                Object.entries(
                    (await this.additionalMappersFn?.(mapperFn.getSchemaObjectFromRule, mapperFn.getSchemaObjectFromSchema)) ?? {}
                ).forEach(([k, v]) => {
                    this.mappers[k] = v;
                });
                resolve();
            } catch (e) {
                reject(e);
            }
        });

        await this._loadingPromise;
    }

    public getValidationRules(schema: ValidationSchema): Record<string, ValidationRule> {
        return Object.fromEntries(Object.entries(schema).filter(([k]) => !k.startsWith('$$')) as Array<[string, ValidationRule]>);
    }

    public getMetas(schema: ValidationSchema): ValidationSchemaMetaKeys {
        return Object.fromEntries(Object.entries(schema).filter(([k]) => k.startsWith('$$')));
    }

    public getSchemaObjectFromSchema(schema: ValidationSchema): Record<string, OpenAPIV3_1.SchemaObject> {
        // if (schema.$$root !== true) {
        return Object.fromEntries(
            Object.entries(this.getValidationRules(schema))
                .map(([k, v]) => [k, this.getSchemaObjectFromRule(v, undefined, schema)])
                .filter(Boolean) as Array<[string, OpenAPIV3_1.SchemaObject]>
        );
        // }

        // delete schema.$$root;
        //
        // return { [ROOT_PROPERTY]: this.getSchemaObjectFromRule(schema as ValidationRule) };
    }

    public getSchemaObjectFromRootSchema(schema: ValidationSchema): OpenAPIV3_1.SchemaObject | undefined {
        if (schema.$$root !== true) {
            throw new Error('this function only support $$root objects');
        }

        delete schema.$$root;

        return this.getSchemaObjectFromRule(schema as ValidationRuleObject);
    }

    public getSchemaObjectFromRule(
        pRule: ValidationRule,
        parentProperties?: Partial<ValidationRuleObject>,
        parentSchema?: ObjectRules
    ): OpenAPIV3_1.SchemaObject | undefined {
        if (!this.validator || !this.mappers?.string) {
            throw new Error(`bad initialisation . validator ? ${!!this.validator} | string mapper ${!!this.mappers?.string}`);
        }

        //clone the object, else fastestValidator will remove $$oa
        const clonedRule: ValidationRule = typeof pRule === 'object' ? (Array.isArray(pRule) ? [...pRule] : { ...pRule }) : pRule;

        //extract known params extensions
        const extensions: Array<[string, EOASchemaExtensionsValueTypes]> =
            Array.isArray(clonedRule) || typeof clonedRule !== 'object' || !clonedRule.$$oa
                ? []
                : (
                      [
                          {
                              property: 'description',
                              extension: EOAExtensions.description
                          },
                          {
                              property: 'summary',
                              extension: EOAExtensions.summary
                          },
                          {
                              property: 'deprecated',
                              extension: EOAExtensions.deprecated
                          }
                      ] as Array<{ property: keyof FVOARuleMetaKeys; extension: EOAExtensionsValues }>
                  ).map(({ property, extension }) => [extension, clonedRule.$$oa?.[property]]);

        const baseRule = this.validator.getRuleFromSchema(clonedRule)?.schema as ValidationRuleObject;
        const rule = {
            ...parentProperties,
            ...baseRule
        };

        const typeMapper = (this.mappers[rule.type as ValidationRuleName] as Mapper<RuleCustom>) || this.mappers.string; // Utilise le mapper pour string par défaut
        const schema = typeMapper(rule, parentSchema);

        if (!schema) {
            return undefined;
        }

        if (rule.optional) {
            schema[EOAExtensions.optional] = true;
        }

        // @ts-ignore
        extensions.forEach(([k, v]: [EOASchemaExtensionsValues, any]) => {
            schema[k] = v;
        });

        return schema;
    }
}

export const getFastestValidatorMappers = ({ getSchemaObjectFromRule, getSchemaObjectFromSchema }: MappersOptions): Mappers => {
    return {
        any: (rule: RuleAny): ReturnType<Mapper<RuleAny>> => ({
            default: rule.default,
            examples: rule.default ? [rule.default] : undefined
        }),
        array: (rule: RuleArray): ReturnType<Mapper<RuleArray>> => {
            const itemsSchema = (rule.items ? getSchemaObjectFromRule(rule.items, { enum: rule.enum }) : undefined) ?? {};

            const schema: OpenAPIV3_1.ArraySchemaObject = {
                type: 'array',
                examples: rule.default ? [rule.default] : undefined,
                uniqueItems: rule.unique,
                default: rule.default,
                items: itemsSchema
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
        boolean: (rule: RuleBoolean): ReturnType<Mapper<RuleBoolean>> => ({
            type: 'boolean',
            default: rule.default,
            examples: rule.default !== undefined ? [rule.default] : [true, false]
        }),
        class: () => undefined,
        currency: (rule: RuleCurrency): ReturnType<Mapper<RuleCurrency>> => {
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
                default: rule.default,
                examples: rule.default ? [rule.default] : undefined,
                format: 'currency'
            };
        },
        date: (rule: RuleDate): ReturnType<Mapper<RuleDate>> => {
            //without convert, date can't be sent handled
            if (!rule.convert) {
                return undefined;
            }

            const example = new Date(rule.default ?? Date.now());
            const examples = [example.toISOString(), example.getTime()];

            return {
                type: 'string',
                default: rule.default,
                format: 'date-time',
                examples
            };
        },
        email: (rule: RuleEmail): ReturnType<Mapper<RuleEmail>> => {
            const PRECISE_PATTERN =
                /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            const BASIC_PATTERN = /^\S+@\S+\.\S+$/;

            const pattern = rule.mode == 'precise' ? PRECISE_PATTERN : BASIC_PATTERN;

            return {
                type: 'string',
                format: 'email',
                default: rule.default,
                pattern: new RegExp(pattern).source,
                maxLength: rule.max,
                minLength: rule.min,
                examples: [rule.default ?? 'foo@bar.com']
            };
        },
        enum: (rule: RuleEnum): ReturnType<Mapper<RuleEnum>> =>
            getSchemaObjectFromRule({
                type: 'string',
                enum: rule.values
            }),
        equal: (rule: RuleEqual, parent: ObjectRules): ReturnType<Mapper<RuleEqual>> => {
            if (rule.field && parent?.[rule.field]) {
                return getSchemaObjectFromRule(parent?.[rule.field]);
            }

            const type: OpenAPIV3_1.NonArraySchemaObjectType | OpenAPIV3_1.ArraySchemaObjectType | undefined = rule.strict
                ? getOpenApiType(rule.value)
                : 'string';

            return {
                type,
                default: rule.default,
                examples: rule.default ? [rule.default] : undefined,
                enum: rule.value ? [rule.value] : undefined
            } as OpenAPIV3_1.ArraySchemaObject | OpenAPIV3_1.NonArraySchemaObject;
        },
        forbidden: () => undefined,
        function: () => undefined,
        luhn: (rule: RuleLuhn): ReturnType<Mapper<RuleLuhn>> => ({
            type: 'string',
            default: rule.default,
            pattern: '^(\\d{1,4} ){3}\\d{1,4}$',
            examples: rule.default ? [rule.default] : undefined,
            format: 'luhn'
        }),
        mac: (rule: RuleMac): ReturnType<Mapper<RuleMac>> => {
            const PATTERN =
                /^((([a-f0-9][a-f0-9]+-){5}|([a-f0-9][a-f0-9]+:){5})([a-f0-9][a-f0-9])$)|(^([a-f0-9][a-f0-9][a-f0-9][a-f0-9]+[.]){2}([a-f0-9][a-f0-9][a-f0-9][a-f0-9]))$/i;
            return {
                type: 'string',
                default: rule.default,
                pattern: new RegExp(PATTERN).source,
                examples: rule.default ? [rule.default] : ['01:C8:95:4B:65:FE', '01C8.954B.65FE', '01-C8-95-4B-65-FE'],
                format: 'mac'
            };
        },
        multi: (rule: RuleMulti): ReturnType<Mapper<RuleMulti>> => {
            if (!Array.isArray(rule.rules)) {
                return undefined;
            }

            const schemas = rule.rules
                .map((rule: ValidationRuleObject | string) => getSchemaObjectFromRule(rule))
                .filter(Boolean) as Array<OpenAPIV3_1.SchemaObject>;

            return {
                oneOf: schemas,
                default: rule.default,
                examples: rule.default ? [rule.default] : undefined
            };
        },
        number: (rule: RuleNumber): ReturnType<Mapper<RuleNumber>> => {
            const example = rule.default ?? rule.enum?.[0] ?? rule.min ?? rule.max;
            const schema: OpenAPIV3_1.NonArraySchemaObject = {
                type: 'number',
                default: rule.default,
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
        object: (rule: RuleObject): ReturnType<Mapper<RuleObject>> => {
            const props = rule.props ?? rule.properties;
            const properties = props ? getSchemaObjectFromSchema(props) : undefined;

            return {
                type: 'object',
                minProperties: rule.minProps,
                maxProperties: rule.maxProps,
                default: rule.default,
                properties,
                examples: rule.default ? [rule.default] : undefined
            };
        },
        record: (fvRule: RuleRecord) => {
            const valueSchema = fvRule.value ? getSchemaObjectFromRule(fvRule.value) : undefined;

            let schema: OpenAPIV3_1.SchemaObject = {
                type: 'object',
                default: fvRule.default,
                additionalProperties: valueSchema
            };

            return schema;
        },
        string: (fvRule: RuleString): ReturnType<Mapper<RuleString>> => {
            let schema: OpenAPIV3_1.NonArraySchemaObject = {
                default: fvRule.default,
                type: 'string'
            };

            if (fvRule.length) {
                schema.maxLength = fvRule.length;
                schema.minLength = fvRule.length;
            } else {
                schema.maxLength = fvRule.max;
                schema.minLength = fvRule.min;
            }

            let defaultExample: string | undefined;

            if (fvRule.pattern) {
                schema.pattern = new RegExp(fvRule.pattern).source;
            } else if (fvRule.contains) {
                schema.pattern = `.*${fvRule.contains}.*`;
                defaultExample = fvRule.contains;
            } else if (fvRule.numeric) {
                schema.pattern = '^[0-9]+$';
                schema.format = 'numeric';
                defaultExample = '12345';
            } else if (fvRule.alpha) {
                schema.pattern = '^[a-zA-Z]+$';
                schema.format = 'alpha';
                defaultExample = 'abcdef';
            } else if (fvRule.alphanum) {
                schema.pattern = '^[a-zA-Z0-9]+$';
                schema.format = 'alphanum';
                defaultExample = 'abc123';
            } else if (fvRule.alphadash) {
                schema.pattern = '^[a-zA-Z0-9_-]+$';
                schema.format = 'alphadash';
                defaultExample = 'abc-123';
            } else if (fvRule.singleLine) {
                schema.pattern = '^[^\\r\\n]*$';
                schema.format = 'single-line';
                defaultExample = 'abc 123';
            } else if (fvRule.hex) {
                schema.pattern = '^([0-9A-Fa-f]{2})+$';
                schema.format = 'hex';
                defaultExample = '48656c6c6f20576f726c64';
            } else if (fvRule.base64) {
                schema.pattern = '^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$';
                schema.format = 'byte';
                defaultExample = 'aGVsbG8gd29ybGQ='; // "hello world" en base64.
            }

            schema.enum = fvRule.enum;

            const example = fvRule.default ?? fvRule.enum?.[0] ?? defaultExample;

            if (example) {
                schema.examples = [example];
            }

            return schema;
        },
        tuple: (rule: RuleTuple): ReturnType<Mapper<RuleTuple>> => {
            const baseSchema = getSchemaObjectFromRule({
                type: 'array',
                default: rule.default,
                length: 2
            } as RuleArray) as OpenAPIV3_1.ArraySchemaObject;

            if (rule.items) {
                baseSchema.items = {
                    oneOf: rule.items.map((rule) => getSchemaObjectFromRule(rule)).filter(Boolean) as Array<OpenAPIV3_1.SchemaObject>
                };
            }

            if (rule.default) {
                baseSchema.examples = [rule.default];
            }

            return baseSchema;
        },
        url: (rule: RuleURL): ReturnType<Mapper<RuleURL>> => ({
            type: 'string',
            format: 'url',
            default: rule.default,
            examples: [rule.default ?? 'https://foobar.com']
        }),
        uuid: (rule: RuleUUID): ReturnType<Mapper<RuleUUID>> => {
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
                default: rule.default,
                examples: rule.default ? [rule.default] : [example]
            };
        },
        objectID: (rule: RuleObjectID): ReturnType<Mapper<RuleObjectID>> => {
            const defaultObjectId = '507f1f77bcf86cd799439011';

            return {
                type: 'string',
                format: 'ObjectId',
                default: rule.default,
                minLength: defaultObjectId.length,
                maxLength: defaultObjectId.length,
                examples: rule.default ? [rule.default] : [defaultObjectId]
            };
        },
        custom: () => undefined
    } as Mappers;
};
