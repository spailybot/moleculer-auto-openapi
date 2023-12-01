import {
    defaultSettings,
    MoleculerOpenAPIGenerator,
    OA_GENERATE_DOCS_INPUT,
    OA_GENERATE_DOCS_OUTPUT
} from './MoleculerOpenAPIGenerator.js';
import { Context, Service, ServiceSchema, ServiceSettingSchema } from 'moleculer';
import fs from 'fs';
import { ECacheMode, OpenApiMixinSettings } from './types/index.js';
import { getAbsoluteFSPath } from 'swagger-ui-dist';
import { RuleString } from 'fastest-validator';
import { DEFAULT_OPENAPI_VERSION } from './constants.js';
import path from 'path/posix';

const swaggerUiAssetPath = getAbsoluteFSPath();
type openApiService = Service<OpenApiMixinSettings> & { generator?: MoleculerOpenAPIGenerator };

export const mixin: ServiceSchema<ServiceSettingSchema> = {
    name: `openapi`,
    settings: defaultSettings as OpenApiMixinSettings,
    events: {
        async '$api.aliases.regenerated'(this: openApiService) {
            const generateDocsAction = 'generateDocs';
            const { cacheMode } = this.settings;
            if (cacheMode !== ECacheMode.TIMEOUT && this.broker.cacher && this.actions[generateDocsAction]) {
                const cacheKey = this.broker.cacher.getCacheKey(`${this.fullName}.${generateDocsAction}`, {}, {}, []);
                await this.broker.cacher.clean(`${cacheKey}*`);
            }

            if (cacheMode === ECacheMode.REFRESH) {
                await this.actions[generateDocsAction]();
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
                enabled(this: openApiService) {
                    return this.settings.cacheOpenApi ?? true;
                },
                keygen: (actionName: string, params: OA_GENERATE_DOCS_INPUT) => {
                    if (!params.version) {
                        return actionName;
                    }

                    return `${actionName}|${params?.version || DEFAULT_OPENAPI_VERSION}`;
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
                return this.getGenerator().generateSchema(ctx);
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
            handler(this: openApiService, ctx: Context<{ file: string }, { $responseType: string }>) {
                const { file } = ctx.params;

                if (file.indexOf('.css') > -1) {
                    ctx.meta.$responseType = 'text/css';
                } else if (file.indexOf('.js') > -1) {
                    ctx.meta.$responseType = 'text/javascript';
                } else {
                    ctx.meta.$responseType = 'application/octet-stream';
                }

                const filePath = `${swaggerUiAssetPath}/${file}`;
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

                const assetsURL = this.settings.assetsPath;
                const swaggerSettings = {
                    deepLinking: true,
                    showExtensions: true,
                    layout: 'StandaloneLayout',
                    ...this.settings.swaggerUiOptions,
                    url: ctx.params.url || this.settings.schemaPath,
                    dom_id: '#swagger-ui',
                    //TODO
                    oauth2RedirectUrl: path.dirname(this.settings.schemaPath) + '/oauth2-redirect'
                };

                return `
<html lang="en">
  <head>
    <title>OpenAPI UI</title>
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

    <script type="application/json" id="__SWAGGER_SETTINGS__">
      ${JSON.stringify(swaggerSettings)}
    </script>
    <script>
        var assetsURL = "${assetsURL}"

        var configElement = document.getElementById('__SWAGGER_SETTINGS__');
        if(!configElement) {
            throw new Error('fail to load configurations');
        }
        var swaggerSettings = JSON.parse(configElement.textContent);

      window.onload = function() {
        // Create CSS link dynamically
        var cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = assetsURL + '/swagger-ui.css';
        document.head.appendChild(cssLink);

        function initSwaggerUIDependentCode() {
            SwaggerUIBundle(
                Object.assign(
                    swaggerSettings,
                    {
                        presets: [
                            SwaggerUIBundle.presets.apis,
                            SwaggerUIStandalonePreset,
                        ],
                        plugins: [
                            SwaggerUIBundle.plugins.DownloadUrl,
                        ]
                    }
                )
            )
        }

        var scripts = [
          assetsURL + '/swagger-ui-bundle.js',
          assetsURL + '/swagger-ui-standalone-preset.js'
        ];

        var scriptsLoaded = 0;
        // Function to load script
        function loadScript(script, callback) {
          var scriptElement = document.createElement('script');
          scriptElement.src = script;
          scriptElement.onload = () => {
            scriptsLoaded++;

            // Verify if all scripts have been loaded
            if (scriptsLoaded === scripts.length) {
              callback();
            }
          };
          document.body.appendChild(scriptElement);
        }

        // Load all scripts
        for (var i = 0; i < scripts.length; i++) {
          loadScript(scripts[i], initSwaggerUIDependentCode);
        }
      };
    </script>

  </body>
</html>`;
                //           return `
                // <html lang="en">
                //   <head>
                //      <title>OpenAPI UI</title>
                //      <link rel="stylesheet" href="${this.settings.assetsPath}/swagger-ui.css"/>
                //      <style>
                //          body {
                //           margin: 0;
                //          }
                //       </style>
                //   </head>
                //   <body>
                //
                //     <div id="swagger-ui">
                //       <p>Loading...</p>
                //       <noscript>If you see json, you need to update your dependencies</noscript>
                //     </div>
                //
                //     <script src="${this.settings.assetsPath}/swagger-ui-bundle.js"></script>
                //     <script src="${this.settings.assetsPath}/swagger-ui-standalone-preset.js"></script>
                //     <script>
                //       window.onload = function() {
                //        SwaggerUIBundle({
                //          url: "${ctx.params.url || this.settings.schemaPath}",
                //          dom_id: '#swagger-ui',
                //          oauth2RedirectUrl: "${this.settings.assetsPath}/oauth2-redirect.html",
                //          deepLinking: true,
                //          showExtensions: true,
                //          presets: [
                //            SwaggerUIBundle.presets.apis,
                //            SwaggerUIStandalonePreset,
                //          ],
                //          plugins: [
                //            SwaggerUIBundle.plugins.DownloadUrl
                //          ],
                //          layout: "StandaloneLayout",
                //        });
                //       }
                //     </script>
                //
                //   </body>
                // </html>`;
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
            handler: (ctx) => {
                ctx.meta.$responseType = 'text/html; charset=utf-8';
                return fs.promises.readFile(`${swaggerUiAssetPath}/oauth2-redirect.html`);
            }
        }
    },
    methods: {
        getGenerator() {
            if (!this.generator) {
                throw new Error('no generator, bad initialization');
            }

            return this.generator;
        }
    },
    created() {
        this.generator = new MoleculerOpenAPIGenerator(this.broker, this.settings as OpenApiMixinSettings);
    },
    async started() {
        this.logger.info(`📜 OpenAPI Docs server is available`);
    }
};
