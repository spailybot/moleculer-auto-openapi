import { ServiceSchema } from 'moleculer';
import { ActionOpenApi } from '../../../src/types/types.js';

const testsParams: Record<string, ActionOpenApi> = {
    addTag: {
        tags: ['actionTag']
    },
    resetTags: {
        tags: [null, 'actionTag']
    },
    multipleTags: {
        tags: ['actionTag1', 'actionTag2']
    },
    responses: {
        responses: {
            200: {
                description: '',
                content: {
                    'application/json': {
                        schema: {
                            type: 'array',
                            items: {
                                type: 'object',
                                examples: [{ id: 1, filename: 'foo.txt', mimetype: 'text/plain', sizeInBytes: 100 }]
                            }
                        }
                    }
                }
            },
            400: {
                $ref: '#/components/responses/FileNotExist'
            },
            401: {
                $ref: '#/components/responses/UnauthorizedError'
            },
            413: {
                $ref: '#/components/responses/FileTooBig'
            },
            422: {
                $ref: '#/components/responses/ValidationError'
            },
            default: {
                $ref: '#/components/responses/ServerError'
            }
        }
    },
    response: {
        response: {
            description: '',
            content: {
                schema: {
                    type: 'array',
                    items: {
                        type: 'object',
                        example: { id: 1, filename: 'foo.txt', mimetype: 'text/plain', sizeInBytes: 100 }
                    }
                }
            }
        }
    }
};

export const testOpenApiService = {
    name: 'tests-openapi',
    settings: {
        rest: '/tests-openapi'
    },
    actions: {
        ...Object.fromEntries(
            Object.entries(testsParams).map(([k, v]) => {
                const params = {
                    openapi: v,
                    handler() {}
                };
                return [k, params];
            })
        )
    }
} as ServiceSchema;
