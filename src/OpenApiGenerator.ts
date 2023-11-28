import { OpenAPIV3, OpenAPIV3_1 as OA3_1 } from 'openapi-types';
import { ValidationRule, ValidationRuleObject, ValidationSchema } from 'fastest-validator';
import { commonOpenApi, FastestValidatorType, openApiServiceOpenApi, TemplateVariables, tSystemParams } from './types/index.js';
import {
    ALLOWING_BODY_METHODS,
    BODY_PARSERS_CONTENT_TYPE,
    DEFAULT_CONTENT_TYPE,
    DEFAULT_MULTI_PART_FIELD_NAME,
    DEFAULT_SUMMARY_TEMPLATE,
    EOAExtensions,
    getAlphabeticSorter,
    HTTP_METHODS,
    matchAll,
    multiOAProperties,
    normalizePath,
    openApiVersionsSupported
} from './commons.js';
import { LoggerInstance } from 'moleculer';
import { Alias } from './objects/Alias.js';
import { FastestValidatorConverter } from './Converters/FastestValidatorConverter.js';
import { UNRESOLVED_ACTION_NAME } from './constants.js';
import { OpenApiMerger } from './OpenApiMerger.js';
import { OptionalOrFalse, SubOptionalOrFalse } from './types/utils.js';

type parametersExtracted = {
    parameters?: Array<OA3_1.ParameterObject>;
    requestBody?: OA3_1.OperationObject['requestBody'];
};

export class OpenApiGenerator {
    private components: OA3_1.ComponentsObject = {
        schemas: {},
        responses: {},
        parameters: {},
        examples: {},
        requestBodies: {},
        headers: {},
        securitySchemes: {},
        links: {},
        callbacks: {},
        pathItems: {}
    };
    private readonly document: openApiServiceOpenApi;
    private converter: FastestValidatorConverter;

    constructor(
        private readonly logger: LoggerInstance,
        validator: FastestValidatorType,
        baseDocument: openApiServiceOpenApi
    ) {
        this.converter = new FastestValidatorConverter(validator);

        this.document = baseDocument;
    }

