// Use random ports during tests
process.env.PORT = '0';

import { ServiceBroker } from 'moleculer';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import Openapi, { OA_GENERATE_DOCS_INPUT, OA_GENERATE_DOCS_OUTPUT } from '../src/index.js';
import ApiGateway from 'moleculer-web';
import { testMappersService } from './datas/services/testMappersService.js';
import type { OpenAPIV3_1 as OA } from 'openapi-types';

const OpenapiService = {
    name: 'openapi',
    mixins: [Openapi],
    settings: {
        openapi: {
            info: {
                description: 'Foo',
                title: 'Bar'
            }
        }
    }
};

const ApiService = {
    name: 'api',
    mixins: [ApiGateway],
    settings: {
        routes: [
            {
                path: '/api',
                whitelist: ['tests-mappers.*'],
                autoAliases: true
            }
            // {
            //     path: '/api',
            //     aliases: {
            //         'POST tests-simple': 'tests.simple',
            //         'POST tests-strings': 'tests.strings'
            //     }
            // }
        ]
    }
};

describe('Test FastestValidator mappers', () => {
    const broker = new ServiceBroker({ logger: false });
    // const broker = new ServiceBroker({
    //     logger: {
    //         type: 'console',
    //         options: {
    //             level: 'debug'
    //         }
    //     }
    // });
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
                pattern: '^?\\d{1,3}(\\,?\\d{3})*(\\"\\.\\d{1,2})?$',
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
                type: 'string',
                format: 'email',
                examples: ['foo@bar.com']
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
                type: 'string',
                pattern: '^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$',
                format: 'mac'
            });
        });

        it('should generate correct openapi for type multi', async () => {
            const property = testSchema.properties.multi;
            expect(property).toEqual({
                anyOf: [
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
                type: 'number',
                examples: [5]
            });
        });

        it('should generate correct openapi for type object', async () => {
            expect(testSchema.properties.object).toEqual({
                type: 'object'
            });
        });
        // it('should generate correct openapi for type object', async () => {
        //     const schemaName = 'tests.simple.object';
        //     expect(testSchema.properties.object).toEqual({
        //         $ref: `#/components/schemas/${schemaName}`
        //     });
        //
        //     const property = OADocument.components.schemas${testMappersService.name}`chemaName];`        //
        //     //remove undefined parts
        //     expect(JSON.parse(JSON.stringify(property))).toStrictEqual({
        //         type: 'object'
        //     });
        // });

        it('should generate correct openapi for type objectID', async () => {
            const property = testSchema.properties.objectID;
            expect(property).toEqual({ type: 'string' });
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
            expect(property).toEqual({ type: 'string' });
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
                type: 'string',
                format: 'uuid'
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
});
