// Use random ports during tests
process.env.PORT = '0';

import url from 'url';
import { ServiceBroker } from 'moleculer';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import ApiGateway from 'moleculer-web';
import fs from 'fs';
import Openapi, { OA_GENERATE_DOCS_INPUT, OA_GENERATE_DOCS_OUTPUT, openApiVersionsSupported } from '../src/index.js';
import path from 'path';
import { Validator } from '@seriousme/openapi-schema-validator';
import { testMappersService } from './datas/services/testMappersService';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

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

const SomeService = {
    name: 'some',
    actions: {
        // upload: {
        //     openapi: {
        //         responses: {
        //             200: {
        //                 description: '',
        //                 content: {
        //                     'application/json': {
        //                         schema: {
        //                             type: 'array',
        //                             items: {
        //                                 type: 'object',
        //                                 examples: [{ id: 1, filename: 'foo.txt', mimetype: 'text/plain', sizeInBytes: 100 }]
        //                             }
        //                         }
        //                     }
        //                 }
        //             },
        //             400: {
        //                 $ref: '#/components/responses/FileNotExist'
        //             },
        //             401: {
        //                 $ref: '#/components/responses/UnauthorizedError'
        //             },
        //             413: {
        //                 $ref: '#/components/responses/FileTooBig'
        //             },
        //             422: {
        //                 $ref: '#/components/responses/ValidationError'
        //             },
        //             default: {
        //                 $ref: '#/components/responses/ServerError'
        //             }
        //         }
        //     },
        //     handler() {}
        // },
        // update: {
        //     openapi: {
        //         summary: 'Foo bar baz'
        //     },
        //     params: {
        //         $$strict: 'remove',
        //         roles: { type: 'array', items: 'string', enum: ['user', 'admin'] },
        //         sex: { type: 'enum', values: ['male', 'female'], default: 'female' },
        //         id: { type: 'number', convert: true, default: 5 },
        //         numberBy: 'number',
        //         someNum: { $$t: 'Is some num', type: 'number', convert: true },
        //         types: {
        //             type: 'array',
        //             $$t: 'Types arr',
        //             default: [{ id: 1, typeId: 5 }],
        //             length: 1,
        //             items: {
        //                 type: 'object',
        //                 strict: 'remove',
        //                 props: {
        //                     id: { type: 'number', optional: true },
        //                     typeId: { type: 'number', optional: true }
        //                 }
        //             }
        //         },
        //         bars: {
        //             type: 'array',
        //             $$t: 'Bars arr',
        //             min: 1,
        //             max: 2,
        //             items: {
        //                 type: 'object',
        //                 strict: 'remove',
        //                 props: {
        //                     id: { type: 'number', optional: true },
        //                     fooNum: { $$t: 'fooNum', type: 'number', optional: true }
        //                 }
        //             }
        //         },
        //         someObj: {
        //             $$t: 'Some obj',
        //             default: { name: 'bar' },
        //             type: 'object',
        //             strict: 'remove',
        //             props: {
        //                 id: { $$t: 'Some obj ID', type: 'number', optional: true },
        //                 numberId: { type: 'number', optional: true },
        //                 name: { type: 'string', optional: true, max: 100 }
        //             }
        //         },
        //         someBool: { type: 'boolean', optional: true },
        //         desc: { type: 'string', optional: true, max: 10, min: 4 },
        //         email: 'email',
        //         date: 'date|optional|min:0|max:99|default:1998-01-10T13:00:00.000Z',
        //         uuid: 'uuid',
        //         url: 'url',
        //         shortObject: {
        //             $$type: 'object',
        //             desc: { type: 'string', optional: true, max: 10000 },
        //             url: 'url'
        //         },
        //         shortObject2: {
        //             $$type: 'object|optional',
        //             desc: { type: 'string', optional: true, max: 10000 },
        //             url: 'url'
        //         }
        //     },
        //     handler() {}
        // },
        // /**
        //  * Action from moleculer-db mixin
        //  */
        // find: {
        //     cache: {
        //         keys: ['populate', 'fields', 'limit', 'offset', 'sort', 'search', 'searchFields', 'query']
        //     },
        //     params: {
        //         roles: { type: 'array', items: 'string', enum: ['user', 'admin'] },
        //         sex: { type: 'enum', values: ['male', 'female'] },
        //         populate: [
        //             { type: 'string', optional: true },
        //             { type: 'array', optional: true, items: 'string' }
        //         ],
        //         fields: [
        //             { type: 'string', optional: true },
        //             { type: 'array', optional: true, items: 'string' }
        //         ],
        //         limit: { type: 'number', integer: true, min: 0, optional: true, convert: true },
        //         offset: { type: 'number', integer: true, min: 0, optional: true, convert: true },
        //         sort: { type: 'string', optional: true },
        //         search: { type: 'string', optional: true, default: 'find me now' },
        //         searchFields: [
        //             { type: 'string', optional: true },
        //             { type: 'array', optional: true, items: 'string' }
        //         ],
        //         query: [
        //             { type: 'object', optional: true },
        //             { type: 'string', optional: true }
        //         ]
        //     },
        //     handler() {}
        // },
        go: {
            openapi: {
                responses: {
                    200: {
                        description: ``,
                        content: {
                            'application/json': {
                                schema: {
                                    type: `object`,
                                    examples: [{ line: `number`, text: `string` }]
                                }
                            }
                        }
                    }
                }
            },
            params: {
                line: { type: `number` }
            },
            handler() {}
        }
        // login: {
        //     params: {
        //         password: { type: 'string', min: 8, pattern: /^[a-zA-Z0-9]+$/ },
        //         repeatPassword: { type: 'string', min: 8, pattern: '^[a-zA-Z0-9]+$' }
        //     },
        //     handler() {}
        // }
    }
};

