import type { Context, LoggerInstance, Service, ServiceBroker } from 'moleculer';
import Moleculer from 'moleculer';
import type { OpenAPIV3_1 as OA3_1 } from 'openapi-types';
import type { OpenApiMixinSettings, ValidatorType } from './types/types.js';
import { ApiSettingsSchemaOpenApi } from './types/types.js';
import { UNRESOLVED_ACTION_NAME } from './constants.js';
import { moleculerOpenAPITypes } from './moleculer.js';
import { DEFAULT_CONTENT_TYPE, openApiVersionsSupported } from './commons.js';
import { ApiSettingsSchema } from 'moleculer-web';
import { MoleculerWebRoutesParser } from './MoleculerWebRoutesParser/MoleculerWebRoutesParser.js';
import { OpenApiGenerator } from './OpenApiGenerator.js';
import { Alias } from './objects/Alias.js';
import MoleculerError = Moleculer.Errors.MoleculerError;

export const defaultSettings: OpenApiMixinSettings = {
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
    returnAssetsAsStream: true,
    defaultResponseContentType: DEFAULT_CONTENT_TYPE
};

export type OA_GENERATE_DOCS_INPUT = {
    version?: openApiVersionsSupported;
};
export type OA_GENERATE_DOCS_OUTPUT = OA3_1.Document;

export class MoleculerOpenAPIGenerator {
    private readonly broker: ServiceBroker;

    private readonly settings: OpenApiMixinSettings;
    private readonly logger: LoggerInstance;
    private validator: ValidatorType;

