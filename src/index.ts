import { getAbsoluteFSPath } from 'swagger-ui-dist';
import type { OpenAPIV3_1 as OA } from 'openapi-types';
import fs from 'fs';
import { ApiRouteSchema } from 'moleculer-web';
import type { Context, Service } from 'moleculer';
import type { ValidationRule, ValidationRuleName, ValidationRuleObject, ValidationSchema } from 'fastest-validator';
import { ObjectRules, tSystemParams, ValidatorType } from './types.js';
import { getFastestValidatorMappers } from './mappers.js';
import { ROOT_PROPERTY, UNRESOLVED_ACTION_NAME } from './constants.js';

const swaggerUiAssetPath = getAbsoluteFSPath();

const isValidationSchema = (schema: any): schema is ValidationSchema => schema?.$$root !== true;

enum EOAExtensions {
    optional = 'x-fastest-optional',
    description = 'x-fastest-description'
}

export type openApiMixinSettings = {
    onlyLocal: boolean;
    schemaPath: string;
    uiPath: string;
    assetsPath: string;
    commonPathItemObjectResponses: OA.ResponsesObject;
    requestBodyAndResponseBodyAreSameOnMethods: Array<OA.HttpMethods>;
    requestBodyAndResponseBodyAreSameDescription: string;
    openapi: OA.Document & { version: openApiVersionsSupported };
    /**
     * allow to skip unresolved actions
     */
    skipUnresolvedActions: boolean;
    /**
     * allow to clear the cache when the routes are reloaded (else, they will be cleared when cache expire)
     * this doesn't work without cacheOpenApi = true
     */
    clearCacheOnRoutesGenerated: boolean;
    /**
     * add the openAPI to cache
     */
    cacheOpenApi: boolean;
};
type openApiService = Service<openApiMixinSettings> & { validator?: ValidatorType };

export type openApiVersionsSupported = '3.1';

export type OA_GENERATE_DOCS_INPUT = {
    version?: openApiVersionsSupported;
};
export type OA_GENERATE_DOCS_OUTPUT = OA.Document;

/*
 * Inspired by https://github.com/grinat/moleculer-auto-openapi
 */
