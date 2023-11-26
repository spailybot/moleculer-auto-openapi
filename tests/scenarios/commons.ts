import { Service, ServiceBroker } from 'moleculer';
import { testMappersService } from '../datas/services/test-mappers.service.js';
import { SomeService } from '../datas/services/some.service.js';
import { OpenapiService } from '../datas/services/openapi.service.js';
import { getApiService } from '../datas/services/api.service.js';
import { MathService } from '../datas/services/math.service.js';
import { PostsService } from '../datas/services/posts.service.js';
import { testOpenApiService } from '../datas/services/test-openapi.service.js';
import { ApiRouteSchema } from 'moleculer-web';
import { getServiceName, openApiVersionsSupported } from '../../src/commons.js';
import { describe, expect, it } from '@jest/globals';
import { Validator } from '@seriousme/openapi-schema-validator';
import { OA_GENERATE_DOCS_INPUT, OA_GENERATE_DOCS_OUTPUT } from '../../src/index.js';

const testServices = [
    testMappersService,
    SomeService,
    OpenapiService,
    MathService,
    PostsService,
    testOpenApiService
] as unknown as Array<Service>;

export const setupBroker = async (
    broker: ServiceBroker,
    pServices: typeof testServices = testServices,
    routes: Array<ApiRouteSchema> = []
) => {
    const services = [...pServices, getApiService(routes)] as unknown as Array<Service>;
    services.forEach((svc) => broker.createService(svc));
    await broker.start();

    await broker.waitForServices(services.map((svc) => getServiceName(svc)));
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
};

export const registerSchemaValidation = (broker: ServiceBroker) => {
    describe('schema validation', () => {
        it.each<openApiVersionsSupported>(['3.1'])(`generate a valid openapi %s documentation`, async (OAVersion) => {
            expect(Validator.supportedVersions.has(OAVersion));

            const json = await broker.call<OA_GENERATE_DOCS_OUTPUT, OA_GENERATE_DOCS_INPUT>(`${OpenapiService.name}.generateDocs`, {
                version: OAVersion as openApiVersionsSupported
            });
            const validator = new Validator();
            const res = await validator.validate(JSON.parse(JSON.stringify(json)));

            expect(res.errors).toBeUndefined();
            expect(res.valid).toBeTruthy();
        });
    });
};
