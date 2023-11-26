import { ApiService } from './datas/services/api.service.js';
import * as url from 'url';
import { Service, ServiceBroker } from 'moleculer';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { Validator } from '@seriousme/openapi-schema-validator';
import { testMappersService } from './datas/services/test-mappers.service.js';
import { OpenapiService } from './datas/services/openapi.service.js';
import { SomeService } from './datas/services/some.service.js';
import { getServiceName, openApiVersionsSupported } from '../src/commons.js';
import { OA_GENERATE_DOCS_INPUT, OA_GENERATE_DOCS_OUTPUT } from '../src/index.js';
import { MathService } from './datas/services/math.service.js';
import { PostsService } from './datas/services/posts.service.js';
import { testOpenApiService } from './datas/services/test-openapi.service.js';

const testServices = [
    testMappersService,
    SomeService,
    OpenapiService,
    ApiService,
    MathService,
    PostsService,
    testOpenApiService
] as unknown as Array<Service>;

describe("Test 'openapi' mixin", () => {
    const broker = new ServiceBroker({
        // logger: false,
        cacher: 'memory'
    });

    testServices.forEach((svc) => broker.createService(svc));

    beforeAll(async () => {
        await broker.start();

        await broker.waitForServices(testServices.map((svc) => getServiceName(svc)));
        await new Promise<void>((resolve) => {
            broker.createService({
                name: 'apiwaiter',
                events: {
                    '$api.aliases.regenerated'() {
                        resolve();
                    }
                }
            });
        });
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
});
