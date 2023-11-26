import { ApiService, getApiService } from '../datas/services/api.service.js';
import { Service, ServiceBroker } from 'moleculer';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { Validator } from '@seriousme/openapi-schema-validator';
import { testMappersService } from '../datas/services/test-mappers.service.js';
import { OpenapiService } from '../datas/services/openapi.service.js';
import { SomeService } from '../datas/services/some.service.js';
import { getServiceName, openApiVersionsSupported } from '../../src/commons.js';
import { OA_GENERATE_DOCS_INPUT, OA_GENERATE_DOCS_OUTPUT } from '../../src/index.js';
import { MathService } from '../datas/services/math.service.js';
import { PostsService } from '../datas/services/posts.service.js';
import { testOpenApiService } from '../datas/services/test-openapi.service.js';
import * as http from 'http';
import axios from 'axios';
import { routes } from '../datas/routes.js';
import { registerSchemaValidation, setupBroker } from './commons.js';

describe("Test 'openapi' mixin", () => {
    const broker = new ServiceBroker({
        // logger: false,
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
