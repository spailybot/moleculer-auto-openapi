import { OpenAPIV3_1 } from 'openapi-types';
import { addMappersFn, commonOpenApi, FastestValidatorType, openApiServiceOpenApi, TemplateVariables } from './types/index.js';
import { getAlphabeticSorter, normalizePath } from './commons.js';
import { Logger } from 'moleculer';
import { Alias } from './objects/Alias.js';
import { FastestValidatorConverter } from './Converters/FastestValidatorConverter.js';
import { DEFAULT_SUMMARY_TEMPLATE, EOAExtensions, OpenApiVersionsSupported, UNRESOLVED_ACTION_NAME } from './constants.js';
import { OpenApiMerger } from './OpenApiMerger.js';
import { ComponentsManager } from './Generators/ComponentsManager.js';
import { ParametersExtractor } from './Generators/ParametersExtractor.js';
import { RequestBodyGenerator } from './Generators/RequestBodyGenerator.js';
import { EOAOperationsExtensionTypes } from './types/internal.js';

export class OpenApiGenerator {
    private readonly document: openApiServiceOpenApi;
    private readonly converter: FastestValidatorConverter;
    public readonly componentsManager: ComponentsManager;
    private readonly parametersExtractor: ParametersExtractor;
    private readonly requestBodyGenerator: RequestBodyGenerator;

    constructor(
        private readonly logger: Logger,
        validator: FastestValidatorType,
        baseDocument: openApiServiceOpenApi,
        addMappersFn: addMappersFn
    ) {
        this.converter = new FastestValidatorConverter(validator, addMappersFn);
        this.document = baseDocument;

        this.componentsManager = new ComponentsManager(this.logger, this.converter);
        this.parametersExtractor = new ParametersExtractor(this.converter, this.componentsManager);
        this.requestBodyGenerator = new RequestBodyGenerator(this.converter, this.componentsManager, this.parametersExtractor);
    }

    private isLoaded?: boolean;

    public async load(): Promise<void> {
        await this.converter.load();
        this.isLoaded = true;
    }

