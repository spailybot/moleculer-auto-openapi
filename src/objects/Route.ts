import { ApiRouteOpenApi, ApiRouteSchema, OpenApiMixinSettings } from '../types/types.js';
import { Alias } from './Alias.js';
import { normalizePath } from '../commons.js';
import path from 'path/posix';
import { bodyParserOptions, routeAlias } from '../types/moleculer-web.js';
import { AliasCreator } from './AliasCreator.js';
import { LoggerInstance, Service } from 'moleculer';

export class Route {
    public readonly aliases: Array<Alias>;
    public readonly path: string;
    public readonly bodyParsers: bodyParserOptions | boolean;
    public readonly autoAliases: boolean;
    public readonly openapi: ApiRouteOpenApi;
    public readonly service: Service<OpenApiMixinSettings>;

    constructor(
        private readonly logger: LoggerInstance,
        route: ApiRouteSchema,
        apiPath: string = '',
        private readonly skipUnresolvedActions: boolean = true,
        service: Service<OpenApiMixinSettings>
    ) {
        this.path = normalizePath(path.join(apiPath ?? '/', route.path ?? '/'));
        this.bodyParsers = route.bodyParsers;
        this.autoAliases = route.autoAliases;
        this.openapi = route.openapi;
        this.service = service;

        this.aliases = new AliasCreator(this.logger, this, route.aliases, this.skipUnresolvedActions).getAliases();
    }

    public searchAlias(alias: routeAlias): Alias | undefined {
        return this.aliases.find(
            (a) =>
                a.method?.toLowerCase() === alias.methods?.toLowerCase() &&
                a.path?.toLowerCase() === normalizePath(alias.path?.toLowerCase())
        );
    }
}
