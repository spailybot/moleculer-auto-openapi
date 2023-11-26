import { ApiSettingsSchemaOpenApi, OpenApiMixinSettings } from '../types/types.js';
import { MOLECULER_WEB_LIST_ALIASES_INPUT, MOLECULER_WEB_LIST_ALIASES_OUTPUT, routeAlias } from '../types/moleculer-web.js';
import { ActionSchema, Context, LoggerInstance, Service } from 'moleculer';
import { getServiceName, normalizePath } from '../commons.js';
import { Route } from '../objects/Route.js';
import { Alias } from '../objects/Alias.js';

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
            const route = new Route(this.logger, routeSchema, service, ctx.service as Service<OpenApiMixinSettings>, skipUnresolvedActions);

            routes.set(route.path, route);
        });

        const autoAliases = await this.fetchAliasesForService(ctx, serviceName);

        return (autoAliases ?? [])
            .flatMap((alias: routeAlias) => {
                this.logger.debug(`checking alias ${alias} for path ${alias.fullPath}`);

                const route = routes.get(normalizePath(alias.routePath));

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
                alias.service = action.service;

                return alias;
            });
    }

    private fetchAliasesForService(ctx: Context, service: string) {
        return ctx.call<MOLECULER_WEB_LIST_ALIASES_OUTPUT, MOLECULER_WEB_LIST_ALIASES_INPUT>(`${service}.listAliases`, {
            withActionSchema: false,
            grouping: false
        });
    }
}