    public generate(openApiVersion: OpenApiVersionsSupported, aliases: Array<Alias>): OpenAPIV3_1.Document {
        if (!this.isLoaded) {
            this.logger.warn('generator : converter is not loaded, custom mapper can be not be enabled');
        }

        const tagsMap: Map<string, OpenAPIV3_1.TagObject> = new Map<string, OpenAPIV3_1.TagObject>();

        if ((this.document as { openapi?: string }).openapi) {
            this.logger.warn(`setting manually the openapi version is not supported`);
            delete (this.document as { openapi?: string }).openapi;
        }

        const document: OpenAPIV3_1.Document & { servers: Array<OpenAPIV3_1.ServerObject> } = {
            openapi: `${openApiVersion}.0`,
            ...this.document,
            servers: this.document.servers ?? [],
            tags: [],
            components: this.componentsManager.cleanComponents(this.document.components)
        };

        //delete responses that end in the document
        if ((document as commonOpenApi).responses) {
            delete (document as commonOpenApi).responses;
        }

        const cachePathActions = new Map<string, string | undefined>();

        aliases.sort(getAlphabeticSorter('fullPath'));

        aliases.forEach((alias) => {
            if (!document.paths) {
                document.paths = {};
            }

            const route = alias.route;
            const { apiService, openApiService } = route;

            const openapiPath: string = this.formatParamUrl(normalizePath(alias.fullPath));
            const currentPath: OpenAPIV3_1.PathItemObject = document.paths?.[openapiPath] ?? {};

            if (alias.isJokerAlias()) {
                currentPath.description = alias.actionSchema?.openapi?.description;
                currentPath.summary = alias.actionSchema?.openapi?.summary;
            }

            alias.getPaths().forEach((pathAction) => {
                const method = pathAction.method;
                const cacheKeyName = `${openapiPath}.${method}`;

                const currentMethod = currentPath[method] as OpenAPIV3_1.OperationObject<EOAOperationsExtensionTypes> | undefined;
                if (currentMethod) {
                    if (
                        (currentMethod[EOAExtensions.server] || currentMethod.servers?.length) &&
                        alias.route.apiService.settings?.openapi?.server?.url &&
                        !currentMethod.servers?.find((srv) => srv.url === alias.route.apiService.settings?.openapi?.server?.url)
                    ) {
                        const server = alias.route.apiService.settings.openapi.server;

                        if (!currentMethod.servers?.length) {
                            currentMethod.servers = [];
                            const alreadySetServer = currentMethod[EOAExtensions.server];
                            if (alreadySetServer) {
                                currentMethod.servers.push(alreadySetServer);
                            }
                        }

                        currentMethod.servers.push(server);
                        this.addServerToDocument(document, server);
                        return;
                    }

                    const actionFromCache = cachePathActions.get(cacheKeyName);
                    this.logger.warn(
                        `${method.toUpperCase()} ${openapiPath} is already register by action ${actionFromCache ?? '<unamedAction>'} skip`
                    );
                    return;
                }

                cachePathActions.set(cacheKeyName, pathAction.actionName);

                const openApi = OpenApiMerger.merge(tagsMap, route, alias, pathAction.action, openApiService, apiService);

                this.componentsManager.components = this.componentsManager.mergeComponents(
                    this.componentsManager.components,
                    this.componentsManager.cleanComponents(openApi.components)
                );

                const { parameters, excluded } = this.parametersExtractor.extract(method, openapiPath, alias, openApi);

                const isUploadAlias = ['multipart', 'stream'].includes(alias.type ?? '');
                let requestBody: OpenAPIV3_1.RequestBodyObject | OpenAPIV3_1.ReferenceObject | undefined;

                if (isUploadAlias) {
                    const fileUploadBody = this.requestBodyGenerator.generateFileUploadBody(alias, excluded);
                    requestBody = openApi?.requestBody
                        ? {
                              ...fileUploadBody,
                              ...openApi.requestBody,
                              content: openApi.requestBody.content ?? fileUploadBody.content
                          }
                        : fileUploadBody;
                } else {
                    const actionParams = alias?.actionSchema?.params ?? {};
                    const metas = this.converter.getMetas(actionParams);
                    requestBody = this.requestBodyGenerator.getRequestBody(alias, method, actionParams, metas, excluded, openApi);
                }

                if (openApi?.parameters) {
                    parameters.push(...openApi.parameters);
                }

                const openApiMethod: OpenAPIV3_1.OperationObject & EOAOperationsExtensionTypes = {
                    summary: !alias.isJokerAlias() ? openApi?.summary : undefined,
                    description: !alias.isJokerAlias() ? openApi?.description : undefined,
                    deprecated: openApi.deprecated,
                    operationId: openApi?.operationId,
                    externalDocs: openApi?.externalDocs,
                    security: openApi?.security,
                    tags: this.handleTags(document, tagsMap, openApi?.tags),
                    parameters,
                    requestBody,
                    responses: openApi?.responses
                };

                if (alias.route.apiService.settings?.openapi?.server) {
                    const server = alias.route.apiService.settings.openapi.server;
                    openApiMethod[EOAExtensions.server] = server;

                    this.addServerToDocument(document, server);
                }

                const templateVariables: TemplateVariables = {
                    summary: openApi?.summary ?? '',
                    action: alias.action ?? UNRESOLVED_ACTION_NAME,
                    autoAlias: alias.route.autoAliases ? '[autoAlias]' : ''
                };

                const summaryTemplate = alias.route?.openApiService?.settings?.summaryTemplate;
                if (typeof summaryTemplate === 'string' || summaryTemplate === undefined) {
                    openApiMethod.summary = Object.entries(templateVariables)
                        .reduce(
                            (acc, [k, v]) => acc.replace(new RegExp(`{{\\s*${k}\\s*}}`, 'g'), v),
                            (summaryTemplate ?? DEFAULT_SUMMARY_TEMPLATE) as string
                        )
                        .trim();
                }

                if (typeof summaryTemplate === 'function') {
                    openApiMethod.summary = summaryTemplate(templateVariables);
                }

                (currentPath[method] as OpenAPIV3_1.OperationObject) = openApiMethod;
            });

            document.paths[openapiPath] = currentPath;
        });

        document.tags?.sort(getAlphabeticSorter('name'));

        document.components = this.componentsManager.mergeComponents(document.components, this.componentsManager.components);

        return this.componentsManager.removeExtensions(document);
    }

    private addServerToDocument(document: OpenAPIV3_1.Document, server: OpenAPIV3_1.ServerObject) {
        if (!document.servers) {
            document.servers = [];
        }

        if (!document.servers.some((srv) => srv.url === server.url)) {
            document.servers.push(server);
        }
    }

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

    private handleTags(
        document: OpenAPIV3_1.Document,
        tagsMap: Map<string, OpenAPIV3_1.TagObject>,
        tags: Array<string> = []
    ): Array<string> {
        const uniqTags = Array.from(new Set(tags));

        if (!document.tags) {
            document.tags = [];
        }

        uniqTags.forEach((tag) => {
            const tagObject: OpenAPIV3_1.TagObject | undefined = tagsMap.get(tag);
            if (!document.tags!.some(({ name }) => name === tag) && tagObject) {
                document.tags!.push(tagObject);
            }
        });

        return uniqTags;
    }
}
