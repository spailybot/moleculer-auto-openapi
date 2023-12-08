import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { ServiceBroker } from 'moleculer';
import { registerSchemaValidation, setupBroker } from './commons.js';
import { routes } from '../datas/routes.js';
import { OA_GENERATE_DOCS_INPUT, OA_GENERATE_DOCS_OUTPUT } from '../../src/index.js';
import { OpenapiService } from '../datas/services/openapi.service.js';

describe("Test 'openapi' mixin edge", () => {
    const broker = new ServiceBroker({
        // logger: false,
        logLevel: 'debug',
        cacher: 'memory'
    });

    beforeAll(async () => {
        // await setupBroker(broker, undefined, [routes.edge]);
        await setupBroker(broker, undefined, [
            {
                path: '/edge',
                autoAliases: true,
                whitelist: ['edge.*']
            }
        ]);
    });

    afterAll(() => broker.stop());

    registerSchemaValidation(broker);

    describe('edge tests', () => {
        let OASchema: OA_GENERATE_DOCS_OUTPUT;
        beforeEach(async () => {
            OASchema = await broker.call<OA_GENERATE_DOCS_OUTPUT, OA_GENERATE_DOCS_INPUT>(`${OpenapiService.name}.generateDocs`, {
                version: '3.1'
            });
        });

        it('should remove unknown methods', async () => {
            expect(routes.edge.aliases?.['FILE /']).toBeDefined();

            expect(OASchema.paths).toBeDefined();
            // @ts-ignore
            expect(OASchema.paths?.['/']?.['file']).not.toBeDefined();
        });

        it('should allow action with custom name', async () => {
            expect(OASchema.paths).toBeDefined();
            // @ts-ignore
            expect(OASchema.paths?.['/api/edge/edge/named']?.['get']).toBeDefined();
        });
    });
});
