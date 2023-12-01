import { ActionSchema, ServiceSchema } from 'moleculer';
import { ActionOpenApi, actionOpenApiResponse, ApiSettingsSchemaOpenApi, commonOpenApi, OpenApiMixinSettings } from './types/index.js';
import { OpenAPIV3_1 } from 'openapi-types';
import { Route } from './objects/Route.js';
import { Alias } from './objects/Alias.js';
import { DEFAULT_CONTENT_TYPE } from './constants.js';
import { OptionalOrFalse } from './types/utils.js';

type actionOpenApiMerged = Omit<ActionOpenApi, 'tags' | 'responses' | 'response'> & {
    tags: Array<string>;
    responses: OpenAPIV3_1.ResponsesObject;
};

export class OpenApiMerger {
    private static generateResponses(
        actionOpenApi: ActionOpenApi,
        defaultContentType: string
    ): OptionalOrFalse<OpenAPIV3_1.ResponsesObject> {
        const responses = actionOpenApi.responses ?? {};

        if (actionOpenApi.response) {
            const response: OpenAPIV3_1.ResponseObject = {
                description: ''
            };
            if ((actionOpenApi.response as actionOpenApiResponse).description === undefined) {
                response.content = {
                    [defaultContentType]: actionOpenApi.response as OpenAPIV3_1.MediaTypeObject
                };
            } else {
                const actionResponse = actionOpenApi.response as actionOpenApiResponse;
                response.description = actionResponse.description;
                response.headers = actionResponse.headers;
                response.links = actionResponse.links;
                if (actionResponse.content) {
                    response.content = {
                        [actionResponse.type ?? defaultContentType]: actionResponse.content
                    };
                }
            }

            responses['200'] = response;
        }

        return responses;
    }

    private static mergeObjects(base: Record<string, any>, toMerge: Record<string, any> = {}): unknown {
        if (!toMerge) {
            throw new Error('need an input object to apply merge');
        }

        Object.entries(toMerge).forEach(([k, v]) => {
            // if sub object use the value "false", we dismiss the previous value
            if (v === false) {
                delete base[k];
                return;
            }

            base[k] = v;
        });

        return base;
    }

    private static mergeCommons(
        tagsRegistered: Map<string, OpenAPIV3_1.TagObject>,
        openApisConfig: Array<commonOpenApi | undefined> = []
    ): actionOpenApiMerged {
        return openApisConfig.reduce((pValue, currentValue) => {
            const previousValue = pValue ?? {
                components: {}
            };

            if (!previousValue?.components) {
                previousValue.components = {};
            }

            if (!currentValue) {
                return previousValue;
            }

            Object.keys(currentValue).forEach((currentValueKey) => {
                const k = currentValueKey as keyof commonOpenApi;
                if (k === 'components') {
                    Object.keys(currentValue.components ?? {}).forEach((componentKey) => {
                        const key = componentKey as keyof typeof previousValue.components;
                        if (!previousValue.components) {
                            previousValue.components = {};
                        }
                        if (!previousValue.components[key]) {
                            previousValue.components[key] = {};
                        }
                        this.mergeObjects(previousValue.components[key] as Record<string, unknown>, currentValue?.components?.[key]);
                    });
                    return;
                }

                if (k === 'responses') {
                    if (!previousValue?.[k]) {
                        previousValue[k] = {};
                    }
                    this.mergeObjects(previousValue[k] as Record<string, unknown>, currentValue?.[k]);
                    return;
                }

                if (k === 'tags') {
                    previousValue.tags = (currentValue.tags ?? []).reduce((tags = [], currentTag) => {
                        if (currentTag === null) {
                            return [];
                        }

                        if (typeof currentTag !== 'string') {
                            if (currentTag.name) {
                                tagsRegistered.set(currentTag.name, {
                                    ...(tagsRegistered.get(currentTag.name) ?? {}),
                                    ...currentTag
                                });
                            }

                            return tags;
                        }

                        tagsRegistered.set(currentTag, {
                            ...(tagsRegistered.get(currentTag) ?? {}),
                            name: currentTag
                        });

                        return [...tags, currentTag];
                    }, previousValue.tags) as actionOpenApiMerged['tags'];
                    return;
                }

                // false = remove previous configuration
                if (currentValue[k] === false) {
                    delete previousValue[k];
                    return;
                }

                previousValue[k] = currentValue[k];
            });

            return previousValue;
        }, {} as actionOpenApiMerged) as actionOpenApiMerged;
    }

    static merge(
        tagsMap: Map<string, OpenAPIV3_1.TagObject>,
        route: Route,
        alias: Alias,
        action?: ActionSchema,
        openApiService?: ServiceSchema<OpenApiMixinSettings>,
        apiService?: ServiceSchema<ApiSettingsSchemaOpenApi>
    ): actionOpenApiMerged {
        return [
            alias?.openapi,
            openApiService?.settings?.addServiceNameToTags && alias?.service?.name ? { tags: [alias.service.name] } : undefined,
            alias?.service?.settings?.openapi,
            action?.openapi
        ].reduce(
            (previousValue: actionOpenApiMerged, currentValue) => {
                if (!currentValue) {
                    return previousValue;
                }

                currentValue.responses = this.generateResponses(
                    currentValue,
                    openApiService?.settings?.defaultResponseContentType ?? DEFAULT_CONTENT_TYPE
                );

                previousValue = this.mergeCommons(tagsMap, [previousValue, currentValue]);

                previousValue.summary = currentValue.summary ?? previousValue.summary;

                previousValue.security = currentValue.security ?? previousValue.security;

                return previousValue;
            },
            this.mergeCommons(tagsMap, [openApiService?.settings?.openapi, apiService?.settings?.openapi, route.openapi])
        ) as actionOpenApiMerged;
    }
}
