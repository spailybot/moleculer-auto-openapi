import type { Context, LoggerInstance, Service, ServiceBroker } from 'moleculer';
import type { OpenAPIV3, OpenAPIV3_1 as OA3_1 } from 'openapi-types';
import type { ApiRouteSchemaOpenApi, Mappers, ObjectRules, openApiMixinSettings, tSystemParams, ValidatorType } from './types.js';
import type { ValidationRule, ValidationRuleName, ValidationRuleObject, ValidationSchema } from 'fastest-validator';
import { ROOT_PROPERTY, UNRESOLVED_ACTION_NAME } from './constants.js';
import { moleculerOpenAPITypes } from './moleculer.js';
import { EOAExtensions, openApiVersionsSupported } from './commons.js';
import { getFastestValidatorMappers } from './mappers.js';
import { ApiSettingsSchema } from 'moleculer-web';

export const defaultSettings: openApiMixinSettings = {
    onlyLocal: false, // build schema from only local services
    schemaPath: '/api/openapi/openapi.json',
    uiPath: '/api/openapi/ui',
    // set //unpkg.com/swagger-ui-dist@3.38.0 for fetch assets from unpkg
    assetsPath: '/openapi/assets',
    commonPathItemObjectResponses: {
        200: {
            $ref: '#/components/responses/ReturnedData'
        },
        401: {
            $ref: '#/components/responses/UnauthorizedError'
        },
        422: {
            $ref: '#/components/responses/ValidationError'
        },
        default: {
            $ref: '#/components/responses/ServerError'
        }
    },
    requestBodyAndResponseBodyAreSameOnMethods: [
        /* 'post',
        'patch',
        'put', */
    ],
    requestBodyAndResponseBodyAreSameDescription:
        'The answer may vary slightly from what is indicated here. Contain id and/or other additional attributes.',
    openapi: {
        openapi: '3.1.0',
        info: {
            description: '',
            version: '0.0.1',
            title: 'Api docs'
        },
        tags: [],
        paths: {},
        components: {
            schemas: moleculerOpenAPITypes.schemas,
            securitySchemes: {},
            responses: moleculerOpenAPITypes.responses
        }
    },
    cacheOpenApi: true,
    skipUnresolvedActions: false,
    clearCacheOnRoutesGenerated: true,
    summaryTemplate: '{{summary}}\n            ({{action}}){{autoAlias}}',
    returnAssetsAsStream: true
};

export type OA_GENERATE_DOCS_INPUT = {
    version?: openApiVersionsSupported;
};
export type OA_GENERATE_DOCS_OUTPUT = OA3_1.Document;

const multiOAProperties = ['oneOf', 'allOf', 'anyOf'];

export class MoleculerOpenAPIGenerator {
    private readonly broker: ServiceBroker;

    private readonly settings: openApiMixinSettings;
    private readonly validator: ValidatorType;
    private readonly mappers: Mappers;
    private readonly logger: LoggerInstance;

    constructor(broker: ServiceBroker, settings: openApiMixinSettings) {
        this.broker = broker;
        const validator = this.broker.validator as unknown as { validator: any };
        if (validator.constructor.name != 'FastestValidator' && validator.validator) {
            throw new Error('only fastest validator is allowed');
        }

        this.validator = validator.validator;

        this.logger = this.broker.getLogger('moleculer-openapi-generator');

        this.settings = {
            ...defaultSettings,
            ...settings
        };

        //register mappers
        // TODO allow to pass custom mappers
        this.mappers = getFastestValidatorMappers({
            getSchemaObjectFromSchema: (...args) => this.getSchemaObjectFromSchema(...args),
            getSchemaObjectFromRule: (...args) => this.getSchemaObjectFromRule(...args)
        });
    }

    //TODO seems useless
    private isValidationSchema(schema: any): schema is ValidationSchema {
        return schema?.$$root !== true;
    }

