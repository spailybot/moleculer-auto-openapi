import { ApiRouteOpenApi, ApiSettingsSchemaOpenApi, definedApiRouteSchema, OpenApiMixinSettings } from '../types/index.js';
import { Alias } from './Alias.js';
import { normalizePath } from '../commons.js';
import path from 'path/posix';
import { bodyParserOptions, BusboyConfig, routeAlias } from '../types/moleculer-web.js';
import { AliasCreator } from './AliasCreator.js';
import { LoggerInstance, ServiceSchema } from 'moleculer';
import { JOKER_METHOD } from '../constants.js';

export class Route {
    public readonly aliases: Array<Alias>;
    public readonly path: string;
    public readonly bodyParsers?: bodyParserOptions | boolean;
    public readonly autoAliases: boolean;
    public readonly openapi?: ApiRouteOpenApi;
    public readonly openApiService?: ServiceSchema<OpenApiMixinSettings>;
    public readonly apiService: ServiceSchema<ApiSettingsSchemaOpenApi>;
    public readonly busboyConfig?: BusboyConfig<unknown>;

    constructor(
        private readonly logger: LoggerInstance,
        route: definedApiRouteSchema,
        apiService: ServiceSchema<ApiSettingsSchemaOpenApi>,
        openApiService?: ServiceSchema<OpenApiMixinSettings>,
        private readonly skipUnresolvedActions: boolean = true
    ) {
        this.path = Route.formatPath(route?.path, apiService);
        this.bodyParsers = route.bodyParsers;
        this.busboyConfig = route.busboyConfig;
        this.autoAliases = route.autoAliases ?? false;
        this.openapi = route.openapi;
        this.openApiService = openApiService;
        this.apiService = apiService;

        this.aliases = new AliasCreator(this.logger, this, route.aliases, this.skipUnresolvedActions).getAliases();
    }

    public static formatPath(routePath: string, apiService: ServiceSchema<ApiSettingsSchemaOpenApi>): string {
        return normalizePath(path.join(apiService?.settings?.path ?? '/', routePath ?? '/'));
    }

    public searchAlias(alias: routeAlias): Alias | undefined {
        return this.aliases.find(
            (a) =>
                (a.method.toLowerCase() === JOKER_METHOD || a.method?.toLowerCase() === alias.methods?.toLowerCase()) &&
                normalizePath(a.path?.toLowerCase()) === normalizePath(alias.path?.toLowerCase())
        );
    }
}