export default {
    name: `openapi`,
    settings: {
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
                schemas: {
                    // Standard moleculer schemas
                    DbMixinList: {
                        type: 'object',
                        properties: {
                            rows: {
                                type: 'array',
                                items: {
                                    type: 'object'
                                }
                            },
                            totalCount: {
                                type: 'number'
                            }
                        }
                    },
                    DbMixinFindList: {
                        type: 'array',
                        items: {
                            type: 'object'
                        }
                    },
                    Item: {
                        type: 'object'
                    },
                    // Standard moleculer responses
                    Error: {
                        type: 'object',
                        properties: {
                            name: {
                                examples: ['InternalServerError'],
                                type: 'string',
                                description: 'The name of the error'
                            },
                            message: {
                                examples: ['Example'],
                                type: 'string',
                                description: 'an helping message'
                            },
                            code: {
                                type: 'number',
                                description: 'the status code of the error (can be different of the HTTP status code)'
                            },
                            type: {
                                type: 'string',
                                description: 'additional information for the error'
                            },
                            data: {
                                type: 'object'
                            }
                        },
                        required: ['name', 'message', 'code']
                    }
                },
                securitySchemes: {},
                responses: {
                    ServerError: {
                        // extends: 'Error',
                        description: 'Server errors: 500, 501, 400, 404 and etc...',
                        content: {
                            'application/json': {
                                schema: {
                                    allOf: [
                                        { $ref: '#/components/schemas/Error' },
                                        {
                                            examples: [
                                                {
                                                    name: 'InternalServerError',
                                                    message: 'Internal Server Error',
                                                    code: 500
                                                }
                                            ]
                                        }
                                    ]
                                }
                            }
                        }
                    },
                    UnauthorizedError: {
                        description: 'Need auth',
                        content: {
                            'application/json': {
                                schema: {
                                    allOf: [
                                        { $ref: '#/components/schemas/Error' },
                                        {
                                            type: 'object',
                                            examples: [
                                                {
                                                    name: 'UnAuthorizedError',
                                                    message: 'Unauthorized',
                                                    code: 401
                                                }
                                            ]
                                        }
                                    ]
                                }
                            }
                        }
                    },
                    ValidationError: {
                        description: 'Fields invalid',
                        content: {
                            'application/json': {
                                schema: {
                                    allOf: [
                                        { $ref: '#/components/schemas/Error' },
                                        {
                                            type: 'object',
                                            examples: [
                                                {
                                                    name: 'MoleculerClientError',
                                                    message: 'Error message',
                                                    code: 422,
                                                    data: [
                                                        { name: 'fieldName', message: 'Field invalid' },
                                                        { name: 'arrayField[0].fieldName', message: 'Whats wrong' },
                                                        { name: 'object.fieldName', message: 'Whats wrong' }
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                }
                            }
                        }
                    },
                    ReturnedData: {
                        description: '',
                        content: {
                            'application/json': {
                                schema: {
                                    oneOf: [
                                        {
                                            $ref: '#/components/schemas/DbMixinList'
                                        },
                                        {
                                            $ref: '#/components/schemas/DbMixinFindList'
                                        },
                                        {
                                            $ref: '#/components/schemas/Item'
                                        }
                                    ]
                                }
                            }
                        }
                    },
                    FileNotExist: {
                        description: 'File not exist',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    examples: [
                                        {
                                            name: 'MoleculerClientError',
                                            message: 'File missing in the request',
                                            code: 400
                                        }
                                    ]
                                }
                            }
                        }
                    },
                    FileTooBig: {
                        description: 'File too big',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    examples: [
                                        {
                                            name: 'PayloadTooLarge',
                                            message: 'Payload too large',
                                            code: 413,
                                            type: 'PAYLOAD_TOO_LARGE',
                                            data: {
                                                fieldname: 'file',
                                                filename: '4b2005c0b8.png',
                                                encoding: '7bit',
                                                mimetype: 'image/png'
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    events: {
        async '$api.aliases.regenerated'(this: openApiService) {
            const generateDocsAction = 'generateDocs';
            if (this.settings.clearCacheOnRoutesGenerated && this.broker.cacher && this.actions[generateDocsAction]) {
                const cacheKey = this.broker.cacher.getCacheKey(`${this.fullName}.generateDocs`, {}, {}, []);
                await this.broker.cacher.clean(cacheKey);
            }
        }
    },
    actions: {
        generateDocs: {
            cache: {
                enabled(this: openApiService) {
                    return this.setting.cacheOpenApi;
                },
                ttl: 600
            },
            openapi: {
                // you can declare custom Path Item Object
                // which override autogenerated object from params
                // https://github.com/OAI/OpenAPI-Specification/blob/b748a884fa4571ffb6dd6ed9a4d20e38e41a878c/versions/3.0.3.md#path-item-object-example
                summary: 'OpenAPI schema url',

                // you custom response
                // https://github.com/OAI/OpenAPI-Specification/blob/b748a884fa4571ffb6dd6ed9a4d20e38e41a878c/versions/3.0.3.md#response-object-examples
                responses: {
                    '200': {
                        description: '',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/OpenAPIModel'
                                }
                            }
                        }
                    }
                },

                // you custom tag
                // https://github.com/OAI/OpenAPI-Specification/blob/b748a884fa4571ffb6dd6ed9a4d20e38e41a878c/versions/3.0.3.md#fixed-fields-8
                tags: ['openapi'],

                // components which attached to root of docx
                // https://github.com/OAI/OpenAPI-Specification/blob/b748a884fa4571ffb6dd6ed9a4d20e38e41a878c/versions/3.0.3.md#components-object
                components: {
                    schemas: {
                        // you custom schema
                        // https://github.com/OAI/OpenAPI-Specification/blob/b748a884fa4571ffb6dd6ed9a4d20e38e41a878c/versions/3.0.3.md#models-with-polymorphism-support
                        OpenAPIModel: {
                            type: 'object',
                            properties: {
                                openapi: {
                                    examples: ['3.0.3'],
                                    type: 'string',
                                    description: 'OpenAPI version'
                                },
                                info: {
                                    type: 'object',
                                    properties: {
                                        description: {
                                            type: 'string'
                                        }
                                    }
                                },
                                tags: {
                                    type: 'array',
                                    items: {
                                        type: 'string'
                                    }
                                }
                            },
                            required: ['openapi']
                        }
                    }
                }
            },
            handler(this: openApiService, ctx: Context<OA_GENERATE_DOCS_INPUT>): Promise<OA_GENERATE_DOCS_OUTPUT> {
                return this.generateSchema(ctx);
            }
        },
        assets: {
            openapi: {
                summary: 'OpenAPI assets',
                description: 'Return files from swagger-ui-dist folder'
            },
            params: {
                file: {
                    type: 'enum',
                    values: [
                        `swagger-ui.css`,
                        `swagger-ui.css.map`,
                        `swagger-ui-bundle.js`,
                        `swagger-ui-bundle.js.map`,
                        `swagger-ui-standalone-preset.js`,
                        `swagger-ui-standalone-preset.js.map`
                    ]
                }
            },
            handler(ctx: Context<{ file: string }, { $responseType: string }>) {
                if (ctx.params.file.indexOf('.css') > -1) {
                    ctx.meta.$responseType = 'text/css';
                } else if (ctx.params.file.indexOf('.js') > -1) {
                    ctx.meta.$responseType = 'text/javascript';
                } else {
                    ctx.meta.$responseType = 'application/octet-stream';
                }

                return fs.readFileSync(`${swaggerUiAssetPath}/${ctx.params.file}`);
            }
        },
        ui: {
            openapi: {
                summary: 'OpenAPI ui',
                description: 'You can provide any schema file in query param'
            },
            params: {
                url: { $$t: 'Schema url', type: 'string', optional: true }
            },
            handler(this: openApiService, ctx: Context<{ url: string }, { $responseType: string }>): string {
                ctx.meta.$responseType = 'text/html; charset=utf-8';

                return `
      <html lang="en">
        <head>
           <title>OpenAPI UI</title>
           <link rel="stylesheet" href="${this.settings.assetsPath}/swagger-ui.css"/>
           <style>
               body {
                margin: 0;
               }
            </style>
        </head>
        <body>

          <div id="swagger-ui">
            <p>Loading...</p>
            <noscript>If you see json, you need to update your dependencies</noscript>
          </div>

          <script src="${this.settings.assetsPath}/swagger-ui-bundle.js"></script>
          <script src="${this.settings.assetsPath}/swagger-ui-standalone-preset.js"></script>
          <script>
            window.onload = function() {
             SwaggerUIBundle({
               url: "${ctx.params.url || this.settings.schemaPath}",
               dom_id: '#swagger-ui',
               deepLinking: true,
               presets: [
                 SwaggerUIBundle.presets.apis,
                 SwaggerUIStandalonePreset,
               ],
               plugins: [
                 SwaggerUIBundle.plugins.DownloadUrl
               ],
               layout: "StandaloneLayout",
             });
            }
          </script>

        </body>
      </html>`;
            }
        }
    },
    methods: {
        fetchServicesWithActions(this: openApiService) {
            return this.broker.call('$node.services', {
                withActions: true,
                onlyLocal: this.settings.onlyLocal
            });
        },
        fetchAliasesForService(this: openApiService, service: string) {
            return this.broker.call(`${service}.listAliases`);
        },
        async generateSchema(this: openApiService, ctx: Context<OA_GENERATE_DOCS_INPUT>): Promise<OA_GENERATE_DOCS_OUTPUT> {
            if (!this.validator) {
                throw new Error('bad initialisation (no validator)');
            }

            const doc: OA.Document = JSON.parse(JSON.stringify(this.settings.openapi));

            const nodes = await this.fetchServicesWithActions();

            let routes: Record<string, { openapi: any }> = await this.collectRoutes(nodes);

            this.attachParamsAndOpenapiFromEveryActionToRoutes(routes, nodes);

            routes = Object.fromEntries(Object.entries(routes).filter(([name, r]) => r.openapi !== false));

            this.attachRoutesToDoc(routes, doc);

            return doc;
        },
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
        },
        async collectRoutes(nodes) {
            const routes: Record<string, ApiRouteSchema> = {};

            for (const node of nodes) {
                // find routes in web-api service
                if (node.settings && node.settings.routes) {
                    // iterate each route
                    for (const route of node.settings.routes) {
                        // map standart aliases
                        this.buildActionRouteStructFromAliases(route, routes);
                    }

                    let service = node.name;
                    // resolve paths with auto aliases
                    const hasAutoAliases = node.settings.routes.some((route) => route.autoAliases);
                    if (hasAutoAliases) {
                        // suport services that has version, like v1.api
                        if (Object.prototype.hasOwnProperty.call(node, 'version') && node.version !== undefined) {
                            service = `v${node.version}.` + service;
                        }
                        const autoAliases = await this.fetchAliasesForService(service);
                        const convertedRoute = this.convertAutoAliasesToRoute(autoAliases);
                        this.buildActionRouteStructFromAliases(convertedRoute, routes);
                    }
                }
            }

            return routes;
        },
        /**
         * @link https://github.com/moleculerjs/moleculer-web/blob/155ccf1d3cb755dafd434e84eb95e35ee324a26d/src/index.js#L229
         * @param autoAliases<Array{Object}>
         * @returns {{path: string, aliases: {}}}
         */
        convertAutoAliasesToRoute(this: openApiService, autoAliases) {
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
        },
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
        },
        attachRoutesToDoc(routes, doc: OA.Document) {
            // route to openapi paths
            for (const action in routes) {
                const { paths, params, actionType, openapi = {} } = routes[action];
                const service = action.split('.').slice(0, -1).join('.');

                // this.addTagToDoc(doc, service);

                for (const path of paths) {
                    // parse method and path from: POST /api/table
                    const [tmpMethod, subPath] = path.alias.split(' ');
                    const method = tmpMethod.toLowerCase() as OA.HttpMethods;

                    // convert /:table to /{table}
                    const openapiPath: string = this.formatParamUrl(this.normalizePath(`${path.base}/${subPath}`));

                    const [queryParams, addedQueryParams] = this.extractParamsFromUrl(openapiPath);

                    const currentPath = doc.paths[openapiPath] || {};

                    if (currentPath[method]) {
                        continue;
                    }

                    // Path Item Object
                    // https://github.com/OAI/OpenAPI-Specification/blob/b748a884fa4571ffb6dd6ed9a4d20e38e41a878c/versions/3.0.3.md#path-item-object-example
                    let currentPathMethod: (typeof currentPath)[OA.HttpMethods] & { components?: OA.ComponentsObject } = {
                        summary: '',
                        tags: [service],
                        // rawParams: params,
                        parameters: [...queryParams],
                        responses: {
                            // attach common responses
                            ...this.settings.commonPathItemObjectResponses
                        }
                    };

                    if (method === 'get' || method === 'delete') {
                        currentPathMethod.parameters.push(...this.moleculerParamsToQuery(params, addedQueryParams));
                    } else {
                        if (openapi?.requestBody) {
                            currentPathMethod.requestBody = openapi.requestBody;
                        } else {
                            const schemaName = action;
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
                            requestBody: this.getFileContentRequestBodyScheme(openapiPath, method, actionType)
                        };
                    }

                    // merge values from action
                    currentPathMethod = this.mergePathItemObjects(currentPathMethod, openapi);

                    // merge values which exist in web-api service
                    // in routes or custom function
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

                    currentPathMethod.summary = `
            ${currentPathMethod.summary}
          `.trim();

                    currentPath[method] = currentPathMethod as (typeof currentPath)[OA.HttpMethods];
                    doc.paths[openapiPath] = currentPath;
                }
            }
        },
        addTagToDoc(doc: OA.Document, tagName) {
            const exist = (doc.tags || []).some((v) => v.name === tagName);
            if (!exist && tagName) {
                (doc.tags || []).push({
                    name: tagName
                });
            }
        },
        /**
         * Convert moleculer params to openapi query params
         * @param obj
         * @param exclude{Array<string>}
         * @returns {[]}
         */
        moleculerParamsToQuery(obj = {}, exclude: Array<string> = []) {
            const out: Array<any> = [];

            for (const fieldName in obj) {
                // skip system field in validator scheme
                if (fieldName.startsWith('$$')) {
                    continue;
                }
                if (exclude.includes(fieldName)) {
                    continue;
                }

                const node = obj[fieldName];

                // array nodes
                if (Array.isArray(node) || (node.type && node.type === 'array')) {
                    const item = {
                        name: `${fieldName}[]`,
                        description: node.$$t,
                        in: 'query',
                        schema: {
                            type: 'array',
                            items: this.getTypeAndExample({
                                default: node.default ? node.default[0] : undefined,
                                enum: node.enum,
                                type: node.items
                            }),
                            unique: node.unique,
                            minItems: node.length || node.min,
                            maxItems: node.length || node.max
                        }
                    };
                    out.push(item);
                    continue;
                }

                out.push({
                    in: 'query',
                    name: fieldName,
                    description: node.$$t,
                    schema: this.getTypeAndExample(node)
                });
            }

            return out;
        },
        extractSystemParams(obj: Record<string, unknown> = {}): tSystemParams {
            return {
                description: obj?.$$t as string
            };
        },
        createSchemaFromParams(
            doc: OA.Document,
            rootSchemeName: string,
            obj: ValidationRule | ValidationSchema,
            exclude: Array<string> = [],
            parentNode: { default?: any } = {}
        ) {
            const rootRules = isValidationSchema(obj)
                ? this.getSchemaObjectFromSchema(obj)
                : { [rootSchemeName]: this.getSchemaObjectFromRule(obj) };

            const rules = Object.fromEntries(Object.entries(rootRules).filter(([name, rule]) => !exclude.includes(name) && rule));

            this._createSchemaFromParams(doc, rootSchemeName, rules, parentNode);
        },
        /**
         * Convert moleculer params to openapi definitions(components schemas)
         * @param doc
         * @param schemeName
         * @param obj
         * @param parentNode
         */
        _createSchemaFromParams(
            doc: OA.Document,
            schemeName: string,
            obj: Record<string, OA.SchemaObject> | { [ROOT_PROPERTY]: OA.SchemaObject },
            parentNode: { default?: any } = {}
        ) {
            if (obj[ROOT_PROPERTY]) {
                const rootObj = obj[ROOT_PROPERTY];
                const systemParams: tSystemParams = this.extractSystemParams(rootObj);

                const schema: OA.SchemaObject = {
                    ...rootObj
                };

                if (systemParams.description) {
                    schema.description = systemParams.description;
                }

                doc.components.schemas[schemeName] = schema;
                return;
            }

            const systemParams: tSystemParams = this.extractSystemParams(obj);

            const required: Array<string> = [];
            const properties = Object.fromEntries(
                Object.entries(obj).map(([fieldName, rule]) => {
                    const nextSchemeName = `${schemeName}.${fieldName}`;

                    if (rule[EOAExtensions.optional] != true) {
                        required.push(fieldName);
                    }

                    //delete extensions
                    Object.values(EOAExtensions).forEach((extension) => {
                        delete rule[extension];
                    });

                    if (rule.type == 'object' && rule.properties) {
                        // create child schema per object
                        this._createSchemaFromParams(doc, nextSchemeName, rule.properties);
                        return [
                            fieldName,
                            {
                                $ref: `#/components/schemas/${nextSchemeName}`
                            }
                        ];
                    }

                    if (rule.type === 'array') {
                        const isChildObject = (rule.items as OA.SchemaObject)?.type === 'object';
                        const items = isChildObject
                            ? {
                                  $ref: `#/components/schemas/${nextSchemeName}`
                              }
                            : rule.items;

                        if (isChildObject) {
                            this._createSchemaFromParams(doc, nextSchemeName, rule.items as OA.SchemaObject);
                        }

                        return [
                            fieldName,
                            {
                                ...rule,
                                items
                            }
                        ];
                    }

                    return [fieldName, rule];
                    //
                    // if (
                    //     // expand $$type: "object|optional"
                    //     node &&
                    //     node.$$type &&
                    //     node.$$type.includes('object')
                    // ) {
                    //     node = {
                    //         type: 'object',
                    //         optional: node.$$type.includes('optional'),
                    //         $$t: node.$$t || '',
                    //         props: {
                    //             ...node
                    //         }
                    //     };
                    // } else if (
                    //     // skip system field in validator scheme
                    //     fieldName.startsWith('$$')
                    // ) {
                    //     continue;
                    // }
                    //
                    // if (exclude.includes(fieldName)) {
                    //     continue;
                    // }
                    //
                    // // expand from short rule to full
                    // if (!(node && node.type)) {
                    //     node = this.expandShortDefinition(node);
                    // }
                    //
                    // // mark as required
                    // if (node.type === 'array') {
                    //     if (node.min || node.length || node.max) {
                    //         (def.required || []).push(fieldName);
                    //         def.minItems = node.length || node.min;
                    //         def.maxItems = node.length || node.max;
                    //     }
                    //     (def as unknown as OA.ArraySchemaObject).uniqueItems = node.unique;
                    // } else if (!node.optional) {
                    //     (def.required || []).push(fieldName);
                    // }
                    //
                    // // common props
                    // def.properties = def.properties || {};
                    // def.properties[fieldName] = {
                    //     description: node.$$t
                    // };
                    //
                    // if (node.type === 'object') {
                    //     def.properties[fieldName] = {
                    //         $ref: `#/components/schemas/${nextSchemeName}`
                    //     };
                    //     this.createSchemaFromParams(doc, nextSchemeName, node.props, [], node);
                    //     continue;
                    // }
                    //
                    // // array with objects
                    // if (node.type === 'array' && node.items && node.items.type === 'object') {
                    //     def.properties[fieldName] = {
                    //         ...def.properties[fieldName],
                    //         type: 'array',
                    //         default: node.default,
                    //         uniqueItems: node.unique,
                    //         minItems: node.length || node.min,
                    //         maxItems: node.length || node.max,
                    //         items: {
                    //             $ref: `#/components/schemas/${nextSchemeName}`
                    //         }
                    //     };
                    //     this.createSchemaFromParams(doc, nextSchemeName, node.items.props, [], node);
                    //     continue;
                    // }
                    //
                    // // simple array
                    // if (node.type === 'array') {
                    //     def.properties[fieldName] = {
                    //         ...def.properties[fieldName],
                    //         type: 'array',
                    //         items: this.getTypeAndExample({
                    //             default: node.default,
                    //             enum: node.enum,
                    //             type: node.items
                    //         }),
                    //         uniqueItems: node.unique,
                    //         minItems: node.length || node.min,
                    //         maxItems: node.length || node.max
                    //     };
                    //     continue;
                    // }
                    //
                    // // string/number/boolean
                    // def.properties[fieldName] = {
                    //     ...def.properties[fieldName],
                    //     ...this.getTypeAndExample(node)
                    // };
                    //
                    // if (!def.required || def.required.length === 0) {
                    //     delete def.required;
                    // }
                    //
                    // return [fieldName, 'aaaa'];
                })
            );

            // Schema model
            // https://github.com/OAI/OpenAPI-Specification/blob/b748a884fa4571ffb6dd6ed9a4d20e38e41a878c/versions/3.0.3.md#models-with-polymorphism-support
            doc.components.schemas[schemeName] = {
                type: 'object',
                properties,
                required: required.length > 0 ? required : undefined,
                description: systemParams.description,
                default: parentNode.default
            };
        },
        getTypeAndExample(node = {}) {
            return this.getSchemaObjectFromSchema({ [ROOT_PROPERTY]: node });
        },
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
        },
        mergeObjects(orig = {}, toMerge = {}) {
            for (const key in toMerge) {
                orig[key] = {
                    ...(orig[key] || {}),
                    ...toMerge[key]
                };
            }
            return orig;
        },
        /**
         * replace // to /
         * @param path
         * @returns {string}
         */
        normalizePath(path = '') {
            path = path.replace(/\/{2,}/g, '/');
            return path;
        },
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
        },
        /**
         * extract params from /{table}
         * @param url
         * @returns {[]}
         */
        extractParamsFromUrl(url = '') {
            const params: Array<OA.ParameterObject> = [];
            const added: Array<string> = [];

            const matches = [...this.matchAll(/{(\w+)}/g, url)] as Array<string>;
            for (const match of matches) {
                const [, name] = match;

                added.push(name);
                params.push({ name, in: 'path', required: true, schema: { type: 'string' } });
            }

            return [params, added];
        },
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
        },
        getFileContentRequestBodyScheme(openapiPath, method, actionType) {
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
        },
        getSchemaObjectFromSchema(schema: ValidationSchema): Record<string, OA.SchemaObject> {
            if (schema.$$root !== true) {
                return Object.fromEntries(
                    Object.entries(schema)
                        .filter(([k]) => !k.startsWith('$$'))
                        .map(([k, v]) => [k, this.getSchemaObjectFromRule(v, undefined, schema)])
                );
            }

            delete schema.$$root;

            return { [ROOT_PROPERTY]: this.getSchemaObjectFromRule(schema as ValidationRule) };
        },
        getSchemaObjectFromRule(
            this: openApiService,
            pRule: ValidationRule,
            parentProperties?: Partial<ValidationRuleObject>,
            parentSchema?: ObjectRules
        ): OA.SchemaObject | undefined {
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

            const typeMapper: (rule: unknown, parentSchema: unknown) => OA.SchemaObject =
                this.mappers[rule.type as ValidationRuleName] || this.mappers.string; // Utilise le mapper pour string par défaut
            const schema = typeMapper(rule, parentSchema);

            if (rule.optional) {
                schema[EOAExtensions.optional] = true;
            }

            extensions.forEach(([k, v]) => {
                rule[k] = v;
            });

            return schema;
        }
    },
    created() {
        const validator = this.broker.validator;
        if (validator.constructor.name != 'FastestValidator' && validator.validator) {
            throw new Error('only fastest validator is allowed');
        }

        this.validator = validator.validator;

        const defaultMappers = getFastestValidatorMappers({
            getSchemaObjectFromSchema: (...args) => this.getSchemaObjectFromSchema(...args),
            getSchemaObjectFromRule: (...args) => this.getSchemaObjectFromRule(...args)
        });

        //register mappers
        // TODO allow to pass custom mappers
        this.mappers = defaultMappers;
    },
    async started() {
        this.logger.info(`📜 OpenAPI Docs server is available at ${this.settings.uiPath}`);
    }
};
