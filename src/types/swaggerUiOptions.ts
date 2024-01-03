export interface SwaggerUiOptions {
    /**
     * If the value matches the name of a spec provided in urls, that spec will be displayed when Swagger UI loads, instead of defaulting to the first spec in urls.
     */
    primaryName?: string;
    /**
     * Enables overriding configuration parameters via URL search params.
     *
     * @default false
     */
    queryConfigEnabled?: boolean;
    /**
     * The name of a component available via the plugin system to use as the top-level layout for Swagger UI.
     *
     * @default StandaloneLayout
     */
    layout?: string;
    /**
     * If set to true, enables deep linking for tags and operations. See {@link https://swagger.io/docs/usage/deep-linking.md | the Deep Linking documentation} for more information.
     *
     * @default true
     */
    deepLinking?: boolean;
    /**
     * Controls the display of operationId in operations list.
     *
     *  @default false.
     */
    displayOperationId?: boolean;

    /**
     * The default expansion depth for models (set to -1 completely hide the models).
     *
     * @default 1
     */
    defaultModelsExpandDepth?: number;

    /**
     * The default expansion depth for the model on the model-example section.
     *
     * @default 1
     */
    defaultModelExpandDepth?: number;

    /**
     * Controls how the model is shown when the API is first rendered.
     * The user can always switch the rendering for a given model by clicking the 'Model' and 'Example Value'
     * links.
     *
     * @default example
     */
    defaultModelRendering?: 'example' | 'model';

    /**
     * Controls the display of the request duration (in milliseconds) for "Try it out" requests.
     *
     * @default false
     */
    displayRequestDuration?: boolean;

    /**
     * Controls the default expansion setting for the operations and tags. It
     * can be 'list' (expands only the tags), 'full' (expands the tags and operations) or 'none' (expands nothing).
     *
     * @default list
     */
    docExpansion?: 'list' | 'full' | 'none';

    /**
     * If set, enables filtering. The top bar will show an edit box that you
     * can use to filter the tagged operations that are shown. Can be Boolean to enable
     * or disable, or a string, in which case filtering will be enabled using that string
     * as the filter expression. Filtering is case-sensitive matching the filter expression
     * anywhere inside the tag.
     */
    filter?: boolean | string;

    /**
     * If set, limits the number of tagged operations displayed to at most this many.
     * The default is to show all operations.
     */
    maxDisplayedTags?: number;

    /**
     * Controls the display of vendor extensions (x-) fields and values for Operations, Parameters, Responses,
     * and Schema.
     *
     * @default true
     */
    showExtensions?: boolean;

    /**
     * Controls the display of extensions (pattern, maxLength, minLength, maximum, minimum) fields
     * and values for Parameters.
     *
     * @default false
     */
    showCommonExtensions?: boolean;

    /**
     * Set to false to deactivate syntax highlighting of payloads and cURL command,
     * can be otherwise an object with the activate and theme properties.
     *
     * @default false
     */
    syntaxHighlight?:
        | false
        | {
              /**
               * Boolean=true. Whether syntax highlighting should be activated or not.
               */
              activate?: boolean;

              /**
               * Highlight.js syntax coloring theme to use. (Only these 7 styles are available.)
               */
              theme?: 'agate' | 'arta' | 'monokai' | 'nord' | 'obsidian' | 'tomorrow-night' | 'idea';
          };

    /**
     * Controls whether the "Try it out" section should be enabled by default.
     * @default false
     */
    tryItOutEnabled?: boolean;

    /**
     * Enables the request snippet section. When disabled, the legacy curl snippet will be used.
     *
     * @default false
     */
    requestSnippetsEnabled?: boolean;

    /**
     * This is the default configuration section for the requestSnippets plugin.
     */
    requestSnippets?: {
        /**
         * Generators for different shell syntax.
         */
        generators?: {
            /**
             * cURL command for Bash shell
             */
            curl_bash?: { title: string; syntax: string };

            /**
             * cURL command for PowerShell shell
             */
            curl_powershell?: { title: string; syntax: string };

            /**
             * cURL command for CMD shell
             */
            curl_cmd?: { title: string; syntax: string };

            /**
             * True if the list of languages should be expanded by default.
             */
            defaultExpanded?: boolean;

            /**
             * An array to only show certain syntax. Set to ["curl_bash"] to only show curl bash.
             */
            languages?: null | ['curl_bash'];
        };

        /**
         * If set to true, uses the mutated request returned from a requestInterceptor to produce the curl command in the UI, otherwise the request before the requestInterceptor was applied is used.
         *
         * @default true
         */
        showMutatedRequest?: boolean;

        /**
         * List of HTTP methods that have the "Try it out" feature enabled. An empty array disables "Try it out" for all operations. This does not filter the operations from the display.
         *
         * @default Array=["get", "put", "post", "delete", "options", "head", "patch", "trace"]
         */
        supportedSubmitMethods?: Array<string>;

        /**
         *
         * By default, Swagger UI attempts to validate specs against swagger.io's online validator. You can use this parameter to set a different validator URL, for example for locally deployed validators ({@link https://github.com/swagger-api/validator-badge | Validator Badge}). Setting it to either none, 127.0.0.1 or localhost will disable validation.
         *
         * @default https://validator.swagger.io/validator
         */
        validatorUrl?: string | null;

        /**
         * If set to true, enables passing credentials, {@link https://fetch.spec.whatwg.org/#credentials | as defined in the Fetch standard}, in CORS requests that are sent by the browser. Note that Swagger UI cannot currently set cookies cross-domain (see {@link https://github.com/swagger-api/swagger-js/issues/1163 | swagger-js#1163}) - as a result, you will have to rely on browser-supplied cookies (which this setting enables sending) that Swagger UI cannot control.
         */
        withCredentials?: boolean;

        /**
         * If set to true, it persists authorization data, and it would not be lost on browser close/refresh
         *
         * @default false
         */
        persistAuthorization?: boolean;
    };
}

export interface SwaggerUiOauthOptions {
    clientId?: string;
    clientSecret?: string;
    realm?: string;
    appName?: string;
    scopeSeparator?: string;
    scopes?: string;
    additionalQueryStringParams?: Record<string, string>;
    useBasicAuthenticationWithAccessCodeGrant?: boolean;
    usePkceWithAuthorizationCodeGrant?: boolean;
}
