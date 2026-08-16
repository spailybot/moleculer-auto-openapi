import { ServiceBroker, ServiceSchema } from 'moleculer';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { setupBroker } from './commons.js';
import { OA_GENERATE_DOCS_INPUT, OA_GENERATE_DOCS_OUTPUT } from '../../src/index.js';
import { OpenapiService } from '../datas/services/openapi.service.js';
import { ApiRouteSchema } from 'moleculer-web';

describe("Test parameter improvements & ref overrides in service broker integration", () => {
    const broker = new ServiceBroker({
        logLevel: 'error',
        cacher: 'memory'
    });

    const mockService = {
        name: 'mock-parameter-service',
        settings: {
            rest: '/mock-params'
        },
        actions: {
            testAction: {
                params: {
                    queryParam: {
                        type: 'string',
                        optional: true,
                        $$oa: {
                            description: 'A query parameter with custom style',
                            style: 'form',
                            explode: true,
                            allowEmptyValue: true,
                            example: 'test-value'
                        }
                    },
                    schemaRefParam: {
                        type: 'object',
                        $$oa: {
                            $ref: '#/components/schemas/CustomUser',
                            description: 'Overridden custom user schema description'
                        }
                    },
                    paramRefParam: {
                        type: 'string',
                        $$oa: {
                            $ref: '#/components/parameters/CustomHeaderParam',
                            description: 'Overridden parameter description'
                        }
                    },
                    overrideUndefinedParam: {
                        type: 'string',
                        hex: true,
                        $$title: 'Identifiant utilisateur',
                        $$oa: {
                            title: undefined,
                            example: 'aabbcc'
                        }
                    }
                },
                handler() {}
            }
        }
    } as ServiceSchema;

    const mockRoute = {
        path: '/mock-route',
        openapi: {
            components: {
                schemas: {
                    CustomUser: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' }
                        }
                    }
                },
                parameters: {
                    CustomHeaderParam: {
                        name: 'CustomHeaderParam',
                        in: 'header',
                        required: true,
                        schema: {
                            type: 'string'
                        }
                    }
                }
            }
        },
        aliases: {
            'GET test': 'mock-parameter-service.testAction'
        }
    } as ApiRouteSchema;

    beforeAll(async () => {
        await setupBroker(broker, [mockService as any, OpenapiService as any], [mockRoute]);
    });

    afterAll(() => broker.stop());

    it('should generate openapi documentation containing configured parameter properties and overrides', async () => {
        const json = await broker.call<OA_GENERATE_DOCS_OUTPUT, OA_GENERATE_DOCS_INPUT>(`${OpenapiService.name}.generateDocs`, {
            version: '3.1'
        });

        const parameters = json?.paths?.['/api/mock-route/test']?.get?.parameters;
        expect(parameters).toBeDefined();
        expect(parameters).toHaveLength(4);

        // Verify queryParam configurations
        const queryParam = parameters.find((p: any) => p.name === 'queryParam');
        expect(queryParam).toEqual({
            name: 'queryParam',
            in: 'query',
            style: 'form',
            explode: true,
            required: undefined,
            description: 'A query parameter with custom style',
            examples: undefined,
            deprecated: undefined,
            allowEmptyValue: true,
            allowReserved: undefined,
            schema: {
                type: 'string',
                description: 'A query parameter with custom style',
                examples: ['test-value'],
                default: undefined,
                enum: undefined,
                maxLength: undefined,
                minLength: undefined
            }
        });

        // Verify schemaRefParam configurations ($ref override)
        const schemaRefParam = parameters.find((p: any) => p.name === 'schemaRefParam');
        expect(schemaRefParam).toEqual({
            name: 'schemaRefParam',
            in: 'query',
            style: 'deepObject',
            explode: true,
            required: true,
            deprecated: undefined,
            description: 'Overridden custom user schema description',
            example: undefined,
            examples: undefined,
            allowEmptyValue: undefined,
            allowReserved: undefined,
            schema: {
                $ref: '#/components/schemas/CustomUser',
                description: 'Overridden custom user schema description'
            }
        });

        // Verify paramRefParam configurations (parameter-level $ref reference)
        const paramRefParam = parameters.find((p: any) => !p.name);
        expect(paramRefParam).toEqual({
            $ref: '#/components/parameters/CustomHeaderParam',
            description: 'Overridden parameter description'
        });

        // Verify overrideUndefinedParam configurations (undefined overrides and custom example suppression)
        const overrideUndefinedParam = parameters.find((p: any) => p.name === 'overrideUndefinedParam');
        expect(overrideUndefinedParam).toEqual({
            name: 'overrideUndefinedParam',
            in: 'query',
            style: undefined,
            explode: undefined,
            required: true,
            deprecated: undefined,
            description: undefined,
            examples: undefined,
            allowEmptyValue: undefined,
            allowReserved: undefined,
            schema: {
                type: 'string',
                title: undefined, // Overridden to undefined
                format: 'hex',
                pattern: '^([0-9A-Fa-f]{2})+$',
                examples: ['aabbcc']
            }
        });
    });
});
