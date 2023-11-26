import { ServiceBroker } from 'moleculer';
import { afterAll, beforeAll, describe } from '@jest/globals';
import { routes } from '../datas/routes.js';
import { registerSchemaValidation, setupBroker } from './commons.js';

describe("Test 'openapi' mixin", () => {
    const broker = new ServiceBroker({
        logger: false,
        cacher: 'memory'
    });

    beforeAll(async () => {
        await setupBroker(broker, undefined, Object.values(routes));
    });

    afterAll(() => broker.stop());

    registerSchemaValidation(broker);

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
