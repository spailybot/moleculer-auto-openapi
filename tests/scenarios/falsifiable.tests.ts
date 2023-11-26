import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { ServiceBroker } from 'moleculer';
import { registerSchemaValidation, setupBroker } from './commons.js';
import { routes } from '../datas/routes.js';
import { OA_GENERATE_DOCS_INPUT, OA_GENERATE_DOCS_OUTPUT, openApiVersionsSupported } from '../../src/index.js';
import { OpenapiService } from '../datas/services/openapi.service.js';

describe('Test that a service can be hide by setting openapi to false', () => {
    const broker = new ServiceBroker({
        // logger: false,
        cacher: 'memory'
    });

    beforeAll(async () => {
        await setupBroker(broker, undefined, [routes.falseRoute, routes.falsifiable]);
    });

    afterAll(() => broker.stop());

    registerSchemaValidation(broker);

    it('should return no paths', async () => {
        const json = await broker.call<OA_GENERATE_DOCS_OUTPUT, OA_GENERATE_DOCS_INPUT>(`${OpenapiService.name}.generateDocs`, {
            version: '3.1'
        });

        expect(json.paths).toEqual({});
    });

    // describe('test', () => {
    //     it('should test', async () => {
    //         const apiService = broker.services.find((svc) => svc.name === 'api');
    //         if (!apiService) {
    //             throw new Error('fail to locate api service');
    //         }
    //
    //         const address = (apiService.server as http.Server)?.address();
    //         if (!address || typeof address === 'string') {
    //             throw new Error('incorrect address returned');
    //         }
    //
    //         await axios.get(`/api/openapi/ui`, {
    //             baseURL: `http://127.0.0.1:${address.port}`
    //         });
    //     });
    // });
});
