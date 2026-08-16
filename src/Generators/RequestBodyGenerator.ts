import type { OpenAPIV3_1 } from 'openapi-types';
import type { ValidationSchema, ValidationSchemaMetaKeys } from 'fastest-validator';
import type { Alias } from '../objects/Alias.js';
import type { ActionOpenApi } from '../types/index.js';
import type { FastestValidatorConverter } from '../Converters/FastestValidatorConverter.js';
import type { ComponentsManager } from './ComponentsManager.js';
import type { ParametersExtractor } from './ParametersExtractor.js';
import { BODY_PARSERS_CONTENT_TYPE, DEFAULT_CONTENT_TYPE, DEFAULT_MULTI_PART_FIELD_NAME, HTTP_METHODS } from '../constants.js';

export class RequestBodyGenerator {
    constructor(
        private readonly converter: FastestValidatorConverter,
        private readonly componentsManager: ComponentsManager,
        private readonly parametersExtractor: ParametersExtractor
    ) {}

    public createRequestBodyFromParams(
        rootSchemeName: string,
        obj: ValidationSchema,
        exclude: Array<string> = [],
        parentNode: { default?: any } = {}
    ): OpenAPIV3_1.SchemaObject | OpenAPIV3_1.ReferenceObject | undefined {
        if (obj.$$root === true) {
            return this.converter.getSchemaObjectFromRootSchema(obj);
        }

        const rootRules = this.converter.getSchemaObjectFromSchema(obj);

        const rules: Record<string, OpenAPIV3_1.SchemaObject> = Object.fromEntries(
            Object.entries(rootRules).filter(([name, rule]) => !exclude.includes(name) && rule)
        );

        return this.componentsManager.createSchemaComponentFromObject(rootSchemeName, rules, parentNode);
    }

    public getRequestBody(
        alias: Alias,
        method: HTTP_METHODS,
        actionParams: ValidationSchema,
        metas: ValidationSchemaMetaKeys,
        excluded: Array<string> = [],
        openApi?: ActionOpenApi
    ): OpenAPIV3_1.RequestBodyObject | OpenAPIV3_1.ReferenceObject | undefined {
        if (!alias.action) {
            return openApi?.requestBody as OpenAPIV3_1.RequestBodyObject | OpenAPIV3_1.ReferenceObject | undefined;
        }

        const openApiMetas: Record<string, any> = {};

        // Extract global keys (strip leading $$, e.g. $$title → title)
        const globalKeys = ['$$title', '$$description', '$$summary', '$$default', '$$example', '$$examples'] as const;
        for (const key of globalKeys) {
            if (key in (metas as Record<string, unknown>)) {
                const openApiKey = key.substring(2);
                openApiMetas[openApiKey] = (metas as Record<string, unknown>)[key];
            }
        }

        // Overwrite with $oa keys
        if (metas?.$$oa) {
            const oaMetas = metas.$$oa as Record<string, unknown>;
            for (const key in oaMetas) {
                openApiMetas[key] = oaMetas[key];
            }
        }

        const bodyParameters = this.parametersExtractor.getParameters(method, actionParams, true);
        if (Object.keys(bodyParameters).length > 0) {
            const currentBodyParameters = {
                ...metas,
                ...bodyParameters
            };

            const schema = this.createRequestBodyFromParams(alias.action, currentBodyParameters, excluded);

            const tmpContentTypes: Array<string> = Object.entries(alias.route?.bodyParsers || {})
                .filter(([, v]) => Boolean(v))
                .flatMap(([parser]) => BODY_PARSERS_CONTENT_TYPE[parser as keyof typeof BODY_PARSERS_CONTENT_TYPE] ?? []);

            const contentTypes = (tmpContentTypes?.length
                ? tmpContentTypes
                : [alias.route?.openApiService?.settings?.defaultResponseContentType]) ?? [DEFAULT_CONTENT_TYPE];

            let required = false;
            if (schema && this.componentsManager.isReferenceObject(schema)) {
                const schemaRef = this.componentsManager.getComponentByRef<OpenAPIV3_1.BaseSchemaObject>(schema.$ref);

                if (!schemaRef) {
                    throw new Error(`fail to get schema from path ${schema.$ref}`);
                }

                required = (schemaRef.required ?? []).length > 0;
            }

            const requestBody: OpenAPIV3_1.RequestBodyObject = {
                required,
                content: Object.fromEntries(
                    contentTypes.map((contentType) => [contentType, { schema }]) as Array<[string, OpenAPIV3_1.MediaTypeObject]>
                )
            };

            // Apply all extracted metas
            const requestBodyRecord = requestBody as Record<string, unknown>;
            for (const key in openApiMetas) {
                requestBodyRecord[key] = openApiMetas[key];
            }

            if (openApi?.requestBody) {
                return {
                    ...requestBody,
                    ...openApi.requestBody,
                    content: openApi.requestBody.content ?? requestBody.content
                };
            }

            return requestBody;
        }

        if (openApi?.requestBody) {
            return openApi.requestBody as OpenAPIV3_1.RequestBodyObject | OpenAPIV3_1.ReferenceObject;
        }
    }

    public generateFileUploadBody(alias: Alias, excluded: Array<string>): OpenAPIV3_1.RequestBodyObject {
        const typeBodyParser = alias.type
            ? BODY_PARSERS_CONTENT_TYPE[alias.type as keyof typeof BODY_PARSERS_CONTENT_TYPE]
            : BODY_PARSERS_CONTENT_TYPE.multipart;

        const schema: OpenAPIV3_1.MediaTypeObject['schema'] = {};

        const binarySchema: { type: OpenAPIV3_1.NonArraySchemaObjectType; format: string } = {
            type: 'string',
            format: 'binary'
        };

        if (alias.type === 'stream') {
            schema.type = binarySchema.type;
            schema.format = binarySchema.format;
        } else {
            if (alias.actionSchema?.params?.$$root === true) {
                throw new Error('$$root parameters is not supported on multipart');
            }

            const filesLimit = alias.busboyConfig?.limits?.files ?? alias?.route?.busboyConfig?.limits?.files;
            const fileField = alias.route.openApiService?.settings?.multiPartFileFieldName ?? DEFAULT_MULTI_PART_FIELD_NAME;
            schema.allOf = [
                {
                    type: 'object',
                    properties: {
                        [fileField]:
                            filesLimit === 1
                                ? binarySchema
                                : {
                                      type: 'array',
                                      items: binarySchema,
                                      maxItems: filesLimit
                                  }
                    },
                    required: [fileField]
                }
            ];
        }

        return {
            required: true,
            content: {
                [typeBodyParser[0]]: {
                    schema
                }
            }
        } as OpenAPIV3_1.RequestBodyObject;
    }
}
