import { ActionOpenApi, AliasRouteSchemaOpenApi, ApiSettingsSchemaOpenApi } from '../types/types.js';
import {
    AliasRouteSchema,
    ApiSchemaAlias,
    MOLECULER_WEB_LIST_ALIASES_INPUT,
    MOLECULER_WEB_LIST_ALIASES_OUTPUT,
    routeAlias
} from '../types/moleculer-web.js';
import { ActionSchema, Context, LoggerInstance, Service } from 'moleculer';
import {
    getServiceName,
    HTTP_METHODS,
    HTTP_METHODS_ARRAY,
    JOKER_METHOD,
    methodIsHttpMethod,
    rawHttpMethod,
    REST_METHOD
} from '../commons.js';
import { ApiRouteSchema } from 'moleculer-web';
import { Route } from '../objects/Route.js';
import { Alias } from '../objects/Alias.js';

export type foundRoute = {
    actionType?: string;
    path: string;
    method: rawHttpMethod;
    action: string;
    openapi?: ActionOpenApi;
};

export type foundRouteWithFilledAction = Omit<foundRoute, 'action'> & { action: ActionSchema | null };

export type foundAlias = {
    only?: Array<string>;
    method?: string;
    except?: Array<string>;
    action?: string | null;
    actionType?: string;
    openapi?: AliasRouteSchemaOpenApi['openapi'];
};

export class MoleculerWebRoutesParser {
    constructor(
        private readonly logger: LoggerInstance,
        private readonly unresolvedActionName: string
    ) {}

    public async parse(
        ctx: Context,
        service: Service<ApiSettingsSchemaOpenApi>,
        skipUnresolvedActions: boolean
    ): Promise<Array<foundRoute>> {
        // const pathsFounds: Array<foundRoute> = [];

        const routes = new Map<string, Route>();

        const serviceName = getServiceName(service);

        (service.settings?.routes || []).forEach((routeSchema) => {
            const route = new Route(this.logger, routeSchema, service.settings?.path, skipUnresolvedActions);

            routes.set(route.path, route);
        });

        const autoAliases = await this.fetchAliasesForService(ctx, serviceName);

        const foundRoutes = (autoAliases ?? [])
            .flatMap((alias: routeAlias) => {
                this.logger.debug(`checking alias ${alias} for path ${alias.fullPath}`);

                const route = routes.get(alias.routePath);

                const routeAlias = route?.searchAlias(alias);
                if (!routeAlias) {
                    if (route && !route.autoAliases) {
                        this.logger.error(`fail to get alias configuration for path "${alias.fullPath}"`);
                        return;
                    }

                    return new Alias(
                        {
                            path: alias.path,
                            method: alias.methods,
                            action: alias.actionName,
                            openapi: route?.openapi
                        },
                        route
                    ).getAllAliases();
                }

                return routeAlias.getAllAliases();
            })
            .filter(Boolean);

        console.log(foundRoutes);

        return foundRoutes;

        // return (autoAliases ?? [])
        //     .flatMap((alias: routeAlias): Array<foundRoute> | foundRoute | undefined => {
        //         this.logger.debug(`checking alias ${alias} for path ${alias.fullPath}`);
        //
        //         const route = routes.get(alias.routePath);
        //
        //         const routeAlias = this.searchAlias(alias, route?.aliases);
        //         if (!routeAlias) {
        //             if (route.autoAliases !== true) {
        //                 this.logger.error(`fail to get alias configuration for path "${alias.fullPath}"`);
        //                 return undefined;
        //             }
        //
        //             return ((alias.methods === JOKER_METHOD ? HTTP_METHODS_ARRAY : [alias.methods]) ?? []).map((m) => ({
        //                 actionType: routeAlias?.actionType,
        //                 path: alias.fullPath,
        //                 method: m.toLowerCase() as foundRoute['method'],
        //                 action: alias.actionName,
        //                 openapi: routeAlias?.openapi ?? route?.openapi
        //             }));
        //         }
        //
        //         if (!methodIsHttpMethod(alias.methods ?? routeAlias.method)) {
        //             debugger;
        //         }
        //
        //         return {
        //             actionType: routeAlias?.actionType,
        //             path: alias.fullPath,
        //             method: alias.methods.toLowerCase() as foundRoute['method'],
        //             action: alias.actionName,
        //             openapi: routeAlias?.openapi ?? route?.openapi
        //         };
        //     })
        //     .filter(Boolean) as Array<foundRoute>;
        //
        // // TODO seems useless to read manually routes ? better to just call listAliases ?
        // // test on original openapi doesn't works ... they generate openapi, but m-web doesn't handle this endpoints ...
        //
        // (service.settings.routes || []).forEach((route) => {
        //     Object.entries(route.aliases || {}).map(([alias, infos]) => {
        //         this.logger.debug(`checking alias ${alias} on route ${route.name ?? '<unamed>'} ${route.path}`);
        //         const aliasFound = this.extractAliasInformation(infos, skipUnresolvedActions);
        //
        //         if (!aliasFound) {
        //             this.logger.debug(`no result after extractions`);
        //             return;
        //         }
        //
        //         const routePath = path.join(service.settings.path ?? '/', route.path ?? '/');
        //
        //         const fullPathAndMethods = this.getFullPathAndMethods(routePath, alias);
        //
        //         if (!fullPathAndMethods) {
        //             this.logger.debug(`no result extracting full path and methods`);
        //             return;
        //         }
        //
        //         const { openapi, actionType } = aliasFound;
        //         generatePathsWithCustomMethods(fullPathAndMethods.path, fullPathAndMethods.method, aliasFound).forEach(
        //             ({ path, method, action }) => {
        //                 pathsFounds.push({
        //                     path,
        //                     method,
        //                     openapi,
        //                     action,
        //                     actionType
        //                 });
        //             }
        //         );
        //     });
        // });
        //
        // if (service.settings.routes?.some((route) => route.autoAliases)) {
        //     const serviceName = getServiceName(service);
        //     const autoAliases = await this.fetchAliasesForService(ctx, serviceName);
        //
        //     autoAliases.map((alias) => {
        //         const method = alias.methods?.toLowerCase() as foundRoute['method'];
        //
        //         if (method !== JOKER_METHOD && method !== REST_METHOD && !methodIsHttpMethod(method)) {
        //             this.logger.warn(`${alias.actionName}: unknown HTTP method ${method} skip`);
        //             return;
        //         }
        //         generatePathsWithCustomMethods(alias.fullPath, method, {
        //             action: alias.actionName
        //         }).forEach(({ path, method, action }) => {
        //             pathsFounds.push({
        //                 path,
        //                 method,
        //                 action
        //             });
        //         });
        //     });
        // }

        // return pathsFounds;
    }