    private fetchServicesWithActions(ctx: Context): Promise<Array<Service>> {
        return ctx.call('$node.services', {
            withActions: true,
            onlyLocal: this.settings.onlyLocal
        });
    }

    private fetchAliasesForService(ctx: Context, service: string) {
        return this.broker.call(`${service}.listAliases`);
    }

    attachParamsAndOpenapiFromEveryActionToRoutes(routes, nodes) {
        for (const routeAction in routes) {
            for (const node of nodes) {
                for (const nodeAction in node.actions) {
                    if (routeAction === nodeAction) {
                        const actionProps = node.actions[nodeAction];

                        routes[routeAction].params = actionProps.params || {};
                        //read openAPI here
                        routes[routeAction].openapi = actionProps.openapi ?? null;
                        break;
                    }
                }
            }
        }
    }

    async collectRoutes(
        ctx: Context,
        nodes: Array<Service<ApiSettingsSchema | undefined>>
    ): Promise<Record<string, ApiRouteSchemaOpenApi>> {
        const routes: Record<string, ApiRouteSchemaOpenApi> = {};

        for (const node of nodes) {
            // find routes in web-api service
            if (node.settings && node.settings.routes) {
                // iterate each route
                for (const route of node.settings.routes) {
                    // map standard aliases
                    this.buildActionRouteStructFromAliases(route, routes);
                }

                let service = node.name;
                // resolve paths with auto aliases
                const hasAutoAliases = node.settings.routes.some((route) => route.autoAliases);
                if (hasAutoAliases) {
                    // support services that has version, like v1.api
                    if (Object.prototype.hasOwnProperty.call(node, 'version') && node.version !== undefined) {
                        service = `v${node.version}.` + service;
                    }
                    const autoAliases = await this.fetchAliasesForService(ctx, service);
                    const convertedRoute = this.convertAutoAliasesToRoute(autoAliases);
                    this.buildActionRouteStructFromAliases(convertedRoute, routes);
                }
            }
        }

        return routes;
    }
    /**
     * @link https://github.com/moleculerjs/moleculer-web/blob/155ccf1d3cb755dafd434e84eb95e35ee324a26d/src/index.js#L229
     * @param autoAliases<Array{Object}>
     * @returns {{path: string, aliases: {}}}
     */
    convertAutoAliasesToRoute(autoAliases) {
        const route = {
            path: '',
            autoAliases: true,
            aliases: {}
        };

        for (const obj of autoAliases) {
            const alias = `${obj.methods} ${obj.fullPath}`;
            if (!obj.actionName && this.settings.skipUnresolvedActions) {
                continue;
            }
            route.aliases[alias] = obj.actionName || UNRESOLVED_ACTION_NAME;
        }

        return route;
    }
    /**
     * convert `GET /table`: `table.get`
     * to {action: {
     *   actionType:'multipart|null',
     *   params: {},
     *   autoAliases: true|undefined
     *   paths: [
     *    {base: 'api/uploads', alias: 'GET /table'}
     *   ]
     *   openapi: null
     * }}
     * @param route
     * @param routes
     * @returns {{}}
     */
    buildActionRouteStructFromAliases(route, routes) {
        for (const alias in route.aliases) {
            const aliasInfo = route.aliases[alias];
            let actionType = aliasInfo.type;

            let action = '';
            if (aliasInfo.action) {
                action = aliasInfo.action;
            } else if (Array.isArray(aliasInfo)) {
                action = aliasInfo[aliasInfo.length - 1];
            } else if (typeof aliasInfo !== 'string') {
                action = UNRESOLVED_ACTION_NAME;
            } else {
                action = aliasInfo;
            }
            // support actions like multipart:import.proceedFile
            if (action.includes(':')) {
                [actionType, action] = action.split(':');
            }

            if (!routes[action]) {
                routes[action] = {
                    actionType,
                    params: {},
                    paths: [],
                    openapi: null
                };
            }

            routes[action].paths.push({
                base: route.path || '',
                alias,
                autoAliases: route.autoAliases,
                openapi: aliasInfo.openapi || null
            });
        }

        return routes;
    }
    attachRoutesToDoc(routes, doc: OA3_1.Document) {
        // route to openapi paths
        for (const action in routes) {
            const { paths, params, actionType, openapi = {} } = routes[action];
            const service = action.split('.').slice(0, -1).join('.');

            // this.addTagToDoc(doc, service);

            for (const path of paths) {
                // parse method and path from: POST /api/table
                const [tmpMethod, subPath] = path.alias.split(' ');
                const method = tmpMethod.toLowerCase() as OA3_1.HttpMethods;

                // convert /:table to /{table}
                const openapiPath: string = this.formatParamUrl(this.normalizePath(`${path.base}/${subPath}`));

                const [queryParams, addedQueryParams] = this.extractParamsFromUrl(openapiPath);

                const currentPath = doc.paths[openapiPath] || {};

                if (currentPath[method]) {
                    continue;
                }

                // Path Item Object
                // https://github.com/OAI/OpenAPI-Specification/blob/b748a884fa4571ffb6dd6ed9a4d20e38e41a878c/versions/3.0.3.md#path-item-object-example
                let currentPathMethod: (typeof currentPath)[OA3_1.HttpMethods] & { components?: OA3_1.ComponentsObject } = {
                    summary: '',
                    tags: [service],
                    // rawParams: params,
                    parameters: [...queryParams],
                    responses: {
                        // attach common responses
                        ...this.settings.commonPathItemObjectResponses
                    }
                };

                const schemaName = action;
                if (method === 'get' || method === 'delete') {
                    currentPathMethod.parameters.push(...this.moleculerParamsToQuery(params, addedQueryParams));
                } else {
                    if (openapi?.requestBody) {
                        currentPathMethod.requestBody = openapi.requestBody;
                    } else {
                        this.createSchemaFromParams(doc, schemaName, params, addedQueryParams);
                        currentPathMethod.requestBody = {
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: `#/components/schemas/${schemaName}`
                                    }
                                }
                            }
                        };
                    }
                }

