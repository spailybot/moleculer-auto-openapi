import { describe, expect, it } from 'vitest';
import { LoggerInstance } from 'moleculer';
import type { OpenAPIV3_1 } from 'openapi-types';
import { createFastestValidator } from './helpers/fastestValidator.js';
import { ParametersExtractor } from '../src/Generators/ParametersExtractor.js';
import { FastestValidatorConverter } from '../src/Converters/FastestValidatorConverter.js';
import { ComponentsManager } from '../src/Generators/ComponentsManager.js';
import { Alias } from '../src/objects/Alias.js';
import { HTTP_METHODS } from '../src/constants.js';

describe('ParametersExtractor and Ref Override tests', () => {
    const logger = {
        warn: () => {},
        error: () => {},
        info: () => {},
        debug: () => {}
    } as unknown as LoggerInstance;

    const validator = createFastestValidator();
    const converter = new FastestValidatorConverter(validator);
    const componentsManager = new ComponentsManager(logger, converter);
    const extractor = new ParametersExtractor(converter, componentsManager);

    it('should map schema $ref override successfully in FastestValidatorConverter', () => {
        const schema = converter.getSchemaObjectFromRule({
            type: 'object',
            $$oa: {
                $ref: '#/components/schemas/User',
                description: 'User override description'
            }
        });

        expect(schema).toEqual({
            $ref: '#/components/schemas/User',
            description: 'User override description'
        });
    });

    it('should configure custom parameter settings on query parameters from $$oa', () => {
        const actionParams = {
            search: {
                type: 'string',
                $$oa: {
                    description: 'Search string query',
                    style: 'form',
                    explode: true,
                    allowEmptyValue: true,
                    allowReserved: true,
                    example: 'hello',
                    deprecated: true
                }
            }
        };

        const alias = {
            actionSchema: {
                params: actionParams
            }
        } as unknown as Alias;

        const result = extractor.addQueryParameters([], alias, HTTP_METHODS.GET, actionParams);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
            name: 'search',
            in: 'query',
            style: 'form',
            explode: true,
            required: true,
            description: 'Search string query',
            examples: undefined,
            deprecated: true,
            allowEmptyValue: true,
            allowReserved: true,
            schema: {
                type: 'string',
                description: 'Search string query',
                examples: ['hello'],
                deprecated: true,
                default: undefined,
                enum: undefined,
                maxLength: undefined,
                minLength: undefined
            }
        });
    });

    it('should handle parameter-level references from $$oa', () => {
        const actionParams = {
            userId: {
                type: 'string',
                $$oa: {
                    $ref: '#/components/parameters/UserId',
                    description: 'overridden parameter description'
                }
            }
        };

        const alias = {
            actionSchema: {
                params: actionParams
            }
        } as unknown as Alias;

        const result = extractor.addQueryParameters([], alias, HTTP_METHODS.GET, actionParams);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
            $ref: '#/components/parameters/UserId',
            description: 'overridden parameter description'
        });
    });

    describe('ComponentsManager object rule title vs summary', () => {
        it('should put $$oa.title on the component and $$oa.summary as the $ref sibling', () => {
            const rule = converter.getSchemaObjectFromRule({
                type: 'object',
                props: {
                    foo: { type: 'string' }
                },
                $$oa: {
                    title: 'DemoTitle',
                    summary: 'DemoSummary',
                    description: 'DemoDescription'
                }
            }) as OpenAPIV3_1.SchemaObject;

            const result = componentsManager.createSchemaPartFromRule('my.action.data', rule);

            expect(result).toMatchObject({
                summary: 'DemoSummary',
                description: 'DemoDescription',
                $ref: '#/components/schemas/my.action.data'
            });
            expect(componentsManager.components.schemas?.['my.action.data']).toMatchObject({
                title: 'DemoTitle',
                type: 'object'
            });
        });

        it('should keep a plain title on scalar rules', () => {
            const rule = converter.getSchemaObjectFromRule({
                type: 'string',
                $$oa: {
                    title: 'ScalarTitle'
                }
            }) as OpenAPIV3_1.SchemaObject;

            const result = componentsManager.createSchemaPartFromRule('my.action.field', rule);

            expect(result).toMatchObject({
                type: 'string',
                title: 'ScalarTitle'
            });
        });

        it('should default the $ref sibling summary to the rule summary when no $$oa.summary is given', () => {
            const rule = converter.getSchemaObjectFromRule({
                type: 'object',
                props: {
                    foo: { type: 'string' }
                },
                $$oa: {
                    title: 'OnlyTitle'
                }
            }) as OpenAPIV3_1.SchemaObject;

            const result = componentsManager.createSchemaPartFromRule('my.action.other', rule);

            expect(result).toMatchObject({
                $ref: '#/components/schemas/my.action.other'
            });
            expect(result).not.toHaveProperty('summary');
            expect(componentsManager.components.schemas?.['my.action.other']).toMatchObject({
                title: 'OnlyTitle'
            });
        });
    });
});