    private fetchAliasesForService(ctx: Context, service: string) {
        return ctx.call<MOLECULER_WEB_LIST_ALIASES_OUTPUT, MOLECULER_WEB_LIST_ALIASES_INPUT>(`${service}.listAliases`, {
            withActionSchema: false,
            grouping: false
        });
    }

    private extractAliasSubInformations(infos: ApiSchemaAlias, skipUnresolvedActions: boolean): foundAlias | undefined {
        const isAliasRouteSchema = (v: unknown): v is AliasRouteSchemaOpenApi =>
            v && (['action', 'handler'] as Array<keyof AliasRouteSchema>).some((property) => !!(v as AliasRouteSchema)[property]);

        if (isAliasRouteSchema(infos)) {
            return {
                openapi: infos.openapi,
                actionType: infos.type,
                action: infos.action,
                only: infos.only,
                method: infos.method,
                except: infos.except
            };
        } else if (Array.isArray(infos)) {
            const cleansInfos = infos.map((info) => this.extractAliasSubInformations(info, skipUnresolvedActions)).filter(Boolean);
            const tmpAction = cleansInfos[cleansInfos.length - 1];

            if (!cleansInfos?.length && skipUnresolvedActions) {
                return;
            }

            return {
                action: tmpAction.action ?? null,
                actionType: tmpAction.actionType,
                openapi: tmpAction.openapi,
                only: tmpAction.only,
                method: tmpAction.method,
                except: tmpAction.except
            };
        } else if (typeof infos !== 'string') {
            if (skipUnresolvedActions) {
                return;
            }
            return {
                action: null
            };
        } else {
            return {
                action: infos
            };
        }
    }

    private extractAliasInformation(infos: ApiSchemaAlias, skipUnresolvedActions: boolean): foundAlias {
        const res = this.extractAliasSubInformations(infos, skipUnresolvedActions);

        if (!res) {
            return;
        }

        // support actions like multipart:import.proceedFile
        if (!res.actionType && res.action?.includes(':')) {
            const [actionType, action] = res.action.split(':');
            res.actionType = actionType;
            res.action = action;
        }

        return res;
    }

