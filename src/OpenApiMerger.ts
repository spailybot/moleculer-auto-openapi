import { ActionSchema, LoggerInstance, Service } from 'moleculer';
import { ActionOpenApi, actionOpenApiResponse, AliasRouteSchemaOpenApi } from './types/types.js';
import { OpenAPIV3_1 as OA, OpenAPIV3_1 as OA3_1 } from 'openapi-types';
import { foundRoute, foundRouteWithFilledAction } from './MoleculerWebRoutesParser/MoleculerWebRoutesParser.js';

export class OpenApiMerger {
    constructor(
        private readonly logger: LoggerInstance,
        private readonly defaultContentType: string
    ) {}

    public mapServicesActions(routes: Array<foundRoute>, services: Array<Service>): Array<foundRouteWithFilledAction> {
        const actionsMap = new Map<string, { service: Service; action: ActionSchema }>();
        services.forEach((svc) =>
            Object.values(svc.actions).forEach((action) => {
                actionsMap.set(action.name, {
                    service: svc,
                    action
                });
            })
        );

        return routes.map((route): foundRouteWithFilledAction => {
            const newRoute: foundRouteWithFilledAction = {
                ...route,
                action: null
            };

            if (!route.action) {
                return newRoute;
            }

            const action = actionsMap.get(route.action);
            if (!action) {
                this.logger.warn(`fail to get details about action "${route.action}"`);
                return newRoute;
            }

            newRoute.action = action.action;
            //use openapi from action, or from openapi
            newRoute.openapi = this.mergeActionAndRouteOpenApi(action.action.openapi, newRoute.openapi);

            return newRoute;
        });
    }

    private mergeActionAndRouteOpenApi(
        actionOpenApi: ActionSchema['openapi'] = {},
        routeOpenApi: AliasRouteSchemaOpenApi['openapi'] = {}
    ): ActionOpenApi {
        let tags = routeOpenApi?.tags || [];
        if (actionOpenApi?.tags?.length) {
            //allow to set null as first parameter of tags to avoid getting them from route openapi
            if (actionOpenApi?.tags?.[0] === null) {
                tags = [];
            }

            tags = [...tags, ...actionOpenApi.tags].filter(Boolean);
        }

        const responses = this.generateResponses(actionOpenApi);

        actionOpenApi.components = this.mergeActionAndRouteComponents(
            {
                ...actionOpenApi.components,
                responses
            },
            routeOpenApi.components
        );

        return {
            ...routeOpenApi,
            ...actionOpenApi,
            tags
        };
    }

    private generateResponses(actionOpenApi: ActionOpenApi) {
        const responses = {
            ...actionOpenApi.components?.responses,
            ...actionOpenApi.responses
        };

        if (actionOpenApi.response) {
            const response: OA.ResponseObject = {
                description: ''
            };
            if ((actionOpenApi.response as actionOpenApiResponse).description === undefined) {
                response.content = {
                    [this.defaultContentType]: actionOpenApi.response as OA.MediaTypeObject
                };
            } else {
                const actionResponse = actionOpenApi.response as actionOpenApiResponse;
                response.description = actionResponse.description;
                response.headers = actionResponse.headers;
                response.links = actionResponse.links;
                response.content = {
                    [actionResponse.type ?? this.defaultContentType]: actionResponse.content
                };
            }

            responses['200'] = response;

            delete actionOpenApi.response;
            delete actionOpenApi.responses;
        }

        return responses;
    }

    private mergeActionAndRouteComponents(actionComponents: OA3_1.ComponentsObject = {}, routeComponents: OA3_1.ComponentsObject = {}) {
        return Object.keys(routeComponents).reduce(
            (mergedObject, key) => {
                mergedObject[key] = {
                    ...(actionComponents[key] || {}),
                    ...routeComponents[key]
                };
                return mergedObject;
            },
            { ...actionComponents }
        );
    }
}
