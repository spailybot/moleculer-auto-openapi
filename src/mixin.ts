import { defaultSettings, MoleculerOpenAPIGenerator } from './MoleculerOpenAPIGenerator.js';
import Moleculer, { Context, Service, ServiceMethods, ServiceSchema } from 'moleculer';
import fs from 'fs';
import {
    addMappersFn,
    ECacheMode,
    filterAliasesFn,
    OA_GENERATE_DOCS_INPUT,
    OA_GENERATE_DOCS_OUTPUT,
    OpenApiMixinSettings,
    OpenApiPaths
} from './types/index.js';
import { RuleString } from 'fastest-validator';
import { DEFAULT_SWAGGER_UI_DIST } from './constants.js';
import path from 'path/posix';
import MoleculerError = Moleculer.Errors.MoleculerError;
import { Alias } from './objects/Alias.js';

type openApiServiceMethods = {
    getGenerator: () => MoleculerOpenAPIGenerator;
    getOpenApiPaths: () => OpenApiPaths;
    getSwaggerPath: () => Promise<string>;
    filterAliases: filterAliasesFn;
    addMappers: addMappersFn;
};

type openApiService = Service<OpenApiMixinSettings> & { generator?: MoleculerOpenAPIGenerator } & openApiServiceMethods;

export type OpenApiMixinServiceSchema = ServiceSchema<
    OpenApiMixinSettings,
    openApiServiceMethods,
    { generator?: MoleculerOpenAPIGenerator }
>;

const openApiPaths: Partial<OpenApiPaths> = {};