    constructor(broker: ServiceBroker, settings: OpenApiMixinSettings) {
        this.broker = broker;
        const validator = this.broker.validator as unknown as { validator: any };
        if (validator.constructor.name != 'FastestValidator' && validator.validator) {
            throw new Error('only fastest validator is allowed');
        }

        this.logger = this.broker.getLogger('moleculer-openapi-generator');
        this.validator = validator.validator;

        this.settings = {
            ...defaultSettings,
            ...settings
        };
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

    private async getAliases(ctx: Context, services: Array<Service<ApiSettingsSchema>>): Promise<Array<Alias>> {
        //only moleculer-web service
        const apiServices = services.filter((service) => service?.settings?.routes) as Array<
            Service<ApiSettingsSchemaOpenApi & Partial<OpenApiMixinSettings>>
        >;

        if (!apiServices?.length) {
            throw new MoleculerError('fail to identify service hosting moleculer-web');
        }

        const routesParser = new MoleculerWebRoutesParser(this.logger);

        try {
            return (
                await Promise.all(
                    apiServices.map(async (svc) => await routesParser.parse(ctx, svc, this.settings.skipUnresolvedActions, services))
                )
            ).flat();
        } catch (e) {
            this.logger.error(e);
            debugger;
        }
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

            if (typeof action !== 'string') {
                return;
            }

            // support actions like multipart:import.proceedFile
            if (action?.includes(':')) {
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
    // routesToOpenApi(routes: Array<foundRouteWithFilledAction>, doc: OA3_1.Document) {
    //     const cachePathActions = new Map<string, string>();
    //
    //     routes.forEach((route) => {
    //         // convert /:table to /{table}
    //         const openapiPath: string = this.formatParamUrl(this.normalizePath(route.path));
    //         const currentPath: OA3_1.PathItemObject = doc.paths[openapiPath] ?? {};
    //
    //         const isJokerMethod = route.method === JOKER_METHOD;
    //
    //         const methods: Array<HTTP_METHODS> = isJokerMethod ? HTTP_METHODS_ARRAY : [route.method as HTTP_METHODS];
    //         const { parameters, requestBody } = this.extractParameters(route) ?? {};
    //
    //         if (isJokerMethod) {
    //             // TODO set parameters here
    //             currentPath.description = route.openapi?.description;
    //             // currentPath.parameters =
    //         }
    //
    //         methods.forEach((method) => {
    //             const cacheKeyName = `${currentPath}.${method}`;
    //
    //             if (currentPath[method]) {
    //                 const actionFromCache = cachePathActions.get(cacheKeyName);
    //                 this.logger.warn(
    //                     `${method.toUpperCase()} ${currentPath} is already register by action ${actionFromCache ?? '<unamedAction>'} skip`
    //                 );
    //                 return;
    //             }
    //
    //             cachePathActions.set(cacheKeyName, route.action?.name);
    //
    //             const openApiMethod: OA3_1.OperationObject = {
    //                 tags: route.openapi.tags,
    //                 responses: route.openapi.responses
    //                 // parameters: this.getParameterOpenapi => get the openapi
    //             };
    //
    //             if (!isJokerMethod) {
    //                 openApiMethod.description = route.openapi.description;
    //             }
    //
    //             (currentPath[method] as OA3_1.OperationObject) = openApiMethod;
    //         });
    //
    //         console.log(openapiPath);
    //
    //         // const [queryParams, addedQueryParams] = this.extractParamsFromUrl(openapiPath);
    //         //
    //         // const currentPath = doc.paths[openapiPath] || {};
    //         //
    //         // if (currentPath[method]) {
    //         //     continue;
    //         // }
    //         //
    //         // // Path Item Object
    //         // // https://github.com/OAI/OpenAPI-Specification/blob/b748a884fa4571ffb6dd6ed9a4d20e38e41a878c/versions/3.0.3.md#path-item-object-example
    //         // let currentPathMethod: (typeof currentPath)[OA3_1.HttpMethods] & { components?: OA3_1.ComponentsObject } = {
    //         //     summary: '',
    //         //     tags: [service],
    //         //     // rawParams: params,
    //         //     parameters: [...queryParams],
    //         //     responses: {
    //         //         // attach common responses
    //         //         ...this.settings.commonPathItemObjectResponses
    //         //     }
    //         // };
    //         //
    //         // const schemaName = action;
    //         // if (method === 'get' || method === 'delete') {
    //         //     currentPathMethod.parameters.push(...this.moleculerParamsToQuery(params, addedQueryParams));
    //         // } else {
    //         //     if (openapi?.requestBody) {
    //         //         currentPathMethod.requestBody = openapi.requestBody;
    //         //     } else {
    //         //         this.createSchemaFromParams(doc, schemaName, params, addedQueryParams);
    //         //         currentPathMethod.requestBody = {
    //         //             content: {
    //         //                 'application/json': {
    //         //                     schema: {
    //         //                         $ref: `#/components/schemas/${schemaName}`
    //         //                     }
    //         //                 }
    //         //             }
    //         //         };
    //         //     }
    //         // }
    //         //
    //         // if (this.settings.requestBodyAndResponseBodyAreSameOnMethods.includes(method)) {
    //         //     currentPathMethod.responses[200] = {
    //         //         description: this.settings.requestBodyAndResponseBodyAreSameDescription,
    //         //         ...currentPathMethod.requestBody
    //         //     };
    //         // }
    //         //
    //         // // if multipart/stream convert fo formData/binary
    //         // if (actionType === 'multipart' || actionType === 'stream') {
    //         //     currentPathMethod = {
    //         //         ...currentPathMethod,
    //         //         parameters: [...queryParams],
    //         //         requestBody: this.getFileContentRequestBodyScheme(openapiPath, method, actionType) as OA3_1.RequestBodyObject &
    //         //             OpenAPIV3.RequestBodyObject
    //         //     };
    //         // }
    //         //
    //         // // merge values from action
    //         // // @ts-ignore
    //         // currentPathMethod = this.mergePathItemObjects(currentPathMethod, openapi);
    //         //
    //         // // merge values which exist in web-api service
    //         // // in routes or custom function
    //         // // @ts-ignore
    //         // currentPathMethod = this.mergePathItemObjects(currentPathMethod, path.openapi);
    //         //
    //         // // add tags to root of scheme
    //         // if (currentPathMethod.tags) {
    //         //     currentPathMethod.tags.forEach((name) => {
    //         //         this.addTagToDoc(doc, name);
    //         //     });
    //         // }
    //         //
    //         // // add components to root of scheme
    //         // if (currentPathMethod.components) {
    //         //     doc.components = this.mergeObjects(doc.components, currentPathMethod.components);
    //         //     delete currentPathMethod.components;
    //         // }
    //         //
    //         // const templateVariables = {
    //         //     summary: currentPathMethod.summary,
    //         //     action,
    //         //     autoAlias: path.autoAliases ? '[autoAlias]' : ''
    //         // };
    //         //
    //         // currentPathMethod.summary = Object.entries(templateVariables)
    //         //     .reduce((previous, [k, v]) => {
    //         //         return previous.replace(new RegExp(`{{${k}}}`, 'g'), v);
    //         //     }, this.settings.summaryTemplate)
    //         //     .trim();
    //         //
    //         // currentPath[method] = currentPathMethod as (typeof currentPath)[OA3_1.HttpMethods];
    //         // doc.paths[openapiPath] = currentPath;
    //     });
    //
    //     return;
    //     // route to openapi paths
    //     // for (const action in routes) {
    //     //     const { paths, params, actionType, openapi = {} } = routes[action];
    //     //     const service = action.split('.').slice(0, -1).join('.');
    //     //
    //     //     // this.addTagToDoc(doc, service);
    //     //
    //     //     for (const path of paths) {
    //     //         // parse method and path from: POST /api/table
    //     //         const [tmpMethod, subPath] = path.alias.split(' ');
    //     //         const method = tmpMethod.toLowerCase() as OA3_1.HttpMethods;
    //     //
    //     //         // convert /:table to /{table}
    //     //         const openapiPath: string = this.formatParamUrl(this.normalizePath(`${path.base}/${subPath}`));
    //     //
    //     //         const [queryParams, addedQueryParams] = this.extractParamsFromUrl(openapiPath);
    //     //
    //     //         const currentPath = doc.paths[openapiPath] || {};
    //     //
    //     //         if (currentPath[method]) {
    //     //             continue;
    //     //         }
    //     //
    //     //         // Path Item Object
    //     //         // https://github.com/OAI/OpenAPI-Specification/blob/b748a884fa4571ffb6dd6ed9a4d20e38e41a878c/versions/3.0.3.md#path-item-object-example
    //     //         let currentPathMethod: (typeof currentPath)[OA3_1.HttpMethods] & { components?: OA3_1.ComponentsObject } = {
    //     //             summary: '',
    //     //             tags: [service],
    //     //             // rawParams: params,
    //     //             parameters: [...queryParams],
    //     //             responses: {
    //     //                 // attach common responses
    //     //                 ...this.settings.commonPathItemObjectResponses
    //     //             }
    //     //         };
    //     //
    //     //         const schemaName = action;
    //     //         if (method === 'get' || method === 'delete') {
    //     //             currentPathMethod.parameters.push(...this.moleculerParamsToQuery(params, addedQueryParams));
    //     //         } else {
    //     //             if (openapi?.requestBody) {
    //     //                 currentPathMethod.requestBody = openapi.requestBody;
    //     //             } else {
    //     //                 this.createSchemaFromParams(doc, schemaName, params, addedQueryParams);
    //     //                 currentPathMethod.requestBody = {
    //     //                     content: {
    //     //                         'application/json': {
    //     //                             schema: {
    //     //                                 $ref: `#/components/schemas/${schemaName}`
    //     //                             }
    //     //                         }
    //     //                     }
    //     //                 };
    //     //             }
    //     //         }
    //     //
    //     //         if (this.settings.requestBodyAndResponseBodyAreSameOnMethods.includes(method)) {
    //     //             currentPathMethod.responses[200] = {
    //     //                 description: this.settings.requestBodyAndResponseBodyAreSameDescription,
    //     //                 ...currentPathMethod.requestBody
    //     //             };
    //     //         }
    //     //
    //     //         // if multipart/stream convert fo formData/binary
    //     //         if (actionType === 'multipart' || actionType === 'stream') {
    //     //             currentPathMethod = {
    //     //                 ...currentPathMethod,
    //     //                 parameters: [...queryParams],
    //     //                 requestBody: this.getFileContentRequestBodyScheme(openapiPath, method, actionType) as OA3_1.RequestBodyObject &
    //     //                     OpenAPIV3.RequestBodyObject
    //     //             };
    //     //         }
    //     //
    //     //         // merge values from action
    //     //         // @ts-ignore
    //     //         currentPathMethod = this.mergePathItemObjects(currentPathMethod, openapi);
    //     //
    //     //         // merge values which exist in web-api service
    //     //         // in routes or custom function
    //     //         // @ts-ignore
    //     //         currentPathMethod = this.mergePathItemObjects(currentPathMethod, path.openapi);
    //     //
    //     //         // add tags to root of scheme
    //     //         if (currentPathMethod.tags) {
    //     //             currentPathMethod.tags.forEach((name) => {
    //     //                 this.addTagToDoc(doc, name);
    //     //             });
    //     //         }
    //     //
    //     //         // add components to root of scheme
    //     //         if (currentPathMethod.components) {
    //     //             doc.components = this.mergeObjects(doc.components, currentPathMethod.components);
    //     //             delete currentPathMethod.components;
    //     //         }
    //     //
    //     //         const templateVariables = {
    //     //             summary: currentPathMethod.summary,
    //     //             action,
    //     //             autoAlias: path.autoAliases ? '[autoAlias]' : ''
    //     //         };
    //     //
    //     //         currentPathMethod.summary = Object.entries(templateVariables)
    //     //             .reduce((previous, [k, v]) => {
    //     //                 return previous.replace(new RegExp(`{{${k}}}`, 'g'), v);
    //     //             }, this.settings.summaryTemplate)
    //     //             .trim();
    //     //
    //     //         currentPath[method] = currentPathMethod as (typeof currentPath)[OA3_1.HttpMethods];
    //     //         doc.paths[openapiPath] = currentPath;
    //     //     }
    //     // }
    // }
    addTagToDoc(doc: OA3_1.Document, tagName: string) {
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
    // moleculerParamsToQuery(obj: ValidationRule | ValidationSchema, exclude: Array<string> = []): Array<OA3_1.ParameterObject> {
    //     if (!this.isValidationSchema(obj)) {
    //         throw new Error('not handled');
    //     }
    //
    //     const rootRules = this.getSchemaObjectFromSchema(obj);
    //
    //     return Object.entries(rootRules)
    //         .filter(([name, rule]) => !exclude.includes(name) && rule)
    //         .map(([name, schema]: [string, OpenAPIV3.SchemaObject]) => {
    //             const systemParams = this.extractSystemParams(schema as Record<string, unknown>);
    //
    //             this.removeExtensions(schema);
    //
    //             const returnedObject: OA3_1.ParameterObject = {
    //                 in: 'query',
    //                 name,
    //                 description: systemParams.description,
    //                 required: systemParams.optional === true,
    //                 schema
    //             };
    //
    //             const subSchemas = schema?.oneOf as Array<OpenAPIV3.SchemaObject> | undefined;
    //             //hard to handle this part ... because this can be really different types
    //             if (subSchemas?.length) {
    //                 // type + array of type
    //                 const arraySchema = subSchemas.find((schema) => schema.type == 'array') as OpenAPIV3.ArraySchemaObject | undefined;
    //
    //                 let required = returnedObject.required;
    //                 subSchemas.forEach((schema) => {
    //                     const systemParams = this.extractSystemParams(schema as Record<string, unknown>);
    //                     required = required || systemParams.optional !== true;
    //                     this.removeExtensions(schema);
    //                 });
    //                 returnedObject.required = required;
    //
    //                 // if it's array of a type + same types rules
    //                 if (arraySchema) {
    //                     return {
    //                         ...returnedObject,
    //                         schema: arraySchema
    //                     };
    //                 }
    //             }
    //             return returnedObject;
    //         });
    // }
    //
    // getTypeAndExample(node = {}) {
    //     return this.getSchemaObjectFromSchema({ [ROOT_PROPERTY]: node });
    // }
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

    public async generateSchema(ctx: Context<OA_GENERATE_DOCS_INPUT>): Promise<OA_GENERATE_DOCS_OUTPUT> {
        const doc: OA3_1.Document = JSON.parse(JSON.stringify(this.settings.openapi));

        const services = await this.fetchServicesWithActions(ctx);

        let aliases = await this.getAliases(ctx, services);

        // this.attachParamsAndOpenapiFromEveryActionToRoutes(routes, services);
        //
        // routes = Object.fromEntries(Object.entries(routes).filter(([name, r]) => r.openapi !== false));
        //
        return new OpenApiGenerator(this.logger, this.validator, JSON.parse(JSON.stringify(this.settings.openapi))).generate(aliases);
        // this.routesToOpenApi(routes, doc);
        //
        // return doc;
    }

    public started() {
        this.logger.info(`📜 OpenAPI Docs server is available at ${this.settings.uiPath}`);
    }
}
