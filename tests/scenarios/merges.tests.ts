import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
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
                await setupBroker(broker, undefined, [routes.merge, routes.mergeRoute]);
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
            });
            describe('tests responses', () => {
                it('should merge responses', async () => {
                    const json = await broker.call<OA_GENERATE_DOCS_OUTPUT, OA_GENERATE_DOCS_INPUT>(`${OpenapiService.name}.generateDocs`, {
                        version: '3.1'
                    });

                    const currentPath = json?.paths?.['/api/merge/merge']?.get;
                    expect(currentPath).toBeDefined();

                    expect(currentPath?.responses).toBeDefined();
                    const responses = currentPath?.responses as OpenAPIV3_1.ResponsesObject;

                    expect(responses['200']?.description).toEqual('action success response');
                    expect(responses['401']?.description).toEqual('route response');
                    expect(responses['402']?.description).toEqual('alias response');
                    expect(responses['403']?.description).toEqual('service response');
                    expect(responses['404']?.description).toEqual('action response');
                });
                it('should allow to remove responses', async () => {
                    const json = await broker.call<OA_GENERATE_DOCS_OUTPUT, OA_GENERATE_DOCS_INPUT>(`${OpenapiService.name}.generateDocs`, {
                        version: '3.1'
                    });

                    const currentPath = json?.paths?.['/api/merge/mergeNoResponse']?.get;
                    expect(currentPath).toBeDefined();

                    expect(currentPath?.responses).toBeDefined();
                    const responses = currentPath?.responses as OpenAPIV3_1.ResponsesObject;

                    expect(responses['401']).toBeUndefined();
                    expect(responses['402']).toBeUndefined();
                });
            });
            describe('test deprecated', () => {
                let schema: OA_GENERATE_DOCS_OUTPUT;
                beforeEach(async () => {
                    schema = await broker.call<OA_GENERATE_DOCS_OUTPUT, OA_GENERATE_DOCS_INPUT>(`${OpenapiService.name}.generateDocs`, {
                        version: '3.1'
                    });
                });

                it('should not set deprecated by default', async () => {
                    expect(schema.paths?.['/api/merge/control']?.get).toBeDefined();
                    expect(schema.paths?.['/api/merge/control']?.get?.deprecated).not.toBeDefined();
                });

                it.each(['mergeAction', 'mergeAlias', 'mergeService'])('should merge deprecated in path : %s', async (path) => {
                    expect(schema.paths?.[`/api/merge/${path}`]?.get).toBeDefined();
                    expect(schema.paths?.[`/api/merge/${path}`]?.get?.deprecated).toBeTruthy();
                });
            });
        });
    });
});
