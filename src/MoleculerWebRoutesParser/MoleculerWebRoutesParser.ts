import { ApiSettingsSchemaOpenApi, definedActionSchema, definedApiRouteSchema, OpenApiMixinSettings } from '../types/index.js';
import { MOLECULER_WEB_LIST_ALIASES_INPUT, MOLECULER_WEB_LIST_ALIASES_OUTPUT, routeAlias } from '../types/moleculer-web.js';
import { ActionSchema, Context, LoggerInstance, Service, ServiceSchema } from 'moleculer';
import { getServiceName, normalizePath } from '../commons.js';
import { Route } from '../objects/Route.js';
import { Alias } from '../objects/Alias.js';

export class MoleculerWebRoutesParser {
    constructor(private readonly logger: LoggerInstance) {
        this.logger.debug(`RoutesParser.constructor()`);
    }

    public async parse(
        ctx: Context,
        service: ServiceSchema<ApiSettingsSchemaOpenApi>,
        skipUnresolvedActions: boolean,
        services: Array<ServiceSchema>
    ): Promise<Array<Alias>> {
        this.logger.debug(`RoutesParser.parse()`);
        const actionsMap = new Map<string, { service: ServiceSchema; action: ActionSchema }>();
        const routes = new Map<string, Route>();

        services.forEach((svc) =>
            Object.values(svc.actions ?? {}).forEach((action) => {
                if (typeof action === 'boolean' || typeof action === 'function' || !action.name) {
                    return;
                }

                actionsMap.set(action.name, {
                    service: svc,
                    action
                });
            })
        );

        const serviceName = getServiceName(service);

        const serviceRoutes = service.settings?.routes || [];

        //do some checks to check if it looks like a moleculer-web service
        if (!Array.isArray(serviceRoutes)) {
            this.logger.debug(`RoutesParser.parse() - service ${serviceName} seems to not be a moleculer-web services`);
            return [];
        }

        serviceRoutes.forEach((routeSchema) => {
            const routeName = routeSchema.name ?? routeSchema.path;
            this.logger.debug(`RoutesParser.parse() - check route ${routeName}`);
            //allow to exclude action from openapi
            if (routeSchema?.openapi === false) {
                this.logger.debug(`RoutesParser.parse() - skip route ${routeName} because openapi = false`);
                return;
            }

            const route = new Route(
                this.logger,
                routeSchema as definedApiRouteSchema,
                service,
                (ctx.service as Service<OpenApiMixinSettings> | null)?.schema,
                skipUnresolvedActions
            );

            routes.set(`${serviceName}-${route.path}`, route);
        });

        //autoAliases are returned X times depending on the services started
        const autoAliases = ((await this.fetchAliasesForService(ctx, serviceName)) ?? []).filter(
            (alias, index, self) => index === self.findIndex((a) => a.fullPath === alias.fullPath && a.methods === alias.methods)
        );

        const unfilledAliases = autoAliases
            .flatMap((alias: routeAlias) => {
                this.logger.debug(`RoutesParser.parse() - checking alias ${alias.path} for path ${alias.fullPath}`);

                const route = routes.get(`${serviceName}-${normalizePath(alias.routePath)}`);

                if (!route) {
                    this.logger.debug(
                        `RoutesParser.parse() - alias ${alias.fullPath} is skipped because not linked to a route (can be normal if route use openapi = false)`
                    );
                    return;
                }

                const routeAlias = route?.searchAlias(alias);
                if (!routeAlias) {
                    if (route && !route.autoAliases) {
                        this.logger.error(`fail to get alias configuration for alias ${alias.methods} "${alias.fullPath}"`);
                        return;
                    }

                    this.logger.debug(`RoutesParser.parse() - alias ${alias.fullPath} seems to use autoAliases`);

                    const newAlias = new Alias(
                        {
                            path: alias.path,
                            method: alias.methods,
                            action: alias.actionName ?? undefined,
                            openapi: route?.openapi
                        },
                        route
                    );

                    if (alias.fullPath) {
                        newAlias.fullPath = alias.fullPath;
                    }
                    return newAlias;
                }

                if (routeAlias.skipped) {
                    this.logger.debug(`RoutesParser.parse() - skip alias ${routeAlias.fullPath} because openapi = false`);
                    return;
                }

                return routeAlias;
            })
            .filter(Boolean) as Array<Alias>;

        return unfilledAliases
            .map((alias) => {
                if (!alias.action) {
                    return alias;
                }

                const action = actionsMap.get(alias.action);
                if (!action) {
                    this.logger.warn(`fail to get details about action "${alias.action}"`);
                    return skipUnresolvedActions ? undefined : alias;
                }

                //allow to exclude action from openapi
                if (action.action.openapi === false) {
                    return;
                }

                alias.actionSchema = action.action as definedActionSchema;
                alias.service = action.service;

                return alias;
            })
            .filter(Boolean) as Array<Alias>;
    }

    private fetchAliasesForService(ctx: Context, service: string) {
        return ctx.call<MOLECULER_WEB_LIST_ALIASES_OUTPUT, MOLECULER_WEB_LIST_ALIASES_INPUT>(`${service}.listAliases`, {
            withActionSchema: false,
            grouping: false
        });
    }
}
