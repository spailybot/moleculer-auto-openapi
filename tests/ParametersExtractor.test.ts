import { describe, expect, it } from 'vitest';
import FastestValidator from 'fastest-validator';
import { LoggerInstance } from 'moleculer';
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

    const validator = new FastestValidator();
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
});
