import { ServiceBroker, ServiceSchema } from 'moleculer';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { setupBroker } from './commons.js';
import { OA_GENERATE_DOCS_INPUT, OA_GENERATE_DOCS_OUTPUT } from '../../src/index.js';
import { OpenapiService } from '../datas/services/openapi.service.js';
import { ApiRouteSchema } from 'moleculer-web';

describe("Documentation & Test: Parameter Precedence and Overrides", () => {
    const broker = new ServiceBroker({
        logLevel: 'error',
        cacher: 'memory'
    });

    const demoService = {
        name: 'demo-overrides-service',
        settings: {
            rest: '/demo'
        },
        actions: {
            testOverrides: {
                // Precedence Rule 1: Action-level parameter validator definitions
                params: {
                    // Scenario A: Standard property with global description mapping to parameter description
                    paramA: {
                        type: 'string',
                        $$description: 'Global description at parameter level',
                        $$oa: {
                            // Empty $$oa block: defaults to using $$description
                        }
                    },

                    // Scenario B: $$oa.description overrides $$description
                    paramB: {
                        type: 'string',
                        $$description: 'This description will be overridden',
                        $$oa: {
                            description: 'Overridden description from $$oa (winner)'
                        }
                    },

                    // Scenario C: Explicit undefined in $$oa overrides and removes parent value
                    paramC: {
                        type: 'string',
                        $$description: 'This description will be removed',
                        $$oa: {
                            description: undefined // Explicitly overrides to undefined
                        }
                    },

                    // Scenario D: OpenAPI 3.1 example pluralization
                    // Setting 'example' (singular) inside $$oa automatically converts it to plural 'examples' array in the schema
                    paramD: {
                        type: 'string',
                        $$oa: {
                            example: 'aabbcc'
                        }
                    },

                    // Scenario E: Custom parameter style, explode & serialize rules
                    paramE: {
                        type: 'object',
                        optional: true,
                        $$oa: {
                            style: 'form',
                            explode: true,
                            allowEmptyValue: true,
                            allowReserved: true
                        }
                    },

                    // Scenario F: Referencing a custom Schema defined in the route
                    paramF: {
                        type: 'object',
                        $$oa: {
                            $ref: '#/components/schemas/CustomSchemaExample',
                            description: 'Description override for the referenced schema'
                        }
                    },

                    // Scenario G: Referencing a custom Parameter component defined in the route
                    paramG: {
                        type: 'string',
                        $$oa: {
                            $ref: '#/components/parameters/CustomParameterExample',
                            description: 'Description override for the referenced parameter'
                        }
                    },

                    // Scenario H: Overriding a very large enum (e.g. timezone) to simplify OpenAPI docs
                    timezone: {
                        type: 'string',
                        enum: ['Europe/Paris', 'America/New_York', 'Asia/Tokyo', 'Africa/Cairo', 'Australia/Sydney'], // very large enum
                        $$oa: {
                            enum: undefined, // Suppresses/removes the enum array in OpenAPI
                            description: 'Valid timezone (IANA / RFC format)',
                            example: 'Europe/Paris'
                        }
                    }
                },
                handler() {}
            }
        }
    } as ServiceSchema;

    const demoRoute = {
        path: '/demo-route',
        openapi: {
            components: {
                schemas: {
                    CustomSchemaExample: {
                        type: 'object',
                        properties: {
                            username: { type: 'string' }
                        }
                    }
                },
                parameters: {
                    CustomParameterExample: {
                        name: 'CustomParameterExample',
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
            'GET test': 'demo-overrides-service.testOverrides'
        }
    } as ApiRouteSchema;

    beforeAll(async () => {
        await setupBroker(broker, [demoService as any, OpenapiService as any], [demoRoute]);
    });

    afterAll(() => broker.stop());

    it('should generate expected OpenAPI document applying precedence rules and overrides correctly', async () => {
        const json = await broker.call<OA_GENERATE_DOCS_OUTPUT, OA_GENERATE_DOCS_INPUT>(`${OpenapiService.name}.generateDocs`, {
            version: '3.1'
        });

        const parameters = json?.paths?.['/api/demo-route/test']?.get?.parameters as Array<any>;
        expect(parameters).toBeDefined();
        expect(parameters).toHaveLength(8); // 7 regular parameters + 1 reference parameter

        // ----------------------------------------------------
        // Verify Scenario A: Inherited $$description
        // ----------------------------------------------------
        const paramA = parameters.find((p: any) => p.name === 'paramA');
        expect(paramA.description).toBe('Global description at parameter level');
        expect(paramA.schema.description).toBe('Global description at parameter level');

        // ----------------------------------------------------
        // Verify Scenario B: $$oa.description overrides $$description
        // ----------------------------------------------------
        const paramB = parameters.find((p: any) => p.name === 'paramB');
        expect(paramB.description).toBe('Overridden description from $$oa (winner)');
        expect(paramB.schema.description).toBe('Overridden description from $$oa (winner)');

        // ----------------------------------------------------
        // Verify Scenario C: Explicit undefined overrides
        // ----------------------------------------------------
        const paramC = parameters.find((p: any) => p.name === 'paramC');
        expect(paramC.description).toBeUndefined();
        expect(paramC.schema.description).toBeUndefined();

        // ----------------------------------------------------
        // Verify Scenario D: OpenAPI 3.1 example pluralization
        // ----------------------------------------------------
        const paramD = parameters.find((p: any) => p.name === 'paramD');
        expect(paramD.example).toBeUndefined();
        // Schema level converts 'example' to 'examples: ["aabbcc"]' (plural array)
        expect(paramD.schema.example).toBeUndefined();
        expect(paramD.schema.examples).toEqual(['aabbcc']);

        // ----------------------------------------------------
        // Verify Scenario E: Custom parameter configurations
        // ----------------------------------------------------
        const paramE = parameters.find((p: any) => p.name === 'paramE');
        expect(paramE.style).toBe('form');
        expect(paramE.explode).toBe(true);
        expect(paramE.allowEmptyValue).toBe(true);
        expect(paramE.allowReserved).toBe(true);

        // ----------------------------------------------------
        // Verify Scenario F: Schema reference overrides
        // ----------------------------------------------------
        const paramF = parameters.find((p: any) => p.name === 'paramF');
        expect(paramF.description).toBe('Description override for the referenced schema');
        expect(paramF.schema).toEqual({
            $ref: '#/components/schemas/CustomSchemaExample',
            description: 'Description override for the referenced schema'
        });

        // ----------------------------------------------------
        // Verify Scenario G: Parameter reference overrides
        // ----------------------------------------------------
        const paramG = parameters.find((p: any) => !p.name);
        expect(paramG).toEqual({
            $ref: '#/components/parameters/CustomParameterExample',
            description: 'Description override for the referenced parameter'
        });

        // ----------------------------------------------------
        // Verify Scenario H: Large enum override to string
        // ----------------------------------------------------
        const timezoneParam = parameters.find((p: any) => p.name === 'timezone');
        expect(timezoneParam.description).toBe('Valid timezone (IANA / RFC format)');
        expect(timezoneParam.example).toBeUndefined();
        expect(timezoneParam.schema.enum).toBeUndefined(); // The enum has been successfully removed in OpenAPI docs
        expect(timezoneParam.schema.examples).toEqual(['Europe/Paris']); // pluralized
    });
});