                if (this.settings.requestBodyAndResponseBodyAreSameOnMethods.includes(method)) {
                    currentPathMethod.responses[200] = {
                        description: this.settings.requestBodyAndResponseBodyAreSameDescription,
                        ...currentPathMethod.requestBody
                    };
                }

                // if multipart/stream convert fo formData/binary
                if (actionType === 'multipart' || actionType === 'stream') {
                    currentPathMethod = {
                        ...currentPathMethod,
                        parameters: [...queryParams],
                        requestBody: this.getFileContentRequestBodyScheme(openapiPath, method, actionType) as OA3_1.RequestBodyObject &
                            OpenAPIV3.RequestBodyObject
                    };
                }

                // merge values from action
                // @ts-ignore
                currentPathMethod = this.mergePathItemObjects(currentPathMethod, openapi);

                // merge values which exist in web-api service
                // in routes or custom function
                // @ts-ignore
                currentPathMethod = this.mergePathItemObjects(currentPathMethod, path.openapi);

                // add tags to root of scheme
                if (currentPathMethod.tags) {
                    currentPathMethod.tags.forEach((name) => {
                        this.addTagToDoc(doc, name);
                    });
                }

                // add components to root of scheme
                if (currentPathMethod.components) {
                    doc.components = this.mergeObjects(doc.components, currentPathMethod.components);
                    delete currentPathMethod.components;
                }

                const templateVariables = {
                    summary: currentPathMethod.summary,
                    action,
                    autoAlias: path.autoAliases ? '[autoAlias]' : ''
                };

                currentPathMethod.summary = Object.entries(templateVariables)
                    .reduce((previous, [k, v]) => {
                        return previous.replace(new RegExp(`{{${k}}}`, 'g'), v);
                    }, this.settings.summaryTemplate)
                    .trim();

