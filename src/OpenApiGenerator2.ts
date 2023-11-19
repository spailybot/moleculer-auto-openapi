import { OpenAPIV3, OpenAPIV3_1 as OA3_1 } from 'openapi-types';
import { ValidationRule, ValidationRuleName, ValidationRuleObject, ValidationSchema, ValidationSchemaMetaKeys } from 'fastest-validator';
import { Mappers, ObjectRules, tSystemParams, FastestValidatorType } from './types/types.js';
import {
    ALLOWING_BODY_METHODS,
    BODY_PARSERS_CONTENT_TYPE,
    DEFAULT_CONTENT_TYPE,
    DEFAULT_MULTI_PART_FIELD_NAME,
    EOAExtensions,
    HTTP_METHODS,
    matchAll,
    multiOAProperties,
    normalizePath
} from './commons.js';
import { LoggerInstance } from 'moleculer';
import { Alias } from './objects/Alias.js';
import { FastestValidatorConverter } from './Converters/FastestValidatorConverter.js';

type parametersExtracted = {
    parameters?: Array<OA3_1.ParameterObject>;
    requestBody?: OA3_1.OperationObject['requestBody'];
};

export class OpenApiGenerator2 {
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
    private readonly document: OA3_1.Document;
    private converter: FastestValidatorConverter;

    constructor(
        private readonly logger: LoggerInstance,
        validator: FastestValidatorType,
        baseDocument: OA3_1.Document
    ) {
        this.converter = new FastestValidatorConverter(validator);

        this.document = baseDocument;
    }

    public generate(routes: Array<Alias>): OA3_1.Document {
        const document: OA3_1.Document = { ...this.document };

        const cachePathActions = new Map<string, string>();

        routes.forEach((alias) => {
            const openapiPath: string = this.formatParamUrl(normalizePath(alias.path));
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

                const openApiMethod: OA3_1.OperationObject = {
                    tags: pathAction.openapi?.tags,
                    responses: pathAction.openapi?.responses,
                    externalDocs: pathAction.openapi?.externalDocs,
                    operationId: pathAction.openapi?.operationId,
                    requestBody,
                    parameters
                };

                if (!alias.isJokerAlias()) {
                    openApiMethod.description = pathAction.openapi?.description;
                    openApiMethod.summary = pathAction.openapi?.summary;
                }

                (currentPath[method] as OA3_1.OperationObject) = openApiMethod;
            });

            document.paths[openapiPath] = currentPath;
        });

        document.components = Object.keys(this.components).reduce(
            (acc, key) => {
                return {
                    ...acc,
                    [key]: { ...document.components[key], ...this.components[key] }
                };
            },
            { ...document.components }
        );

        //TODO
        return document;
    }

    private extractParameters(method: HTTP_METHODS, path: string, alias: Alias): parametersExtracted {
        const pathParameters = this.extractParamsFromUrl(path);
        const result: parametersExtracted = {
            parameters: [...pathParameters]
        };

        const excluded = pathParameters.map((params: OA3_1.ParameterObject) => params.name);

        if (['multipart', 'stream'].includes(alias.type)) {
            // if (alias.isJokerAlias()) {
            //     throw new Error(`upload is not compatible with joker methods`);
            // }

            result.requestBody = this.generateFileUploadBody(alias, excluded);

            return result;
        } else if (alias.actionSchema?.params && alias.action) {
            const actionParams = alias.actionSchema.params;
            const metas = this.converter.getMetas(actionParams);

            //query
            const queryParameters = this.getParameters(method, actionParams, false);
            Object.entries(queryParameters).forEach(([k, v]) => {
                const schema = this.converter.getSchemaObjectFromRule(v) as OpenAPIV3.SchemaObject;

                if (!schema) {
                    return undefined;
                }

                const component = this.getComponent(schema);

                result.parameters.push({
                    name: k,
                    in: 'query',
                    schema,
                    required: component[EOAExtensions.optional] !== true
                });
            });

            //body
            const bodyParameters = this.getParameters(method, actionParams, true);
            if (Object.keys(bodyParameters).length > 1) {
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
                    : [alias.route?.service?.settings?.defaultResponseContentType]) ?? [DEFAULT_CONTENT_TYPE];

                let required = false;
                if (this.isReferenceObject(schema)) {
                    const schemaRef = this.getComponentByRef(schema.$ref);

                    if (!schemaRef) {
                        throw new Error(`fail to get schema from path ${schema.$ref}`);
                    }

                    this.removeExtensions(schemaRef);

                    required = schemaRef.required?.length > 0;
                }

                result.requestBody = {
                    required,
                    content: Object.fromEntries(
                        contentTypes.map((contentType) => [contentType, { schema }]) as Array<[string, OA3_1.MediaTypeObject]>
                    )
                };
            }
        }
        return result;
    }

    private getParameters(method: HTTP_METHODS, params: ValidationSchema, body: boolean): Record<string, ValidationRule> {
        const defaultInBody = ALLOWING_BODY_METHODS.includes(method);
        return Object.fromEntries(
            Object.entries(this.converter.getValidationRules(params))
                .map(([k, param]: [string, ValidationRule | undefined | any]): [string, ValidationRule] => {
                    const inBody = (param as ValidationRuleObject)?.$$oa?.in === 'body' ?? defaultInBody;

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

            const fileField = alias.route.service?.settings?.multiPartFileFieldName ?? DEFAULT_MULTI_PART_FIELD_NAME;
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

    //TODO seems useless
    // private isValidationSchema(schema: any): schema is ValidationSchema {
    //     return schema?.$$root !== true;
    // }

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

    private removeExtensions(rule: OA3_1.SchemaObject): void {
        Object.values(EOAExtensions).forEach((extension) => {
            delete rule[extension];
        });
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
        //delete extensions
        this.removeExtensions(rule);

        if (rule.type == 'object' && rule.properties) {
            // create child schema per object
            return {
                ...this._createSchemaComponentFromObject(nextSchemeName, rule.properties, { default: rule.default }),
                description: rule.description
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
            description: obj?.[EOAExtensions.description] as string
        };
    }
}