    public generate(openApiVersion: openApiVersionsSupported, aliases: Array<Alias>): OA3_1.Document {
        const tagsMap: Map<string, OA3_1.TagObject> = new Map<string, OA3_1.TagObject>();

        if ((this.document as { openapi?: string }).openapi) {
            this.logger.warn(`setting manually the openapi version is not supported`);
            delete (this.document as { openapi?: string }).openapi;
        }

        const document: OA3_1.Document = {
            openapi: `${openApiVersion}.0`,
            ...this.document,
            tags: [],
            info: {
                title: 'moleculer-web API',
                ...this.document.info
            },
            components: this.cleanComponents(this.document.components)
        };

        //delete responses that end in the document
        if ((document as commonOpenApi).responses) {
            delete (document as commonOpenApi).responses;
        }

        const cachePathActions = new Map<string, string>();

        aliases.sort(getAlphabeticSorter('fullPath'));

        aliases.forEach((alias) => {
            const route = alias.route;
            const { apiService, openApiService } = route;

            const openapiPath: string = this.formatParamUrl(normalizePath(alias.fullPath));
            const currentPath: OA3_1.PathItemObject = document.paths[openapiPath] ?? {};

            if (alias.isJokerAlias()) {
                currentPath.description = alias.actionSchema?.openapi?.description;
                currentPath.summary = alias.actionSchema?.openapi?.summary;
            }

            alias.getPaths().forEach((pathAction) => {
                const method = pathAction.method;
                const cacheKeyName = `${openapiPath}.${method}`;

                const { parameters, requestBody } = this.extractParameters(method, openapiPath, alias) ?? {};

                if (currentPath[method]) {
                    const actionFromCache = cachePathActions.get(cacheKeyName);
                    this.logger.warn(
                        `${method.toUpperCase()} ${openapiPath} is already register by action ${actionFromCache ?? '<unamedAction>'} skip`
                    );
                    return;
                }

                cachePathActions.set(cacheKeyName, pathAction.action?.name);

                const openApi = OpenApiMerger.merge(tagsMap, openApiService, apiService, route, alias, pathAction.action);

                this.components = this.mergeComponents(this.components, this.cleanComponents(openApi.components));

                const openApiMethod: OA3_1.OperationObject = {
                    summary: !alias.isJokerAlias() ? openApi?.summary : undefined,
                    description: !alias.isJokerAlias() ? openApi?.description : undefined,
                    operationId: openApi?.operationId,
                    externalDocs: openApi?.externalDocs,
                    security: openApi?.security,
                    tags: this.handleTags(document, tagsMap, openApi?.tags),
                    parameters,
                    requestBody,
                    responses: openApi?.responses
                };

                const templateVariables: TemplateVariables = {
                    summary: openApi?.summary,
                    action: alias.action ?? UNRESOLVED_ACTION_NAME,
                    autoAlias: alias.route.autoAliases ? '[autoAlias]' : ''
                };

                const summaryTemplate = alias.route?.openApiService?.settings?.summaryTemplate;
                if (typeof summaryTemplate === 'string' || summaryTemplate === undefined) {
                    openApiMethod.summary = Object.entries(templateVariables)
                        .reduce(
                            (previous, [k, v]) => {
                                return previous.replace(new RegExp(`{{${k}}}`, 'g'), v ?? '');
                            },
                            (summaryTemplate ?? DEFAULT_SUMMARY_TEMPLATE) as string
                        )
                        .trim();
                }
                if (typeof summaryTemplate === 'function') {
                    openApiMethod.summary = summaryTemplate(templateVariables);
                }

                (currentPath[method] as OA3_1.OperationObject) = openApiMethod;
            });

            document.paths[openapiPath] = currentPath;
        });

        document.tags?.sort(getAlphabeticSorter('name'));

        document.components = this.mergeComponents(document.components, this.components);

        return this.removeExtensions(document);
    }

    private mergeComponents(c1: OA3_1.ComponentsObject, c2: OA3_1.ComponentsObject): OA3_1.ComponentsObject {
        return Object.keys(c2).reduce(
            (acc, key) => {
                if (!Object.keys(c2?.[key]).length) {
                    return acc;
                }

                return {
                    ...acc,
                    [key]: { ...c1[key], ...c2[key] }
                };
            },
            { ...c1 }
        ) as OA3_1.ComponentsObject;
    }