                currentPath[method] = currentPathMethod as (typeof currentPath)[OA3_1.HttpMethods];
                doc.paths[openapiPath] = currentPath;
            }
        }
    }
    addTagToDoc(doc: OA3_1.Document, tagName) {
        const exist = (doc.tags || []).some((v) => v.name === tagName);
        if (!exist && tagName) {
            (doc.tags || []).push({
                name: tagName
            });
        }
    }
    /**
     * Convert moleculer params to openapi query params
     * @param obj
     * @param exclude{Array<string>}
     * @returns {[]}
     */
    moleculerParamsToQuery(obj: ValidationRule | ValidationSchema, exclude: Array<string> = []): Array<OA3_1.ParameterObject> {
        if (!this.isValidationSchema(obj)) {
            throw new Error('not handled');
        }

        const rootRules = this.getSchemaObjectFromSchema(obj);

        return Object.entries(rootRules)
            .filter(([name, rule]) => !exclude.includes(name) && rule)
            .map(([name, schema]: [string, OpenAPIV3.SchemaObject]) => {
                const systemParams = this.extractSystemParams(schema as Record<string, unknown>);

                this.removeExtensions(schema);

                const returnedObject: OA3_1.ParameterObject = {
                    in: 'query',
                    name,
                    description: systemParams.description,
                    required: systemParams.optional === true,
                    schema
                };

                const subSchemas = schema?.oneOf as Array<OpenAPIV3.SchemaObject> | undefined;
                //hard to handle this part ... because this can be really different types
                if (subSchemas?.length) {
                    // type + array of type
                    const arraySchema = subSchemas.find((schema) => schema.type == 'array') as OpenAPIV3.ArraySchemaObject | undefined;

                    let required = returnedObject.required;
                    subSchemas.forEach((schema) => {
                        const systemParams = this.extractSystemParams(schema as Record<string, unknown>);
                        required = required || systemParams.optional !== true;
                        this.removeExtensions(schema);
                    });
                    returnedObject.required = required;

                    // if it's array of a type + same types rules
                    if (arraySchema) {
                        return {
                            ...returnedObject,
                            schema: arraySchema
                        };
                    }
                }
                return returnedObject;
            });
    }
    extractSystemParams(obj: Record<string, unknown> = {}): tSystemParams {
        return {
            optional: obj?.[EOAExtensions.optional] as boolean,
            description: obj?.[EOAExtensions.description] as string
        };
    }
    createSchemaFromParams(
        doc: OA3_1.Document,
        rootSchemeName: string,
        obj: ValidationRule | ValidationSchema,
        exclude: Array<string> = [],
        parentNode: { default?: any } = {}
    ) {
        const rootRules = this.isValidationSchema(obj)
            ? this.getSchemaObjectFromSchema(obj)
            : { [rootSchemeName]: this.getSchemaObjectFromRule(obj) };

        const rules = Object.fromEntries(Object.entries(rootRules).filter(([name, rule]) => !exclude.includes(name) && rule));

        this._createSchemaComponentFromObject(doc, rootSchemeName, rules, parentNode);
    }

    private removeExtensions(rule: OA3_1.SchemaObject): void {
        Object.values(EOAExtensions).forEach((extension) => {
            delete rule[extension];
        });
    }

    _createSchemaPartFromRule(
        doc: OA3_1.Document,
        nextSchemeName: string,
        rule: OA3_1.SchemaObject
    ): OA3_1.SchemaObject | OA3_1.ReferenceObject {
        const systemParams: tSystemParams = this.extractSystemParams(rule as Record<string, unknown>);

        rule.description = systemParams.description;
        //delete extensions
        this.removeExtensions(rule);

        if (rule.type == 'object' && rule.properties) {
            // create child schema per object
            this._createSchemaComponentFromObject(doc, nextSchemeName, rule.properties, { default: rule.default });
            return {
                description: rule.description,
                $ref: `#/components/schemas/${nextSchemeName}`
            };
        }

        if (rule.type === 'array') {
            return {
                ...rule,
                items: rule.items ? this._createSchemaPartFromRule(doc, nextSchemeName, rule.items as OA3_1.SchemaObject) : undefined
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
                    this._createSchemaPartFromRule(doc, schemeName, schema);

                    return {
                        $ref: `#/components/schemas/${schemeName}`
                    };
                });
            });
        }

        return rule;
    }
    /**
     * Convert moleculer params to openapi definitions(components schemas)
     * @param doc
     * @param schemeName
     * @param obj
     * @param customProperties
     */
    _createSchemaComponentFromObject(
        doc: OA3_1.Document,
        schemeName: string,
        obj: Record<string, OA3_1.SchemaObject> | { [ROOT_PROPERTY]: OA3_1.SchemaObject },
        customProperties: { default?: any } = {}
    ) {
        //TODO not tested
        if (obj[ROOT_PROPERTY]) {
            const rootObj = obj[ROOT_PROPERTY];
            const systemParams: tSystemParams = this.extractSystemParams(rootObj as Record<string, unknown>);

            const schema: OA3_1.SchemaObject = {
                ...rootObj
            };

            if (systemParams.description) {
                schema.description = systemParams.description;
            }

            doc.components.schemas[schemeName] = schema;
            return;
        }

        const required: Array<string> = [];
        const properties = Object.fromEntries(
            Object.entries(obj).map(([fieldName, rule]) => {
                const nextSchemeName = `${schemeName}.${fieldName}`;
                if (rule[EOAExtensions.optional] != true) {
                    required.push(fieldName);
                }

                return [fieldName, this._createSchemaPartFromRule(doc, nextSchemeName, rule)];
            })
        );

        // Schema model
        // https://github.com/OAI/OpenAPI-Specification/blob/b748a884fa4571ffb6dd6ed9a4d20e38e41a878c/versions/3.0.3.md#models-with-polymorphism-support
        doc.components.schemas[schemeName] = {
            type: 'object',
            properties,
            required: required.length > 0 ? required : undefined,
            default: customProperties.default
        };
    }
    getTypeAndExample(node = {}) {
        return this.getSchemaObjectFromSchema({ [ROOT_PROPERTY]: node });
    }
    mergePathItemObjects(orig = {}, toMerge = {}) {
        for (const key in toMerge) {
            // merge components
            if (key === 'components') {
                orig[key] = this.mergeObjects(orig[key], toMerge[key]);
                continue;
            }

            // merge responses
            if (key === 'responses') {
                orig[key] = this.mergeObjects(orig[key], toMerge[key]);

                // iterate codes
                for (const code in orig[key]) {
                    // remove $ref if exist content
                    if (orig[key][code] && orig[key][code].content) {
                        delete orig[key][code].$ref;
                    }
                }

                continue;
            }

            // replace non components attributes
            orig[key] = toMerge[key];
        }
        return orig;
    }
    mergeObjects(orig = {}, toMerge = {}) {
        for (const key in toMerge) {
            orig[key] = {
                ...(orig[key] || {}),
                ...toMerge[key]
            };
        }
        return orig;
    }
    /**
     * replace // to /
     * @param path
     * @returns {string}
     */
    normalizePath(path = '') {
        path = path.replace(/\/{2,}/g, '/');
        return path;
    }
    /**
     * convert /:table to /{table}
     * @param url
     * @returns {string|string}
     */
    formatParamUrl(url = ''): string {
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
    /**
     * extract params from /{table}
     * @param url
     * @returns {[]}
     */
    extractParamsFromUrl(url = ''): [Array<OA3_1.ParameterObject>, Array<string>] {
        const params: Array<OA3_1.ParameterObject> = [];
        const added: Array<string> = [];

        const matches = [...this.matchAll(/{(\w+)}/g, url)] as Array<string>;
        for (const match of matches) {
            const [, name] = match;

            added.push(name);
            params.push({ name, in: 'path', required: true, schema: { type: 'string' } });
        }

        return [params, added];
    }
    /**
     * matchAll polyfill for es8 and older
     * @param regexPattern
     * @param sourceString
     * @returns {[]}
     */
    matchAll(regexPattern, sourceString): Array<string> {
        const output: Array<string> = [];
        let match;
        // make sure the pattern has the global flag
        const regexPatternWithGlobal = RegExp(regexPattern, 'g');
        while ((match = regexPatternWithGlobal.exec(sourceString)) !== null) {
            // get rid of the string copy
            delete match.input;
            // store the match data
            output.push(match);
        }
        return output;
    }
    getFileContentRequestBodyScheme(openapiPath, method, actionType): OA3_1.RequestBodyObject {
        return {
            content: {
                ...(actionType === 'multipart'
                    ? {
                          'multipart/form-data': {
                              schema: {
                                  type: 'object',
                                  properties: {
                                      file: {
                                          type: 'array',
                                          items: {
                                              type: 'string',
                                              format: 'binary'
                                          }
                                      },
                                      someField: {
                                          type: 'string'
                                      }
                                  }
                              }
                          }
                      }
                    : {
                          'application/octet-stream': {
                              schema: {
                                  type: 'string',
                                  format: 'binary'
                              }
                          }
                      })
            }
        };
    }
    getSchemaObjectFromSchema(schema: ValidationSchema): Record<string, OA3_1.SchemaObject> {
        if (schema.$$root !== true) {
            return Object.fromEntries(
                Object.entries(schema)
                    .filter(([k]) => !k.startsWith('$$'))
                    .map(([k, v]) => [k, this.getSchemaObjectFromRule(v, undefined, schema)])
            );
        }

        delete schema.$$root;

        return { [ROOT_PROPERTY]: this.getSchemaObjectFromRule(schema as ValidationRule) };
    }
    getSchemaObjectFromRule(
        pRule: ValidationRule,
        parentProperties?: Partial<ValidationRuleObject>,
        parentSchema?: ObjectRules
    ): OA3_1.SchemaObject | undefined {
        if (!this.validator || !this.mappers?.string) {
            throw new Error(`bad initialisation . validator ? ${!!this.validator} | string mapper ${!!this.mappers?.string}`);
        }

        //extract known params extensions
        const extensions = (
            [
                {
                    property: '$$t',
                    extension: EOAExtensions.description
                }
            ] as Array<{ property: string; extension: EOAExtensions }>
        ).map(({ property, extension }) => {
            const currentRule = pRule as Record<string, string>;
            const value = (pRule as Record<string, string>)?.[property];

            delete currentRule?.[property];

            return [extension, value];
        });

        const baseRule = this.validator.getRuleFromSchema(pRule)?.schema as ValidationRuleObject;
        const rule = {
            ...parentProperties,
            ...baseRule
        };

        const typeMapper: (rule: unknown, parentSchema: unknown) => OA3_1.SchemaObject =
            this.mappers[rule.type as ValidationRuleName] || this.mappers.string; // Utilise le mapper pour string par défaut
        const schema = typeMapper(rule, parentSchema);

        if (!schema) {
            return undefined;
        }

        if (rule.optional) {
            schema[EOAExtensions.optional] = true;
        }

        extensions.forEach(([k, v]) => {
            schema[k] = v;
        });

        return schema;
    }

    public async generateSchema(ctx: Context<OA_GENERATE_DOCS_INPUT>): Promise<OA_GENERATE_DOCS_OUTPUT> {
        const doc: OA3_1.Document = JSON.parse(JSON.stringify(this.settings.openapi));

        const nodes = await this.fetchServicesWithActions(ctx);

        let routes: Record<string, { openapi: any }> = await this.collectRoutes(ctx, nodes);

        this.attachParamsAndOpenapiFromEveryActionToRoutes(routes, nodes);

        routes = Object.fromEntries(Object.entries(routes).filter(([name, r]) => r.openapi !== false));

        this.attachRoutesToDoc(routes, doc);

        return doc;
    }

    public started() {
        this.logger.info(`📜 OpenAPI Docs server is available at ${this.settings.uiPath}`);
    }
}
