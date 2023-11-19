import { describe, jest, it, expect, beforeEach } from '@jest/globals';
import { getFastestValidatorMappers, MappersOptions } from '../src/mappers.js';
import {
    RuleAny,
    RuleArray,
    RuleBoolean,
    RuleClass,
    RuleCurrency,
    RuleCustom,
    RuleCustomInline,
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
    RuleObjectID,
    RuleRecord,
    RuleString,
    RuleTuple,
    RuleURL,
    RuleUUID
} from 'fastest-validator';
import { Mapper, Mappers, ValidationRuleMapping } from '../src/types/types.js';

const subObject: RuleObject = {
    type: 'object',
    properties: {
        num: 'number'
    },
    default: { num: 1 }
};

describe('Fastest Validator Mappers', () => {
    let mappers: Mappers;

    const mockGetSchemaObjectFromRule = jest.fn();
    const mockGetSchemaObjectFromSchema = jest.fn();

    const mappersOptions = {
        getSchemaObjectFromRule: mockGetSchemaObjectFromRule,
        getSchemaObjectFromSchema: mockGetSchemaObjectFromSchema
    } as MappersOptions;

    beforeEach(() => {
        mappers = getFastestValidatorMappers(mappersOptions);
    });

    describe('any mapper', () => {
        let mapperFn: Mapper<RuleAny>;
        const baseRule = {
            type: 'any'
        } as RuleAny;

        beforeEach(() => {
            // @ts-ignore
            mapperFn = mappers.any.bind(mappers);
        });

        it('should map any rule, normal', () => {
            expect(mapperFn(baseRule)).toEqual({});
        });
        it('should map any rule, withDefault', () => {
            expect(
                mapperFn({
                    ...baseRule,
                    default: 'test'
                })
            ).toEqual({
                default: 'test',
                examples: ['test']
            });
        });
    });

    describe('array mapper', () => {
        let mapperFn: Mapper<RuleArray>;
        const baseRule = {
            type: 'array'
        } as RuleArray;

        beforeEach(() => {
            // @ts-ignore
            mapperFn = mappers.array.bind(mappers);
        });

        it('should map array rule normal', () => {
            expect(
                mapperFn({
                    ...baseRule,
                    normal: {
                        type: 'array'
                    }
                })
            ).toEqual({ type: 'array' });
        });
        it('should map array rule withEmpty', () => {
            expect(mapperFn({ ...baseRule, empty: true })).toEqual({ type: 'array' });
        });
        it('should map array rule withMin', () => {
            expect(mapperFn({ ...baseRule, type: 'array', min: 1 })).toEqual({
                minItems: 1,
                type: 'array'
            });
        });
        it('should map array rule withMax', () => {
            expect(
                mapperFn({
                    ...baseRule,
                    type: 'array',
                    max: 1
                })
            ).toEqual({
                maxItems: 1,
                type: 'array'
            });
        });
        it('should map array rule withLength', () => {
            expect(mapperFn({ ...baseRule, type: 'array', length: 1 })).toEqual({
                maxItems: 1,
                minItems: 1,
                type: 'array'
            });
        });
        it('should map array rule withContains', () => {
            expect(
                mapperFn({
                    ...baseRule,
                    type: 'array',
                    contains: ['test']
                })
            ).toEqual({ type: 'array' });
        });
        it('should map array rule withUnique', () => {
            expect(
                mapperFn({
                    ...baseRule,
                    type: 'array',
                    unique: true
                })
            ).toEqual({ type: 'array', uniqueItems: true });
        });
        it('should map array rule withEnum', () => {
            expect(
                mapperFn({
                    ...baseRule,
                    type: 'array',
                    enum: ['test']
                })
            ).toEqual({ type: 'array' });
        });
        it('should map array rule withItems', () => {
            mockGetSchemaObjectFromRule.mockReturnValueOnce({ type: 'string' });
            expect(
                mapperFn({
                    ...baseRule,
                    type: 'array',
                    items: { type: 'string' }
                })
            ).toEqual({
                type: 'array',
                items: {
                    type: 'string'
                }
            });
            expect(mockGetSchemaObjectFromRule).toHaveBeenCalledWith({ type: 'string' }, { enum: undefined });
        });
        it('should map array rule withConvert', () => {
            expect(
                mapperFn({
                    ...baseRule,
                    type: 'array',
                    convert: true
                })
            ).toEqual({ type: 'array' });
        });
        it('should map array rule withDefault', () => {
            expect(mapperFn({ ...baseRule, type: 'array', default: ['test1', 'test2'] })).toEqual({
                default: ['test1', 'test2'],
                examples: [['test1', 'test2']],
                type: 'array'
            });
        });
        it('should map array rule withSubObject', () => {
            mockGetSchemaObjectFromRule.mockReturnValueOnce({
                $ref: '#/components/schemas/tests-mappers.array.withSubObject'
            });
            expect(
                mapperFn({
                    ...baseRule,
                    type: 'array',
                    items: subObject
                })
            ).toEqual({
                items: {
                    $ref: '#/components/schemas/tests-mappers.array.withSubObject'
                },
                type: 'array'
            });
            expect(mockGetSchemaObjectFromRule).toHaveBeenCalledWith(subObject, { enum: undefined });
        });
    });

    describe('boolean mapper', () => {
        let mapperFn: Mapper<RuleBoolean>;
        const baseRule = {
            type: 'boolean'
        } as RuleBoolean;

        beforeEach(() => {
            // @ts-ignore
            mapperFn = mappers.boolean.bind(mappers);
        });

        it('should map boolean rule, normal', () => {
            expect(mapperFn(baseRule)).toEqual({
                examples: [true, false],
                type: 'boolean'
            });
        });
        it('should map boolean rule, withConvert', () => {
            expect(
                mapperFn({
                    ...baseRule,
                    convert: true
                })
            ).toEqual({
                examples: [true, false],
                type: 'boolean'
            });
        });
        it('should map boolean rule, withDefault', () => {
            expect(
                mapperFn({
                    ...baseRule,
                    default: [true]
                })
            ).toEqual({
                default: [true],
                examples: [true],
                type: 'boolean'
            });
        });
    });

    describe('class mapper', () => {
        let mapperFn: Mapper<RuleClass>;
        const baseRule = {
            type: 'class',
            instanceOf: Buffer
        } as RuleClass;

        beforeEach(() => {
            // @ts-ignore
            mapperFn = mappers.class.bind(mappers);
        });

        it('should map class rule, normal', () => {
            expect(mapperFn(baseRule)).toEqual(undefined);
        });

        it('should map class rule, withDefault', () => {
            expect(
                mapperFn({
                    ...baseRule,
                    default: Buffer.from('test')
                })
            ).toEqual(undefined);
        });
    });

    describe('currency mapper', () => {
        let mapperFn: Mapper<RuleCurrency>;
        const baseRule = {
            type: 'currency'
        } as RuleCurrency;

        beforeEach(() => {
            // @ts-ignore
            mapperFn = mappers.currency.bind(mappers);
        });

        it('should map currency rule, normal', () => {
            expect(mapperFn({ ...baseRule, type: 'currency' })).toEqual({
                format: 'currency',
                pattern: '(?=.*\\d)^(-?|-?)(([0-9]\\d{0,2}(,\\d{3})*)|0)?(\\.\\d{1,2})?$',
                type: 'string'
            });
        });
        it('should map currency rule, withDefault', () => {
            expect(mapperFn({ ...baseRule, type: 'currency', default: '$12,222.2' })).toEqual({
                default: '$12,222.2',
                examples: ['$12,222.2'],
                format: 'currency',
                pattern: '(?=.*\\d)^(-?|-?)(([0-9]\\d{0,2}(,\\d{3})*)|0)?(\\.\\d{1,2})?$',
                type: 'string'
            });
        });
        it('should map currency rule, withCurrencySymbol', () => {
            expect(mapperFn({ ...baseRule, type: 'currency', currencySymbol: '$' })).toEqual({
                format: 'currency',
                pattern: '(?=.*\\d)^(-?\\$|\\$-?)(([0-9]\\d{0,2}(,\\d{3})*)|0)?(\\.\\d{1,2})?$',
                type: 'string'
            });
        });
        it('should map currency rule, withSymbolOptional', () => {
            expect(mapperFn({ ...baseRule, type: 'currency', currencySymbol: '$', symbolOptional: true })).toEqual({
                format: 'currency',
                pattern: '(?=.*\\d)^(-?\\$?|\\$?-?)(([0-9]\\d{0,2}(,\\d{3})*)|0)?(\\.\\d{1,2})?$',
                type: 'string'
            });
        });
        it('should map currency rule, withThousandSeparator', () => {
            expect(mapperFn({ ...baseRule, type: 'currency', thousandSeparator: ' ' })).toEqual({
                format: 'currency',
                pattern: '(?=.*\\d)^(-?|-?)(([0-9]\\d{0,2}( \\d{3})*)|0)?(\\.\\d{1,2})?$',
                type: 'string'
            });
        });
        it('should map currency rule, withDecimalSeparator', () => {
            expect(mapperFn({ ...baseRule, type: 'currency', decimalSeparator: ',' })).toEqual({
                format: 'currency',
                pattern: '(?=.*\\d)^(-?|-?)(([0-9]\\d{0,2}(,\\d{3})*)|0)?(\\,\\d{1,2})?$',
                type: 'string'
            });
        });
        it('should map currency rule, withCustomRegex', () => {
            expect(mapperFn({ ...baseRule, type: 'currency', customRegex: /[a-z]/i })).toEqual({
                format: 'currency',
                pattern: '/[a-z]/i',
                type: 'string'
            });
        });
    });

    describe('date mapper', () => {
        let mapperFn: Mapper<RuleDate>;
        const baseRule = {
            type: 'date',
            convert: true
        } as RuleDate;

        beforeEach(() => {
            // @ts-ignore
            mapperFn = mappers.date.bind(mappers);
        });

        it('should map date rule, normal', () => {
            expect(mapperFn(baseRule)).toEqual({
                type: 'string',
                examples: expect.arrayContaining([expect.any(String), expect.any(Number)]),
                format: 'date-time'
            });
        });

        it('should map date rule, withoutConvert', () => {
            expect(
                mapperFn({
                    ...baseRule,
                    convert: false
                })
            ).toEqual(undefined);
        });

        it('should map date rule, withDefault', () => {
            expect(
                mapperFn({
                    ...baseRule,
                    default: '1998-01-10T13:00:00.000Z'
                })
            ).toEqual({
                default: '1998-01-10T13:00:00.000Z',
                examples: ['1998-01-10T13:00:00.000Z', 884437200000],
                format: 'date-time',
                type: 'string'
            });
        });
    });

    describe('email mapper', () => {
        let mapperFn: Mapper<RuleEmail>;
        const baseRule = {
            type: 'email'
        } as RuleEmail;

        beforeEach(() => {
            // @ts-ignore
            mapperFn = mappers.email.bind(mappers);
        });

        it('should map email rule, normal', () => {
            expect(mapperFn(baseRule)).toEqual({
                examples: ['foo@bar.com'],
                format: 'email',
                pattern: '^\\S+@\\S+\\.\\S+$',
                type: 'string'
            });
        });
        it('should map email, withDefault', () => {
            expect(mapperFn({ ...baseRule, default: 'email@foobar.com' })).toEqual({
                default: 'email@foobar.com',
                examples: ['email@foobar.com'],
                format: 'email',
                pattern: '^\\S+@\\S+\\.\\S+$',
                type: 'string'
            });
        });
        it('should map email, withEmpty', () => {
            expect(mapperFn({ ...baseRule, empty: true })).toEqual({
                examples: ['foo@bar.com'],
                format: 'email',
                pattern: '^\\S+@\\S+\\.\\S+$',
                type: 'string'
            });
        });
        it('should map email, withMode', () => {
            expect(mapperFn({ ...baseRule, mode: 'precise' })).toEqual({
                examples: ['foo@bar.com'],
                format: 'email',
                pattern:
                    '^(([^<>()[\\]\\\\.,;:\\s@"]+(\\.[^<>()[\\]\\\\.,;:\\s@"]+)*)|(".+"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}])|(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,}))$',
                type: 'string'
            });
        });
        it('should map email, withNormalize', () => {
            expect(mapperFn({ ...baseRule, normalize: true })).toEqual({
                examples: ['foo@bar.com'],
                format: 'email',
                pattern: '^\\S+@\\S+\\.\\S+$',
                type: 'string'
            });
        });
        it('should map email, withMin', () => {
            expect(mapperFn({ ...baseRule, min: 1 })).toEqual({
                examples: ['foo@bar.com'],
                format: 'email',
                minLength: 1,
                pattern: '^\\S+@\\S+\\.\\S+$',
                type: 'string'
            });
        });
        it('should map email, withMax', () => {
            expect(mapperFn({ ...baseRule, max: 5 })).toEqual({
                examples: ['foo@bar.com'],
                format: 'email',
                maxLength: 5,
                pattern: '^\\S+@\\S+\\.\\S+$',
                type: 'string'
            });
        });
    });

    describe('enum mapper', () => {
        let mapperFn: Mapper<RuleEnum>;
        const baseRule = {
            type: 'enum',
            values: ['test1', 'test2', 'test3']
        } as RuleEnum;

        beforeEach(() => {
            // @ts-ignore
            mapperFn = mappers.enum.bind(mappers);
        });

        it('should map enum rule, normal', () => {
            mockGetSchemaObjectFromRule.mockReturnValueOnce({
                enum: ['test1', 'test2', 'test3'],
                examples: ['test1'],
                type: 'string'
            });
            expect(mapperFn(baseRule)).toEqual({
                enum: ['test1', 'test2', 'test3'],
                examples: ['test1'],
                type: 'string'
            });
            expect(mockGetSchemaObjectFromRule).toHaveBeenCalledWith({
                enum: ['test1', 'test2', 'test3'],
                type: 'string'
            });
        });
    });

    describe('equal mapper', () => {
        let mapperFn: Mapper<RuleEqual>;
        const testParent = {
            fake: 'email'
        };
        const baseRule = {
            type: 'equal'
        } as RuleEqual;

        beforeEach(() => {
            // @ts-ignore
            mapperFn = mappers.equal.bind(mappers);
        });

        it('should map equal rule, normal', () => {
            expect(mapperFn(baseRule, testParent)).toEqual({
                type: 'string'
            });
        });

        it('should map equal rule, withDefault', () => {
            expect(mapperFn({ ...baseRule, value: 'test', default: 'test' }, testParent)).toEqual({
                default: 'test',
                enum: ['test'],
                examples: ['test'],
                type: 'string'
            });
        });
        it('should map equal rule, withValue', () => {
            expect(mapperFn({ ...baseRule, value: 'test' }, testParent)).toEqual({
                enum: ['test'],
                type: 'string'
            });
        });
        it('should map equal rule, withField', () => {
            mockGetSchemaObjectFromRule.mockReturnValueOnce({
                examples: ['foo@bar.com'],
                format: 'email',
                pattern: '^\\S+@\\S+\\.\\S+$',
                type: 'string'
            });
            expect(mapperFn({ ...baseRule, field: 'fake' }, testParent)).toEqual({
                examples: ['foo@bar.com'],
                format: 'email',
                pattern: '^\\S+@\\S+\\.\\S+$',
                type: 'string'
            });
            expect(mockGetSchemaObjectFromRule).toHaveBeenCalledWith(testParent.fake);
        });
        it('should map equal rule, withStrict', () => {
            expect(mapperFn({ ...baseRule, strict: true, value: 2 }, testParent)).toEqual({
                enum: [2],
                type: 'number'
            });
        });
    });

    describe('forbidden mapper', () => {
        let mapperFn: Mapper<RuleForbidden>;
        const baseRule = {
            type: 'forbidden'
        } as RuleForbidden;

        beforeEach(() => {
            // @ts-ignore
            mapperFn = mappers.forbidden.bind(mappers);
        });

        it('should map forbidden rule, normal', () => {
            expect(mapperFn(baseRule)).toEqual(undefined);
        });
    });

    describe('function mapper', () => {
        let mapperFn: Mapper<RuleFunction>;
        const baseRule = {
            type: 'function'
        } as RuleFunction;

        beforeEach(() => {
            // @ts-ignore
            mapperFn = mappers.function.bind(mappers);
        });

        it('should map function rule, normal', () => {
            expect(mapperFn(baseRule)).toEqual(undefined);
        });
    });

    describe('luhn mapper', () => {
        let mapperFn: Mapper<RuleLuhn>;
        const baseRule = {
            type: 'luhn'
        } as RuleLuhn;

        beforeEach(() => {
            // @ts-ignore
            mapperFn = mappers.luhn.bind(mappers);
        });

        it('should map luhn rule, normal', () => {
            expect(mapperFn(baseRule)).toEqual({
                format: 'luhn',
                pattern: '^(\\d{1,4} ){3}\\d{1,4}$',
                type: 'string'
            });
        });

        it('should map luhn rule, withDefault', () => {
            expect(mapperFn({ ...baseRule, default: '4242424242424242' })).toEqual({
                default: '4242424242424242',
                examples: ['4242424242424242'],
                format: 'luhn',
                pattern: '^(\\d{1,4} ){3}\\d{1,4}$',
                type: 'string'
            });
        });
    });

    describe('mac mapper', () => {
        let mapperFn: Mapper<RuleMac>;
        const baseRule = {
            type: 'mac'
        } as RuleMac;

        beforeEach(() => {
            // @ts-ignore
            mapperFn = mappers.mac.bind(mappers);
        });

        it('should map mac rule, normal', () => {
            expect(mapperFn(baseRule)).toEqual({
                examples: ['01:C8:95:4B:65:FE', '01C8.954B.65FE', '01-C8-95-4B-65-FE'],
                format: 'mac',
                pattern:
                    '^((([a-f0-9][a-f0-9]+-){5}|([a-f0-9][a-f0-9]+:){5})([a-f0-9][a-f0-9])$)|(^([a-f0-9][a-f0-9][a-f0-9][a-f0-9]+[.]){2}([a-f0-9][a-f0-9][a-f0-9][a-f0-9]))$',
                type: 'string'
            });
        });

        it('should map mac rule, withDefault', () => {
            expect(mapperFn({ ...baseRule, default: '00:B0:D0:63:C2:26' })).toEqual({
                default: '00:B0:D0:63:C2:26',
                examples: ['00:B0:D0:63:C2:26'],
                format: 'mac',
                pattern:
                    '^((([a-f0-9][a-f0-9]+-){5}|([a-f0-9][a-f0-9]+:){5})([a-f0-9][a-f0-9])$)|(^([a-f0-9][a-f0-9][a-f0-9][a-f0-9]+[.]){2}([a-f0-9][a-f0-9][a-f0-9][a-f0-9]))$',
                type: 'string'
            });
        });
    });

    describe('multi mapper', () => {
        let mapperFn: Mapper<RuleMulti>;
        const baseRule = {
            type: 'multi'
        } as RuleMulti;

        beforeEach(() => {
            // @ts-ignore
            mapperFn = mappers.multi.bind(mappers);
        });

        it('should map multi rule, normal', () => {
            mockGetSchemaObjectFromRule.mockReturnValueOnce({
                type: 'string'
            });
            expect(mapperFn({ ...baseRule, rules: ['string'] })).toEqual({
                oneOf: [
                    {
                        type: 'string'
                    }
                ]
            });
            expect(mockGetSchemaObjectFromRule).toHaveBeenCalledWith('string');
        });

        it('should map multi rule, without rules', () => {
            expect(mapperFn(baseRule)).toEqual(undefined);
        });

        it('should map multi rule, withDefault', () => {
            mockGetSchemaObjectFromRule.mockReturnValueOnce({
                type: 'string'
            });
            expect(mapperFn({ ...baseRule, rules: ['string'], default: 'test' })).toEqual({
                default: 'test',
                examples: ['test'],
                oneOf: [
                    {
                        type: 'string'
                    }
                ]
            });
            expect(mockGetSchemaObjectFromRule).toHaveBeenCalledWith('string');
        });
        it('should map multi rule, withDifferentRules', () => {
            mockGetSchemaObjectFromRule.mockReturnValueOnce({
                type: 'string'
            });
            mockGetSchemaObjectFromRule.mockReturnValueOnce({
                $ref: '#/components/schemas/tests-mappers.multi.withDifferentRules.0'
            });
            expect(mapperFn({ ...baseRule, rules: ['string', subObject], default: 'test' })).toEqual({
                default: 'test',
                examples: ['test'],
                oneOf: [
                    {
                        type: 'string'
                    },
                    {
                        $ref: '#/components/schemas/tests-mappers.multi.withDifferentRules.0'
                    }
                ]
            });
            expect(mockGetSchemaObjectFromRule).toHaveBeenCalledWith('string');
            expect(mockGetSchemaObjectFromRule).toHaveBeenCalledWith(subObject);
        });
        it('should map multi rule, withMultipleSubSchemas', () => {
            mockGetSchemaObjectFromRule.mockReturnValueOnce({
                $ref: '#/components/schemas/tests-mappers.multi.withDifferentRules.0'
            });
            mockGetSchemaObjectFromRule.mockReturnValueOnce({
                $ref: '#/components/schemas/tests-mappers.multi.withDifferentRules.1'
            });
            expect(mapperFn({ ...baseRule, rules: [subObject, subObject], default: 'test' })).toEqual({
                default: 'test',
                examples: ['test'],
                oneOf: [
                    {
                        $ref: '#/components/schemas/tests-mappers.multi.withDifferentRules.0'
                    },
                    {
                        $ref: '#/components/schemas/tests-mappers.multi.withDifferentRules.1'
                    }
                ]
            });

            expect(mockGetSchemaObjectFromRule).toHaveBeenCalledWith(subObject);
            expect(mockGetSchemaObjectFromRule).toHaveBeenCalledWith(subObject);
        });
    });

    describe('number mapper', () => {
        let mapperFn: Mapper<RuleNumber>;
        const baseRule = {
            type: 'number'
        } as RuleNumber;

        beforeEach(() => {
            // @ts-ignore
            mapperFn = mappers.number.bind(mappers);
        });

        it('should map number rule, normal', () => {
            expect(mapperFn(baseRule)).toEqual({
                type: 'number'
            });
        });

        it('should map number rule, withDefault', () => {
            expect(mapperFn({ ...baseRule, default: 1 })).toEqual({
                default: 1,
                examples: [1],
                type: 'number'
            });
        });

        it('should map number rule, withMin', () => {
            expect(mapperFn({ ...baseRule, min: 1 })).toEqual({
                examples: [1],
                minimum: 1,
                type: 'number'
            });
        });

        it('should map number rule, withMax', () => {
            expect(mapperFn({ ...baseRule, max: 5 })).toEqual({
                examples: [5],
                maximum: 5,
                type: 'number'
            });
        });

        it('should map number rule, withEqual', () => {
            expect(mapperFn({ ...baseRule, equal: 2 })).toEqual({
                maximum: 2,
                minimum: 2,
                type: 'number'
            });
        });

        it('should map number rule, withNotEqual', () => {
            expect(mapperFn({ ...baseRule, notEqual: 2 })).toEqual({
                type: 'number'
            });
        });

        it('should map number rule, withInteger', () => {
            expect(mapperFn({ ...baseRule, integer: true })).toEqual({
                type: 'number'
            });
        });

        it('should map number rule, withPositive', () => {
            expect(mapperFn({ ...baseRule, positive: true })).toEqual({
                minimum: 0,
                type: 'number'
            });
        });

        it('should map number rule, withNegative', () => {
            expect(mapperFn({ ...baseRule, negative: true })).toEqual({
                maximum: 0,
                type: 'number'
            });
        });

        it('should map number rule, withConvert', () => {
            expect(mapperFn({ ...baseRule, convert: true })).toEqual({
                type: 'number'
            });
        });
    });

    describe('object mapper', () => {
        let mapperFn: Mapper<RuleObject>;
        const baseRule = {
            type: 'object'
        } as RuleObject;

        beforeEach(() => {
            // @ts-ignore
            mapperFn = mappers.object.bind(mappers);
        });

        it('should map object rule, normal', () => {
            expect(mapperFn(baseRule)).toEqual({
                type: 'object'
            });
        });

        it('should map object rule, withDefault', () => {
            expect(mapperFn({ ...baseRule, default: { foo: 'bar' } })).toEqual({
                default: {
                    foo: 'bar'
                },
                examples: [
                    {
                        foo: 'bar'
                    }
                ],
                type: 'object'
            });
        });
        it('should map object rule, withSubObject', () => {
            mockGetSchemaObjectFromSchema.mockReturnValueOnce({
                sub: {
                    $ref: '#/components/schemas/tests-mappers.object.withSubObject'
                }
            });
            expect(
                mapperFn({
                    ...baseRule,
                    properties: {
                        sub: subObject
                    }
                })
            ).toEqual({
                properties: {
                    sub: { $ref: '#/components/schemas/tests-mappers.object.withSubObject' }
                },
                type: 'object'
            });
            expect(mockGetSchemaObjectFromSchema).toHaveBeenCalledWith({ sub: subObject });
        });
        it('should map object rule, withStrict', () => {
            expect(mapperFn({ ...baseRule, strict: true })).toEqual({
                type: 'object'
            });
        });
        it('should map object rule, withProperties', () => {
            mockGetSchemaObjectFromSchema.mockReturnValueOnce({
                sub: {
                    $ref: '#/components/schemas/tests-mappers.object.withProperties'
                }
            });
            expect(
                mapperFn({
                    ...baseRule,
                    properties: {
                        num: 'number'
                    }
                })
            ).toEqual({
                properties: {
                    sub: {
                        $ref: '#/components/schemas/tests-mappers.object.withProperties'
                    }
                },
                type: 'object'
            });
            expect(mockGetSchemaObjectFromSchema).toHaveBeenCalledWith({
                num: 'number'
            });
        });
        it('should map object rule, withProps', () => {
            mockGetSchemaObjectFromSchema.mockReturnValueOnce({
                num: {
                    $ref: '#/components/schemas/tests-mappers.object.withProps'
                }
            });
            expect(
                mapperFn({
                    ...baseRule,
                    props: {
                        num: 'number'
                    }
                })
            ).toEqual({
                properties: {
                    num: {
                        $ref: '#/components/schemas/tests-mappers.object.withProps'
                    }
                },
                type: 'object'
            });
            expect(mockGetSchemaObjectFromSchema).toHaveBeenCalledWith({
                num: 'number'
            });
        });
        it('should map object rule, withMinProps', () => {
            expect(mapperFn({ ...baseRule, minProps: 1 })).toEqual({
                minProperties: 1,
                type: 'object'
            });
        });
        it('should map object rule, withMaxProps', () => {
            expect(mapperFn({ ...baseRule, maxProps: 2 })).toEqual({
                maxProperties: 2,
                type: 'object'
            });
        });
    });

    describe('record mapper', () => {
        let mapperFn: Mapper<RuleRecord>;
        const baseRule = {
            type: 'record'
        } as RuleRecord;

        beforeEach(() => {
            // @ts-ignore
            mapperFn = mappers.record.bind(mappers);
        });

        it('should map record rule, normal', () => {
            expect(mapperFn(baseRule)).toEqual({
                type: 'object'
            });
        });

        it('should map record rule, withDefault', () => {
            expect(mapperFn({ ...baseRule, default: { foo: 'bar' } })).toEqual({
                default: {
                    foo: 'bar'
                },
                type: 'object'
            });
        });
        it('should map record rule, withKey', () => {
            expect(
                mapperFn({
                    ...baseRule,
                    key: {
                        type: 'string'
                    }
                })
            ).toEqual({
                type: 'object'
            });
        });
        it('should map record rule, withValue', () => {
            mockGetSchemaObjectFromRule.mockReturnValueOnce({
                type: 'number'
            });
            expect(mapperFn({ ...baseRule, value: { type: 'number' } })).toEqual({
                additionalProperties: {
                    type: 'number'
                },
                type: 'object'
            });
            expect(mockGetSchemaObjectFromRule).toHaveBeenCalledWith({ type: 'number' });
        });
    });

    describe('string mapper', () => {
        let mapperFn: Mapper<RuleString>;
        const baseRule = {
            type: 'string'
        } as RuleString;

        beforeEach(() => {
            // @ts-ignore
            mapperFn = mappers.string.bind(mappers);
        });

        it('should map string rule, normal', () => {
            expect(mapperFn(baseRule)).toEqual({
                type: 'string'
            });
        });

        it('should map string rule, allowEmpty', () => {
            expect(mapperFn({ ...baseRule, empty: true })).toEqual({
                type: 'string'
            });
        });
        it('should map string rule, withMin', () => {
            expect(mapperFn({ ...baseRule, min: 5 })).toEqual({
                type: 'string',
                minLength: 5
            });
        });
        it('should map string rule, withMax', () => {
            expect(mapperFn({ ...baseRule, max: 10 })).toEqual({
                type: 'string',
                maxLength: 10
            });
        });
        it('should map string rule, withLength', () => {
            expect(mapperFn({ ...baseRule, length: 10 })).toEqual({
                type: 'string',
                maxLength: 10,
                minLength: 10
            });
        });
        it('should map string rule, withPattern', () => {
            expect(mapperFn({ ...baseRule, pattern: /^[a-z]+$/ })).toEqual({
                type: 'string',
                pattern: '^[a-z]+$'
            });
        });
        it('should map string rule, withContains', () => {
            expect(mapperFn({ ...baseRule, contains: 'test' })).toEqual({
                type: 'string',
                pattern: '.*test.*',
                examples: ['test']
            });
        });
        it('should map string rule, withEnum', () => {
            expect(mapperFn({ ...baseRule, enum: ['option1', 'option2', 'option3'] })).toEqual({
                type: 'string',
                examples: ['option1'],
                enum: ['option1', 'option2', 'option3']
            });
        });
        it('should map string rule, withAlpha', () => {
            expect(mapperFn({ ...baseRule, alpha: true })).toEqual({
                type: 'string',
                examples: ['abcdef'],
                format: 'alpha',
                pattern: '^[a-zA-Z]+$'
            });
        });
        it('should map string rule, withNumeric', () => {
            expect(mapperFn({ ...baseRule, numeric: true })).toEqual({
                type: 'string',
                examples: ['12345'],
                format: 'numeric',
                pattern: '^[0-9]+$'
            });
        });
        it('should map string rule, withAlphanum', () => {
            expect(mapperFn({ ...baseRule, alphanum: true })).toEqual({
                type: 'string',
                examples: ['abc123'],
                format: 'alphanum',
                pattern: '^[a-zA-Z0-9]+$'
            });
        });
        it('should map string rule, withAlphadash', () => {
            expect(mapperFn({ ...baseRule, alphadash: true })).toEqual({
                type: 'string',
                examples: ['abc-123'],
                format: 'alphadash',
                pattern: '^[a-zA-Z0-9_-]+$'
            });
        });
        it('should map string rule, withHex', () => {
            expect(mapperFn({ ...baseRule, hex: true })).toEqual({
                type: 'string',
                examples: ['48656c6c6f20576f726c64'],
                format: 'hex',
                pattern: '^([0-9A-Fa-f]{2})+$'
            });
        });
        it('should map string rule, withSingleLine', () => {
            expect(mapperFn({ ...baseRule, singleLine: true })).toEqual({
                type: 'string',
                examples: ['abc 123'],
                format: 'single-line',
                pattern: '^[^\\r\\n]*$'
            });
        });
        it('should map string rule, withBase64', () => {
            expect(mapperFn({ ...baseRule, base64: true })).toEqual({
                type: 'string',
                examples: ['aGVsbG8gd29ybGQ='],
                format: 'byte',
                pattern: '^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$'
            });
        });
        it('should map string rule, withTrim', () => {
            expect(mapperFn({ ...baseRule, trim: true })).toEqual({
                type: 'string'
            });
        });
        it('should map string rule, withTrimLeft', () => {
            expect(mapperFn({ ...baseRule, trimLeft: true })).toEqual({
                type: 'string'
            });
        });
        it('should map string rule, withTrimRight', () => {
            expect(mapperFn({ ...baseRule, trimRight: true })).toEqual({
                type: 'string'
            });
        });
        it('should map string rule, withPadStart', () => {
            expect(mapperFn({ ...baseRule, padStart: 5 })).toEqual({
                type: 'string'
            });
        });
        it('should map string rule, withPadEnd', () => {
            expect(mapperFn({ ...baseRule, padEnd: 5 })).toEqual({
                type: 'string'
            });
        });
        it('should map string rule, withPadChar', () => {
            expect(mapperFn({ ...baseRule, padChar: '*' })).toEqual({
                type: 'string'
            });
        });
        it('should map string rule, withLowerCase', () => {
            expect(mapperFn({ ...baseRule, lowercase: true })).toEqual({
                type: 'string'
            });
        });
        it('should map string rule, withUpperCase', () => {
            expect(mapperFn({ ...baseRule, uppercase: true })).toEqual({
                type: 'string'
            });
        });
        it('should map string rule, withLocaleLowerCase', () => {
            expect(mapperFn({ ...baseRule, localeLowercase: true })).toEqual({
                type: 'string'
            });
        });
        it('should map string rule, withLocaleUpperCase', () => {
            expect(mapperFn({ ...baseRule, localeUppercase: true })).toEqual({
                type: 'string'
            });
        });
        it('should map string rule, withConvert', () => {
            expect(mapperFn({ ...baseRule, convert: true })).toEqual({
                type: 'string'
            });
        });
    });

    describe('tuple mapper', () => {
        let mapperFn: Mapper<RuleTuple>;
        const baseRule = {
            type: 'tuple'
        } as RuleTuple;

        beforeEach(() => {
            // @ts-ignore
            mapperFn = mappers.tuple.bind(mappers);
        });

        it('should map tuple rule, normal', () => {
            expect(mapperFn(baseRule)).toEqual(undefined);
        });

        it('should map tuple rule, withDefault', () => {
            mockGetSchemaObjectFromRule.mockReturnValueOnce({
                default: [1, 'test'],
                examples: [[1, 'test']],
                maxItems: 2,
                minItems: 2,
                type: 'array'
            });
            expect(mapperFn({ ...baseRule, default: [1, 'test'] })).toEqual({
                default: [1, 'test'],
                examples: [[1, 'test']],
                maxItems: 2,
                minItems: 2,
                type: 'array'
            });
            expect(mockGetSchemaObjectFromRule).toHaveBeenCalledWith({
                default: [1, 'test'],
                length: 2,
                type: 'array'
            });
        });
        it('should map tuple rule, withEmpty', () => {
            mockGetSchemaObjectFromRule.mockReturnValueOnce({
                maxItems: 2,
                minItems: 2,
                type: 'array'
            });
            expect(mapperFn({ ...baseRule, empty: true })).toEqual({
                maxItems: 2,
                minItems: 2,
                type: 'array'
            });
            expect(mockGetSchemaObjectFromRule).toHaveBeenCalledWith({ length: 2, type: 'array' });
        });
        it('should map tuple rule, withItems', () => {
            mockGetSchemaObjectFromRule.mockReturnValueOnce({
                maxItems: 2,
                minItems: 2,
                type: 'array'
            });
            mockGetSchemaObjectFromRule.mockReturnValueOnce({
                $ref: '#/components/schemas/tests-mappers.tuple.withItems.0'
            });
            mockGetSchemaObjectFromRule.mockReturnValueOnce({
                type: 'string'
            });
            expect(mapperFn({ ...baseRule, items: [subObject, { type: 'string' }] })).toEqual({
                items: {
                    oneOf: [
                        {
                            $ref: '#/components/schemas/tests-mappers.tuple.withItems.0'
                        },
                        {
                            type: 'string'
                        }
                    ]
                },
                maxItems: 2,
                minItems: 2,
                type: 'array'
            });
            expect(mockGetSchemaObjectFromRule).toHaveBeenNthCalledWith(1, {
                length: 2,
                type: 'array'
            });
            expect(mockGetSchemaObjectFromRule).toHaveBeenCalledWith(subObject);
            expect(mockGetSchemaObjectFromRule).toHaveBeenCalledWith({ type: 'string' });
        });
    });

    describe('url mapper', () => {
        let mapperFn: Mapper<RuleURL>;
        const baseRule = {
            type: 'url'
        } as RuleURL;

        beforeEach(() => {
            // @ts-ignore
            mapperFn = mappers.url.bind(mappers);
        });

        it('should map url rule, normal', () => {
            expect(mapperFn(baseRule)).toEqual({
                examples: ['https://foobar.com'],
                format: 'url',
                type: 'string'
            });
        });

        it('should map url rule, withDefault', () => {
            expect(mapperFn({ ...baseRule, default: 'https://mysite.com' })).toEqual({
                default: 'https://mysite.com',
                examples: ['https://mysite.com'],
                format: 'url',
                type: 'string'
            });
        });
        it('should map url rule, withEmpty', () => {
            expect(mapperFn({ ...baseRule, empty: true })).toEqual({
                examples: ['https://foobar.com'],
                format: 'url',
                type: 'string'
            });
        });
    });

    describe('uuid mapper', () => {
        let mapperFn: Mapper<RuleUUID>;
        const baseRule = {
            type: 'uuid'
        } as RuleUUID;

        beforeEach(() => {
            // @ts-ignore
            mapperFn = mappers.uuid.bind(mappers);
        });

        it('should map uuid rule, normal', () => {
            expect(mapperFn(baseRule)).toEqual({
                examples: ['10ba038e-48da-487b-96e8-8d3b99b6d18a'],
                format: 'uuid',
                type: 'string'
            });
        });

        it('should map uuid rule, withDefault', () => {
            expect(mapperFn({ ...baseRule, default: '6a6e3331-4e5f-4c5b-9b78-782d60426cc6' })).toEqual({
                default: '6a6e3331-4e5f-4c5b-9b78-782d60426cc6',
                examples: ['6a6e3331-4e5f-4c5b-9b78-782d60426cc6'],
                format: 'uuid',
                type: 'string'
            });
        });
        it('should map uuid rule, withVersion0', () => {
            expect(mapperFn({ ...baseRule, version: 0 })).toEqual({
                examples: ['00000000-0000-0000-0000-000000000000'],
                format: 'uuid',
                type: 'string'
            });
        });
        it('should map uuid rule, withVersion1', () => {
            expect(mapperFn({ ...baseRule, version: 1 })).toEqual({
                examples: ['45745c60-7b1a-11e8-9c9c-2d42b21b1a3e'],
                format: 'uuid',
                type: 'string'
            });
        });
        it('should map uuid rule, withVersion2', () => {
            expect(mapperFn({ ...baseRule, version: 2 })).toEqual({
                examples: ['9a7b330a-a736-21e5-af7f-feaf819cdc9f'],
                format: 'uuid',
                type: 'string'
            });
        });
        it('should map uuid rule, withVersion3', () => {
            expect(mapperFn({ ...baseRule, version: 3 })).toEqual({
                examples: ['9125a8dc-52ee-365b-a5aa-81b0b3681cf6'],
                format: 'uuid',
                type: 'string'
            });
        });
        it('should map uuid rule, withVersion4', () => {
            expect(mapperFn({ ...baseRule, version: 4 })).toEqual({
                examples: ['10ba038e-48da-487b-96e8-8d3b99b6d18a'],
                format: 'uuid',
                type: 'string'
            });
        });
        it('should map uuid rule, withVersion5', () => {
            expect(mapperFn({ ...baseRule, version: 5 })).toEqual({
                examples: ['fdda765f-fc57-5604-a269-52a7df8164ec'],
                format: 'uuid',
                type: 'string'
            });
        });
        it('should map uuid rule, withVersion6', () => {
            expect(mapperFn({ ...baseRule, version: 6 })).toEqual({
                examples: ['a9030619-8514-6970-e0f9-81b9ceb08a5f'],
                format: 'uuid',
                type: 'string'
            });
        });
    });

    describe('objectID mapper', () => {
        let mapperFn: Mapper<RuleObjectID>;
        const baseRule = {
            type: 'objectID'
        } as RuleObjectID;

        beforeEach(() => {
            // @ts-ignore
            mapperFn = mappers.objectID.bind(mappers);
        });

        it('should map objectID rule, normal', () => {
            expect(mapperFn(baseRule)).toEqual({
                examples: ['507f1f77bcf86cd799439011'],
                format: 'ObjectId',
                maxLength: 24,
                minLength: 24,
                type: 'string'
            });
        });

        it('should map objectID rule, withDefault', () => {
            expect(mapperFn({ ...baseRule, default: '507f1f77bcf86cd799439012' })).toEqual({
                default: '507f1f77bcf86cd799439012',
                examples: ['507f1f77bcf86cd799439012'],
                format: 'ObjectId',
                maxLength: 24,
                minLength: 24,
                type: 'string'
            });
        });
        it('should map objectID rule, withConvert', () => {
            expect(mapperFn({ ...baseRule, convert: true })).toEqual({
                examples: ['507f1f77bcf86cd799439011'],
                format: 'ObjectId',
                maxLength: 24,
                minLength: 24,
                type: 'string'
            });
        });
    });

    describe('custom mapper', () => {
        let mapperFn: Mapper<RuleCustomInline>;
        const baseRule = {
            type: 'custom',
            check: () => true
        } as RuleCustomInline;

        beforeEach(() => {
            // @ts-ignore
            mapperFn = mappers.custom.bind(mappers);
        });

        it('should map custom rule, normal', () => {
            expect(mapperFn(baseRule)).toEqual(undefined);
        });
    });
});
