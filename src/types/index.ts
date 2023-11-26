import { ApiRouteSchema } from 'moleculer-web';
import { openApiServiceOpenApi } from './openapi.js';

export type tSystemParams = {
    description?: string;
    summary?: string;
    optional?: boolean;
    deprecated?: boolean;
};

export type OpenApiMixinSettings = {
    /**
     * map only local services (on the same node) ?
     * @default false
     */
    onlyLocal?: boolean;
    /**
     * path to openapi.json / to the openapi generation action
     */
    schemaPath: string;
    /**
     * path you configured to point to open api assets
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
     * this doesn't work without cacheOpenApi = true
     * @default true
     */
    clearCacheOnRoutesGenerated?: boolean;
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
    summaryTemplate?: string;
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
};

export { ApiRouteSchema };

// TODO precise exports
export * from './openapi.js';
export * from './converters/index.js';
