import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';
import type { ValidationSchema, ValidationRule, ValidationRuleObject } from 'fastest-validator';
import type { Alias } from '../objects/Alias.js';
import type { ActionOpenApi, FVOARuleMetaKeys } from '../types/index.js';
import type { FastestValidatorConverter } from '../Converters/FastestValidatorConverter.js';
import type { ComponentsManager } from './ComponentsManager.js';
import { EOAExtensions, HTTP_METHODS, ALLOWING_BODY_METHODS, OA_PARAM_IN, OA_REF_PREFIX, OA_TYPE, PARAM_SPECIFIC_KEYS } from '../constants.js';
import { matchAll } from '../commons.js';

export class ParametersExtractor {
    constructor(
        private readonly converter: FastestValidatorConverter,
        private readonly componentsManager: ComponentsManager
    ) {}

    public extractParamsFromUrl(url = ''): Array<OpenAPIV3_1.ParameterObject> {
        return [...matchAll(/{(\w+)}/g, url).flat()].map((name) => ({
            name,
            in: 'path',
            required: true,
            schema: { type: 'string' }
        })) as Array<OpenAPIV3_1.ParameterObject>;
    }

    public addQueryParameters(
        parameters: Array<OpenAPIV3_1.ParameterObject>,
        alias: Alias,
        method: HTTP_METHODS,
        actionParams: ValidationSchema
    ): Array<OpenAPIV3_1.ParameterObject> {
        if (alias.openapi?.queryParameters) {
            return alias.openapi.queryParameters.map((param) => ({ ...param, in: OA_PARAM_IN.QUERY }));
        }

        const queryParameters = this.getParameters(method, actionParams, false);
        Object.entries(queryParameters).forEach(([k, v]) => {
            const ruleObj = (v && typeof v === 'object' && !Array.isArray(v)) ? (v as Record<string, unknown>) : {};
            const openApiParams = (ruleObj.$$oa as FVOARuleMetaKeys | undefined) || {};

            if (typeof openApiParams.$ref === 'string' && openApiParams.$ref.startsWith(OA_REF_PREFIX.PARAMETERS)) {
                const schemaParameter = {
                    $ref: openApiParams.$ref,
                    ...Object.fromEntries(
                        PARAM_SPECIFIC_KEYS
                            .filter((key) => openApiParams[key] !== undefined)
                            .map((key) => [key, openApiParams[key]])
                    )
                } as OpenAPIV3_1.ReferenceObject & OpenAPIV3_1.ParameterBaseObject;

                if (!parameters.some((p) => p.name === k)) {
                    parameters.push(schemaParameter as unknown as OpenAPIV3_1.ParameterObject);
                    return;
                }

                parameters = parameters.map((parameter) => {
                    if (parameter.name !== k) {
                        return parameter;
                    }

                    return {
                        ...schemaParameter,
                        in: OA_PARAM_IN.PATH,
                        required: true
                    } as unknown as OpenAPIV3_1.ParameterObject;
                });
                return;
            }

            const schema = this.converter.getSchemaObjectFromRule(v) as OpenAPIV3_1.SchemaObject | OpenAPIV3_1.ReferenceObject;

            if (!schema) {
                return undefined;
            }

            const component = this.componentsManager.getComponent(schema);
            const isObjectType = component?.type === OA_TYPE.OBJECT;

            const schemaParameter: OpenAPIV3_1.ParameterObject = {
                name: k,
                in: OA_PARAM_IN.QUERY,
                style: 'style' in openApiParams ? openApiParams.style : (isObjectType ? 'deepObject' : undefined),
                explode: 'explode' in openApiParams ? openApiParams.explode : (isObjectType ? true : undefined),
                required: 'required' in openApiParams ? openApiParams.required : (component[EOAExtensions.optional] !== true || undefined),
                deprecated: 'deprecated' in openApiParams ? openApiParams.deprecated : (component?.deprecated !== undefined ? component.deprecated : undefined),
                description: 'description' in openApiParams ? openApiParams.description : (component?.description !== undefined ? component.description : undefined),
                examples: ('examples' in openApiParams && !Array.isArray(openApiParams.examples)) ? openApiParams.examples : undefined,
                allowEmptyValue: 'allowEmptyValue' in openApiParams ? openApiParams.allowEmptyValue : undefined,
                allowReserved: 'allowReserved' in openApiParams ? openApiParams.allowReserved : undefined,
                schema: schema as any
            };

            if (!parameters.some((p) => p.name === k)) {
                parameters.push(schemaParameter);
                return;
            }

            parameters = parameters.map((parameter) => {
                if (parameter.name !== k) {
                    return parameter;
                }

                return {
                    ...schemaParameter,
                    in: OA_PARAM_IN.PATH,
                    required: true
                };
            });
        });

        return parameters;
    }

    public getParameters(method: HTTP_METHODS, params: ValidationSchema, body: boolean): Record<string, ValidationRule> {
        const defaultInBody = ALLOWING_BODY_METHODS.includes(method);
        return Object.fromEntries(
            Object.entries(this.converter.getValidationRules(params))
                .map(([k, param]: [string, ValidationRule | undefined | any]): [string, ValidationRule] | undefined => {
                    const openApiInParameter = (param as ValidationRuleObject)?.$$oa?.in;
                    const inBody = openApiInParameter ? openApiInParameter === 'body' : defaultInBody;

                    if (inBody !== body) {
                        return;
                    }

                    return [k, param];
                })
                .filter(Boolean) as Array<[string, ValidationRule]>
        );
    }

    public extract(method: HTTP_METHODS, path: string, alias: Alias, openApi?: ActionOpenApi) {
        const actionParams = alias?.actionSchema?.params ?? {};
        const isUploadAlias = ['multipart', 'stream'].includes(alias.type ?? '');

        const pathParameters = openApi?.pathParameters
            ? openApi.pathParameters.map((param: any) => ({
                  ...param,
                  in: 'path'
              }))
            : this.extractParamsFromUrl(path);

        const mergedParameters = this.addQueryParameters(pathParameters, alias, isUploadAlias ? HTTP_METHODS.GET : method, actionParams);
        const excluded = pathParameters.map((params: OpenAPIV3_1.ParameterObject) => params.name);

        return {
            parameters: mergedParameters,
            excluded
        };
    }
}
