import { AliasRouteOpenApi, AliasRouteSchemaOpenApi, ApiRouteOpenApi } from '../types/types.js';
import { Route } from './Route.js';
import { isRawHttpMethod, normalizePath, rawHttpMethod } from '../commons.js';

export type aliasNoRest = Omit<AliasRouteSchemaOpenApi, 'method'> & { method?: rawHttpMethod };

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

    private route: Route;
    public type: string;
    private _method: rawHttpMethod;
    private _path: string;
    public action: string;
    public openapi: AliasRouteSchemaOpenApi['openapi'];

    constructor(name: string, infos: aliasNoRest, route: Route) {
        this.route = route;
        this.type = infos.actionType;
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

    // TODO
    private mergeOpenApiWithRoute(aliasOpenApi: AliasRouteOpenApi = {}, routeOpenApi: ApiRouteOpenApi = {}): AliasRouteOpenApi {
        return {
            ...routeOpenApi,
            ...aliasOpenApi
        };
    }
}
