import { ActionSchema } from 'moleculer';
import { ActionOpenApi, actionOpenApiResponse, AliasRouteSchemaOpenApi } from './types/types.js';
import { OpenAPIV3_1 as OA, OpenAPIV3_1 as OA3_1 } from 'openapi-types';
import { ApiRouteSchema } from 'moleculer-web';

export class OpenApiMerger {
    public static mergeAliasAndRouteOpenApi(
        aliasOpenApi: AliasRouteSchemaOpenApi['openapi'] = {},
        routeOpenApi: ApiRouteSchema['openapi'] = {}
    ) {
        const tags = this.mergeTags(aliasOpenApi.tags, routeOpenApi.tags);
        aliasOpenApi.components = this.mergeActionAndRouteComponents(aliasOpenApi.components, routeOpenApi.components);

        return {
            ...routeOpenApi,
            ...aliasOpenApi,
            tags
        };
    }

    public static mergeActionAndAliasOpenApi(
        actionOpenApi: ActionSchema['openapi'] = {},
        aliasOpenApi: AliasRouteSchemaOpenApi['openapi'] = {},
        defaultContentType: string
    ): ActionOpenApi {
        const tags = this.mergeTags(actionOpenApi.tags, aliasOpenApi.tags);
        const responses = this.generateResponses(actionOpenApi, defaultContentType);

        actionOpenApi.components = this.mergeActionAndRouteComponents(
            {
                ...actionOpenApi.components,
                responses
            },
            aliasOpenApi.components
        );

        return {
            ...aliasOpenApi,
            ...actionOpenApi,
            tags
        };
    }

    private static mergeTags(addition: Array<string | null> = [], baseTags: Array<string> = []) {
        let tags = baseTags || [];
        if (addition?.length) {
            //allow to set null as first parameter of tags to avoid getting them from route openapi
            if (addition?.[0] === null) {
                tags = [];
            }

            tags = [...tags, ...addition].filter(Boolean);
        }

        return tags;
    }

    private static generateResponses(actionOpenApi: ActionOpenApi, defaultContentType: string) {
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
                    [defaultContentType]: actionOpenApi.response as OA.MediaTypeObject
                };
            } else {
                const actionResponse = actionOpenApi.response as actionOpenApiResponse;
                response.description = actionResponse.description;
                response.headers = actionResponse.headers;
                response.links = actionResponse.links;
                response.content = {
                    [actionResponse.type ?? defaultContentType]: actionResponse.content
                };
            }

            responses['200'] = response;

            delete actionOpenApi.response;
            delete actionOpenApi.responses;
        }

        return responses;
    }

    private static mergeActionAndRouteComponents(
        actionComponents: OA3_1.ComponentsObject = {},
        routeComponents: OA3_1.ComponentsObject = {}
    ) {
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
