import type { OpenAPIV3_1 as OA3_1 } from 'openapi-types';
import { ValidationRule, ValidationRuleName, ValidationRuleObject, ValidationSchema } from 'fastest-validator';
import { ROOT_PROPERTY } from './constants.js';
import { Mappers, ObjectRules, tSystemParams, ValidatorType } from './types/types.js';
import { EOAExtensions, HTTP_METHODS, HTTP_METHODS_ARRAY, JOKER_METHOD, matchAll, multiOAProperties, normalizePath } from './commons.js';
import { getFastestValidatorMappers } from './mappers.js';
import { LoggerInstance } from 'moleculer';
import { foundRouteWithFilledAction } from './MoleculerWebRoutesParser/MoleculerWebRoutesParser.js';
import path from 'path';

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
    private readonly document: OA3_1.Document;

    private readonly validator: ValidatorType;
    private readonly mappers: Mappers;

    constructor(
        private readonly logger: LoggerInstance,
        validator: ValidatorType,
        baseDocument: OA3_1.Document
    ) {
        this.validator = validator;

        this.mappers = getFastestValidatorMappers({
            getSchemaObjectFromSchema: (...args) => this.getSchemaObjectFromSchema(...args),
            getSchemaObjectFromRule: (...args) => this.getSchemaObjectFromRule(...args)
        });

        this.document = baseDocument;
    }

    generate(routes: Array<foundRouteWithFilledAction>): OA3_1.Document {
        const document: OA3_1.Document = { ...this.document };

        const cachePathActions = new Map<string, string>();

        routes.forEach((route) => {
            // convert /:table to /{table}
            const openapiPath: string = this.formatParamUrl(normalizePath(route.path));
            const currentPath: OA3_1.PathItemObject = document.paths[openapiPath] ?? {};

            // const isJokerMethod = route.method === JOKER_METHOD;
            const isJokerMethod = false;

            const methods: Array<HTTP_METHODS> = isJokerMethod ? HTTP_METHODS_ARRAY : [route.method as HTTP_METHODS];
            const { parameters, requestBody } = this.extractParameters(openapiPath, route) ?? {};

            if (isJokerMethod) {
                // TODO set parameters here
                currentPath.description = route.openapi?.description;
                currentPath.parameters = parameters;
            }

            methods.forEach((method) => {
                const cacheKeyName = `${openapiPath}.${method}`;

                if (currentPath[method]) {
                    const actionFromCache = cachePathActions.get(cacheKeyName);
                    this.logger.warn(
                        `${method.toUpperCase()} ${openapiPath} is already register by action ${actionFromCache ?? '<unamedAction>'} skip`
                    );
                    return;
                }

                cachePathActions.set(cacheKeyName, route.action?.name);

                const openApiMethod: OA3_1.OperationObject = {
                    tags: route.openapi?.tags,
                    responses: route.openapi?.responses,
                    parameters
                };

                if (!isJokerMethod) {
                    openApiMethod.description = route.openapi?.description;
                }

                (currentPath[method] as OA3_1.OperationObject) = openApiMethod;
            });

            // const [queryParams, addedQueryParams] = this.extractParamsFromUrl(openapiPath);
            //
            // const currentPath = doc.paths[openapiPath] || {};
            //
            // if (currentPath[method]) {
            //     continue;
            // }
            //
            // // Path Item Object
            // // https://github.com/OAI/OpenAPI-Specification/blob/b748a884fa4571ffb6dd6ed9a4d20e38e41a878c/versions/3.0.3.md#path-item-object-example
            // let currentPathMethod: (typeof currentPath)[OA3_1.HttpMethods] & { components?: OA3_1.ComponentsObject } = {
            //     summary: '',
            //     tags: [service],
            //     // rawParams: params,
            //     parameters: [...queryParams],
            //     responses: {
            //         // attach common responses
            //         ...this.settings.commonPathItemObjectResponses
            //     }
            // };
            //
            // const schemaName = action;
            // if (method === 'get' || method === 'delete') {
            //     currentPathMethod.parameters.push(...this.moleculerParamsToQuery(params, addedQueryParams));
            // } else {
            //     if (openapi?.requestBody) {
            //         currentPathMethod.requestBody = openapi.requestBody;
            //     } else {
            //         this.createSchemaFromParams(doc, schemaName, params, addedQueryParams);
            //         currentPathMethod.requestBody = {
            //             content: {
            //                 'application/json': {
            //                     schema: {
            //                         $ref: `#/components/schemas/${schemaName}`
            //                     }
            //                 }
            //             }
            //         };
            //     }
            // }
            //
            // if (this.settings.requestBodyAndResponseBodyAreSameOnMethods.includes(method)) {
            //     currentPathMethod.responses[200] = {
            //         description: this.settings.requestBodyAndResponseBodyAreSameDescription,
            //         ...currentPathMethod.requestBody
            //     };
            // }
            //
            // // if multipart/stream convert fo formData/binary
            // if (actionType === 'multipart' || actionType === 'stream') {
            //     currentPathMethod = {
            //         ...currentPathMethod,
            //         parameters: [...queryParams],
            //         requestBody: this.getFileContentRequestBodyScheme(openapiPath, method, actionType) as OA3_1.RequestBodyObject &
            //             OpenAPIV3.RequestBodyObject
            //     };
            // }
            //
            // // merge values from action
            // // @ts-ignore
            // currentPathMethod = this.mergePathItemObjects(currentPathMethod, openapi);
            //
            // // merge values which exist in web-api service
            // // in routes or custom function
            // // @ts-ignore
            // currentPathMethod = this.mergePathItemObjects(currentPathMethod, path.openapi);
            //
            // // add tags to root of scheme
            // if (currentPathMethod.tags) {
            //     currentPathMethod.tags.forEach((name) => {
            //         this.addTagToDoc(doc, name);
            //     });
            // }
            //
            // // add components to root of scheme
            // if (currentPathMethod.components) {
            //     doc.components = this.mergeObjects(doc.components, currentPathMethod.components);
            //     delete currentPathMethod.components;
            // }
            //
            // const templateVariables = {
            //     summary: currentPathMethod.summary,
            //     action,
            //     autoAlias: path.autoAliases ? '[autoAlias]' : ''
            // };
            //
            // currentPathMethod.summary = Object.entries(templateVariables)
            //     .reduce((previous, [k, v]) => {
            //         return previous.replace(new RegExp(`{{${k}}}`, 'g'), v);
            //     }, this.settings.summaryTemplate)
            //     .trim();
            //
            // currentPath[method] = currentPathMethod as (typeof currentPath)[OA3_1.HttpMethods];
            // doc.paths[openapiPath] = currentPath;

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

    private extractParameters(path: string, route: foundRouteWithFilledAction): Pick<OA3_1.OperationObject, 'parameters' | 'requestBody'> {
        const result: Pick<OA3_1.OperationObject, 'parameters' | 'requestBody'> = {
            parameters: this.extractParamsFromUrl(path)
        };

        if (route.action?.params) {
            this.createSchemaFromParams(
                route.action.name,
                route.action.params,
                result.parameters.map((params: OA3_1.ParameterObject) => params.name)
            );
        }
        return undefined;
    }

    createSchemaFromParams(
        rootSchemeName: string,
        obj: ValidationRule | ValidationSchema,
        exclude: Array<string> = [],
        parentNode: { default?: any } = {}
    ) {
        const rootRules = this.isValidationSchema(obj)
            ? this.getSchemaObjectFromSchema(obj)
            : { [rootSchemeName]: this.getSchemaObjectFromRule(obj) };

        const rules = Object.fromEntries(Object.entries(rootRules).filter(([name, rule]) => !exclude.includes(name) && rule));

        this._createSchemaComponentFromObject(rootSchemeName, rules, parentNode);
    }

    /**
     * extract params from /{table}
     * @param url
     * @returns {[]}
     */
    extractParamsFromUrl(url = ''): Array<OA3_1.ParameterObject> {
        const params: Array<OA3_1.ParameterObject> = [];

        const matches = [...matchAll(/{(\w+)}/g, url).flat()];
        for (const match of matches) {
            const [, name] = match;

            params.push({ name, in: 'path', required: true, schema: { type: 'string' } });
        }

        return params;
    }

    //TODO seems useless
    private isValidationSchema(schema: any): schema is ValidationSchema {
        return schema?.$$root !== true;
    }

    /**
     * Convert moleculer params to openapi definitions(components schemas)
     * @param schemeName
     * @param obj
     * @param customProperties
     */
    _createSchemaComponentFromObject(
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

            this.components.schemas[schemeName] = schema;
            return;
        }

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

        // Schema model
        // https://github.com/OAI/OpenAPI-Specification/blob/b748a884fa4571ffb6dd6ed9a4d20e38e41a878c/versions/3.0.3.md#models-with-polymorphism-support
        this.components.schemas[schemeName] = {
            type: 'object',
            properties,
            required: required.length > 0 ? required : undefined,
            default: customProperties.default
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
            this._createSchemaComponentFromObject(nextSchemeName, rule.properties, { default: rule.default });
            return {
                description: rule.description,
                $ref: `#/components/schemas/${nextSchemeName}`
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
                    this._createSchemaPartFromRule(schemeName, schema);

                    return {
                        $ref: `#/components/schemas/${schemeName}`
                    };
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

    private getSchemaObjectFromSchema(schema: ValidationSchema): Record<string, OA3_1.SchemaObject> {
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

    private getSchemaObjectFromRule(
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
}
