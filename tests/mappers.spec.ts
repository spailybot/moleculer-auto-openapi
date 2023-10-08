// Use random ports during tests
process.env.PORT = '0';

import { ServiceBroker } from 'moleculer';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { OA_GENERATE_DOCS_INPUT, OA_GENERATE_DOCS_OUTPUT } from '../src/index.js';
import type { OpenAPIV3_1 as OA } from 'openapi-types';
import { ApiService } from './datas/services/api.service.js';
import { OpenapiService } from './datas/services/openapi.service.js';
import { testMappersService } from './datas/services/testMappers.service.js';

describe('Test FastestValidator mappers', () => {
    const broker = new ServiceBroker({ logger: false });
    broker.createService(testMappersService);
    broker.createService(OpenapiService);
    broker.createService(ApiService);

    let OADocument: OA_GENERATE_DOCS_OUTPUT;
    beforeAll(async () => {
        await broker.start();

        await broker.waitForServices([testMappersService.name, OpenapiService.name, ApiService.name]);
        await new Promise<void>((resolve) => {
            broker.createService({
                name: 'apiwaiter',
                events: {
                    '$api.aliases.regenerated'() {
                        resolve();
                    }
                }
            });
        });

        OADocument = await broker.call<OA_GENERATE_DOCS_OUTPUT, OA_GENERATE_DOCS_INPUT>(`${OpenapiService.name}.generateDocs`, {});
    });

    afterAll(() => broker.stop());

    describe('simple tests', () => {
        let testSchema: OA.SchemaObject;
        beforeAll(() => {
            testSchema = OADocument.components.schemas[`${testMappersService.name}.simple`];
        });
        it('should generate correct openapi for type any', async () => {
            const property = testSchema.properties.any;
            expect(property).toBeDefined();
        });

        it('should generate correct openapi for type array', async () => {
            const property = testSchema.properties.array;
            expect(property).toEqual({
                type: 'array'
            });
        });

        it('should generate correct openapi for type boolean', async () => {
            const property = testSchema.properties.boolean;
            expect(property).toEqual({
                type: 'boolean',
                examples: [true, false]
            });
        });

        it('should generate correct openapi for type class', async () => {
            const property = testSchema.properties.class;
            expect(property).not.toBeDefined();
        });

        it('should generate correct openapi for type currency', async () => {
            const property = testSchema.properties.currency;
            expect(property).toEqual({
                type: 'string',
                pattern: '(?=.*\\d)^(-?|-?)(([0-9]\\d{0,2}(,\\d{3})*)|0)?(\\.\\d{1,2})?$',
                format: 'currency'
            });
        });

        it('should generate correct openapi for type date', async () => {
            const property: OA.SchemaObject = testSchema.properties.date;
            expect(property).toEqual({
                type: 'string',
                format: 'date-time',
                examples: expect.arrayContaining([expect.any(String)])
            });

            const dateObject = new Date(property.examples[0]);
            expect(dateObject).toBeInstanceOf(Date);
            expect(isNaN(dateObject.getTime())).toBeFalsy();
        });

        it('should generate correct openapi for type email', async () => {
            const property = testSchema.properties.email;
            expect(property).toEqual({
                examples: ['foo@bar.com'],
                format: 'email',
                pattern: '^\\S+@\\S+\\.\\S+$',
                type: 'string'
            });
        });

        it('should generate correct openapi for type enum', async () => {
            const property = testSchema.properties.enum;
            expect(property).toEqual({ type: 'string', enum: ['admin', 'user', 'guest'], examples: ['admin'] });
        });

        it('should generate correct openapi for type equal', async () => {
            const property = testSchema.properties.equal;
            expect(property).toEqual({
                type: 'string'
            });
        });

        it('should generate correct openapi for type forbidden', async () => {
            const property = testSchema.properties.forbidden;
            expect(property).not.toBeDefined();
        });

        it('should generate correct openapi for type function', async () => {
            const property = testSchema.properties.function;
            expect(property).not.toBeDefined();
        });

        it('should generate correct openapi for type luhn', async () => {
            const property = testSchema.properties.luhn;
            expect(property).toEqual({
                type: 'string',
                pattern: '^(\\d{1,4} ){3}\\d{1,4}$',
                format: 'luhn'
            });
        });

        it('should generate correct openapi for type mac', async () => {
            const property = testSchema.properties.mac;
            expect(property).toEqual({
                examples: ['01:C8:95:4B:65:FE', '01C8.954B.65FE', '01-C8-95-4B-65-FE'],
                format: 'mac',
                pattern:
                    '^((([a-f0-9][a-f0-9]+[-]){5}|([a-f0-9][a-f0-9]+[:]){5})([a-f0-9][a-f0-9])$)|(^([a-f0-9][a-f0-9][a-f0-9][a-f0-9]+[.]){2}([a-f0-9][a-f0-9][a-f0-9][a-f0-9]))$',
                type: 'string'
            });
        });

        it('should generate correct openapi for type multi', async () => {
            const property = testSchema.properties.multi;
            expect(property).toEqual({
                oneOf: [
                    { type: 'string' },
                    {
                        type: 'boolean',
                        examples: [true, false]
                    }
                ]
            });
        });

        it('should generate correct openapi for type number', async () => {
            const property = testSchema.properties.number;
            expect(property).toEqual({
                type: 'number'
            });
        });

        it('should generate correct openapi for type object', async () => {
            expect(testSchema.properties.object).toEqual({
                type: 'object'
            });
        });

        it('should generate correct openapi for type objectID', async () => {
            const property = testSchema.properties.objectID;
            expect(property).toEqual({
                examples: ['507f1f77bcf86cd799439011'],
                format: 'ObjectId',
                maxLength: 24,
                minLength: 24,
                type: 'string'
            });
        });

        it('should generate correct openapi for type record', async () => {
            const property = testSchema.properties.record;
            expect(property).toEqual({
                type: 'object'
            });
        });

        it('should generate correct openapi for type string', async () => {
            const property = testSchema.properties.string;
            expect(property).toEqual({
                type: 'string'
            });
        });

        it('should generate correct openapi for type tuple', async () => {
            const property = testSchema.properties.tuple;
            expect(property).toEqual({
                maxItems: 2,
                minItems: 2,
                type: 'array'
            });
        });

        it('should generate correct openapi for type url', async () => {
            const property = testSchema.properties.url;
            expect(property).toEqual({
                type: 'string',
                format: 'url',
                examples: ['https://foobar.com']
            });
        });

        it('should generate correct openapi for type uuid', async () => {
            const property = testSchema.properties.uuid;
            expect(property).toEqual({
                examples: ['10ba038e-48da-487b-96e8-8d3b99b6d18a'],
                format: 'uuid',
                type: 'string'
            });
        });

        it('should generate correct openapi for type custom', async () => {
            expect(testSchema.properties.custom).not.toBeDefined();
        });
    });

    describe('any tests', () => {
        let testSchema: OA.SchemaObject;
        beforeAll(() => {
            testSchema = OADocument.components.schemas[`${testMappersService.name}.any`];
        });
        it('should generate correct openapi for type any', async () => {
            const property = testSchema.properties.normal;
            expect(property).toBeDefined();
        });
        it('should generate correct openapi for type any shorthand', async () => {
            const property = testSchema.properties.shortHand;
            expect(property).toBeDefined();
        });
        it('should generate correct openapi for type any with default', async () => {
            const property = testSchema.properties.withDefault;
            expect(property).toEqual({
                default: 'test',
                examples: ['test']
            });
        });
    });

    describe('array tests', () => {
        let testSchema: OA.SchemaObject;
        beforeAll(() => {
            testSchema = OADocument.components.schemas[`${testMappersService.name}.array`];
        });
        it('should generate correct openapi for type array', async () => {
            const property = testSchema.properties.normal;
            expect(property).toEqual({
                type: 'array'
            });
        });
        it('should generate correct openapi for type array shorthand', async () => {
            const property = testSchema.properties.shortHand;
            expect(property).toEqual({
                type: 'array'
            });
        });
        it('should generate correct openapi for type array with empty', async () => {
            const property = testSchema.properties.withEmpty;
            expect(property).toEqual({
                type: 'array'
            });
        });
        it('should generate correct openapi for type array with min', async () => {
            const property = testSchema.properties.withMin;
            expect(property).toEqual({
                minItems: 1,
                type: 'array'
            });
        });
        it('should generate correct openapi for type array with max', async () => {
            const property = testSchema.properties.withMax;
            expect(property).toEqual({
                maxItems: 1,
                type: 'array'
            });
        });
        it('should generate correct openapi for type array with length', async () => {
            const property = testSchema.properties.withLength;
            expect(property).toEqual({
                maxItems: 1,
                minItems: 1,
                type: 'array'
            });
        });
        it('should generate correct openapi for type array with contains', async () => {
            const property = testSchema.properties.withContains;
            expect(property).toEqual({
                type: 'array'
            });
        });
        it('should generate correct openapi for type array with unique', async () => {
            const property = testSchema.properties.withUnique;
            expect(property).toEqual({
                type: 'array',
                uniqueItems: true
            });
        });
        it('should generate correct openapi for type array with enum', async () => {
            const property = testSchema.properties.withEnum;
            expect(property).toEqual({
                type: 'array'
            });
        });
        it('should generate correct openapi for type array with items', async () => {
            const property = testSchema.properties.withItems;
            expect(property).toEqual({
                type: 'array',
                items: {
                    type: 'string'
                }
            });
        });
        it('should generate correct openapi for type array with default', async () => {
            const property = testSchema.properties.withDefault;
            expect(property).toEqual({
                default: ['test1', 'test2'],
                examples: [['test1', 'test2']],
                type: 'array'
            });
        });
        it('should generate correct openapi for type array with sub object', async () => {
            const property = testSchema.properties.withSubObject;
            expect(property).toEqual({
                items: {
                    $ref: '#/components/schemas/tests-mappers.array.withSubObject'
                },
                type: 'array'
            });

            const subSchema = OADocument.components.schemas[`${testMappersService.name}.array.withSubObject`];
            expect(subSchema).toEqual({
                properties: {
                    num: {
                        type: 'number'
                    }
                },
                required: ['num'],
                type: 'object'
            });
        });
    });

    describe('boolean tests', () => {
        let testSchema: OA.SchemaObject;
        beforeAll(() => {
            testSchema = OADocument.components.schemas[`${testMappersService.name}.boolean`];
        });
        it('should generate correct openapi for type boolean', async () => {
            const property = testSchema.properties.normal;
            expect(property).toEqual({
                type: 'boolean',
                examples: [true, false]
            });
        });
        it('should generate correct openapi for type boolean shorthand', async () => {
            const property = testSchema.properties.shortHand;
            expect(property).toEqual({
                type: 'boolean',
                examples: [true, false]
            });
        });
        it('should generate correct openapi for type boolean with convert', async () => {
            const property = testSchema.properties.withConvert;
            expect(property).toEqual({
                type: 'boolean',
                examples: [true, false]
            });
        });
        it('should generate correct openapi for type boolean with default', async () => {
            const property = testSchema.properties.withDefault;
            expect(property).toEqual({
                default: [true],
                examples: [true],
                type: 'boolean'
            });
        });
    });

    describe('class tests', () => {
        let testSchema: OA.SchemaObject;
        beforeAll(() => {
            testSchema = OADocument.components.schemas[`${testMappersService.name}.class`];
        });
        it("shouldn't generate openapi for type class", async () => {
            const property = testSchema.properties.normal;
            expect(property).toBeUndefined();
        });
        it("shouldn't generate openapi for type class shorthand", async () => {
            const property = testSchema.properties.shortHand;
            expect(property).toBeUndefined();
        });
        it("shouldn't generate openapi for type class with default", async () => {
            const property = testSchema.properties.withDefault;
            expect(property).toBeUndefined();
        });
    });

    describe('currency tests', () => {
        let testSchema: OA.SchemaObject;
        beforeAll(() => {
            testSchema = OADocument.components.schemas[`${testMappersService.name}.currency`];
        });
        it('should generate openapi for type currency', async () => {
            const property = testSchema.properties.normal;
            expect(property).toEqual({
                format: 'currency',
                pattern: '(?=.*\\d)^(-?|-?)(([0-9]\\d{0,2}(,\\d{3})*)|0)?(\\.\\d{1,2})?$',
                type: 'string'
            });
        });
        it('should generate openapi for type currency shorthand', async () => {
            const property = testSchema.properties.shortHand;
            expect(property).toEqual({
                format: 'currency',
                pattern: '(?=.*\\d)^(-?|-?)(([0-9]\\d{0,2}(,\\d{3})*)|0)?(\\.\\d{1,2})?$',
                type: 'string'
            });
        });
        it('should generate openapi for type currency with default', async () => {
            const property = testSchema.properties.withDefault;
            expect(property).toEqual({
                default: '$12,222.2',
                examples: ['$12,222.2'],
                format: 'currency',
                pattern: '(?=.*\\d)^(-?|-?)(([0-9]\\d{0,2}(,\\d{3})*)|0)?(\\.\\d{1,2})?$',
                type: 'string'
            });
        });
        it('should generate openapi for type currency with currencySymbol', async () => {
            const property = testSchema.properties.withCurrencySymbol;
            expect(property).toEqual({
                format: 'currency',
                pattern: '(?=.*\\d)^(-?\\$|\\$-?)(([0-9]\\d{0,2}(,\\d{3})*)|0)?(\\.\\d{1,2})?$',
                type: 'string'
            });
        });
        it('should generate openapi for type currency with symbolOptional', async () => {
            const property = testSchema.properties.withSymbolOptional;
            expect(property).toEqual({
                format: 'currency',
                pattern: '(?=.*\\d)^(-?\\$?|\\$?-?)(([0-9]\\d{0,2}(,\\d{3})*)|0)?(\\.\\d{1,2})?$',
                type: 'string'
            });
        });
        it('should generate openapi for type currency with thousandSeparator', async () => {
            const property = testSchema.properties.withThousandSeparator;
            expect(property).toEqual({
                format: 'currency',
                pattern: '(?=.*\\d)^(-?|-?)(([0-9]\\d{0,2}( \\d{3})*)|0)?(\\.\\d{1,2})?$',
                type: 'string'
            });
        });
        it('should generate openapi for type currency with decimalSeparator', async () => {
            const property = testSchema.properties.withDecimalSeparator;
            expect(property).toEqual({
                format: 'currency',
                pattern: '(?=.*\\d)^(-?|-?)(([0-9]\\d{0,2}(,\\d{3})*)|0)?(\\,\\d{1,2})?$',
                type: 'string'
            });
        });
        it('should generate openapi for type currency with customRegex', async () => {
            const property = testSchema.properties.withCustomRegex;
            expect(property).toEqual({
                format: 'currency',
                pattern: '/[a-z]/i',
                type: 'string'
            });
        });
    });

    describe('date tests', () => {
        let testSchema: OA.SchemaObject;
        beforeAll(() => {
            testSchema = OADocument.components.schemas[`${testMappersService.name}.date`];
        });
        it('should generate openapi for type date', async () => {
            const property = testSchema.properties.normal;
            expect(property).toEqual({
                type: 'string',
                examples: expect.arrayContaining([expect.any(String), expect.any(Number)]),
                format: 'date-time'
            });
        });
        it('should generate openapi for type date shorthand', async () => {
            const property = testSchema.properties.shortHand;
            expect(property).toEqual({
                type: 'string',
                examples: expect.arrayContaining([expect.any(String), expect.any(Number)]),
                format: 'date-time'
            });
        });
        it('should generate openapi for type date with default', async () => {
            const property = testSchema.properties.withDefault;
            expect(property).toEqual({
                default: '1998-01-10T13:00:00.000Z',
                examples: ['1998-01-10T13:00:00.000Z', 884437200000],
                format: 'date-time',
                type: 'string'
            });
        });
    });

    describe('email tests', () => {
        let testSchema: OA.SchemaObject;
        beforeAll(() => {
            testSchema = OADocument.components.schemas[`${testMappersService.name}.email`];
        });
        it('should generate openapi for type email', async () => {
            const property = testSchema.properties.normal;
            expect(property).toEqual({
                examples: ['foo@bar.com'],
                format: 'email',
                pattern: '^\\S+@\\S+\\.\\S+$',
                type: 'string'
            });
        });
        it('should generate openapi for type email shorthand', async () => {
            const property = testSchema.properties.shortHand;
            expect(property).toEqual({
                examples: ['foo@bar.com'],
                format: 'email',
                pattern: '^\\S+@\\S+\\.\\S+$',
                type: 'string'
            });
        });
        it('should generate openapi for type email with default', async () => {
            const property = testSchema.properties.withDefault;
            expect(property).toEqual({
                default: 'email@foobar.com',
                examples: ['email@foobar.com'],
                format: 'email',
                pattern: '^\\S+@\\S+\\.\\S+$',
                type: 'string'
            });
        });
        it('should generate openapi for type email with empty', async () => {
            const property = testSchema.properties.withEmpty;
            expect(property).toEqual({
                examples: ['foo@bar.com'],
                format: 'email',
                pattern: '^\\S+@\\S+\\.\\S+$',
                type: 'string'
            });
        });
        it('should generate openapi for type email with mode', async () => {
            const property = testSchema.properties.withMode;
            expect(property).toEqual({
                examples: ['foo@bar.com'],
                format: 'email',
                pattern:
                    '^(([^<>()[\\]\\\\.,;:\\s@"]+(\\.[^<>()[\\]\\\\.,;:\\s@"]+)*)|(".+"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\])|(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,}))$',
                type: 'string'
            });
        });
        it('should generate openapi for type email with normalize', async () => {
            const property = testSchema.properties.withNormalize;
            expect(property).toEqual({
                examples: ['foo@bar.com'],
                format: 'email',
                pattern: '^\\S+@\\S+\\.\\S+$',
                type: 'string'
            });
        });
        it('should generate openapi for type email with min', async () => {
            const property = testSchema.properties.withMin;
            expect(property).toEqual({
                examples: ['foo@bar.com'],
                format: 'email',
                minLength: 1,
                pattern: '^\\S+@\\S+\\.\\S+$',
                type: 'string'
            });
        });
        it('should generate openapi for type email with max', async () => {
            const property = testSchema.properties.withMax;
            expect(property).toEqual({
                examples: ['foo@bar.com'],
                format: 'email',
                maxLength: 5,
                pattern: '^\\S+@\\S+\\.\\S+$',
                type: 'string'
            });
        });
    });

    describe('enum tests', () => {
        let testSchema: OA.SchemaObject;
        beforeAll(() => {
            testSchema = OADocument.components.schemas[`${testMappersService.name}.enum`];
        });
        it('should generate openapi for type enum', async () => {
            const property = testSchema.properties.normal;
            expect(property).toEqual({
                enum: ['test1', 'test2', 'test3'],
                examples: ['test1'],
                type: 'string'
            });
        });
    });

    describe('equal tests', () => {
        let testSchema: OA.SchemaObject;
        beforeAll(() => {
            testSchema = OADocument.components.schemas[`${testMappersService.name}.equal`];
        });
        it('should generate openapi for type equal', async () => {
            const property = testSchema.properties.normal;
            expect(property).toEqual({
                type: 'string'
            });
        });
        it('should generate openapi for type equal with default', async () => {
            const property = testSchema.properties.withDefault;
            expect(property).toEqual({
                default: 'test',
                enum: ['test'],
                examples: ['test'],
                type: 'string'
            });
        });
        it('should generate openapi for type equal with value', async () => {
            const property = testSchema.properties.withValue;
            expect(property).toEqual({
                enum: ['test'],
                type: 'string'
            });
        });
        it('should generate openapi for type equal with field', async () => {
            const property = testSchema.properties.withField;
            expect(property).toEqual({
                examples: ['foo@bar.com'],
                format: 'email',
                pattern: '^\\S+@\\S+\\.\\S+$',
                type: 'string'
            });
        });
        it('should generate openapi for type equal with strict', async () => {
            const property = testSchema.properties.withStrict;
            expect(property).toEqual({
                enum: [2],
                type: 'number'
            });
        });
    });

    describe('forbidden tests', () => {
        let testSchema: OA.SchemaObject;
        beforeAll(() => {
            testSchema = OADocument.components.schemas[`${testMappersService.name}.forbidden`];
        });
        it('should generate openapi for type forbidden', async () => {
            const property = testSchema.properties.normal;
            expect(property).toBeUndefined();
        });
        it('should generate openapi for type forbidden with shortHand', async () => {
            const property = testSchema.properties.shortHand;
            expect(property).toBeUndefined();
        });
    });

    describe('function tests', () => {
        let testSchema: OA.SchemaObject;
        beforeAll(() => {
            testSchema = OADocument.components.schemas[`${testMappersService.name}.function`];
        });
        it('should generate openapi for type function', async () => {
            const property = testSchema.properties.normal;
            expect(property).toBeUndefined();
        });
        it('should generate openapi for type function with shortHand', async () => {
            const property = testSchema.properties.shortHand;
            expect(property).toBeUndefined();
        });
    });

    describe('luhn tests', () => {
        let testSchema: OA.SchemaObject;
        beforeAll(() => {
            testSchema = OADocument.components.schemas[`${testMappersService.name}.luhn`];
        });
        it('should generate openapi for type luhn', async () => {
            const property = testSchema.properties.normal;
            expect(property).toEqual({
                format: 'luhn',
                pattern: '^(\\d{1,4} ){3}\\d{1,4}$',
                type: 'string'
            });
        });
        it('should generate openapi for type luhn with shortHand', async () => {
            const property = testSchema.properties.shortHand;
            expect(property).toEqual({
                format: 'luhn',
                pattern: '^(\\d{1,4} ){3}\\d{1,4}$',
                type: 'string'
            });
        });
        it('should generate openapi for type luhn with default', async () => {
            const property = testSchema.properties.withDefault;
            expect(property).toEqual({
                default: '4242424242424242',
                examples: ['4242424242424242'],
                format: 'luhn',
                pattern: '^(\\d{1,4} ){3}\\d{1,4}$',
                type: 'string'
            });
        });
    });

    describe('mac tests', () => {
        let testSchema: OA.SchemaObject;
        beforeAll(() => {
            testSchema = OADocument.components.schemas[`${testMappersService.name}.mac`];
        });
        it('should generate openapi for type mac', async () => {
            const property = testSchema.properties.normal;
            expect(property).toEqual({
                examples: ['01:C8:95:4B:65:FE', '01C8.954B.65FE', '01-C8-95-4B-65-FE'],
                format: 'mac',
                pattern:
                    '^((([a-f0-9][a-f0-9]+[-]){5}|([a-f0-9][a-f0-9]+[:]){5})([a-f0-9][a-f0-9])$)|(^([a-f0-9][a-f0-9][a-f0-9][a-f0-9]+[.]){2}([a-f0-9][a-f0-9][a-f0-9][a-f0-9]))$',
                type: 'string'
            });
        });
        it('should generate openapi for type mac with shortHand', async () => {
            const property = testSchema.properties.shortHand;
            expect(property).toEqual({
                examples: ['01:C8:95:4B:65:FE', '01C8.954B.65FE', '01-C8-95-4B-65-FE'],
                format: 'mac',
                pattern:
                    '^((([a-f0-9][a-f0-9]+[-]){5}|([a-f0-9][a-f0-9]+[:]){5})([a-f0-9][a-f0-9])$)|(^([a-f0-9][a-f0-9][a-f0-9][a-f0-9]+[.]){2}([a-f0-9][a-f0-9][a-f0-9][a-f0-9]))$',
                type: 'string'
            });
        });
        it('should generate openapi for type mac with default', async () => {
            const property = testSchema.properties.withDefault;
            expect(property).toEqual({
                default: '00:B0:D0:63:C2:26',
                examples: ['00:B0:D0:63:C2:26'],
                format: 'mac',
                pattern:
                    '^((([a-f0-9][a-f0-9]+[-]){5}|([a-f0-9][a-f0-9]+[:]){5})([a-f0-9][a-f0-9])$)|(^([a-f0-9][a-f0-9][a-f0-9][a-f0-9]+[.]){2}([a-f0-9][a-f0-9][a-f0-9][a-f0-9]))$',
                type: 'string'
            });
        });
    });

    describe('multi tests', () => {
        let testSchema: OA.SchemaObject;
        beforeAll(() => {
            testSchema = OADocument.components.schemas[`${testMappersService.name}.multi`];
        });
        it('should generate openapi for type multi', async () => {
            const property = testSchema.properties.normal;
            expect(property).toEqual({
                oneOf: [
                    {
                        type: 'string'
                    }
                ]
            });
        });

        it('should generate openapi for type multi with default', async () => {
            const property = testSchema.properties.withDefault;
            expect(property).toEqual({
                default: 'test',
                examples: ['test'],
                oneOf: [
                    {
                        type: 'string'
                    }
                ]
            });
        });

        it('should generate openapi for type multi with differentRules', async () => {
            const property = testSchema.properties.withDifferentRules;
            expect(property).toEqual({
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

            const subSchema = OADocument.components.schemas[`${testMappersService.name}.multi.withDifferentRules.0`];
            expect(subSchema).toEqual({
                properties: {
                    num: {
                        type: 'number'
                    }
                },
                required: ['num'],
                type: 'object'
            });
        });

        it('should generate openapi for type multi with multiple sub schemas', async () => {
            const property = testSchema.properties.withMultipleSubSchemas;
            expect(property).toEqual({
                default: 'test',
                examples: ['test'],
                oneOf: [
                    {
                        $ref: '#/components/schemas/tests-mappers.multi.withMultipleSubSchemas.0'
                    },
                    {
                        $ref: '#/components/schemas/tests-mappers.multi.withMultipleSubSchemas.1'
                    }
                ]
            });

            const subSchema0 = OADocument.components.schemas[`${testMappersService.name}.multi.withMultipleSubSchemas.0`];
            const subSchema1 = OADocument.components.schemas[`${testMappersService.name}.multi.withMultipleSubSchemas.1`];
            expect(subSchema0).toEqual({
                properties: {
                    num: {
                        type: 'number'
                    }
                },
                required: ['num'],
                type: 'object'
            });
            expect(subSchema1).toStrictEqual(subSchema0);
        });
    });

    describe('number tests', () => {
        let testSchema: OA.SchemaObject;
        beforeAll(() => {
            testSchema = OADocument.components.schemas[`${testMappersService.name}.number`];
        });
        it('should generate openapi for type number', async () => {
            const property = testSchema.properties.normal;
            expect(property).toEqual({
                type: 'number'
            });
        });
        it('should generate openapi for type number with shortHand', async () => {
            const property = testSchema.properties.shortHand;
            expect(property).toEqual({
                type: 'number'
            });
        });
        it('should generate openapi for type number with default', async () => {
            const property = testSchema.properties.withDefault;
            expect(property).toEqual({
                default: 1,
                examples: [1],
                type: 'number'
            });
        });
        it('should generate openapi for type number with min', async () => {
            const property = testSchema.properties.withMin;
            expect(property).toEqual({
                examples: [1],
                minimum: 1,
                type: 'number'
            });
        });
        it('should generate openapi for type number with max', async () => {
            const property = testSchema.properties.withMax;
            expect(property).toEqual({
                examples: [5],
                maximum: 5,
                type: 'number'
            });
        });
        it('should generate openapi for type number with equal', async () => {
            const property = testSchema.properties.withEqual;
            expect(property).toEqual({
                maximum: 2,
                minimum: 2,
                type: 'number'
            });
        });
        it('should generate openapi for type number with notEqual', async () => {
            const property = testSchema.properties.withNotEqual;
            expect(property).toEqual({
                type: 'number'
            });
        });
        it('should generate openapi for type number with integer', async () => {
            const property = testSchema.properties.withInteger;
            expect(property).toEqual({
                type: 'number'
            });
        });
        it('should generate openapi for type number with positive', async () => {
            const property = testSchema.properties.withPositive;
            expect(property).toEqual({
                minimum: 0,
                type: 'number'
            });
        });
        it('should generate openapi for type number with negative', async () => {
            const property = testSchema.properties.withNegative;
            expect(property).toEqual({
                maximum: 0,
                type: 'number'
            });
        });
        it('should generate openapi for type number with convert', async () => {
            const property = testSchema.properties.withConvert;
            expect(property).toEqual({
                type: 'number'
            });
        });
    });

    describe('object tests', () => {
        let testSchema: OA.SchemaObject;
        beforeAll(() => {
            testSchema = OADocument.components.schemas[`${testMappersService.name}.object`];
        });
        it('should generate openapi for type object', async () => {
            const property = testSchema.properties.normal;
            expect(property).toEqual({
                type: 'object'
            });
        });
        it('should generate openapi for type object with shortHand', async () => {
            const property = testSchema.properties.shortHand;
            expect(property).toEqual({
                type: 'object'
            });
        });
        it('should generate openapi for type object with default', async () => {
            const property = testSchema.properties.withDefault;
            expect(property).toEqual({
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
        it('should generate openapi for type object with strict', async () => {
            const property = testSchema.properties.withStrict;
            expect(property).toEqual({
                type: 'object'
            });
        });
        it('should generate openapi for type object with properties', async () => {
            const property = testSchema.properties.withProperties;
            expect(property).toEqual({
                $ref: '#/components/schemas/tests-mappers.object.withProperties'
            });

            const subSchema = OADocument.components.schemas[`${testMappersService.name}.object.withProperties`];
            expect(subSchema).toEqual({
                properties: {
                    num: {
                        type: 'number'
                    }
                },
                required: ['num'],
                type: 'object'
            });
        });
        it('should generate openapi for type object with props', async () => {
            const property = testSchema.properties.withProps;
            expect(property).toEqual({
                $ref: '#/components/schemas/tests-mappers.object.withProps'
            });

            const subSchema = OADocument.components.schemas[`${testMappersService.name}.object.withProps`];
            expect(subSchema).toEqual({
                properties: {
                    num: {
                        type: 'number'
                    }
                },
                required: ['num'],
                type: 'object'
            });
        });
        it('should generate openapi for type object with minProps', async () => {
            const property = testSchema.properties.withMinProps;
            expect(property).toEqual({
                minProperties: 1,
                type: 'object'
            });
        });
        it('should generate openapi for type object with maxProps', async () => {
            const property = testSchema.properties.withMaxProps;
            expect(property).toEqual({
                maxProperties: 2,
                type: 'object'
            });
        });
    });

    describe('record tests', () => {
        let testSchema: OA.SchemaObject;
        beforeAll(() => {
            testSchema = OADocument.components.schemas[`${testMappersService.name}.record`];
        });
        it('should generate openapi for type record', async () => {
            const property = testSchema.properties.normal;
            expect(property).toEqual({
                type: 'object'
            });
        });
        it('should generate openapi for type record with shortHand', async () => {
            const property = testSchema.properties.shortHand;
            expect(property).toEqual({
                type: 'object'
            });
        });
        it('should generate openapi for type record with default', async () => {
            const property = testSchema.properties.withDefault;
            expect(property).toEqual({
                default: {
                    foo: 'bar'
                },
                type: 'object'
            });
        });
        it('should generate openapi for type record with key', async () => {
            const property = testSchema.properties.withKey;
            expect(property).toEqual({
                type: 'object'
            });
        });
        it('should generate openapi for type record with value', async () => {
            const property = testSchema.properties.withValue;
            expect(property).toEqual({
                additionalProperties: {
                    type: 'number'
                },
                type: 'object'
            });
        });
    });

    describe('string tests', () => {
        let testSchema: OA.SchemaObject;
        beforeAll(() => {
            testSchema = OADocument.components.schemas[`${testMappersService.name}.strings`];
        });

        it('should generate correct openapi for normal string', async () => {
            const property = testSchema.properties.normal;
            expect(property).toEqual({
                type: 'string'
            });
        });

        it('should generate correct openapi for shorthand string', async () => {
            const property = testSchema.properties.shortHand;
            expect(property).toEqual({
                type: 'string'
            });
        });

        it('should handle empty values correctly', async () => {
            const property = testSchema.properties.allowEmpty;
            expect(property).toEqual({
                type: 'string'
            });
        });

        it('should handle minimum lengths correctly', async () => {
            const property = testSchema.properties.withMin;
            expect(property).toEqual({
                type: 'string',
                minLength: 5
            });
        });

        it('should handle maximum lengths correctly', async () => {
            const property = testSchema.properties.withMax;
            expect(property).toEqual({
                type: 'string',
                maxLength: 10
            });
        });

        it('should handle fixed lengths correctly', async () => {
            const property = testSchema.properties.withLength;
            expect(property).toEqual({
                type: 'string',
                maxLength: 10,
                minLength: 10
            });
        });

        it('should handle pattern RegExp correctly', async () => {
            const property = testSchema.properties.withPattern;
            expect(property).toEqual({
                type: 'string',
                pattern: '^[a-z]+$'
            });
        });

        it('should handle pattern contains correctly', async () => {
            const property = testSchema.properties.withContains;
            expect(property).toEqual({
                type: 'string',
                pattern: '.*test.*',
                examples: ['test']
            });
        });

        it('should handle enum correctly', async () => {
            const property = testSchema.properties.withEnum;
            expect(property).toEqual({
                type: 'string',
                examples: ['option1'],
                enum: ['option1', 'option2', 'option3']
            });
        });

        it('should handle pattern alpha correctly', async () => {
            const property = testSchema.properties.withAlpha;
            expect(property).toEqual({
                type: 'string',
                examples: ['abcdef'],
                format: 'alpha',
                pattern: '^[a-zA-Z]+$'
            });
        });

        it('should handle pattern numeric correctly', async () => {
            const property = testSchema.properties.withNumeric;
            expect(property).toEqual({
                type: 'string',
                examples: ['12345'],
                format: 'numeric',
                pattern: '^[0-9]+$'
            });
        });

        it('should handle pattern alphanum correctly', async () => {
            const property = testSchema.properties.withAlphanum;
            expect(property).toEqual({
                type: 'string',
                examples: ['abc123'],
                format: 'alphanum',
                pattern: '^[a-zA-Z0-9]+$'
            });
        });

        it('should handle pattern alphadash correctly', async () => {
            const property = testSchema.properties.withAlphadash;
            expect(property).toEqual({
                type: 'string',
                examples: ['abc-123'],
                format: 'alphadash',
                pattern: '^[a-zA-Z0-9_-]+$'
            });
        });

        it('should handle pattern hex correctly', async () => {
            const property = testSchema.properties.withHex;
            expect(property).toEqual({
                type: 'string',
                examples: ['48656c6c6f20576f726c64'],
                format: 'hex',
                pattern: '^([0-9A-Fa-f]{2})+$'
            });
        });

        it('should handle pattern singleLine correctly', async () => {
            const property = testSchema.properties.withSingleLine;
            expect(property).toEqual({
                type: 'string',
                examples: ['abc 123'],
                format: 'single-line',
                pattern: '^[^\\r\\n]*$'
            });
        });

        it('should handle pattern base64 correctly', async () => {
            const property = testSchema.properties.withBase64;
            expect(property).toEqual({
                type: 'string',
                examples: ['aGVsbG8gd29ybGQ='],
                format: 'byte',
                pattern: '^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$'
            });
        });

        it('should generate correct openapi for string that should be trimmed', async () => {
            const property = testSchema.properties.withTrim;
            expect(property).toEqual({
                type: 'string'
            });
        });

        it('should generate correct openapi for string that should be trimmed left', async () => {
            const property = testSchema.properties.withTrimLeft;
            expect(property).toEqual({
                type: 'string'
            });
        });

        it('should generate correct openapi for string that should be trimmed right', async () => {
            const property = testSchema.properties.withTrimRight;
            expect(property).toEqual({
                type: 'string'
            });
        });

        it('should generate correct openapi for string that should be padded at start', async () => {
            const property = testSchema.properties.withPadStart;
            expect(property).toEqual({
                type: 'string'
            });
        });

        it('should generate correct openapi for string that should be padded at the end', async () => {
            const property = testSchema.properties.withPadEnd;
            expect(property).toEqual({
                type: 'string'
            });
        });

        it('should generate correct openapi for string with specified padding character', async () => {
            const property = testSchema.properties.withPadChar;
            expect(property).toEqual({
                type: 'string'
            });
        });

        it('should generate correct openapi for string that should be lower-cased', async () => {
            const property = testSchema.properties.withLowerCase;
            expect(property).toEqual({
                type: 'string'
            });
        });

        it('should generate correct openapi for string that should be upper-cased', async () => {
            const property = testSchema.properties.withUpperCase;
            expect(property).toEqual({
                type: 'string'
            });
        });

        it('should handle uppercase conversion correctly', async () => {
            const property = testSchema.properties.withUpperCase;
            expect(property).toEqual({
                type: 'string'
            });
        });

        it('should generate correct openapi for string that should be locale lower-cased', async () => {
            const property = testSchema.properties.withLocaleLowerCase;
            expect(property).toEqual({
                type: 'string'
            });
        });

        it('should generate correct openapi for string that should be locale upper-cased', async () => {
            const property = testSchema.properties.withLocaleUpperCase;
            expect(property).toEqual({
                type: 'string'
            });
        });

        it('should generate correct openapi for string that should be converted to string type', async () => {
            const property = testSchema.properties.withConvert;
            expect(property).toEqual({
                type: 'string'
            });
        });
    });

    describe('tuple tests', () => {
        let testSchema: OA.SchemaObject;
        beforeAll(() => {
            testSchema = OADocument.components.schemas[`${testMappersService.name}.tuple`];
        });
        it('should generate openapi for type tuple', async () => {
            const property = testSchema.properties.normal;
            expect(property).toEqual({
                maxItems: 2,
                minItems: 2,
                type: 'array'
            });
        });
        it('should generate openapi for type tuple with shortHand', async () => {
            const property = testSchema.properties.shortHand;
            expect(property).toEqual({
                maxItems: 2,
                minItems: 2,
                type: 'array'
            });
        });
        it('should generate openapi for type tuple with default', async () => {
            const property = testSchema.properties.withDefault;
            expect(property).toEqual({
                default: [1, 'test'],
                examples: [[1, 'test']],
                maxItems: 2,
                minItems: 2,
                type: 'array'
            });
        });
        it('should generate openapi for type tuple with empty', async () => {
            const property = testSchema.properties.withEmpty;
            expect(property).toEqual({
                maxItems: 2,
                minItems: 2,
                type: 'array'
            });
        });
        it('should generate openapi for type tuple with items', async () => {
            const property = testSchema.properties.withItems;
            expect(property).toEqual({
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

            const subSchema = OADocument.components.schemas[`${testMappersService.name}.tuple.withItems.0`];
            expect(subSchema).toEqual({
                properties: {
                    num: {
                        type: 'number'
                    }
                },
                required: ['num'],
                type: 'object'
            });
        });
    });

    describe('url tests', () => {
        let testSchema: OA.SchemaObject;
        beforeAll(() => {
            testSchema = OADocument.components.schemas[`${testMappersService.name}.url`];
        });
        it('should generate openapi for type url', async () => {
            const property = testSchema.properties.normal;
            expect(property).toEqual({
                examples: ['https://foobar.com'],
                format: 'url',
                type: 'string'
            });
        });
        it('should generate openapi for type url with shortHand', async () => {
            const property = testSchema.properties.shortHand;
            expect(property).toEqual({
                examples: ['https://foobar.com'],
                format: 'url',
                type: 'string'
            });
        });
        it('should generate openapi for type url with default', async () => {
            const property = testSchema.properties.withDefault;
            expect(property).toEqual({
                default: 'https://mysite.com',
                examples: ['https://mysite.com'],
                format: 'url',
                type: 'string'
            });
        });
        it('should generate openapi for type url with empty', async () => {
            const property = testSchema.properties.withEmpty;
            expect(property).toEqual({
                examples: ['https://foobar.com'],
                format: 'url',
                type: 'string'
            });
        });
    });

    describe('uuid tests', () => {
        let testSchema: OA.SchemaObject;
        beforeAll(() => {
            testSchema = OADocument.components.schemas[`${testMappersService.name}.uuid`];
        });
        it('should generate openapi for type uuid', async () => {
            const property = testSchema.properties.normal;
            expect(property).toEqual({
                examples: ['10ba038e-48da-487b-96e8-8d3b99b6d18a'],
                format: 'uuid',
                type: 'string'
            });
        });
        it('should generate openapi for type uuid with shortHand', async () => {
            const property = testSchema.properties.shortHand;
            expect(property).toEqual({
                examples: ['10ba038e-48da-487b-96e8-8d3b99b6d18a'],
                format: 'uuid',
                type: 'string'
            });
        });
        it('should generate openapi for type uuid with default', async () => {
            const property = testSchema.properties.withDefault;
            expect(property).toEqual({
                default: '6a6e3331-4e5f-4c5b-9b78-782d60426cc6',
                examples: ['6a6e3331-4e5f-4c5b-9b78-782d60426cc6'],
                format: 'uuid',
                type: 'string'
            });
        });
        it('should generate openapi for type uuid with version 0', async () => {
            const property = testSchema.properties.withVersion0;
            expect(property).toEqual({
                examples: ['00000000-0000-0000-0000-000000000000'],
                format: 'uuid',
                type: 'string'
            });
        });
        it('should generate openapi for type uuid with version 1', async () => {
            const property = testSchema.properties.withVersion1;
            expect(property).toEqual({
                examples: ['45745c60-7b1a-11e8-9c9c-2d42b21b1a3e'],
                format: 'uuid',
                type: 'string'
            });
        });
        it('should generate openapi for type uuid with version 2', async () => {
            const property = testSchema.properties.withVersion2;
            expect(property).toEqual({
                examples: ['9a7b330a-a736-21e5-af7f-feaf819cdc9f'],
                format: 'uuid',
                type: 'string'
            });
        });
        it('should generate openapi for type uuid with version 3', async () => {
            const property = testSchema.properties.withVersion3;
            expect(property).toEqual({
                examples: ['9125a8dc-52ee-365b-a5aa-81b0b3681cf6'],
                format: 'uuid',
                type: 'string'
            });
        });
        it('should generate openapi for type uuid with version 4', async () => {
            const property = testSchema.properties.withVersion4;
            expect(property).toEqual({
                examples: ['10ba038e-48da-487b-96e8-8d3b99b6d18a'],
                format: 'uuid',
                type: 'string'
            });
        });
        it('should generate openapi for type uuid with version 5', async () => {
            const property = testSchema.properties.withVersion5;
            expect(property).toEqual({
                examples: ['fdda765f-fc57-5604-a269-52a7df8164ec'],
                format: 'uuid',
                type: 'string'
            });
        });
        it('should generate openapi for type uuid with version 6', async () => {
            const property = testSchema.properties.withVersion6;
            expect(property).toEqual({
                examples: ['a9030619-8514-6970-e0f9-81b9ceb08a5f'],
                format: 'uuid',
                type: 'string'
            });
        });
    });

    describe('objectId tests', () => {
        let testSchema: OA.SchemaObject;
        beforeAll(() => {
            testSchema = OADocument.components.schemas[`${testMappersService.name}.objectId`];
        });
        it('should generate openapi for type objectId', async () => {
            const property = testSchema.properties.normal;
            expect(property).toEqual({
                examples: ['507f1f77bcf86cd799439011'],
                format: 'ObjectId',
                maxLength: 24,
                minLength: 24,
                type: 'string'
            });
        });
        it('should generate openapi for type objectId with shortHand', async () => {
            const property = testSchema.properties.shortHand;
            expect(property).toEqual({
                examples: ['507f1f77bcf86cd799439011'],
                format: 'ObjectId',
                maxLength: 24,
                minLength: 24,
                type: 'string'
            });
        });
        it('should generate openapi for type objectId with default', async () => {
            const property = testSchema.properties.withDefault;
            expect(property).toEqual({
                default: '507f1f77bcf86cd799439012',
                examples: ['507f1f77bcf86cd799439012'],
                format: 'ObjectId',
                maxLength: 24,
                minLength: 24,
                type: 'string'
            });
        });
        it('should generate openapi for type uuid with convert', async () => {
            const property = testSchema.properties.withConvert;
            expect(property).toEqual({
                examples: ['507f1f77bcf86cd799439011'],
                format: 'ObjectId',
                maxLength: 24,
                minLength: 24,
                type: 'string'
            });
        });
    });

    describe('custom tests', () => {
        let testSchema: OA.SchemaObject;
        beforeAll(() => {
            testSchema = OADocument.components.schemas[`${testMappersService.name}.custom`];
        });
        it('should generate openapi for type custom', async () => {
            const property = testSchema.properties.normal;
            expect(property).toBeUndefined();
        });
        it('should generate openapi for type custom with shortHand', async () => {
            const property = testSchema.properties.shortHand;
            expect(property).toBeUndefined();
        });
    });
});
