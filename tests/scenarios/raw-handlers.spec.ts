import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { ServiceBroker } from 'moleculer';
import { registerSchemaValidation, setupBroker } from './commons.js';
import { OpenapiService } from '../datas/services/openapi.service.js';
import { ApiRouteSchema } from 'moleculer-web';
import { OA_GENERATE_DOCS_INPUT, OA_GENERATE_DOCS_OUTPUT } from '../../src/index.js';
import type { IncomingMessage, ServerResponse } from 'http';

describe("Test 'openapi' mixin with raw transport handlers & middleware aliases", () => {
    const broker = new ServiceBroker({
        logger: false,
        cacher: 'Memory'
    });

    const rawSseHandler = (req: IncomingMessage, res: ServerResponse) => {
        res.writeHead(200, { 'Content-Type': 'text/event-stream' });
        res.end();
    };

    const rawMiddleware = (req: any, res: any, next: () => void) => {
        next();
    };

    const rawTransportRoutes: ApiRouteSchema = {
        path: '/transport',
        aliases: {
            // 1. Raw function handler (skipped automatically)
            'GET /raw-stream': rawSseHandler,

            // 2. Middleware array without action (skipped automatically)
            'GET /middleware-pipeline': [rawMiddleware, rawMiddleware],

            // 3. Explicitly skipped via openapi: false
            'GET /mcp-sse': {
                handler: rawSseHandler,
                openapi: false
            },

            // 4. Raw handler without action or openapi metadata (skipped automatically when skipUnresolvedActions is true)
            'POST /raw-untyped': {
                handler: rawSseHandler
            },

            // 5. Documented raw handler with custom openapi metadata
            'GET /documented-stream': {
                handler: rawSseHandler,
                openapi: {
                    summary: 'Streamable MCP SSE transport',
                    description: 'Direct SSE endpoint for MCP stream transport',
                    tags: ['Transport'],
                    responses: {
                        '200': {
                            description: 'SSE stream connection established',
                            content: {
                                'text/event-stream': {
                                    schema: {
                                        type: 'string'
                                    }
                                }
                            }
                        }
                    }
                }
            },

            // 6. Regular Moleculer action
            'GET /regular': 'some.find'
        }
    };

    beforeAll(async () => {
        await setupBroker(broker, undefined, [rawTransportRoutes]);
    });

    afterAll(() => broker.stop());

    registerSchemaValidation(broker);

    it('should generate valid OpenAPI schema without errors when raw transport handlers are present', async () => {
        const schema = await broker.call<OA_GENERATE_DOCS_OUTPUT, OA_GENERATE_DOCS_INPUT>(
            `${OpenapiService.name}.generateDocs`,
            { version: '3.1' }
        );

        expect(schema).toBeDefined();
        expect(schema.openapi).toBe('3.1.0');
        expect(schema.paths).toBeDefined();

        const paths = schema.paths!;

        // The regular action should be present
        expect(paths['/api/transport/regular']?.get).toBeDefined();

        // The documented raw handler should be present with its custom OpenAPI metadata
        expect(paths['/api/transport/documented-stream']?.get).toBeDefined();
        const documentedOp = paths['/api/transport/documented-stream']?.get;
        expect(documentedOp?.summary).toContain('Streamable MCP SSE transport');
        expect(documentedOp?.description).toBe('Direct SSE endpoint for MCP stream transport');
        expect(documentedOp?.tags).toContain('Transport');

        // Unresolved / skipped raw handlers should NOT pollute the generated OpenAPI paths
        expect(paths['/api/transport/raw-stream']).toBeUndefined();
        expect(paths['/api/transport/middleware-pipeline']).toBeUndefined();
        expect(paths['/api/transport/mcp-sse']).toBeUndefined();
        expect(paths['/api/transport/raw-untyped']).toBeUndefined();
    });
});
