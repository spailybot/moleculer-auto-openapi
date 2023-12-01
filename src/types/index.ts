import type { ApiRouteSchema } from 'moleculer-web';
import type { openApiServiceOpenApi } from './openapi.js';
import { SwaggerUiOptions } from './swaggerUiOptions.js';

export type tSystemParams = {
    description?: string;
    summary?: string;
    optional?: boolean;
    deprecated?: boolean;
};

export interface TemplateVariables {
    summary: string;
    action: string;
    autoAlias: string;
}

/**
 * Enum to describe the different cache modes.
 */
export enum ECacheMode {
    /**
     * Cache Mode: NEXT_CALL
     *
     * Pro(s):
     * - The OpenAPI will always be up-to-date. Each new service detection prompts a clear cache, not renewal though.
     *
     * Con(s):
     * - The first call might be a bit slower due to updating process.
     */
    NEXT_CALL = 'next-call',

    /**
     * Cache Mode: REFRESH
     *
     * Pro(s):
     * - Provides faster response on the first call because cache regenerates whenever a new service is detected.
     *
     * Con(s):
     * - More CPU usage, often significantly, if aliases/services are refreshed frequently.
     */
    REFRESH = 'refresh',

    /**
     * Cache Mode: TIMEOUT
     *
     * Pro(s):
     * - Designed mindful of CPU usage, it only clears cache on timeouts (default 10 mins).
     *
     * Con(s):
     * - Not ideal for dynamic servers due to its completely time-based cache clearing policy.
     * - The OpenAPI might not be up-to-date all the time.
     */
    TIMEOUT = 'timeout'
}

export type OpenApiMixinSettings = {
    /**
     * map only local services (on the same node) ?
     * @default false
     */
    onlyLocal?: boolean;
    //TODO replace this paths by "openapiServicePath", holding a rest path, or an object with multiple paths ... if empty, try to resolve it
    /**
     * path to openapi.json / to the openapi generation action
     */
    schemaPath: string;
    /**
     * path you configured to point to open api assets
     *
     * You can use unpkg CDN by setting //unpkg.com/swagger-ui-dist[@<version>] :
     *
     * @default //unpkg.com/swagger-ui-dist
     */
    assetsPath?: string;
    /**
     * Configure the base of the openApi Document . {@link https://spec.openapis.org/oas/v3.1.0#openapi-object | documentation}
     */
    openapi: openApiServiceOpenApi;
    /**
     * allow to skip unresolved actions
     *
     * @default true
     */
    skipUnresolvedActions?: boolean;
    /**
     * allow to clear the cache when the routes are reloaded (else, they will be cleared when cache expire)
     *
     * @remarks
     *  this doesn't work without cacheOpenApi = true, or without cacher .
     *
     * @default next-call
     * @see cacheOpenApi
     * @see ECacheMode
     */
    cacheMode?: ECacheMode;
    /**
     * add the openAPI to cache
     * If no cacher is available, the openApi will not be cached
     *
     * @default true
     */
    cacheOpenApi?: boolean;
    /**
     * summary template
     * use variable between double accolades : {{summary}}
     * @var string summary : the actual summary
     * @var string action : the action name
     * @var string autoAlias : print [autoAlias] if an auto alias
     * @default {{summary}}\n            ({{action}}){{autoAlias}}
     */
    summaryTemplate?: string | ((variables: TemplateVariables) => string);
    /**
     * return assets as a stream else as a buffer ?
     * @default true
     */
    returnAssetsAsStream?: boolean;
    /**
     * set the default response content-type, used by "response", can be overridden with parameter "response.type" on action/route level
     *
     * @default application/json
     */
    defaultResponseContentType?: string;
    /**
     * the name of the field holding the file (only important in documentation, change it if it collides with one of your fields)
     *
     * @default file
     */
    multiPartFileFieldName?: string;

    /**
     * add the name of the services in tags ?
     *
     * @default false
     */
    addServiceNameToTags?: boolean;

    /**
     * set some swaggerUi options
     */
    swaggerUiOptions?: SwaggerUiOptions;
};

export { ApiRouteSchema };

// TODO precise exports
export * from './openapi.js';
export * from './converters/index.js';

export { SwaggerUiOptions };
