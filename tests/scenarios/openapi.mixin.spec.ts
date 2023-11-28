import { ServiceBroker } from 'moleculer';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { routes } from '../datas/routes.js';
import { registerSchemaValidation, setupBroker } from './commons.js';
import { OA_GENERATE_DOCS_INPUT, OA_GENERATE_DOCS_OUTPUT } from '../../src/index.js';
import { OpenapiService } from '../datas/services/openapi.service.js';

describe("Test 'openapi' mixin", () => {
    const broker = new ServiceBroker({
        // logger: false,
        logLevel: 'debug',
        cacher: 'memory'
    });

    beforeAll(async () => {
        await setupBroker(broker, undefined, Object.values(routes));
    });

    afterAll(() => broker.stop());

    registerSchemaValidation(broker);

    describe('security', () => {
        it('should pass the security scheme', async () => {
            const json = await broker.call<OA_GENERATE_DOCS_OUTPUT, OA_GENERATE_DOCS_INPUT>(`${OpenapiService.name}.generateDocs`, {
                version: '3.1'
            });

            const securityObject = json?.paths?.['/api/edge/posts/{id}']?.put?.security;
            expect(securityObject).toBeDefined();

            expect(securityObject).toEqual([
                {
                    myAuth: []
                }
            ]);
        });
    });

    describe('test', () => {
        it('should test', async () => {
            const json = await broker.call<OA_GENERATE_DOCS_OUTPUT, OA_GENERATE_DOCS_INPUT>(`${OpenapiService.name}.generateDocs`, {
                version: '3.1'
            });

            console.log(json);
        });
    });
});
