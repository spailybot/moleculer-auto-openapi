import { ActionSchema, Service } from 'moleculer';
import { ActionOpenApi, actionOpenApiResponse, ApiSettingsSchemaOpenApi, commonOpenApi, OpenApiMixinSettings } from './types/index.js';
import { OpenAPIV3_1 as OA3_1 } from 'openapi-types';
import { Route } from './objects/Route.js';
import { Alias } from './objects/Alias.js';
import { DEFAULT_CONTENT_TYPE, getAlphabeticSorter } from './commons.js';

type actionOpenApiMerged = Omit<ActionOpenApi, 'tags'> & { tags: Array<string> };

export class OpenApiMerger {
    private static generateResponses(actionOpenApi: ActionOpenApi, defaultContentType: string): OA3_1.ResponsesObject {
        const responses = actionOpenApi.responses ?? {};

        if (actionOpenApi.response) {
            const response: OA3_1.ResponseObject = {
                description: ''
            };
            if ((actionOpenApi.response as actionOpenApiResponse).description === undefined) {
                response.content = {
                    [defaultContentType]: actionOpenApi.response as OA3_1.MediaTypeObject
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
            }

            base[k] = v;
        });

        return base;
    }

    private static mergeCommons(
        tagsRegistered: Map<string, OA3_1.TagObject>,
        openApisConfig: Array<commonOpenApi | undefined> = []
    ): actionOpenApiMerged {
        return openApisConfig.reduce((previousValue, currentValue) => {
            if (!previousValue?.components) {
                previousValue.components = {};
            }

            if (!currentValue) {
                return previousValue;
            }

            Object.keys(currentValue).forEach((k: keyof commonOpenApi) => {
                if (k === 'components') {
                    if (!previousValue?.[k]) {
                        previousValue[k] = {};
                    }
                    Object.keys(currentValue[k]).forEach((key) => {
                        if (!previousValue[k]?.[key]) {
                            previousValue[k][key] = {};
                        }
                        this.mergeObjects(previousValue[k][key], currentValue?.[key]);
                    });
                    return;
                }

                if (k === 'responses') {
                    if (!previousValue?.[k]) {
                        previousValue[k] = {};
                    }
                    this.mergeObjects(previousValue[k], currentValue?.[k]);
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
        document: OA3_1.Document,
        openApiService: Service<OpenApiMixinSettings>,
        apiService: Service<ApiSettingsSchemaOpenApi>,
        route: Route,
        alias: Alias,
        action: ActionSchema
    ): Omit<ActionOpenApi, 'tags'> & { tags: Array<string> } {
        const tags = document.tags ?? [];
        const tagsMap: Map<string, OA3_1.TagObject> = new Map<string, OA3_1.TagObject>();
        tags.forEach((tag) => {
            tagsMap.set(tag.name, tag);
        });

        const openApi = [
            alias?.openapi,
            alias?.service?.name ? { tags: [alias.service.name] } : undefined,
            alias?.service?.openapi,
            action?.openapi
        ].reduce(
            (previousValue: actionOpenApiMerged, currentValue) => {
                if (!currentValue) {
                    return previousValue;
                }

                currentValue.responses = this.generateResponses(
                    currentValue,
                    openApiService.settings.defaultResponseContentType ?? DEFAULT_CONTENT_TYPE
                );

                previousValue = this.mergeCommons(tagsMap, [previousValue, currentValue]);

                previousValue.summary = currentValue.summary ?? previousValue.summary;

                // TODO
                // previousValue.requestBody = currentValue.requestBody;
                // query
                // urlParams
                // security ?

                return previousValue;
            },
            this.mergeCommons(tagsMap, [openApiService.settings.openapi, apiService.settings.openapi, route.openapi])
        ) as actionOpenApiMerged;

        const outputTags = Array.from(tagsMap.values());
        outputTags.sort(getAlphabeticSorter('name'));
        document.tags = outputTags;

        return openApi;
    }
}