    // /**
    //  * Generate aliases for REST.
    //  *
    //  * @param {String} path
    //  * @param {*} action
    //  *
    //  * @returns Array<Alias>
    //  */
    // private generateRESTAliases(path: string, action: string) {
    //     const p = path.split(/\s+/);
    //     const pathName = p[1];
    //     const pathNameWithoutEndingSlash = pathName.endsWith('/') ? pathName.slice(0, -1) : pathName;
    //     const aliases = {
    //         list: `GET ${pathName}`,
    //         get: `GET ${pathNameWithoutEndingSlash}/:id`,
    //         create: `POST ${pathName}`,
    //         update: `PUT ${pathNameWithoutEndingSlash}/:id`,
    //         patch: `PATCH ${pathNameWithoutEndingSlash}/:id`,
    //         remove: `DELETE ${pathNameWithoutEndingSlash}/:id`
    //     };
    //     let actions = ['list', 'get', 'create', 'update', 'patch', 'remove'];
    //
    //     if (typeof action !== 'string' && (action.only || action.except)) {
    //         if (action.only) {
    //             actions = actions.filter((item) => action.only.includes(item));
    //         }
    //
    //         if (action.except) {
    //             actions = actions.filter((item) => !action.except.includes(item));
    //         }
    //
    //         action = action.action;
    //     }
    //
    //     console.log(action);
    //     // return actions.map(item => this.createAlias(route, aliases[item], `${action}.${item}`));
    // }

    // private extendAliases(aliases: Record<string, ApiRouteSchemaOpenApi['aliases'][string]>): Record<string, AliasRouteSchemaOpenApi> {
    private extendAliases(aliases: Record<string, ApiRouteSchema['aliases'][string]>, skipUnresolvedActions: boolean): Array<foundAlias> {
        return Object.entries(aliases ?? {})
            .flatMap(([k, alias]) => {
                const aliasInformation = this.extractAliasInformation(alias, skipUnresolvedActions);

                return this.getMethods(k, aliasInformation) ?? [];
            })
            .filter(Boolean);
    }

    private _getMethods(tmpMethod: string = ''): Array<HTTP_METHODS | typeof REST_METHOD> | undefined {
        const method = tmpMethod.toLowerCase();
        if (method === JOKER_METHOD) {
            return HTTP_METHODS_ARRAY;
        }
        if (method === REST_METHOD || methodIsHttpMethod(method)) {
            return [method];
        }

        this.logger.warn(`unknown http method "${method}" . Skip !`);
        return;
    }

    private getMethods(aliasKey: string, aliasInformations: foundAlias): Array<foundAlias> | undefined {
        const splitAlias = aliasKey.split(' ');
        if (splitAlias.length > 2) {
            this.logger.warn(`fail to parse alias "${aliasKey}", skip`);
            return;
        }

        if (!aliasInformations.method && splitAlias.length === 1) {
            return HTTP_METHODS_ARRAY.map((m) => ({ ...aliasInformations, method: m }));
        }

        const methods = this._getMethods(aliasInformations.method ?? splitAlias[0]);

        if (!methods) {
            return undefined;
        }

        return methods.flatMap((m) => {
            return this.getAliasesFromREST(m, aliasInformations);
        });
    }

    private getAliasesFromREST(
        method: HTTP_METHODS | typeof REST_METHOD,
        alias: foundAlias
    ): Array<{
        method: HTTP_METHODS;
        action: string;
    }> {
        if (method !== REST_METHOD) {
            return [
                {
                    method,
                    action: alias.action
                }
            ];
        }

        const actionName = alias.action;
        const actions: Record<string, { method: HTTP_METHODS; action: string }> = {
            list: { method: HTTP_METHODS.GET, action: `${actionName}.list` },
            get: { method: HTTP_METHODS.GET, action: `${actionName}.get` },
            create: { method: HTTP_METHODS.POST, action: `${actionName}.create` },
            update: { method: HTTP_METHODS.PUT, action: `${actionName}.update` },
            patch: { method: HTTP_METHODS.PATCH, action: `${actionName}.patch` },
            remove: { method: HTTP_METHODS.DELETE, action: `${actionName}.remove` }
        };

        return Object.entries(actions)
            .filter(([key]) => (alias.only ? alias.only.includes(key) : true) && (alias.except ? !alias.except.includes(key) : true))
            .map(([, v]) => v);
    }

    // private searchAlias(alias: routeAlias, aliases: Array<foundAlias> = []): foundAlias | undefined {
    //     return aliases.find(
    //         (a) => a.method?.toLowerCase() === alias.methods?.toLowerCase() && a.action?.toLowerCase() === alias.actionName?.toLowerCase()
    //     );
    // }
}
