import { ServiceSchema } from 'moleculer';

export const PostsService: ServiceSchema = {
    name: 'posts',
    //version: 2,

    settings: {
        rest: 'posts/'
    },

    actions: {
        list: {
            cache: true,
            openapi: {
                response: {
                    schema: {
                        type: 'array',
                        items: {
                            $ref: '#/components/schemas/Post'
                        }
                    }
                },
                components: {
                    schemas: {
                        Author: {
                            type: 'object',
                            properties: {
                                _id: {
                                    type: 'integer',
                                    format: 'int64'
                                },
                                fullName: {
                                    type: 'string'
                                },
                                avatar: {
                                    type: 'string',
                                    format: 'url'
                                }
                            }
                        },
                        Post: {
                            type: 'object',
                            properties: {
                                _id: {
                                    type: 'integer',
                                    format: 'int64'
                                },
                                title: {
                                    type: 'string'
                                },
                                content: {
                                    type: 'string'
                                },
                                author: {
                                    $ref: '#/components/schemas/Author'
                                },
                                createdAt: {
                                    type: 'integer',
                                    format: 'int64'
                                }
                            }
                        }
                    }
                }
            },
            // rest: 'GET /',
            handler(ctx) {
                // Clone the local list
            }
        },
        get: {
            cache: {
                keys: ['id']
            },

            // rest: 'GET /:id',
            handler(ctx) {}
        },
        feed: {
            // rest: 'GET /feed',
            handler(ctx) {}
        },
        create: {
            // rest: 'POST /',
            handler(ctx) {}
        },
        update: {
            // rest: 'PUT /:id',
            handler(ctx) {}
        },
        remove: {
            // rest: 'DELETE /:id',
            handler(ctx) {}
        }
    },

    methods: {}
};
