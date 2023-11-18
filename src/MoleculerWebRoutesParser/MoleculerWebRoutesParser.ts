import { ActionOpenApi, AliasRouteSchemaOpenApi, ApiSettingsSchemaOpenApi, OpenApiMixinSettings } from '../types/types.js';
import { MOLECULER_WEB_LIST_ALIASES_INPUT, MOLECULER_WEB_LIST_ALIASES_OUTPUT, routeAlias } from '../types/moleculer-web.js';
import { ActionSchema, Context, LoggerInstance, Service } from 'moleculer';
import { getServiceName, rawHttpMethod } from '../commons.js';
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
    constructor(private readonly logger: LoggerInstance) {}

    public async parse(
        ctx: Context,
        service: Service<ApiSettingsSchemaOpenApi>,
        skipUnresolvedActions: boolean,
        services: Array<Service>
    ): Promise<Array<Alias>> {
        const actionsMap = new Map<string, { service: Service; action: ActionSchema }>();
        const routes = new Map<string, Route>();

        services.forEach((svc) =>
            Object.values(svc.actions).forEach((action) => {
                actionsMap.set(action.name, {
                    service: svc,
                    action
                });
            })
        );

        const serviceName = getServiceName(service);

        (service.settings?.routes || []).forEach((routeSchema) => {
            const route = new Route(
                this.logger,
                routeSchema,
                service.settings?.path,
                skipUnresolvedActions,
                ctx.service as Service<OpenApiMixinSettings>
            );

            routes.set(route.path, route);
        });

        const autoAliases = await this.fetchAliasesForService(ctx, serviceName);

        return (autoAliases ?? [])
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
                    );
                }

                return routeAlias;
            })
            .filter(Boolean)
            .map((alias) => {
                if (!alias.action) {
                    return alias;
                }

                const action = actionsMap.get(alias.action);
                if (!action) {
                    this.logger.warn(`fail to get details about action "${alias.action}"`);
                    return alias;
                }

                alias.actionSchema = action.action;

                return alias;
            });

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
}
