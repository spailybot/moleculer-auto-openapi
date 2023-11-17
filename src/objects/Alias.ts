import { AliasRouteOpenApi, AliasRouteSchemaOpenApi, ApiRouteOpenApi } from '../types/types.js';
import { Route } from './Route.js';
import { HTTP_METHODS, HTTP_METHODS_ARRAY, isRawHttpMethod, JOKER_METHOD, normalizePath, rawHttpMethod } from '../commons.js';

export class Alias {
    get path(): string {
        return this._path;
    }
    set path(value: string) {
        this._path = normalizePath(value);
    }

    get method(): rawHttpMethod {
        return this._method;
    }
    set method(value: string) {
        if (!isRawHttpMethod(value)) {
            throw new Error(`"${value}" is not a valid method`);
        }
        this._method = value;
    }

    private readonly route: Route;
    public type: string;
    private _method: rawHttpMethod;
    private _path: string;
    public action: string;
    public openapi: AliasRouteSchemaOpenApi['openapi'];

    constructor(infos: AliasRouteSchemaOpenApi, route: Route) {
        this.route = route;
        this.type = infos.type;
        this.method = infos.method;
        this.path = infos.path;
        this.action = infos.action;
        this.openapi = this.mergeOpenApiWithRoute(infos.openapi, route.openapi);

        console.log(infos);
    }

    toJSON(): AliasRouteSchemaOpenApi {
        return {
            method: this.method,
            type: this.type,
            path: this.path,
            action: this.action,
            openapi: this.openapi
        };
    }

    public getAllAliases(): Array<Alias & { method: HTTP_METHODS }> {
        return ((this.method === JOKER_METHOD ? HTTP_METHODS_ARRAY : [this.method]) ?? []).map(
            (m) =>
                new Alias(
                    {
                        ...this.toJSON(),
                        method: m
                    },
                    this.route
                ) as Alias & { method: HTTP_METHODS }
        );
    }

    // TODO
    private mergeOpenApiWithRoute(aliasOpenApi: AliasRouteOpenApi = {}, routeOpenApi: ApiRouteOpenApi = {}): AliasRouteOpenApi {
        return {
            ...routeOpenApi,
            ...aliasOpenApi
        };
    }
}