export const mixin: OpenApiMixinServiceSchema = {
    name: `openapi`,
    settings: defaultSettings as OpenApiMixinSettings,
    events: {
        '$api.aliases.regenerated': {
            throttle: 10000,
            async handler(this: openApiService) {
                const generateDocsAction = 'generateDocs';
                const { cacheMode } = this.settings;
                if (cacheMode !== ECacheMode.TIMEOUT && this.broker.cacher && this.actions[generateDocsAction]) {
                    // Invalidate every cached generateDocs result (with or without version).
                    // Uses ** (not *) because versioned keys like "...|3.1" contain a dot, which "*" does not match.
                    await this.broker.cacher.clean(`${this.fullName}.${generateDocsAction}**`);
                }

                this.actions.regenerateOpenApiPaths().catch((e) => {
                    this.logger.error(`regenerateOpenApiPaths failed with error : ${e.toString()}`);
                });

                if (cacheMode === ECacheMode.REFRESH) {
                    await this.actions[generateDocsAction]();
                }
            }
        }
    },
    actions: {
        generateDocs: {
            rest: {
                path: '/openapi.json',
                method: 'GET'
            },
            cache: {
                enabled(this: openApiService | undefined) {
                    return this?.settings?.cacheOpenApi ?? true;
                },
                keygen: (action, opts, ctx) => {
                    const name = action.name!;
                    const version = (ctx.params as OA_GENERATE_DOCS_INPUT | undefined)?.version;

                    if (!version) {
                        return name;
                    }

                    return `${name}|${version}`;
                },
                ttl: 600
            },
            openapi: {
                tags: ['OpenApi']
            },
            // TODO support multiples OA version ?
            // params: {
            //     version: {
            //         type: 'number',
            //         default: defaultOpenApiVersion,
            //         enum: openApiVersionsSupported
            //     }
            // },
            handler(this: openApiService, ctx: Context<OA_GENERATE_DOCS_INPUT>): Promise<OA_GENERATE_DOCS_OUTPUT> {
                return this.getGenerator().generateSchema(ctx, {
                    filterAliasesFn: this.filterAliases,
                    addMappers: this.addMappers
                });
            }
        },
        assets: {
            rest: {
                path: '/assets/:file',
                method: 'GET'
            },
            openapi: {
                summary: 'OpenAPI assets',
                description: 'Return files from swagger-ui-dist folder',
                tags: ['OpenApi']
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
            async handler(ctx: Context<{ file: string }, { $responseType: string }>) {
                const { file } = ctx.params;

                if (file.indexOf('.css') > -1) {
                    ctx.meta.$responseType = 'text/css';
                } else if (file.indexOf('.js') > -1) {
                    ctx.meta.$responseType = 'text/javascript';
                } else {
                    ctx.meta.$responseType = 'application/octet-stream';
                }

                const filePath = `${await this.getSwaggerPath()}/${file}`;
                if (this.settings.returnAssetsAsStream) {
                    return fs.createReadStream(filePath);
                } else {
                    return fs.promises.readFile(filePath);
                }
            }
        },
        ui: {
            rest: {
                path: '/ui',
                method: 'GET'
            },
            openapi: {
                summary: 'OpenAPI ui',
                description: 'You can provide any schema file in query param',
                tags: ['OpenApi']
            },
            params: {
                url: {
                    $$oa: {
                        summary: 'Schema file'
                    },
                    type: 'string',
                    optional: true
                } as RuleString
            },
            async handler(this: openApiService, ctx: Context<{ url: string }, { $responseType: string }>): Promise<string> {
                ctx.meta.$responseType = 'text/html; charset=utf-8';

                const paths: OpenApiPaths = await this.getOpenApiPaths();

                const assetsURL = paths.assetsPath;
                const swaggerSettings = {
                    swaggerSettings: {
                        deepLinking: true,
                        showExtensions: true,
                        layout: 'StandaloneLayout',
                        ...this.settings.UIOptions,
                        url: ctx.params.url || paths.schemaPath,
                        dom_id: '#swagger-ui',
                        oauth2RedirectUrl: paths.oauth2RedirectPath
                    },
                    oauth: this.settings.UIOauthOptions
                };

                return `<html lang="en"><head><title>OpenAPI UI</title><style>body{ margin: 0;} </style></head><body><div id="swagger-ui"><p>Loading...</p><noscript>If you see json, you need to update your dependencies</noscript></div><script type="application/json" id="__SWAGGER_SETTINGS__">${JSON.stringify(
                    swaggerSettings
                )} </script><script>var assetsURL="${assetsURL}"; var configElement=document.getElementById("__SWAGGER_SETTINGS__"); if (!configElement){ throw new Error("fail to load configurations");} var settings=JSON.parse(configElement.textContent); window.onload=function (){ var cssLink=document.createElement("link"); cssLink.rel="stylesheet"; cssLink.href=assetsURL + "/swagger-ui.css"; document.head.appendChild(cssLink); function initSwaggerUIDependentCode(){ var ui=SwaggerUIBundle( Object.assign(settings.swaggerSettings,{ presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset], plugins: [SwaggerUIBundle.plugins.DownloadUrl],}) ); if(settings.oauth){ ui.initOAuth(settings.oauth)}} var scripts=[assetsURL + "/swagger-ui-bundle.js", assetsURL + "/swagger-ui-standalone-preset.js"]; var scriptsLoaded=0; function loadScript(script, callback){ var scriptElement=document.createElement("script"); scriptElement.src=script; scriptElement.onload=()=>{ scriptsLoaded++; if (scriptsLoaded===scripts.length){ callback();}}; document.body.appendChild(scriptElement);} for (var i=0; i < scripts.length; i++){ loadScript(scripts[i], initSwaggerUIDependentCode);}}; </script></body></html>`;
            }
        },
        oauth2Redirect: {
            rest: {
                path: '/oauth2-redirect',
                method: 'GET'
            },
            openapi: {
                summary: 'OpenAPI OAuth2 redirect',
                description: 'This fill will handle the OAuth2',
                tags: ['OpenApi']
            },
            cache: false,
            async handler(ctx) {
                if (!this) {
                    throw new MoleculerError('unknown error');
                }
                ctx.meta.$responseType = 'text/html; charset=utf-8';
                const oauth2RedirectPath = `${await this?.getSwaggerPath()}/oauth2-redirect`;
                const html = await fs.promises.readFile(`${oauth2RedirectPath}.html`, 'utf8');
                try {
                    // Newer swagger-ui-dist split the redirect logic into a separate file.
                    // Inline it so the page stays self-contained (a relative "oauth2-redirect.js"
                    // would resolve against the exposed redirect URL and 404).
                    const script = await fs.promises.readFile(`${oauth2RedirectPath}.js`, 'utf8');
                    const inlineHtml = html.replace('</body>', `<script>${script}</script></body>`);
                    return html.indexOf('</body>') > -1 ? inlineHtml : `${html}<script>${script}</script>`;
                } catch (err) {
                    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
                        throw err;
                    }
                    // Older swagger-ui-dist: the html is self-contained.
                    return html;
                }
            }
        },
        regenerateOpenApiPaths: {
            visibility: 'private',
            async handler(this: openApiService, ctx: Context) {
                const openApiAliases = ((await this.getGenerator().getAliases(ctx)) as Array<Alias>).filter(
                    (alias) => alias.service?.name === this.name
                );

                openApiAliases.forEach((alias) => {
                    if (alias.action === `${this.name}.ui`) {
                        openApiPaths.uiPath = alias.fullPath;
                    }
                    if (alias.action === `${this.name}.assets`) {
                        openApiPaths.assetsPath = alias.fullPath?.replace('/:file', '');
                    }
                    if (alias.action === `${this.name}.oauth2Redirect`) {
                        openApiPaths.oauth2RedirectPath = alias.fullPath;
                    }
                    if (alias.action === `${this.name}.generateDocs`) {
                        openApiPaths.schemaPath = alias.fullPath;
                    }
                });

                //call the getter to throw an error if a path is not set
                this.getOpenApiPaths();
            }
        }
    },
    methods: {
        getOpenApiPaths(this: openApiService): OpenApiPaths {
            if (this.settings.schemaPath) {
                this.logger.warn(`settings.schemaPath is deprecated, use settings.openApiPaths.schemaPath instead`);
            }
            if (this.settings.assetsPath) {
                this.logger.warn(`settings.assetsPath is deprecated, use settings.openApiPaths.assetsPath instead`);
            }

            if (typeof this.settings.openApiPaths === 'string') {
                this.settings.openApiPaths = {
                    schemaPath: path.join(this.settings.openApiPaths, 'openapi.json'),
                    uiPath: path.join(this.settings.openApiPaths, 'ui'),
                    oauth2RedirectPath: path.join(this.settings.openApiPaths, 'oauth2-redirect'),
                    assetsPath: path.join(this.settings.openApiPaths, 'assets')
                };
            }

            const paths: Partial<OpenApiPaths> = {
                assetsPath:
                    this.settings.assetsPath ??
                    this.settings.openApiPaths?.assetsPath ??
                    openApiPaths.assetsPath ??
                    DEFAULT_SWAGGER_UI_DIST,
                schemaPath: this.settings.schemaPath ?? this.settings.openApiPaths?.schemaPath ?? openApiPaths.schemaPath,
                uiPath: this.settings.openApiPaths?.uiPath ?? openApiPaths.uiPath,
                oauth2RedirectPath: this.settings.openApiPaths?.oauth2RedirectPath ?? openApiPaths.oauth2RedirectPath
            };

            (['assetsPath', 'schemaPath', 'uiPath', 'oauth2RedirectPath'] as Array<keyof OpenApiPaths>).forEach((k) => {
                if (!paths[k]) {
                    throw new MoleculerError(`fail to get path for settings ${k}`);
                }
            });

            return paths as OpenApiPaths;
        },
        getSwaggerPath: async (): Promise<string> => {
            try {
                const swaggerUi = await import('swagger-ui-dist');
                return swaggerUi.getAbsoluteFSPath();
            } catch (e) {
                throw new MoleculerError('fail to load swagger ui');
            }
        },
        getGenerator() {
            if (!this.generator) {
                throw new Error('no generator, bad initialization');
            }

            return this.generator;
        },
        filterAliases: (ctx: Context<OA_GENERATE_DOCS_INPUT>, aliases: Array<Alias>): Array<Alias> => {
            return aliases;
        },
        addMappers: (getSchemaObjectFromRule, getSchemaObjectFromSchema) => {
            return {};
        }
    } as ServiceMethods & { filterAliases: filterAliasesFn; addMappers: addMappersFn },
    created() {
        this.generator = new MoleculerOpenAPIGenerator(this.broker, this.settings as OpenApiMixinSettings);
    },
    async started() {
        this.logger.info(`📜 OpenAPI Docs server is available`);
    }
};