    private extractParameters(method: HTTP_METHODS, path: string, alias: Alias): parametersExtracted {
        const pathParameters = alias.openapi?.pathParameters
            ? alias.openapi.pathParameters.map((param) => ({
                  ...param,
                  in: 'path'
              }))
            : this.extractParamsFromUrl(path);

        const result: parametersExtracted = {
            parameters: [...pathParameters]
        };

        const excluded = pathParameters.map((params: OA3_1.ParameterObject) => params.name);

        if (['multipart', 'stream'].includes(alias.type)) {
            result.requestBody = alias.openapi?.requestBody ? alias.openapi?.requestBody : this.generateFileUploadBody(alias, excluded);

            return result;
        } else if (alias.openapi?.queryParameters || alias.openapi?.requestBody || (alias.actionSchema?.params && alias.action)) {
            const actionParams = alias?.actionSchema?.params ?? {};
            const metas = this.converter.getMetas(actionParams);
            const openApiMetas = metas?.$$oa ?? {};

            //query
            if (!alias.openapi?.queryParameters) {
                const queryParameters = this.getParameters(method, actionParams, false);
                Object.entries(queryParameters).forEach(([k, v]) => {
                    const schema = this.converter.getSchemaObjectFromRule(v) as OpenAPIV3.SchemaObject;

                    if (!schema) {
                        return undefined;
                    }

                    const component = this.getComponent(schema);

                    const schemaParameter = {
                        name: k,
                        in: 'query',
                        // required need to be true, or undefined
                        required: component[EOAExtensions.optional] !== true || undefined,
                        schema
                    };

                    if (!excluded.includes(k)) {
                        result.parameters.push(schemaParameter);
                        return;
                    }

                    //handle the case where the pathParameter is defined in params
                    result.parameters = result.parameters.map((parameter) => {
                        if (parameter.name !== k) {
                            return parameter;
                        }

                        return {
                            ...schemaParameter,
                            in: 'path',
                            required: true
                        };
                    });
                });
            } else {
                result.parameters = alias.openapi.queryParameters.map((param) => ({ ...param, in: 'query' }));
            }

            //body
            if (!alias.openapi?.requestBody) {
                const bodyParameters = this.getParameters(method, actionParams, true);
                if (Object.keys(bodyParameters).length > 0) {
                    const currentBodyParameters = {
                        ...metas,
                        ...bodyParameters
                    };

                    const schema = this.createRequestBodyFromParams(alias.action, currentBodyParameters, excluded);

                    const tmpContentTypes: Array<string> = Object.entries(alias.route?.bodyParsers || {})
                        .filter(([, v]) => Boolean(v))
                        .flatMap(([parser]) => BODY_PARSERS_CONTENT_TYPE[parser] ?? []);

                    // TODO specify input content type ? + allow to specify one ? allow to force one ?
                    const contentTypes = (tmpContentTypes?.length
                        ? tmpContentTypes
                        : [alias.route?.openApiService?.settings?.defaultResponseContentType]) ?? [DEFAULT_CONTENT_TYPE];

                    let required = false;
                    if (this.isReferenceObject(schema)) {
                        const schemaRef = this.getComponentByRef(schema.$ref);

                        if (!schemaRef) {
                            throw new Error(`fail to get schema from path ${schema.$ref}`);
                        }

                        required = schemaRef.required?.length > 0;
                    }

                    result.requestBody = {
                        description: openApiMetas.description,
                        summary: openApiMetas.summary,
                        required,
                        content: Object.fromEntries(
                            contentTypes.map((contentType) => [contentType, { schema }]) as Array<[string, OA3_1.MediaTypeObject]>
                        )
                    };
                }
            } else {
                result.requestBody = alias.openapi.requestBody;
            }
        }
        return result;
    }

    private getParameters(method: HTTP_METHODS, params: ValidationSchema, body: boolean): Record<string, ValidationRule> {
        const defaultInBody = ALLOWING_BODY_METHODS.includes(method);
        return Object.fromEntries(
            Object.entries(this.converter.getValidationRules(params))
                .map(([k, param]: [string, ValidationRule | undefined | any]): [string, ValidationRule] => {
                    const openApiInParameter = (param as ValidationRuleObject)?.$$oa?.in;
                    const inBody = openApiInParameter ? openApiInParameter === 'body' : defaultInBody;

                    if (inBody !== body) {
                        return;
                    }

                    return [k, param];
                })
                .filter(Boolean)
        );
    }

    /**
     * file upload use a specific way to works, so we need to handle it here
     *
     * @link https://moleculer.services/docs/0.14/moleculer-web.html#File-upload-aliases
     */
    private generateFileUploadBody(alias: Alias, excluded: Array<string>): OA3_1.RequestBodyObject {
        const typeBodyParser = alias.type ? BODY_PARSERS_CONTENT_TYPE[alias.type] : undefined;

        const schema: OA3_1.MediaTypeObject['schema'] = {};

        const binarySchema: { type: OA3_1.NonArraySchemaObjectType; format: string } = {
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

            const fileField = alias.route.openApiService?.settings?.multiPartFileFieldName ?? DEFAULT_MULTI_PART_FIELD_NAME;
            schema.allOf = [
                {
                    type: 'object',
                    properties: {
                        [fileField]: {
                            oneOf: [
                                binarySchema,
                                {
                                    type: 'array',
                                    items: binarySchema
                                }
                            ]
                        }
                    }
                }
            ];

            if (alias.action && alias.actionSchema?.params) {
                //merge schema with field "file"
                const paramsSchema = this.createRequestBodyFromParams(alias.action, alias.actionSchema.params ?? {}, excluded);
                schema.allOf.push(paramsSchema);
            }
        }

        return {
            content: {
                [typeBodyParser]: {
                    schema
                }
            }
        } as OA3_1.RequestBodyObject;
    }