const ApiService = {
    name: 'api',
    mixins: [ApiGateway],
    settings: {
        routes: [
            {
                path: '/api',
                aliases: {
                    'POST login-custom-function': {
                        handler(req, res) {
                            res.end();
                        },
                        openapi: {
                            summary: 'Login',
                            tags: ['auth'],
                            requestBody: {
                                content: {
                                    'application/json': {
                                        schema: {
                                            type: 'object',
                                            examples: [{ login: '', pass: '' }]
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            {
                path: '/api',
                aliases: {
                    'PUT upload': 'multipart:some.upload',
                    'PATCH update/:id': 'some.update',
                    'GET find': {
                        openapi: {
                            summary: 'Some find summary'
                        },
                        action: 'some.find'
                    },
                    'POST go': 'some.go',
                    'POST some-login': 'some.login',
                    'POST tests-simple': 'tests.simple',
                    'POST tests-strings': 'tests.strings'
                }
            },
            {
                path: '/api',
                whitelist: ['openapi.*'],
                autoAliases: true
            },
            {
                path: '/api',
                whitelist: ['tests.*'],
                autoAliases: true
            }
        ]
    }
};

describe("Test 'openapi' mixin", () => {
    // const broker = new ServiceBroker({ logger: false });
    const broker = new ServiceBroker();
    broker.createService(testMappersService);
    broker.createService(OpenapiService);
    broker.createService(ApiService);

    beforeAll(async () => {
        await broker.start();

        await broker.waitForServices([testMappersService.name, OpenapiService.name, ApiService.name]);
    });

    afterAll(() => broker.stop());

    describe('schema validation', () => {
        it.each<openApiVersionsSupported>(['3.1'])(`generate a valid openapi %s documentation`, async (OAVersion) => {
            expect(Validator.supportedVersions.has(OAVersion));

            const json = await broker.call<OA_GENERATE_DOCS_OUTPUT, OA_GENERATE_DOCS_INPUT>(`${OpenapiService.name}.generateDocs`, {
                version: OAVersion as openApiVersionsSupported
            });
            const validator = new Validator();
            const res = await validator.validate(json);

            expect(res.errors).toBeUndefined();
            expect(res.valid).toBeTruthy();
        });
    });

    it('generate schema json file', async () => {
        expect.assertions(1);

        const json = await broker.call('openapi.generateDocs');

        const expectedSchema = JSON.parse(fs.readFileSync(path.join(__dirname, 'datas', 'expectedSchema.json')).toString());

        // @ts-ignore
        fs.writeFileSync(path.join(__dirname, 'receivedSchema.json'), JSON.stringify(json, ' ', 2));

        // check json https://editor.swagger.io/
        //console.log(JSON.stringify(json, null, ""));
        expect(json).toMatchObject(expectedSchema);
    });

    it('Asset is returned as a stream', async () => {
        const file = 'swagger-ui-bundle.js.map';
        const swaggerPath = (await import('swagger-ui-dist')).getAbsoluteFSPath();

        const stream = await broker.call('openapi.assets', { file });

        const expected = fs.readFileSync(path.join(swaggerPath, file)).toString();

        let buffer = '';
        // for await (const chunk of stream) {
        //     buffer += chunk;
        // }

        expect(stream).toBeInstanceOf(fs.ReadStream);
        expect(buffer).toEqual(expected);
    });
});
