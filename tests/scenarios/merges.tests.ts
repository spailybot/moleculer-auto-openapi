import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { ServiceBroker } from 'moleculer';
import { registerSchemaValidation, setupBroker } from './commons.js';
import { routes } from '../datas/routes.js';
import { OA_GENERATE_DOCS_INPUT, OA_GENERATE_DOCS_OUTPUT } from '../../src/index.js';
import { OpenapiService } from '../datas/services/openapi.service.js';
import { OpenAPIV3_1 } from 'openapi-types';

describe('merge tests', () => {
    describe('Test that a service can be hide by setting openapi to false', () => {
        const broker = new ServiceBroker({
            logger: false,
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
    });

    describe('Test components merge', () => {
        describe('Test that a service can be hide by setting openapi to false', () => {
            const broker = new ServiceBroker({
                logger: false,
                cacher: 'memory'
            });

            beforeAll(async () => {
                await setupBroker(broker, undefined, [routes.merge]);
            });

            afterAll(() => broker.stop());

            registerSchemaValidation(broker);
            it('should return components paths', async () => {
                const json = await broker.call<OA_GENERATE_DOCS_OUTPUT, OA_GENERATE_DOCS_INPUT>(`${OpenapiService.name}.generateDocs`, {
                    version: '3.1'
                });

                expect(json?.components?.schemas).toBeDefined();
                const { schemas } = json.components as Required<Pick<OpenAPIV3_1.ComponentsObject, 'schemas'>>;

                const mergeComponent = {
                    type: 'object',
                    properties: {
                        _id: {
                            type: 'integer',
                            format: 'int64'
                        }
                    }
                };

                //expect merged schemas are here
                expect(schemas.RouteLevelComponent).toBeDefined();
                expect(schemas.RouteLevelComponent).toEqual(mergeComponent);
                expect(schemas.AliasLevelComponent).toBeDefined();
                expect(schemas.AliasLevelComponent).toEqual(mergeComponent);
                expect(schemas.ServiceLevelComponent).toBeDefined();
                expect(schemas.ServiceLevelComponent).toEqual(mergeComponent);
                expect(schemas.ActionLevelComponent).toBeDefined();
                expect(schemas.ActionLevelComponent).toEqual(mergeComponent);

                expect(schemas.RouteLevelErasedByAliasComponent?.properties?.alias).toBeDefined();
                expect(schemas.RouteLevelErasedByServiceComponent?.properties?.service).toBeDefined();
                expect(schemas.RouteLevelErasedByActionComponent?.properties?.action).toBeDefined();
            });
        });
    });
});