    private isReferenceObject(component: any): component is OA3_1.ReferenceObject {
        return !!(component as OA3_1.ReferenceObject)?.$ref;
    }

    private getComponent(component: OA3_1.ReferenceObject | OA3_1.SchemaObject): OA3_1.SchemaObject {
        if (!this.isReferenceObject(component)) {
            return component;
        }

        const refComponent = this.getComponentByRef(component.$ref);
        if (!refComponent) {
            throw new Error(`fail to get component "${component.$ref}`);
        }
        return refComponent;
    }

    private getComponentByRef(path: string): OA3_1.SchemaObject | undefined {
        const pathSegments = path.split('/').filter((segment) => segment !== ''); // Séparer le chemin en segments

        //bad path format
        if (
            pathSegments.length < 4 ||
            pathSegments[0] !== '#' ||
            pathSegments[1] !== 'components' ||
            !Object.keys(this.components).includes(pathSegments[2])
        ) {
            return undefined;
        }

        return pathSegments.slice(2).reduce((currentObject, segment) => {
            return currentObject && currentObject.hasOwnProperty(segment) ? currentObject[segment] : undefined;
        }, this.components);
    }

    createRequestBodyFromParams(
        rootSchemeName: string,
        obj: ValidationSchema,
        exclude: Array<string> = [],
        parentNode: { default?: any } = {}
    ): OA3_1.SchemaObject | OA3_1.ReferenceObject {
        if (obj.$$root === true) {
            return this.converter.getSchemaObjectFromRootSchema(obj);
        }

        const rootRules = this.converter.getSchemaObjectFromSchema(obj);

        const rules: Record<string, OA3_1.SchemaObject> = Object.fromEntries(
            Object.entries(rootRules).filter(([name, rule]) => !exclude.includes(name) && rule)
        );

        return this._createSchemaComponentFromObject(rootSchemeName, rules, parentNode);
    }

    /**
     * extract params from /{table}
     * @param url
     * @returns {[]}
     */
    extractParamsFromUrl(url = ''): Array<OA3_1.ParameterObject> {
        return [...matchAll(/{(\w+)}/g, url).flat()].map((name) => ({
            name,
            in: 'path',
            required: true,
            schema: { type: 'string' }
        })) as Array<OA3_1.ParameterObject>;
    }
    /**
     * Convert moleculer params to openapi definitions(components schemas)
     * @param schemeName
     * @param obj
     * @param customProperties
     */
    _createSchemaComponentFromObject(
        schemeName: string,
        obj: Record<string, OA3_1.SchemaObject>,
        customProperties: { default?: any } = {}
    ): OA3_1.ReferenceObject {
        const required: Array<string> = [];
        const properties = Object.fromEntries(
            Object.entries(obj).map(([fieldName, rule]) => {
                const nextSchemeName = `${schemeName}.${fieldName}`;
                if (rule[EOAExtensions.optional] != true) {
                    required.push(fieldName);
                }

                return [fieldName, this._createSchemaPartFromRule(nextSchemeName, rule)];
            })
        );

        if (this.components.schemas[schemeName]) {
            this.logger.warn(`Generator - schema ${schemeName} already exist and will be overwrite`);
        }

        this.components.schemas[schemeName] = {
            type: 'object',
            properties,
            required: required.length > 0 ? required : undefined,
            default: customProperties.default
        };

        return {
            $ref: `#/components/schemas/${schemeName}`
        };
    }

