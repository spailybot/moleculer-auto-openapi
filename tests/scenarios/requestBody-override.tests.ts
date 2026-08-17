import { ServiceBroker, ServiceSchema } from 'moleculer';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { setupBroker } from './commons.js';
import { OA_GENERATE_DOCS_INPUT, OA_GENERATE_DOCS_OUTPUT } from '../../src/index.js';
import { OpenapiService } from '../datas/services/openapi.service.js';
import { ApiRouteSchema } from 'moleculer-web';

describe('Request body override', () => {
    const broker = new ServiceBroker({
        logLevel: 'error',
        cacher: 'Memory'
    });

    const demoService = {
        name: 'requestbody-demo',
        settings: {
            rest: '/demo-requestbody'
        },
        actions: {
            create: {
                // Runtime validation params (moleculer) — intentionally different from the
                // documented request body below.
                params: {
                    email: { type: 'email' },
                    password: { type: 'string', min: 8 }
                },
                openapi: {
                    // Fully custom requestBody: bypasses the schema derived from `params`.
                    requestBody: {
                        description: 'The credentials to create the account',
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        login: { type: 'string' },
                                        pass: { type: 'string' }
                                    },
                                    required: ['login', 'pass']
                                }
                            }
                        }
                    }
                },
                handler() {}
            },
            createViaOa: {
                // Runtime validation params still contain a body parameter so that `$$oa` is
                // applied, but `$$oa.content` fully replaces the auto-generated content.
                params: {
                    placeholder: { type: 'string', optional: true },
                    $$oa: {
                        description: 'Custom description via $$oa',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        foo: { type: 'string' }
                                    },
                                    required: ['foo']
                                }
                            }
                        }
                    }
                },
                handler() {}
            }
        }
    } as ServiceSchema;

    const demoRoute = {
        path: '/demo-requestbody',
        bodyParsers: {
            json: true
        },
        aliases: {
            'POST create': 'requestbody-demo.create',
            'POST createViaOa': 'requestbody-demo.createViaOa'
        }
    } as ApiRouteSchema;

    beforeAll(async () => {
        await setupBroker(broker, [demoService as any, OpenapiService as any], [demoRoute]);
    });

    afterAll(() => broker.stop());

    it('should use a fully custom requestBody (openapi.requestBody) instead of the schema derived from params', async () => {
        const json = await broker.call<OA_GENERATE_DOCS_OUTPUT, OA_GENERATE_DOCS_INPUT>(
            `${OpenapiService.name}.generateDocs`,
            { version: '3.1' }
        );

        const requestBody = json?.paths?.['/api/demo-requestbody/create']?.post?.requestBody as any;
        expect(requestBody).toBeDefined();
        expect(requestBody.description).toBe('The credentials to create the account');
        expect(requestBody.required).toBe(true);
        expect(requestBody.content).toEqual({
            'application/json': {
                schema: {
                    type: 'object',
                    properties: {
                        login: { type: 'string' },
                        pass: { type: 'string' }
                    },
                    required: ['login', 'pass']
                }
            }
        });
    });

    it('should use a fully custom requestBody via $$oa.content on the params root', async () => {
        const json = await broker.call<OA_GENERATE_DOCS_OUTPUT, OA_GENERATE_DOCS_INPUT>(
            `${OpenapiService.name}.generateDocs`,
            { version: '3.1' }
        );

        const requestBody = json?.paths?.['/api/demo-requestbody/createViaOa']?.post?.requestBody as any;
        expect(requestBody).toBeDefined();
        expect(requestBody.description).toBe('Custom description via $$oa');
        expect(requestBody.content).toEqual({
            'application/json': {
                schema: {
                    type: 'object',
                    properties: {
                        foo: { type: 'string' }
                    },
                    required: ['foo']
                }
            }
        });
    });
});