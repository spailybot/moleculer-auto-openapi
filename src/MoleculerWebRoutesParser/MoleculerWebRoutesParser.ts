import { ApiSettingsSchemaOpenApi, definedActionSchema, definedApiRouteSchema, OpenApiMixinSettings } from '../types/index.js';
import { MOLECULER_WEB_LIST_ALIASES_INPUT, MOLECULER_WEB_LIST_ALIASES_OUTPUT, routeAlias } from '../types/moleculer-web.js';
import { ActionSchema, Context, LoggerInstance, Service } from 'moleculer';
import { getServiceName, normalizePath } from '../commons.js';
import { Route } from '../objects/Route.js';
import { Alias } from '../objects/Alias.js';

export class MoleculerWebRoutesParser {
    constructor(private readonly logger: LoggerInstance) {
        this.logger.debug(`RoutesParser.constructor()`);
    }

    public async parse(
        ctx: Context,
        service: Service<ApiSettingsSchemaOpenApi>,
        skipUnresolvedActions: boolean,
        services: Array<Service>
    ): Promise<Array<Alias>> {
        this.logger.debug(`RoutesParser.parse()`);
        const actionsMap = new Map<string, { service: Service; action: ActionSchema }>();
        const routes = new Map<string, Route>();

        // TODO map the current OA server (moleculer service), to route, to add the "server" field

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
            this.logger.debug(`RoutesParser.parse() - check route ${routeSchema.name ?? routeSchema.path}`);
            //allow to exclude action from openapi
            if (routeSchema?.openapi === false) {
                this.logger.debug(`RoutesParser.parse() - skip route ${routeSchema.name ?? routeSchema.path} because openapi = false`);
                return;
            }

            const route = new Route(
                this.logger,
                routeSchema as definedApiRouteSchema,
                service,
                ctx.service as Service<OpenApiMixinSettings>,
                skipUnresolvedActions
            );

            routes.set(route.path, route);
        });

        const autoAliases = await this.fetchAliasesForService(ctx, serviceName);

        return (autoAliases ?? [])
            .flatMap((alias: routeAlias) => {
                this.logger.debug(`RoutesParser.parse() - checking alias ${alias.path} for path ${alias.fullPath}`);

                const route = routes.get(normalizePath(alias.routePath));

                if (!route) {
                    this.logger.debug(
                        `RoutesParser.parse() - alias ${alias.fullPath} is skipped because not linked to a route (can be normal if route use openapi = false)`
                    );
                    return;
                }

                const routeAlias = route?.searchAlias(alias);
                if (!routeAlias) {
                    if (route && !route.autoAliases) {
                        this.logger.error(`fail to get alias configuration for path "${alias.fullPath}"`);
                        return;
                    }

                    this.logger.debug(`RoutesParser.parse() - alias ${alias.fullPath} seems to use autoAliases`);

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

                if (routeAlias.skipped) {
                    this.logger.debug(`RoutesParser.parse() - skip alias ${routeAlias.fullPath} because openapi = false`);
                    return;
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

                //allow to exclude action from openapi
                if (action.action.openapi === false) {
                    return;
                }

                alias.actionSchema = action.action as definedActionSchema;
                alias.service = action.service;

                return alias;
            })
            .filter(Boolean);
    }

    private fetchAliasesForService(ctx: Context, service: string) {
        return ctx.call<MOLECULER_WEB_LIST_ALIASES_OUTPUT, MOLECULER_WEB_LIST_ALIASES_INPUT>(`${service}.listAliases`, {
            withActionSchema: false,
            grouping: false
        });
    }
}