    /**
     * convert /:table to /{table}
     * @param url
     * @returns {string|string}
     */
    private formatParamUrl(url = ''): string {
        let start = url.indexOf('/:');
        if (start === -1) {
            return url;
        }

        const end = url.indexOf('/', ++start);

        if (end === -1) {
            return url.slice(0, start) + '{' + url.slice(++start) + '}';
        }

        return this.formatParamUrl(url.slice(0, start) + '{' + url.slice(++start, end) + '}' + url.slice(end));
    }

    private _createSchemaPartFromRule(nextSchemeName: string, rule: OA3_1.SchemaObject): OA3_1.SchemaObject | OA3_1.ReferenceObject {
        const systemParams: tSystemParams = this.extractSystemParams(rule as Record<string, unknown>);

        rule.description = systemParams.description;
        rule.title = systemParams.summary;
        rule.deprecated = systemParams.deprecated;

        if (rule.type == 'object' && rule.properties) {
            // create child schema per object
            return {
                summary: rule.title,
                deprecated: rule.deprecated,
                description: rule.description,
                ...this._createSchemaComponentFromObject(nextSchemeName, rule.properties, { default: rule.default })
            };
        }

        if (rule.type === 'array') {
            return {
                ...rule,
                items: rule.items ? this._createSchemaPartFromRule(nextSchemeName, rule.items as OA3_1.SchemaObject) : undefined
            };
        }

        if (multiOAProperties.some((property) => rule[property])) {
            let i = 0;
            multiOAProperties.forEach((property) => {
                if (!rule[property]) {
                    return;
                }

                rule[property] = (rule[property] as Array<OA3_1.SchemaObject>).map((schema) => {
                    if (schema.type !== 'object') {
                        return schema;
                    }

                    const schemeName = `${nextSchemeName}.${i++}`;

                    return this._createSchemaPartFromRule(schemeName, schema);
                });
            });
        }

        return rule;
    }

    private extractSystemParams(obj: Record<string, unknown> = {}): tSystemParams {
        return {
            optional: obj?.[EOAExtensions.optional] as boolean,
            description: obj?.[EOAExtensions.description] as string,
            summary: obj?.[EOAExtensions.summary] as string,
            deprecated: obj?.[EOAExtensions.deprecated] as boolean
        };
    }

    private removeExtensions<T>(obj: T): T {
        if (Array.isArray(obj)) {
            return obj.map((item) => this.removeExtensions(item)) as T;
        }

        if (typeof obj === 'object') {
            Object.values(EOAExtensions).forEach((extension) => {
                delete obj[extension];
            });

            return Object.fromEntries(
                Object.entries(obj).map(([k, v]) => {
                    return [k, this.removeExtensions(v)];
                })
            ) as T;
        }

        return obj;
    }

    private cleanComponents(components: SubOptionalOrFalse<OA3_1.ComponentsObject> = {}): OA3_1.ComponentsObject {
        return Object.fromEntries(
            Object.entries(components).map(([k, v]: [string, OptionalOrFalse<OA3_1.ComponentsObject>]) => [
                k,
                Object.fromEntries(
                    Object.entries(v)
                        .map(([key, value]) => (value === false ? undefined : [key, value]))
                        .filter(Boolean)
                )
            ])
        );
    }

    private handleTags(document: OA3_1.Document, tagsMap: Map<string, OA3_1.TagObject>, tags: Array<string> = []): Array<string> {
        const uniqTags = Array.from(new Set(tags));

        uniqTags.forEach((tag) => {
            const tagObject: OA3_1.TagObject | undefined = tagsMap.get(tag);
            if (!document.tags?.some(({ name }) => name === tag) && tagObject) {
                document.tags.push(tagObject);
            }
        });

        return uniqTags;
    }
}
